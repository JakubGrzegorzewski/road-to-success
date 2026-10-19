<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import PopupComponent from '@/components/Universal/PopupComponent.vue'
import type { CommentTarget, IComment } from '@/scripts/interfaces'
import { authorRole, Comment, isNewComment, targetKey } from '@/scripts/database/Comment'
import { commentPrefs } from '@/scripts/commentPrefs'
import { formatDate, useNow, useRelativeTime } from '@/scripts/composables'
import CommentComposer from './CommentComposer.vue'
import { useCommentsContext } from './commentsContext'

/**
 * Flat thread of one target: open comments, resolved ones folded under "Pokaż załatwione (n)",
 * and the composer. Edit/delete are offered on the device's own comments only (a guard against
 * mistakes, not a security feature — there are no accounts).
 */
const props = withDefaults(defineProps<{ target: CommentTarget; showLink?: boolean }>(), { showLink: true })

const { t, locale } = useI18n()
const ctx = useCommentsContext()
const now = useNow(30_000)
const relative = useRelativeTime()

const key = computed(() => targetKey(props.target))
const comments = computed(() => ctx.groups.value.get(key.value) ?? [])
const openComments = computed(() => comments.value.filter((c) => !c.resolved))
const resolvedComments = computed(() => comments.value.filter((c) => c.resolved))
const showResolved = ref(false)
const visibleComments = computed(() => (showResolved.value ? [...openComments.value, ...resolvedComments.value] : openComments.value))
const editingId = ref<string | null>(null)
const editText = ref('')
const toDelete = ref<IComment | null>(null)
const copied = ref(false)

function authorName(c: IComment): string {
  return ctx.people.value.find((p) => p.id === c.authorId)?.fullName || c.authorName || t('advancement.comment.unknownAuthor')
}

function personName(id: string | undefined): string {
  return (id && ctx.people.value.find((p) => p.id === id)?.fullName) || ''
}

function roleLabel(c: IComment): string {
  const role = authorRole(c.authorId, ctx.rankInProgress.value)
  return role === 'mentor' ? t('advancement.comment.roleMentor') : role === 'mentee' ? t('advancement.comment.roleMentee') : ''
}

const isOwn = (c: IComment) => !!commentPrefs.authorId && c.authorId === commentPrefs.authorId
const isNew = (c: IComment) => isNewComment(c, ctx.seenAt.value, commentPrefs.authorId)
const when = (iso: string) => relative(Date.parse(iso), now.value)

async function startEdit(c: IComment) {
  editingId.value = c.id
  editText.value = c.content
  await nextTick()
  document.getElementById(`edit-${c.id}`)?.focus()
}

async function saveEdit(c: IComment) {
  if (!editText.value.trim()) return
  await Comment.edit(c.id, editText.value)
  editingId.value = null
}

function onEditKeydown(e: KeyboardEvent, c: IComment) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    void saveEdit(c)
  } else if (e.key === 'Escape') {
    e.stopPropagation()
    editingId.value = null
  }
}

async function confirmDelete() {
  const c = toDelete.value
  toDelete.value = null
  if (c) await Comment.deleteObject(c.id)
}

