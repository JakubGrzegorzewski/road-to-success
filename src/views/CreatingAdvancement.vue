<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import IdeaTaskComponent from "@/components/Advancement/IdeaTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import AsSimpleAdvancementComponent from "@/components/Advancement/AsSimpleAdvancementComponent.vue";
import AsTableAdvancementComponent from "@/components/Advancement/AsTableAdvancementComponent.vue";
import EyeIconComponent from "@/components/Universal/Icons/EyeIconComponent.vue";
import HelpLink from "@/components/Universal/HelpLink.vue";
import CommentButton from "@/components/Comments/CommentButton.vue";
import CommentSheet from "@/components/Comments/CommentSheet.vue";
import CommentsSummary from "@/components/Comments/CommentsSummary.vue";
import GeneralComments from "@/components/Comments/GeneralComments.vue";
import { anchorIdFor, COMMENTS_CONTEXT, keyFromHash, type CommentsContext } from "@/components/Comments/commentsContext";
import { Status, type IComment, type IRankInProgress, type ITask, type IUser } from "@/scripts/interfaces.ts";
import { ITypesEnum } from "@/scripts/eventBus";
import { Rank } from "@/scripts/database/Rank.ts";
import { RankInProgress } from "@/scripts/database/RankInProgress.ts";
import { User } from "@/scripts/database/User.ts";
import { Requirement, requirementLabel } from "@/scripts/database/Requirement.ts";
import { Task } from "@/scripts/database/Task.ts";
import { Comment, groupByTarget, openCount, type CommentTargetKey } from "@/scripts/database/Comment";
import { commentPrefs, loadCommentPrefs, markCommentsSeen } from "@/scripts/commentPrefs";
import { getIdeaSegments, isDarkMode } from "@/scripts/helperFunctions.ts";
import { rankBackgroundUrl, rankIconUrl } from "@/scripts/rankAssets";
import { buildAdvancementViewModel } from "@/scripts/pdf/advancementViewModel";
import { buildAdvancementPdf, loadPdfMake, pdfFileName, type PdfLabels, type PdfLayout } from "@/scripts/pdf/buildAdvancementPdf";
import type { CommentScope } from "@/scripts/pdf/advancementViewModel";
import { deliverPdf } from "@/scripts/pdf/deliverPdf";
import { useDbUpdates, useLayout } from "@/scripts/composables";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isMobile } = useLayout();

const props = defineProps<{
  id: string,
}>();

// ---------------------------------------------------------------- data
const rankInProgress = ref<IRankInProgress>();
const people = ref<IUser[]>([]);
const tasks = ref<ITask[]>([]);
const comments = ref<IComment[]>([]);
const state = ref<'loading' | 'ready' | 'missing'>('loading');

const rank = computed(() => Rank.find(rankInProgress.value?.rankId));
const requirements = computed(() => Requirement.findByRankId(rank.value?.id));
const mentee = computed(() => people.value.find(p => p.id === rankInProgress.value?.personId));
const mentor = computed(() => people.value.find(p => p.id === rankInProgress.value?.mentorId));
const coveredRequirements = computed(() => new Set(tasks.value.flatMap(task => task.requirementIds)));
const ideaSegments = computed(() => (rank.value ? getIdeaSegments(rank.value.idea, tasks.value) : []));
const rankOptions = Rank.list().map(r => ({ value: r.id, label: r.fullName }));
const peopleOptions = computed(() => people.value.map(p => ({ value: p.id, label: p.fullName })));

async function loadRankInProgress() {
  const found = await RankInProgress.findById(props.id);
  rankInProgress.value = found;
  if (!found) state.value = 'missing';
  // e.g. opened on a new device before synchronisation delivered this advancement
  else if (state.value === 'missing') await load();
}

async function loadComments() {
  comments.value = await Comment.getByRankInProgressId(props.id);
}

