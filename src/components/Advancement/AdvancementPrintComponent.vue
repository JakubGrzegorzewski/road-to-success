<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { IRank, IRankInProgress, IRequirement, ITask, IUser } from "@/scripts/interfaces.js";


const { t } = useI18n();

const props = defineProps<{
  rankInProgress: IRankInProgress,
  rank: IRank,
  mentee: IUser,
  mentor: IUser,
  tasks: ITask[],
  requirements: IRequirement[],
}>();

function isRequirementSelected(task: ITask, requirement: IRequirement) {
  const reqIds = Array.isArray(task.requirementsIds) ? task.requirementsIds : [];
  return reqIds.includes(requirement.id as number);
}

</script>

<template>
  <div
      class="report-container"
  >
    <header>
      <h1>{{ rank.fullName }}</h1>
      <div class="header-meta">
        <p><strong>{{ t('advancement.mentee') }}:</strong> {{ mentee.fullName || '—' }}</p>
        <p><strong>{{ t('advancement.mentor') }}:</strong> {{ mentor.fullName || '—' }}</p>
      </div>
    </header>

    <section v-if="rank.startRequirements?.length > 0 && rank.endRequirements?.length > 0" class="requirements-section">
      <h2>{{ t('advancement.requirement.showRequirements') }}</h2>
      <div class="requirements-grid">
        <div class="req-box">
          <h3>{{ t('advancement.requirement.start') }}</h3>
          <ul>
            <li v-for="req in rank.startRequirements" :key="req">{{ req }}</li>
          </ul>
        </div>
        <div class="req-box">
          <h3>{{ t('advancement.requirement.end') }}</h3>
          <ul>
            <li v-for="req in rank.endRequirements" :key="req">{{ req }}</li>
          </ul>
        </div>
      </div>
    </section>

    <article v-if="rank.idea" class="rank-idea" v-html="rank.idea"/>

    <section v-if="tasks.length > 0" class="tasks-section">
      <h2>{{ t('advancement.task.tasks') }}</h2>

      <div v-for="task in tasks" :key="task.id" class="task-card">
        <div class="task-row">
          <strong>{{ t('advancement.task.content') }}:</strong>
          <p>{{ task.content || '—' }}</p>
        </div>

        <div v-if="task.partIdea && task.partIdea.length > 0" class="task-row">
          <strong>{{ t('advancement.task.idea') }}:</strong>
          <p>{{ task.partIdea.join(' ') }}</p>
        </div>

        <div class="task-row">
          <strong>{{ t('advancement.requirements') }}:</strong>
          <div class="task-badges">
            <template v-for="requirement in requirements" :key="requirement.id">
              <div v-if="isRequirementSelected(task, requirement)" class="req-badge">
                {{ requirement.number }}. {{ requirement.content }}
              </div>
            </template>
            <span v-if="!task.requirementsIds || task.requirementsIds.length === 0">—</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
.requirements-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.task-card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 15px; background: #f8fafc; }
.task-row { margin-bottom: 12px; }
.task-row:last-child { margin-bottom: 0; }
.rank-idea { text-align: justify; line-height: 1.6; }
h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }

.report-container {
  font-family: 'Museo', sans-serif;
  background: white;
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  margin: 20px auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  color: #000;
  font-size: 11pt;
  gap: 15px;
  display: block;
}

.report-container .task-card {
  background: transparent;
  border: 1px solid #000;
  border-radius: 0;
}

.tasks-section{
  break-inside: avoid-region;
}

.report-container h2,
.report-container header {
  border-color: #000;
}

@media print {
  @page { size: A4; margin: 20mm; }

  .report-container {
    width: 100% !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    color: #000 !important;
    display: block !important;
  }

  header, h2 { border-color: #000 !important; }
  h2 { page-break-after: avoid; }
  .task-card {
    background: transparent !important;
    border: 1px solid #000 !important;
    border-radius: 0 !important;
  }
  .tasks-section{
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  strong, p, li, div, span { color: #000 !important; }
}
</style>