<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AdvancementViewModel } from "@/scripts/pdf/advancementViewModel";
import { useLayout } from "@/scripts/composables";
import ReportCommentsComponent from "@/components/Advancement/ReportCommentsComponent.vue";
import { computed } from "vue";

/** Screen preview of the "requirement table" document (same data as the PDF). */
const props = defineProps<{
  vm: AdvancementViewModel,
  rankIcon?: string,
}>();

const { t } = useI18n();
const { isWide } = useLayout();

/** Appendix "Uwagi" with references to the commented items (as in the PDF). */
const appendix = computed(() => props.vm.includeComments
  ? [
      { ref: t('pdf.generalRef'), rows: props.vm.generalComments },
      ...props.vm.tasks.map(task => ({ ref: t('pdf.taskRef', { n: task.index }), rows: task.comments })),
      ...props.vm.requirements.map(r => ({ ref: t('pdf.requirementRef', { label: r.label }), rows: r.comments })),
    ].filter(e => e.rows.length > 0)
  : []);
</script>

<template>
  <div class="report-container">
    <div class="report-header">
      <img v-if="rankIcon" :src="rankIcon" :alt="vm.rank.fullName" class="rank-image"/>
      <h1>{{ vm.rank.fullName }}</h1>
      <div><strong>{{ t('advancement.mentee') }}:</strong> {{ vm.menteeName || '—' }}</div>
      <div><strong>{{ t('advancement.mentor') }}:</strong> {{ vm.mentorName || '—' }}</div>
    </div>

    <article class="rank-idea">
      <template v-for="(segment, i) in vm.ideaSegments" :key="i"><span :class="{ 'idea-part-highlight': segment.highlighted }">{{ segment.text }}</span></template>
    </article>

    <section v-if="vm.requirements.length > 0" class="matrix-section">
      <h2>{{ t('advancement.requirements') }}</h2>

      <table v-if="isWide" class="matrix-table">
        <thead>
        <tr>
          <th class="col-req">{{ t('requirement.requirement') }}</th>
          <th class="col-tasks">{{ t('advancement.task.tasks') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="requirement in vm.requirements" :key="requirement.id">
          <td class="col-req">
            <strong>{{ requirement.label }}.</strong> {{ requirement.content }}
          </td>
          <td class="col-tasks">
            <div v-if="requirement.tasks.length > 0" class="tasks-wrapper">
              <div v-for="task in requirement.tasks" :key="task.id" class="task-item">
                <p class="task-content">{{ task.content || '—' }}</p>
              </div>
            </div>
            <span v-else class="no-tasks">—</span>
          </td>
        </tr>
        </tbody>
      </table>

      <!-- below 960 px: one card per requirement instead of a table -->
      <ul v-else class="requirement-cards">
        <li v-for="requirement in vm.requirements" :key="requirement.id" class="requirement-card" :class="{ empty: requirement.tasks.length === 0 }">
          <p class="requirement-text"><strong>{{ requirement.label }}.</strong> {{ requirement.content }}</p>
          <div class="requirement-tasks">
            <span class="cards-label">{{ t('advancement.task.tasks') }}:</span>
            <p v-for="task in requirement.tasks" :key="task.id" class="task-content">{{ task.content || '—' }}</p>
            <span v-if="requirement.tasks.length === 0" class="no-tasks">—</span>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="appendix.length > 0" class="comments-appendix">
      <h2>{{ t('pdf.commentsAppendix') }}</h2>
      <dl>
        <template v-for="entry in appendix" :key="entry.ref">
          <dt>{{ entry.ref }}</dt>
          <dd><ReportCommentsComponent :rows="entry.rows" /></dd>
        </template>
      </dl>
    </section>
  </div>
</template>

<style scoped>
h1 {
  margin: 10mm 0 8px;
  text-align: center;
}

h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }

.rank-image{
  width: 300px;
  max-width: 60%;
  padding: 20px;
}

.report-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20mm 20mm 20mm;
}

.rank-idea {
  text-align: justify;
  line-height: 1.6;
  break-after: page;
}

.idea-part-highlight {
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

.report-container {
  font-family: 'Museo', sans-serif;
  background: white;
  width: 210mm;
  max-width: 100%;
  min-height: 297mm;
  padding: 20mm;
  margin: 20px auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  color: #000;
  font-size: 11pt;
  display: block;
}

.report-container h2,
.report-container header {
  border-color: #000;
}

.matrix-section {
  margin-top: 25px;
}

.comments-appendix {
  margin-top: 25px;
  break-before: auto;
}

.comments-appendix dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 14px;
  margin: 0;
}

.comments-appendix dt {
  font-weight: 700;
}

.comments-appendix dd {
  margin: 0;
  min-width: 0;
}

@media (max-width: 599px) {
  .comments-appendix dl {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  .comments-appendix dd {
    margin-bottom: 10px;
  }
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  font-size: 10pt;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #000 !important;
  padding: 10px;
  vertical-align: top;
  text-align: left;
}

.matrix-table th {
  background-color: #f1f5f9;
  font-weight: bold;
}

.col-req {
  width: 40%;
}

.col-tasks {
  width: 60%;
}

.tasks-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  padding-bottom: 8px;
  border-bottom: 1px dashed #cbd5e1;
}

.task-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.task-content {
  margin: 0 0 4px 0;
  white-space: pre-wrap;
}

.no-tasks {
  color: #94a3b8;
}

.requirement-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.requirement-card {
  border: 1px solid #cbd5e1;
  border-left: 4px solid var(--accent-success);
  border-radius: 8px;
  padding: 10px 12px;
}

.requirement-card.empty {
  border-left-color: #cbd5e1;
}

.requirement-text {
  margin: 0 0 8px;
}

.cards-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 2px;
}

/* tablets and phones: fluid "paper" instead of a fixed A4 sheet */
@media (max-width: 959px) {
  .report-container {
    width: auto;
    min-height: 0;
    margin: 12px;
    padding: 20px 16px;
    font-size: 15px;
  }
  .report-header {
    padding: 0 0 20px;
  }
  h1 {
    margin-top: 0;
    font-size: 1.6rem;
  }
  .rank-idea {
    text-align: left;
  }
}

@media print {
  @page { size: A4; margin: 15mm; }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  #app, main, .v-application {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
  }
  .report-container {
    position: static !important;
    width: 210mm !important;
    padding: 5mm !important;
    box-shadow: none !important;
    color: #000 !important;
    display: block !important;
    box-sizing: border-box !important;
    background: transparent !important;
  }

  header, h2 { border-color: #000 !important; }

  .matrix-table th {
    background-color: transparent !important;
  }

  .task-item {
    border-color: #000 !important;
  }
  strong, p, li, div, span, th, td { color: #000 !important; }
}
</style>
