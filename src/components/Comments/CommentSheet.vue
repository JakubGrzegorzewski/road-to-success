<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { targetFromKey, type CommentTargetKey } from '@/scripts/database/Comment'
import CommentThread from './CommentThread.vue'
import { useCommentsContext } from './commentsContext'

/**
 * Thread in a bottom sheet (phones) or a dialog (wider screens). Follows the on-screen keyboard
 * through `visualViewport`, so the composer is never hidden behind it.
 */
const props = defineProps<{ targetKey: CommentTargetKey; subtitle?: string }>()

const { t } = useI18n()
const ctx = useCommentsContext()
const card = ref<HTMLElement | null>(null)
const keyboard = ref(0)
const viewportHeight = ref<number | null>(null)
let previouslyFocused: Element | null = null

const target = computed(() => targetFromKey(props.targetKey))
const title = computed(() => t('advancement.comment.threadTitle', { target: ctx.targetLabel(props.targetKey) }))

function onViewport() {
  const vv = window.visualViewport
  if (!vv) return
  keyboard.value = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
  viewportHeight.value = Math.round(vv.height)
}

function onKeydown(e: KeyboardEvent) {
  // a confirmation popup on top handles its own Escape
  if (e.key === 'Escape' && !document.querySelector('.modal-overlay')) {
    e.preventDefault()
    ctx.closeSheet()
  }
}

onMounted(async () => {
  previouslyFocused = document.activeElement
  document.addEventListener('keydown', onKeydown)
  window.visualViewport?.addEventListener('resize', onViewport)
  window.visualViewport?.addEventListener('scroll', onViewport)
  onViewport()
  await nextTick()
  card.value?.querySelector<HTMLElement>('.sheet-close')?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.visualViewport?.removeEventListener('resize', onViewport)
  window.visualViewport?.removeEventListener('scroll', onViewport)
  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
})
</script>

<template>
  <Teleport to="body">
    <div
        class="sheet-overlay"
        :style="{ '--keyboard': `${keyboard}px`, '--vvh': viewportHeight ? `${viewportHeight}px` : '100dvh' }"
        @click.self="ctx.closeSheet()"
    >
      <section ref="card" class="sheet" role="dialog" aria-modal="true" :aria-label="title">
        <header class="sheet-header">
          <h2>{{ title }}</h2>
          <button type="button" class="sheet-close" :aria-label="t('advancement.comment.close')" @click="ctx.closeSheet()">✕</button>
        </header>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        <CommentThread :target="target" />
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.sheet-overlay {
  position: fixed;
  inset: 0;
  /* below PopupComponent (2400): confirmation dialogs open on top of the sheet */
  z-index: 2300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
}

.sheet {
  width: 560px;
  max-width: calc(100% - 32px);
  max-height: calc(var(--vvh) - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--surface-raised);
  color: var(--text);
  border-radius: 14px;
  padding: 16px 18px 18px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
  font-family: 'Museo', sans-serif;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.sheet-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.sheet-close {
  flex: none;
  width: var(--touch-target);
  height: var(--touch-target);
  margin: -8px -10px -8px 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

.subtitle {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.45;
  opacity: 0.85;
  white-space: pre-wrap;
  max-height: 6.5em;
  overflow: hidden;
}

@media (max-width: 599px) {
  .sheet-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .sheet {
    width: 100%;
    max-width: 100%;
    max-height: calc(var(--vvh) - 24px);
    margin-bottom: var(--keyboard);
    border-radius: 16px 16px 0 0;
    padding: 12px 14px calc(14px + var(--safe-bottom));
  }
  .sheet::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    margin: 0 auto 8px;
  }
}
</style>