async function load() {
  state.value = 'loading';
  await loadRankInProgress();
  if (!rankInProgress.value) return;
  [people.value, tasks.value, comments.value] = await Promise.all([
    User.getAll(),
    Task.getByRankInProgressId(props.id),
    Comment.getByRankInProgressId(props.id),
    loadCommentPrefs(),
  ]);
  state.value = 'ready';
  onCommentsLoaded();
}

useDbUpdates([ITypesEnum.ERankInProgress, ITypesEnum.EUser, ITypesEnum.ETask, ITypesEnum.ETaskComment], async (type) => {
  if (type === ITypesEnum.ERankInProgress) {
    await loadRankInProgress();
    await loadComments();
  } else if (type === ITypesEnum.EUser) people.value = await User.getAll();
  else if (type === ITypesEnum.ETask) {
    tasks.value = await Task.getByRankInProgressId(props.id);
    await loadComments();
  } else if (type === ITypesEnum.ETaskComment) await loadComments();
});

onMounted(load);
watch(() => props.id, (_id, previous) => {
  if (previous) void markCommentsSeen(previous);
  commentsInitialised = false;
  void load();
});

// ---------------------------------------------------------------- comments
const commentGroups = computed(() => groupByTarget(comments.value));
const seenAt = ref<number | undefined>();
const sheetKey = ref<CommentTargetKey | null>(null);
const expanded = ref(new Set<CommentTargetKey>());
const requirementsDetails = ref<HTMLDetailsElement | null>(null);
let commentsInitialised = false;

const usesSheet = (key: CommentTargetKey) => key.startsWith('req:') || (key.startsWith('task:') && isMobile.value);
const isOpen = (key: CommentTargetKey) => (usesSheet(key) ? sheetKey.value === key : expanded.value.has(key));

function setExpanded(key: CommentTargetKey, value: boolean) {
  const next = new Set(expanded.value);
  if (value) next.add(key);
  else next.delete(key);
  expanded.value = next;
}

function openThread(key: CommentTargetKey) {
  if (usesSheet(key)) sheetKey.value = key;
  else setExpanded(key, true);
}

function toggleThread(key: CommentTargetKey) {
  if (!isOpen(key)) openThread(key);
  else if (usesSheet(key)) sheetKey.value = null;
  else setExpanded(key, false);
}

async function reveal(key: CommentTargetKey) {
  if (key.startsWith('req:') && requirementsDetails.value) requirementsDetails.value.open = true;
  openThread(key);
  await nextTick();
  document.getElementById(anchorIdFor(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function targetLabel(key: CommentTargetKey): string {
  if (key === 'adv') return t('advancement.comment.general');
  if (key.startsWith('task:')) {
    const index = tasks.value.findIndex(task => task.id === key.slice(5));
    return t('advancement.comment.targetTask', { n: index + 1 });
  }
  const requirement = Requirement.find(Number(key.slice(4)));
  return t('advancement.comment.targetRequirement', { label: requirement ? requirementLabel(requirement, requirements.value) : key.slice(4) });
}

const commentsContext: CommentsContext = {
  rankInProgress,
  people,
  groups: commentGroups,
  seenAt,
  sheetKey,
  expanded,
  usesSheet,
  isOpen,
  toggle: toggleThread,
  open: openThread,
  reveal: (key) => void reveal(key),
  closeSheet: () => { sheetKey.value = null },
  targetLabel,
  anchorId: anchorIdFor,
  linkFor: (key) => `${location.origin}/stopien/${props.id}#${anchorIdFor(key)}`,
};
provide(COMMENTS_CONTEXT, commentsContext);

/** Targets in page order (summary panel). */
const commentOrder = computed<CommentTargetKey[]>(() => [
  'adv',
  ...tasks.value.map(task => `task:${task.id}` as const),
  ...requirements.value.map(r => `req:${r.id}` as const),
]);

const sheetSubtitle = computed(() => {
  const key = sheetKey.value;
  if (!key) return '';
  if (key.startsWith('req:')) {
    const requirement = Requirement.find(Number(key.slice(4)));
    return requirement ? `${requirementLabel(requirement, requirements.value)}. ${requirement.content}` : '';
  }
  if (key.startsWith('task:')) return tasks.value.find(task => task.id === key.slice(5))?.content.trim().slice(0, 240) ?? '';
  return '';
});

/** First load: snapshot "last visit", expand open general notes, follow a #zadanie-… link. */
function onCommentsLoaded() {
  if (commentsInitialised) return;
  commentsInitialised = true;
  seenAt.value = commentPrefs.seenAt[props.id];
  expanded.value = new Set();
  sheetKey.value = null;
  if (openCount(commentGroups.value.get('adv') ?? []) > 0) setExpanded('adv', true);
  void followHash();
}

async function followHash() {
  const key = keyFromHash(route.hash);
  if (!key) return;
  await nextTick();
  await reveal(key);
}

watch(() => route.hash, () => {
  if (state.value === 'ready') void followHash();
});

// "new since the last visit" is measured from leaving the view (or hiding the app)
function onVisibility() {
  if (document.visibilityState === 'hidden') void markCommentsSeen(props.id);
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility));
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibility);
  if (state.value === 'ready') void markCommentsSeen(props.id);
});

