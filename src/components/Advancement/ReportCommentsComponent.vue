<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { CommentRow } from "@/scripts/pdf/advancementViewModel";

/** Comments in the document preview (same content as the PDF). */
defineProps<{ rows: CommentRow[] }>();

const { t, locale } = useI18n();
const date = (iso: string) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
};
const role = (r: CommentRow['role']) => (r === 'mentor' ? t('advancement.comment.roleMentor') : r === 'mentee' ? t('advancement.comment.roleMentee') : '');
</script>

<template>
  <ul class="report-comments">
    <li v-for="c in rows" :key="c.id" :class="{ resolved: c.resolved }">
      <span class="meta">
        <strong>{{ c.author || '—' }}</strong>
        <template v-if="role(c.role)"> · {{ role(c.role) }}</template>
        · {{ date(c.date) }}
        <template v-if="c.resolved"> · {{ t('advancement.comment.resolved') }}</template>
      </span>
      <span class="text">{{ c.content }}</span>
    </li>
  </ul>
</template>

<style scoped>
.report-comments {
  list-style: none;
  margin: 4px 0 0;
  padding: 0 0 0 10px;
  border-left: 2px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.92em;
}

.meta {
  display: block;
  font-size: 0.85em;
  color: #475569;
}

.text {
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.resolved .text {
  color: #475569;
}
</style>
