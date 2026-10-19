<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import type { IComment, IRankInProgress, IUser } from '@/scripts/interfaces.ts';
import AdvancementCardComponent from "@/components/Advancement/AdvancementCardComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import ImportBackupComponent from "@/components/Universal/ImportBackupComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import { CardType } from "@/scripts/enums";
import { ITypesEnum } from "@/scripts/eventBus";
import { RankInProgress } from "@/scripts/database/RankInProgress.ts";
import { User } from "@/scripts/database/User.ts";
import { Rank } from "@/scripts/database/Rank";
import { Comment, isNewComment } from "@/scripts/database/Comment";
import { commentPrefs, loadCommentPrefs } from "@/scripts/commentPrefs";
import { useDbUpdates } from "@/scripts/composables";

const { t } = useI18n();
const router = useRouter();

const ranks = ref<IRankInProgress[]>([]);
const people = ref<IUser[]>([]);
const comments = ref<IComment[]>([]);
const loaded = ref(false);
const rankToDelete = ref<string | undefined>(undefined);
const importer = ref<InstanceType<typeof ImportBackupComponent> | null>(null);

const nameOf = (id: string) => people.value.find(p => p.id === id)?.fullName ?? '';
const cards = computed(() => ranks.value.map(r => {
  const open = comments.value.filter(c => c.rankInProgressId === r.id && !c.resolved);
  return {
    rankInProgress: r,
    rank: Rank.find(r.rankId),
    menteeName: nameOf(r.personId),
    mentorName: nameOf(r.mentorId),
    openComments: open.length,
    newComments: open.some(c => isNewComment(c, commentPrefs.seenAt[r.id], commentPrefs.authorId)),
  };
}));

async function load() {
  [ranks.value, people.value, comments.value] = await Promise.all([RankInProgress.getAll(), User.getAll(), Comment.getAll(), loadCommentPrefs()]);
  loaded.value = true;
}

async function loadComments() {
  comments.value = await Comment.getAll();
}

const isEmpty = computed(() => loaded.value && people.value.length === 0 && ranks.value.length === 0);

onMounted(load);

useDbUpdates([ITypesEnum.ERankInProgress, ITypesEnum.EUser], load);
useDbUpdates([ITypesEnum.ETaskComment, ITypesEnum.ETask], loadComments);

async function addAdvancement() {
  if (people.value.length === 0) {
    await router.push("/dodaj-osobe/");
    return;
  }
  const rank = await RankInProgress.addDefault();
  await router.push('/stopien/' + rank.id);
}

async function confirmDelete() {
  if (rankToDelete.value !== undefined) await RankInProgress.deleteObject(rankToDelete.value);
  rankToDelete.value = undefined;
}
</script>

<template>
  <section v-if="isEmpty" class="welcome">
    <img src="@/assets/logo.svg" alt="" class="welcome-logo" />
    <h1>{{ t('advancement.emptyTitle') }}</h1>
    <p>{{ t('advancement.emptyText') }}</p>
    <div class="welcome-actions">
      <ButtonComponent :button-text="t('advancement.emptyAddPerson')" button-style="primary" block @click="router.push('/dodaj-osobe/')" />
      <ButtonComponent :button-text="t('advancement.emptyJoin')" block @click="router.push('/synchronizacja')" />
      <ButtonComponent :button-text="t('advancement.emptyImport')" button-style="ghost" block @click="importer?.pick()" />
      <ButtonComponent :button-text="t('advancement.emptyHelp')" button-style="ghost" block @click="router.push('/pomoc/pierwsze-kroki')" />
    </div>
  </section>
  <h1 v-if="!isEmpty">{{ t('advancement.your') }}</h1>
  <div v-if="!isEmpty" class="advancement-container" :aria-busy="!loaded">
    <AdvancementCardComponent
        v-for="card in cards"
        :key="card.rankInProgress.id"
        :type="CardType.DEFAULT"
        :rank="card.rank"
        :mentee-name="card.menteeName"
        :mentor-name="card.mentorName"
        :open-comments="card.openComments"
        :new-comments="card.newComments"
        @click="router.push('/stopien/' + card.rankInProgress.id)"
        @delete-rank="rankToDelete = card.rankInProgress.id"
    />
    <AdvancementCardComponent :type="CardType.ADD" @click="addAdvancement" />
    <AdvancementCardComponent :type="CardType.IMPORT" @click="importer?.pick()" />
  </div>
  <ImportBackupComponent ref="importer" @imported="load" />
  <PopupComponent
      v-if="rankToDelete"
      :title="t('popups.delete.title')"
      :message="t('popups.delete.message')"
      :option-one="{ text: t('edit.delete'), style: 'error', action: confirmDelete }"
      :option-two="{ text: t('edit.cancel'), action: () => { rankToDelete = undefined } }"
  />
</template>

<style scoped>
  .welcome {
    max-width: 520px;
    margin: var(--space-lg) auto;
    padding: var(--space-md);
    text-align: center;
    font-family: 'Museo', sans-serif;
  }
  .welcome-logo {
    width: 96px;
    padding: 12px;
    border-radius: 24px;
    background: var(--primary-color);
  }
  .welcome h1 {
    margin-top: var(--space-sm);
  }
  .welcome p {
    line-height: 1.5;
    opacity: 0.85;
  }
  .welcome-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }
  .welcome-actions :deep(.button) {
    min-width: 260px;
  }
  h1 {
    text-align: center;
    font-family: 'Museo', sans-serif;
    margin-top: var(--space-lg);
    padding: 0 var(--space-sm);
  }
  .advancement-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin: var(--space-lg);
  }

  @media (max-width: 599px) {
    h1 {
      margin: var(--space-md) 0 var(--space-sm);
      font-size: 1.4rem;
    }
    .advancement-container {
      flex-direction: column;
      align-items: stretch;
      margin: 0 var(--space-sm) var(--space-md);
      gap: var(--space-sm);
    }
  }
</style>