function setResolved(c: IComment, resolved: boolean) {
  void Comment.setResolved(c.id, resolved, commentPrefs.authorId)
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(ctx.linkFor(key.value))
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <div class="thread" :data-thread="key">
    <p v-if="comments.length === 0" class="empty">{{ t('advancement.comment.noComments') }}</p>

    <ul class="entries">
        <li v-for="c in visibleComments" :key="c.id" class="entry" :class="{ resolved: c.resolved, new: isNew(c) }">
          <div class="meta">
            <strong class="author">{{ authorName(c) }}</strong>
            <span v-if="roleLabel(c)" class="role">{{ roleLabel(c) }}</span>
            <time :datetime="c.date" :title="formatDate(c.date, locale)">{{ when(c.date) }}</time>
            <span v-if="c.editedAt" class="edited" :title="formatDate(c.editedAt, locale)">· {{ t('advancement.comment.edited') }}</span>
            <span v-if="isNew(c)" class="new-badge" :title="t('advancement.comment.newSinceLastVisit')">{{ t('advancement.comment.new') }}</span>
            <span v-if="c.resolved" class="resolved-badge">
              {{ personName(c.resolvedById) ? t('advancement.comment.resolvedBy', { name: personName(c.resolvedById) }) : t('advancement.comment.resolved') }}
            </span>
          </div>

          <div v-if="editingId === c.id" class="edit">
            <textarea :id="`edit-${c.id}`" v-model="editText" class="edit-input" rows="3" @keydown="onEditKeydown($event, c)" />
            <div class="edit-actions">
              <ButtonComponent :button-text="t('advancement.comment.cancel')" button-style="ghost" @click="editingId = null" />
              <ButtonComponent :button-text="t('advancement.comment.save')" button-style="primary" :disabled="!editText.trim()" @click="saveEdit(c)" />
            </div>
          </div>
          <p v-else class="content">{{ c.content }}</p>

          <div v-if="editingId !== c.id" class="actions">
            <button v-if="!c.resolved" type="button" class="action resolve" @click="setResolved(c, true)">{{ t('advancement.comment.resolve') }}</button>
            <button v-else type="button" class="action" @click="setResolved(c, false)">{{ t('advancement.comment.reopen') }}</button>
            <template v-if="isOwn(c)">
              <button type="button" class="action" @click="startEdit(c)">{{ t('advancement.comment.edit') }}</button>
              <button type="button" class="action danger" @click="toDelete = c">{{ t('advancement.comment.delete') }}</button>
            </template>
          </div>
        </li>
    </ul>

    <div class="thread-tools">
      <button v-if="resolvedComments.length > 0" type="button" class="link-button" :aria-expanded="showResolved" @click="showResolved = !showResolved">
        {{ showResolved ? t('advancement.comment.hideResolved') : t('advancement.comment.showResolved', { n: resolvedComments.length }) }}
      </button>
      <button v-if="showLink" type="button" class="link-button" @click="copyLink">{{ copied ? t('advancement.comment.linkCopied') : t('advancement.comment.copyLink') }}</button>
    </div>

    <CommentComposer :target="target" />

    <PopupComponent
        v-if="toDelete"
        :title="t('advancement.comment.deleteTitle')"
        :message="t('advancement.comment.deleteMessage')"
        :option-one="{ text: t('edit.delete'), style: 'error', action: confirmDelete }"
        :option-two="{ text: t('edit.cancel'), action: () => { toDelete = null } }"
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.thread {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  font-family: 'Museo', sans-serif;
}

.empty {
  margin: 0;
  font-size: 14px;
  opacity: 0.75;
}

.entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-warning);
  min-width: 0;
}

.entry.resolved {
  border-left-color: var(--accent-success);
  opacity: 0.85;
}

.entry.new {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.35);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 13px;
}

.author {
  overflow-wrap: anywhere;
}

.role,
.new-badge,
.resolved-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
}

.role {
  background: rgba(50, 158, 213, 0.18);
}

.new-badge {
  background: var(--accent-error);
  color: white;
}

.resolved-badge {
  background: rgba(16, 185, 129, 0.2);
}

time,
.edited {
  opacity: 0.7;
}

.content {
  margin: 6px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.45;
  font-size: 15px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.action {
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.action.resolve {
  border-color: var(--accent-success);
}

.action.danger {
  color: var(--accent-error);
}

@media (pointer: coarse) {
  .action {
    min-height: var(--touch-target);
    padding: 6px 12px;
  }
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.edit-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--secondary-color);
  background: var(--surface-raised);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
  resize: vertical;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.thread-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}

.link-button {
  border: none;
  background: none;
  padding: 0;
  min-height: 32px;
  color: var(--secondary-color);
  font: inherit;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}
</style>
