<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatBubbleIconComponent from '@/components/Universal/Icons/ChatBubbleIconComponent.vue'
import { isNewComment, openCount, type CommentTargetKey } from '@/scripts/database/Comment'
import { commentPrefs } from '@/scripts/commentPrefs'
import { useCommentsContext } from './commentsContext'

/**
 * Speech bubble with a counter: open notes (highlighted), or the grey total when all are resolved.
 * Opens/closes the thread of `targetKey`.
 */
const props = withDefaults(defineProps<{ targetKey: CommentTargetKey; showLabel?: boolean }>(), { showLabel: false })

const { t } = useI18n()
const ctx = useCommentsContext()

const comments = computed(() => ctx.groups.value.get(props.targetKey) ?? [])
const open = computed(() => openCount(comments.value))
const total = computed(() => comments.value.length)
const hasNew = computed(() => comments.value.some((c) => isNewComment(c, ctx.seenAt.value, commentPrefs.authorId)))
const expanded = computed(() => ctx.isOpen(props.targetKey))

const label = computed(() => {
  if (total.value === 0) return t('advancement.comment.buttonLabelEmpty')
  if (open.value === 0) return t('advancement.comment.buttonLabelResolved', { n: total.value })
  return t('advancement.comment.buttonLabel', { n: open.value })
})
</script>

<template>
  <button
      type="button"
      class="comment-button"
      :class="{ 'has-open': open > 0, 'all-resolved': total > 0 && open === 0, expanded }"
      :aria-label="label"
      :title="label"
      :aria-expanded="expanded"
      :aria-haspopup="ctx.usesSheet(targetKey) ? 'dialog' : undefined"
      @click.stop="ctx.toggle(targetKey)"
  >
    <span class="icon">
      <ChatBubbleIconComponent />
      <span v-if="hasNew" class="new-dot" aria-hidden="true" />
    </span>
    <span v-if="total > 0" class="count" aria-hidden="true">{{ open > 0 ? open : total }}</span>
    <span v-if="showLabel" class="text" aria-hidden="true">{{ total === 0 ? t('advancement.comment.add') : t('advancement.comment.title') }}</span>
  </button>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.comment-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: transparent;
  color: inherit;
  font-family: 'Museo', sans-serif;
  font-size: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s, border-color 0.15s;
}

@media (hover: hover) {
  .comment-button:hover {
    background: rgba(50, 158, 213, 0.12);
  }
}

.comment-button.expanded {
  border-color: var(--secondary-color);
  background: rgba(50, 158, 213, 0.12);
}

.icon {
  position: relative;
  display: inline-flex;
  opacity: 0.85;
}

.count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: rgba(127, 140, 146, 0.25);
}

.has-open .count {
  background: var(--accent-warning);
  color: #1f1300;
}

.all-resolved .count {
  opacity: 0.8;
}

.new-dot {
  position: absolute;
  top: -3px;
  right: -4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-error);
  box-shadow: 0 0 0 2px var(--surface-raised);
}

.text {
  font-size: 13px;
  white-space: nowrap;
}
</style>