// ---------------------------------------------------------------- editing
const pendingRankId = ref<number | null>(null);
const lostRequirementComments = ref(0);

async function requestRankChange(rankId: number) {
  if (!rankInProgress.value || rankId === rankInProgress.value.rankId) return;
  const lost = await Comment.countLostOnRankChange(rankInProgress.value.id, rankId);
  if (tasks.value.length === 0 && lost === 0) void RankInProgress.update({ ...rankInProgress.value, rankId });
  else {
    lostRequirementComments.value = lost;
    pendingRankId.value = rankId;
  }
}

const rankChangeMessage = computed(() => {
  const lost = lostRequirementComments.value;
  return t('popups.changeRank.message') + (lost > 0 ? ' ' + t('advancement.comment.orphanedOnRankChange', { n: lost }, lost) : '');
});

async function confirmRankChange() {
  if (rankInProgress.value && pendingRankId.value !== null) {
    await RankInProgress.update({ ...rankInProgress.value, rankId: pendingRankId.value });
  }
  pendingRankId.value = null;
}

function setPerson(field: 'personId' | 'mentorId', id: string) {
  if (rankInProgress.value) void RankInProgress.update({ ...rankInProgress.value, [field]: id });
}

const setMentee = (id: string) => setPerson('personId', id);
const setMentor = (id: string) => setPerson('mentorId', id);

async function addTask() {
  if (!rankInProgress.value) return;
  await Task.add(rankInProgress.value.id);
}

// ---------------------------------------------------------------- preview & PDF
const isPdfHidden = ref(true);
const layout = ref<PdfLayout>(readPreference('rts.pdfLayout', 'table') as PdfLayout);
const withBackground = ref(readPreference('rts.pdfBackground', '1') === '1');
// off by default: the PDF is usually the document handed in
const withComments = ref(readPreference('rts.pdfComments', '0') === '1');
const commentScope = ref<CommentScope>(readPreference('rts.pdfCommentScope', 'open') === 'all' ? 'all' : 'open');
const pdfBusy = ref(false);
const pdfError = ref(false);
const pdfReady = ref<{ blob: Blob; name: string } | null>(null);

