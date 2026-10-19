<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNewComment, openCount, type CommentTargetKey } from '@/scripts/database/Comment'
import { commentPrefs } from '@/scripts/commentPrefs'
import { useCommentsContext } from './commentsContext'

/** "Otwarte uwagi (n)": every open note of the advancement, grouped by target; a click opens the thread. */
const props = defineProps<{ order: CommentTargetKey[] }>()

const { t } = useI18n()
const ctx = useCommentsContext()
const PREVIEW = 2

const groups = computed(() =>
    props.order
        .map((key) => {
          const open = (ctx.groups.value.get(key) ?? []).filter((c) => !c.resolved)
          return { key, open, hasNew: open.some((c) => isNewComment(c, ctx.seenAt.value, commentPrefs.authorId)) }
        })
        .filter((g) => g.open.length > 0),
)
const total = computed(() => groups.value.reduce((n, g) => n + openCount(g.open), 0))

function authorName(authorId: string, fallback: string) {
  return ctx.people.value.find((p) => p.id === authorId)?.fullName || fallback || t('advancement.comment.unknownAuthor')
}
</script>

<template>
  <section v-if="total > 0" class="comments-summary" aria-labelledby="comments-summary-title">
    <details open>
      <summary id="comments-summary-title">{{ t('advancement.comment.summaryTitle', { n: total }) }}</summary>
      <ul>
        <li v-for="group in groups" :key="group.key">
          <button type="button" class="target" @click="ctx.reveal(group.key)">
            <span class="target-head">
              <strong>{{ ctx.targetLabel(group.key) }}</strong>
              <span v-if="group.hasNew" class="new-dot" :title="t('advancement.comment.newSinceLastVisit')" />
              <span class="show">{{ t('advancement.comment.summaryShow') }} →</span>
            </span>
            <span v-for="c in group.open.slice(-PREVIEW)" :key="c.id" class="snippet">
              <em>{{ authorName(c.authorId, c.authorName) }}:</em> {{ c.content }}
            </span>
            <span v-if="group.open.length > PREVIEW" class="more">{{ t('advancement.comment.summaryMore', { n: group.open.length - PREVIEW }) }}</span>
          </button>
        </li>
      </ul>
    </details>
  </section>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.comments-summary {
  border-radius: 10px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-warning);
  background: var(--surface-raised);
  color: var(--text);
  padding: 4px 12px 8px;
  box-shadow: 0 4px 14px var(--shadow-light);
}

summary {
  cursor: pointer;
  font-weight: 700;
  min-height: var(--touch-target);
  display: flex;
  align-items: center;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  min-width: 0;
}

.target {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  text-align: left;
  padding: 8px 10px;
  min-height: var(--touch-target);
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

@media (hover: hover) {
  .target:hover {
    border-color: var(--secondary-color);
  }
}

.target-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.show {
  margin-left: auto;
  font-size: 13px;
  color: var(--secondary-color);
}

.snippet {
  font-size: 13px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more {
  font-size: 12px;
  opacity: 0.7;
}

.new-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-error);
}
</style>
