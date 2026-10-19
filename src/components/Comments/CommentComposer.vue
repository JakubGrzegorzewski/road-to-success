<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import HelpLink from '@/components/Universal/HelpLink.vue'
import type { CommentTarget, IUser } from '@/scripts/interfaces'
import { authorRole, Comment, targetKey } from '@/scripts/database/Comment'
import { commentPrefs, loadCommentPrefs, setCommentAuthor } from '@/scripts/commentPrefs'
import { useCommentsContext } from './commentsContext'

/**
 * New comment: textarea that grows with the text, "Piszę jako: X (zmień)", Ctrl/⌘+Enter sends.
 * The draft is kept in localStorage per target, so switching threads does not lose it.
 */
const props = defineProps<{ target: CommentTarget }>()
const emit = defineEmits<{ (e: 'sent'): void }>()

const { t } = useI18n()
const ctx = useCommentsContext()

const text = ref('')
const area = ref<HTMLTextAreaElement | null>(null)
const picking = ref(false)
const sending = ref(false)

const rip = computed(() => ctx.rankInProgress.value)
const draftKey = computed(() => `rts.commentDraft.${rip.value?.id ?? ''}.${targetKey(props.target)}`)
const author = computed<IUser | undefined>(() => ctx.people.value.find((p) => p.id === commentPrefs.authorId))
const needsAuthor = computed(() => commentPrefs.loaded && !author.value)

/** Mentor and mentee of this advancement first, then everybody else. */
const candidates = computed(() => {
  const r = rip.value
  const rank = (p: IUser) => (p.id === r?.mentorId ? 0 : p.id === r?.personId ? 1 : 2)
  return [...ctx.people.value].sort((a, b) => rank(a) - rank(b))
})

function roleLabel(id: string): string {
  const role = authorRole(id, rip.value)
  return role === 'mentor' ? t('advancement.comment.roleMentor') : role === 'mentee' ? t('advancement.comment.roleMentee') : ''
}

function readDraft(): string {
  try {
    return localStorage.getItem(draftKey.value) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(value: string) {
  try {
    if (value) localStorage.setItem(draftKey.value, value)
    else localStorage.removeItem(draftKey.value)
  } catch {
    /* storage unavailable */
  }
}

function autoGrow() {
  const el = area.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(Math.max(el.scrollHeight, 72), 320)}px`
}

function onInput() {
  writeDraft(text.value)
  autoGrow()
}

async function choose(id: string) {
  await setCommentAuthor(id)
  picking.value = false
  await nextTick()
  area.value?.focus()
}

async function send() {
  const r = rip.value
  const content = text.value.trim()
  if (!r || !content || !author.value || sending.value) return
  sending.value = true
  try {
    await Comment.add({ rankInProgressId: r.id, target: props.target, authorId: author.value.id, content })
    text.value = ''
    writeDraft('')
    await nextTick()
    autoGrow()
    emit('sent')
  } finally {
    sending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    void send()
  }
}

/** On phones the keyboard covers the lower half of the screen: keep the field visible. */
function onFocus() {
  const vv = window.visualViewport
  if (!vv) return
  const keep = () => area.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  vv.addEventListener('resize', keep, { once: true })
  setTimeout(keep, 350)
}

watch(draftKey, () => {
  text.value = readDraft()
  void nextTick(autoGrow)
})

onMounted(async () => {
  await loadCommentPrefs()
  text.value = readDraft()
  await nextTick()
  autoGrow()
})

defineExpose({ focus: () => area.value?.focus() })
</script>

<template>
  <div class="composer">
    <fieldset v-if="needsAuthor || picking" class="author-picker">
      <legend>
        {{ t('advancement.comment.chooseAuthor') }}
        <HelpLink to="komentarze#pisze-jako" />
      </legend>
      <p class="hint">{{ t('advancement.comment.chooseAuthorHint') }}</p>
      <div class="author-options">
        <button
            v-for="person in candidates"
            :key="person.id"
            type="button"
            class="author-option"
            :class="{ selected: person.id === commentPrefs.authorId }"
            :aria-pressed="person.id === commentPrefs.authorId"
            @click="choose(person.id)"
        >
          <span class="name">{{ person.fullName }}</span>
          <span v-if="roleLabel(person.id)" class="role">{{ roleLabel(person.id) }}</span>
        </button>
        <router-link to="/dodaj-osobe/" class="author-option add">+ {{ t('advancement.comment.addPerson') }}</router-link>
      </div>
      <button v-if="picking && author" type="button" class="link-button" @click="picking = false">{{ t('edit.cancel') }}</button>
    </fieldset>

    <template v-else-if="author">
      <label class="visually-hidden" :for="`composer-${targetKey(target)}`">{{ t('advancement.comment.placeholder') }}</label>
      <textarea
          :id="`composer-${targetKey(target)}`"
          ref="area"
          v-model="text"
          class="composer-input"
          rows="2"
          :placeholder="t('advancement.comment.placeholder')"
          enterkeyhint="enter"
          @input="onInput"
          @keydown="onKeydown"
          @focus="onFocus"
      />
      <div class="composer-footer">
        <span class="writing-as">
          {{ t('advancement.comment.writingAs') }}: <strong>{{ author.fullName }}</strong>
          <span v-if="roleLabel(author.id)" class="role">{{ roleLabel(author.id) }}</span>
          <span aria-hidden="true">·</span>
          <button type="button" class="link-button" @click="picking = true">{{ t('advancement.comment.change') }}</button>
          <HelpLink to="komentarze#pisze-jako" />
        </span>
        <span class="send">
          <span class="send-hint" aria-hidden="true">{{ t('advancement.comment.sendHint') }}</span>
          <ButtonComponent :button-text="t('advancement.comment.send')" button-style="primary" :disabled="!text.trim() || sending" @click="send" />
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.composer-input {
  width: 100%;
  min-height: 72px;
  max-height: 320px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: 'Museo', sans-serif;
  font-size: 16px; /* no zoom on iOS */
  line-height: 1.45;
  resize: none;
}

.composer-input:focus {
  outline: 2px solid var(--secondary-color);
  outline-offset: 0;
}

.composer-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  font-size: 13px;
}

.writing-as {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.send {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.send-hint {
  opacity: 0.6;
  font-size: 12px;
}

.role {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(50, 158, 213, 0.18);
}

.link-button {
  border: none;
  background: none;
  padding: 0;
  color: var(--secondary-color);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
  min-height: 24px;
}

.author-picker {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px 12px;
  margin: 0;
  min-width: 0;
}

.author-picker legend {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-weight: 700;
  padding: 0 4px;
}

.hint {
  margin: 0 0 8px;
  font-size: 13px;
  opacity: 0.8;
}

.author-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.author-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--touch-target);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  max-width: 100%;
}

.author-option .name {
  overflow-wrap: anywhere;
}

.author-option.selected {
  border-color: var(--secondary-color);
}

.author-option.add {
  border-style: dashed;
}

@media (max-width: 599px) {
  .send-hint {
    display: none;
  }
  .author-option {
    flex: 1 1 100%;
  }
}

@media (pointer: coarse) {
  .send-hint {
    display: none;
  }
}
</style>