function readPreference(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

watch(layout, v => writePreference('rts.pdfLayout', v));
watch(withBackground, v => writePreference('rts.pdfBackground', v ? '1' : '0'));
watch(withComments, v => writePreference('rts.pdfComments', v ? '1' : '0'));
watch(commentScope, v => writePreference('rts.pdfCommentScope', v));
watch(isPdfHidden, hidden => {
  // warm up the PDF engine while the user looks at the preview
  if (!hidden) void loadPdfMake().catch(() => undefined);
  window.scrollTo({ top: 0 });
});

const viewModel = computed(() => {
  if (!rankInProgress.value || !rank.value) return null;
  return buildAdvancementViewModel({
    rankInProgress: rankInProgress.value,
    tasks: tasks.value,
    requirements: requirements.value,
    rank: rank.value,
    person: mentee.value,
    mentor: mentor.value,
    ...(withComments.value ? { comments: comments.value, people: people.value, commentScope: commentScope.value } : {}),
  });
});

function pdfLabels(): PdfLabels {
  return {
    title: t('pdf.title'),
    idea: t('advancement.idea'),
    mentee: t('advancement.mentee'),
    mentor: t('advancement.mentor'),
    requirements: t('advancement.requirements'),
    requirement: t('requirement.requirement'),
    tasks: t('advancement.task.tasks'),
    task: t('advancement.task.task'),
    status: t('status'),
    ideaFragment: t('pdf.ideaFragment'),
    none: '—',
    generatedOn: t('pdf.generatedOn'),
    comments: {
      title: t('pdf.comments'),
      general: t('advancement.comment.general'),
      appendix: t('pdf.commentsAppendix'),
      resolved: t('advancement.comment.resolved'),
      mentor: t('advancement.comment.roleMentor'),
      mentee: t('advancement.comment.roleMentee'),
      // the builder fills the placeholders in
      taskRef: t('pdf.taskRef', { n: '{n}' }),
      requirementRef: t('pdf.requirementRef', { label: '{label}' }),
      generalRef: t('pdf.generalRef'),
    },
    statuses: {
      [Status.DRAFT]: t('statusOptions.draft'),
      [Status.CREATED]: t('statusOptions.created'),
      [Status.PENDING]: t('statusOptions.pending'),
      [Status.IN_PROGRESS]: t('statusOptions.in_progress'),
      [Status.COMPLETED]: t('statusOptions.completed'),
      [Status.FAILED]: t('statusOptions.failed'),
    },
  };
}

async function generatePdf() {
  const vm = viewModel.value;
  if (!vm || pdfBusy.value) return;
  pdfBusy.value = true;
  pdfError.value = false;
  try {
    const blob = await buildAdvancementPdf(
        { ...vm, generatedAt: new Date() },
        { layout: layout.value, labels: pdfLabels(), background: withBackground.value, locale: locale.value },
        { icon: rankIconUrl(rank.value), background: rankBackgroundUrl(rank.value) },
    );
    const name = pdfFileName(vm);
    const result = await deliverPdf(blob, name, { title: [vm.rank.fullName, vm.menteeName].filter(Boolean).join(' – ') });
    // the user gesture expired while generating: let them tap again
    if (result === 'needs-gesture') pdfReady.value = { blob, name };
  } catch (e) {
    console.error('[pdf]', e);
    pdfError.value = true;
  } finally {
    pdfBusy.value = false;
  }
}

async function deliverReady(prefer: 'share' | 'download') {
  const ready = pdfReady.value;
  if (!ready) return;
  const result = await deliverPdf(ready.blob, ready.name, { prefer });
  if (result !== 'needs-gesture') pdfReady.value = null;
}

function print(): void {
  window.print();
}
</script>

<template>
  <div v-if="state === 'loading'" class="loading">
    <p>{{ t('statusOptions.loading') }}<span class="loading-dots"></span></p>
  </div>

  <div v-else-if="state === 'missing'" class="missing">
    <p>{{ t('advancement.notFound') }}</p>
    <ButtonComponent :button-text="t('advancement.backToList')" @click="router.push('/')" />
  </div>

  <template v-else-if="rankInProgress && rank">
    <section v-if="isPdfHidden" class="rank">
      <div class="rank-details">
        <div class="option-selection">
          <div class="field">
            <DropDownSelectionComponent
                :model-value="rankInProgress.rankId"
                :label="t('advancement.select') + ':'"
                :options="rankOptions"
                :block="isMobile"
                @update:model-value="requestRankChange"
            />
          </div>
        </div>
        <div class="option-selection">
          <div class="field">
            <DropDownSelectionComponent
                :model-value="rankInProgress.personId"
                :label="t('advancement.selectMentee') + ':'"
                :options="peopleOptions"
                :block="isMobile"
                @update:model-value="setMentee"
            />
          </div>
          <div class="field">
            <DropDownSelectionComponent
                :model-value="rankInProgress.mentorId"
                :label="t('advancement.selectMentor') + ':'"
                :options="peopleOptions"
                :block="isMobile"
                @update:model-value="setMentor"
            />
          </div>
          <router-link :to="'/dodaj-osobe/'" class="add-button" :aria-label="t('advancement.addPerson')" :title="t('advancement.addPerson')">+</router-link>
        </div>
      </div>

      <h1 class="rank-title">{{ rank.fullName }}</h1>
      <details v-if="rank.startRequirements.length > 0 && rank.endRequirements.length > 0">
        <summary>{{ t('advancement.requirement.showRequirements') }}</summary>
        <div class="requirement-item box-shadow general-requirements">
          <h3>{{ t('advancement.requirement.start') }}</h3>
          <ul>
            <li v-for="req in rank.startRequirements" :key="req">{{ req }}</li>
          </ul>
          <h3>{{ t('advancement.requirement.end') }}</h3>
          <ul>
            <li v-for="req in rank.endRequirements" :key="req">{{ req }}</li>
          </ul>
        </div>
      </details>

      <p class="idea"><template v-for="(segment, i) in ideaSegments" :key="i"><span :class="{ 'idea-part-highlight': segment.highlighted }">{{ segment.text }}</span></template></p>

      <details ref="requirementsDetails">
        <summary>{{ t('advancement.requirement.showSelected') }}</summary>
        <div class="requirements-collapsed">
          <div v-for="requirement in requirements" :id="anchorIdFor(`req:${requirement.id}`)" :key="requirement.id" class="requirement-item box-shadow">
            <div class="requirement-item-head">
              <CommentButton :target-key="`req:${requirement.id}`" />
              <div
                  class="requirement-item-status"
                  :style="{ backgroundColor: coveredRequirements.has(requirement.id) ? 'var(--accent-success)' : 'var(--accent-error)' }"
              >
                {{ coveredRequirements.has(requirement.id) ? "✔ " + t('advancement.requirement.added') : "✕ " + t('advancement.requirement.notAdded') }}
              </div>
            </div>
            <p><strong>{{ requirement.number }}.</strong> {{ requirement.content }}</p>
          </div>
        </div>
      </details>

      <CommentsSummary :order="commentOrder" />
      <GeneralComments />
    </section>

    <section v-if="isPdfHidden" class="rank-content">
      <IdeaTaskComponent
          v-for="(task, index) in tasks"
          :key="task.id"
          :task="task"
          :index="index + 1"
          :rank="rank"
          :requirements="requirements"
      />
      <ButtonComponent
          class="add-task-button"
          :button-text="t('advancement.task.add')"
          :buttonStyle="isDarkMode() ? 'default-light' : 'default'"
          @click="addTask"
      />
    </section>

    <section v-else class="preview">
      <div class="preview-toolbar" role="toolbar" :aria-label="t('advancement.preview')">
        <div class="segmented" role="radiogroup" :aria-label="t('pdf.layout')">
          <button type="button" role="radio" :aria-checked="layout === 'table'" :class="{ active: layout === 'table' }" @click="layout = 'table'">{{ t('pdf.layoutTable') }}</button>
          <button type="button" role="radio" :aria-checked="layout === 'simple'" :class="{ active: layout === 'simple' }" @click="layout = 'simple'">{{ t('pdf.layoutSimple') }}</button>
        </div>
        <label class="checkbox">
          <input v-model="withBackground" type="checkbox" />
          {{ t('pdf.background') }}
        </label>
        <span class="comments-option">
          <label class="checkbox">
            <input v-model="withComments" type="checkbox" />
            {{ t('advancement.comment.pdfInclude') }}
          </label>
          <span v-if="withComments" class="segmented small" role="radiogroup" :aria-label="t('advancement.comment.pdfInclude')">
            <button type="button" role="radio" :aria-checked="commentScope === 'open'" :class="{ active: commentScope === 'open' }" @click="commentScope = 'open'">{{ t('advancement.comment.pdfOnlyOpen') }}</button>
            <button type="button" role="radio" :aria-checked="commentScope === 'all'" :class="{ active: commentScope === 'all' }" @click="commentScope = 'all'">{{ t('advancement.comment.pdfAll') }}</button>
          </span>
        </span>
        <HelpLink to="pdf#opcje-podgladu" />
        <div class="toolbar-actions">
          <ButtonComponent :button-text="pdfBusy ? t('pdf.generating') : t('pdf.download')" button-style="primary" :disabled="pdfBusy" @click="generatePdf" />
        </div>
      </div>

      <div id="print-capture-target" class="print-preview-scroll">
        <AsTableAdvancementComponent v-if="viewModel && layout === 'table'" :vm="viewModel" :rank-icon="rankIconUrl(rank)" />
        <AsSimpleAdvancementComponent v-if="viewModel && layout === 'simple'" :vm="viewModel" :rank-icon="rankIconUrl(rank)" />
      </div>
    </section>

    <button
        type="button"
        class="icon-button show-pdf-button"
        :aria-label="isPdfHidden ? t('advancement.preview') : t('advancement.backToEdit')"
        :title="isPdfHidden ? t('advancement.preview') : t('advancement.backToEdit')"
        @click="isPdfHidden = !isPdfHidden"
    >
      <EyeIconComponent color="var(--primary-color)" :model-value="isPdfHidden" />
    </button>
    <img v-if="isPdfHidden && rankIconUrl(rank)" :src="rankIconUrl(rank)" class="rank-watermark" alt=""/>

    <CommentSheet v-if="sheetKey" :key="sheetKey" :target-key="sheetKey" :subtitle="sheetSubtitle" />
    <PopupComponent
        v-if="pendingRankId !== null"
        :title="t('popups.changeRank.title')"
        :message="rankChangeMessage"
        :option-one="{ text: t('edit.yes'), style: 'error', action: confirmRankChange }"
        :option-two="{ text: t('edit.no'), action: () => { pendingRankId = null } }"
    />
    <PopupComponent
        v-if="pdfReady"
        :title="t('pdf.ready')"
        :message="t('pdf.readyMessage')"
        :option-three="{ text: t('edit.close'), style: 'ghost', action: () => { pdfReady = null } }"
        :option-one="{ text: t('pdf.save'), action: () => deliverReady('download') }"
        :option-two="{ text: t('pdf.share'), action: () => deliverReady('share') }"
        :dismiss="() => { pdfReady = null }"
    />
    <PopupComponent
        v-if="pdfError"
        :title="t('pdf.failed')"
        :option-two="{ text: t('edit.ok'), action: () => { pdfError = false } }"
    />
  </template>
</template>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  font-family: 'Museo', sans-serif;
}

