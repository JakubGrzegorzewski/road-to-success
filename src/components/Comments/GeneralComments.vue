<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openCount } from '@/scripts/database/Comment'
import CommentButton from './CommentButton.vue'
import CommentThread from './CommentThread.vue'
import { useCommentsContext } from './commentsContext'

/** "Uwagi ogólne": notes about the whole advancement, between the idea and the tasks. */
const { t } = useI18n()
const ctx = useCommentsContext()
const comments = computed(() => ctx.groups.value.get('adv') ?? [])
const open = computed(() => openCount(comments.value))
const expanded = computed(() => ctx.isOpen('adv'))
</script>

<template>
  <section id="uwagi-ogolne" class="general-comments" :class="{ expanded }">
    <header class="head">
      <div class="titles">
        <h2>{{ t('advancement.comment.general') }}</h2>
        <p class="hint">
          <template v-if="comments.length === 0">{{ t('advancement.comment.generalHint') }}</template>
          <template v-else-if="open > 0">{{ t('advancement.comment.openCount', { n: open }, open) }}</template>
          <template v-else>{{ t('advancement.comment.allResolved') }}</template>
        </p>
      </div>
      <CommentButton target-key="adv" show-label />
    </header>
    <CommentThread v-if="expanded" :target="{ type: 'advancement' }" class="body" />
  </section>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.general-comments {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-raised);
  color: var(--text);
  padding: 8px 12px;
  box-shadow: 0 4px 14px var(--shadow-light);
  scroll-margin-top: 80px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.titles {
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

.hint {
  margin: 2px 0 0;
  font-size: 13px;
  opacity: 0.75;
}

.body {
  margin-top: 10px;
}

@media (max-width: 599px) {
  .head :deep(.comment-button .text) {
    display: none;
  }
}
</style>
