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
      :style="rank.iconInBase64 ? { '--bg-image': `url(data:image/png;base64,${rank.iconInBase64})` } : {}"
  >

      <div class="report-header">
        <img v-if="rank.iconInBase64" :src="'data:image/png;base64,'+rank.iconInBase64" :alt="rank.fullName" class="rank-image"/>
        <h1 style="padding-top: 10mm">{{ rank.fullName }}</h1>
        <div><strong>{{ t('advancement.mentee') }}:</strong> {{ mentee.fullName || '—' }}</div>
        <div><strong>{{ t('advancement.mentor') }}:</strong> {{ mentor.fullName || '—' }}</div>
      </div>

      <article v-if="rank.idea" class="rank-idea" v-html="rank.idea"/>

      <section v-if="tasks.length > 0" class="tasks-section">
        <h2>{{ t('advancement.task.tasks') }}</h2>

        <div v-for="task in tasks" :key="task.id" class="task-card">
          <div class="task-row">
            <strong>{{ task.content || '—' }}</strong>
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

.report-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20mm;
}

.rank-image{
  width: 300px;
  max-width: 100%;
  height: auto;
  padding: 20px;
}

.rank-idea {
  text-align: justify;
  line-height: 1.6;
  break-after: page;
}

.task-card {
  padding: 20px 0 20px 0;
  border-radius: 8px;
  margin-bottom: 15px;
  background: #f8fafc;
}
.task-row {
  margin-bottom: 12px;
}
.task-row:last-child {
  margin-bottom: 0;
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
  border-radius: 0;
  break-inside: avoid;
}

@media screen and (max-width: 210mm) {
  .report-container {
    width: 100%;
    min-height: 0;
    padding: 8vw;
    margin: 12px auto;
    box-sizing: border-box;
  }
}

@media print {
  @page { size: A4; margin: 0; }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  /* Target wrapper elements that might break layouts */
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
    page-break-inside: avoid !important; /* Legacy fallback */
    break-inside: avoid !important;      /* Modern standard */
  }


  strong, p, li, div, span { color: #000 !important; }
}
</style>