.missing {
  max-width: 520px;
  margin: var(--space-lg) auto;
  padding: var(--space-md);
  text-align: center;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.rank {
  padding: var(--space-lg);
  padding-bottom: 0;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-md);
}

.rank-title {
  margin: 20px 0 0;
}

.idea {
  text-align: justify;
  line-height: 1.6;
  margin: 0;
}

.general-requirements {
  padding: 20px;
}

.general-requirements ul {
  padding-left: 22px;
  margin: 8px 0 16px;
}

.general-requirements li {
  margin-bottom: 4px;
}

.rank-content{
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg) calc(var(--space-lg) + 60px);
  font-family: 'Museo', sans-serif;
}

.preview {
  font-family: 'Museo', sans-serif;
  padding-bottom: 80px;
}

.preview-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm) var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.segmented {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.segmented button {
  min-height: 36px;
  padding: 0 14px;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

.segmented button.active {
  background: var(--secondary-color);
  color: white;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  min-height: 36px;
  cursor: pointer;
}

.checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--secondary-color);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-xs);
}

.print-preview-scroll {
  overflow-x: auto;
  max-width: 100%;
}

.rank-watermark {
  width: 500px;
  max-width: 60vw;
  height: auto;
  position: fixed;
  z-index: -1;
  top: 200px;
  right: 50px;
  opacity: 0.3;
  transform: rotate(-15deg);
  pointer-events: none;
}

