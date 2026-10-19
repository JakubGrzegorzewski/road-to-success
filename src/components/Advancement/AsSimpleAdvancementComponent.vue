<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AdvancementViewModel } from "@/scripts/pdf/advancementViewModel";
import { Status } from "@/scripts/interfaces";

/** Screen preview of the "task list" document (same data as the PDF). */
defineProps<{
  vm: AdvancementViewModel,
  rankIcon?: string,
}>();

const { t } = useI18n();

const statusKey: Record<Status, string> = {
  [Status.DRAFT]: 'statusOptions.draft',
  [Status.CREATED]: 'statusOptions.created',
  [Status.PENDING]: 'statusOptions.pending',
  [Status.IN_PROGRESS]: 'statusOptions.in_progress',
  [Status.COMPLETED]: 'statusOptions.completed',
  [Status.FAILED]: 'statusOptions.failed',
}
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

      <section class="tasks-section">
        <h2>{{ t('advancement.task.tasks') }}</h2>
        <p v-if="vm.tasks.length === 0" class="muted">{{ t('advancement.task.noTasks') }}</p>

        <div v-for="task in vm.tasks" :key="task.id" class="task-card">
          <div class="task-title">
            <strong>{{ t('advancement.task.task') }} {{ task.index }}</strong>
            <span class="status">{{ t(statusKey[task.status]) }}</span>
          </div>
          <p class="task-text">{{ task.content || '—' }}</p>

          <div v-if="task.ideaFragments.length > 0" class="task-row">
            <strong>{{ t('advancement.task.idea') }}:</strong>
            <p class="fragment">{{ task.ideaFragments.join(' … ') }}</p>
          </div>

          <div class="task-row">
            <strong>{{ t('advancement.requirements') }}:</strong>
            <div class="task-badges">
              <div v-for="requirement in task.requirements" :key="requirement.id" class="req-badge">
                <strong>{{ requirement.label }}.</strong> {{ requirement.content }}
              </div>
              <span v-if="task.requirements.length === 0">—</span>
            </div>
          </div>
        </div>
      </section>
  </div>
</template>

<style scoped>
h1 {
  margin: 10mm 0 8px;
  text-align: center;
}

.report-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20mm;
}

.rank-image{
  width: 300px;
  max-width: 60%;
  padding: 20px;
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

.muted {
  color: #64748b;
}

.task-card {
  padding: 16px 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
  break-inside: avoid;
}

.task-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.status {
  font-size: 0.85em;
  color: #475569;
}

.task-text {
  white-space: pre-wrap;
  margin: 6px 0 10px;
}

.fragment {
  margin: 2px 0 0;
  font-style: italic;
}

.task-row {
  margin-bottom: 12px;
}
.task-row:last-child {
  margin-bottom: 0;
}

.task-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

h2 {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  margin-bottom: 15px;
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
  @page { size: A4; margin: 0; }

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
    padding: 0 !important;
    box-shadow: none !important;
    color: #000 !important;
    display: block !important;
    box-sizing: border-box !important;
    background: transparent !important;
  }
  h2, h3 {
    break-after: avoid !important;
  }

  .tasks-section {
    page-break-inside: auto !important;
    break-inside: auto !important;
  }

  .task-card {
    background: transparent !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  strong, p, li, div, span { color: #000 !important; }
}
</style>
