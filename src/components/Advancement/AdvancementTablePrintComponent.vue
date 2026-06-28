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

function getTasksForRequirement(requirement: IRequirement): ITask[] {
  return props.tasks.filter(task => {
    const reqIds = Array.isArray(task.requirementsIds) ? task.requirementsIds : [];
    return reqIds.includes(requirement.id as number);
  });
}
</script>

<template>
  <div class="report-container">
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

    <section v-if="requirements.length > 0" class="matrix-section">
      <h2>{{ t('advancement.requirements') }}</h2>

      <table class="matrix-table">
        <thead>
        <tr>
          <th class="col-req">{{ t('advancement.requirement.showRequirements') }}</th>
          <th class="col-tasks">{{ t('advancement.task.tasks') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="requirement in requirements" :key="requirement.id">
          <td class="col-req">
            <strong>{{ requirement.number }}.</strong> {{ requirement.content }}
          </td>

          <td class="col-tasks">
            <div v-if="getTasksForRequirement(requirement).length > 0" class="tasks-wrapper">
              <div
                  v-for="task in getTasksForRequirement(requirement)"
                  :key="task.id"
                  class="task-item"
              >
                <p class="task-content">{{ task.content }}</p>
                <p v-if="task.partIdea && task.partIdea.length > 0" class="task-idea">
                  <small><strong>{{ t('advancement.task.idea') }}:</strong> {{ task.partIdea.join(' ') }}</small>
                </p>
              </div>
            </div>
            <span v-else class="no-tasks">—</span>
          </td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
.requirements-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
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
  display: block;
}

.report-container h2,
.report-container header {
  border-color: #000;
}

/* Style tabeli */
.matrix-section {
  margin-top: 25px;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  font-size: 10pt;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #000;
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
}

.task-idea {
  margin: 0;
  color: #64748b;
}

.no-tasks {
  color: #94a3b8;
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

  .matrix-table th {
    background-color: transparent !important;
  }

  .task-item {
    border-color: #000 !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  strong, p, li, div, span, th, td { color: #000 !important; }
}
</style>