.icon-button {
  position: fixed;
  right: calc(16px + var(--safe-right));
  bottom: calc(16px + var(--safe-bottom));
  width: 56px;
  height: 56px;
  padding: 10px;
  cursor: pointer;
  border: none;
  background-color: var(--secondary-color);
  border-radius: 50%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.icon-button :deep(svg) {
  width: 100%;
  height: 100%;
}

.add-task-button {
  align-self: center;
  margin: 10px;
  width: 100%;
  max-width: 800px;
}

.option-selection {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: flex-end;
  justify-content: left;
  margin-bottom: var(--space-md);
}

.field {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--accent-info);
  border-radius: 100%;
  color: white;
  text-decoration: none;
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s ease;
  flex: none;
}

@media (hover: hover) {
  .add-button:hover {
    transform: scale(1.1);
  }
}

.add-button:active {
  transform: scale(0.9);
}

.requirements-collapsed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
  cursor: default;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 8px;
  gap : 5px;

  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
  }
}

.requirement-item p {
  margin: 0;
}

.requirement-item {
  scroll-margin-top: 80px;
}

.requirement-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  align-self: stretch;
}

.comments-option {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.segmented.small button {
  min-height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.requirement-item-status{
  padding: 4px 8px;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  min-width: 100px;
  text-align: center;
  position: relative;
  margin-left: auto;
  font-size: 12px;
}

.loading-dots::after {
 content: '.';
 animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}

summary {
  cursor: pointer;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
}

summary::-webkit-details-marker {
  display: none;
}

summary::before {
  content: '▸';
  transition: transform 0.15s;
}

details[open] > summary::before {
  transform: rotate(90deg);
}

@media (max-width: 959px) {
  .rank {
    padding: var(--space-md);
    padding-bottom: 0;
  }
  .rank-content {
    padding: var(--space-md) var(--space-md) calc(var(--space-lg) + 60px);
  }
}

/* Phones */
@media (max-width: 599px) {
  .rank {
    padding: var(--space-sm);
    padding-bottom: 0;
    gap: var(--space-sm);
  }
  .rank-title {
    margin-top: var(--space-xs);
    font-size: 1.6rem;
  }
  .idea {
    text-align: left;
  }
  .option-selection {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
  }
  .field {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .add-button {
    align-self: flex-start;
    width: var(--touch-target);
    height: var(--touch-target);
  }
  .rank-content {
    padding: var(--space-sm) var(--space-sm) calc(var(--space-lg) + 72px);
    gap: var(--space-sm);
  }
  .rank-watermark {
    display: none;
  }
  .icon-button {
    /* above the bottom navigation */
    bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 16px);
    width: 52px;
    height: 52px;
  }
  .preview-toolbar {
    justify-content: flex-start;
    padding: var(--space-xs) var(--space-sm);
  }
  .toolbar-actions,
  .toolbar-actions :deep(.button) {
    width: 100%;
  }
  summary {
    min-height: var(--touch-target);
  }
  .requirements-collapsed {
    grid-template-columns: 1fr;
  }
}

@media print {
  .rank, .rank-content, .preview-toolbar, .icon-button, .rank-watermark {
    display: none !important;
  }
}
</style>

<style>
.idea-part-highlight {
  text-decoration: underline;
  text-decoration-color: var(--secondary-color);
  text-decoration-thickness: 3px;
  text-underline-offset: 3px;
}
</style>
