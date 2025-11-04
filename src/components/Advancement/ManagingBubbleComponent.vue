<script setup lang="ts">
import {ref, defineProps} from 'vue';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {fetchDELETE, fetchGET, fetchPUT} from "@/main.js";
import FullPageSelectorComponent from "@/components/Universal/FullPageSelectorComponent.vue";
import CheckmarkComponent from "@/components/Universal/CheckmarkComponent.vue";
import {useI18n} from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  rankInProgress : {
    type: Object,
    required: false
  },
})

const generating = ref(false);
const isOpen = ref(false);
const rankStyle = ref('NONE');

const isStatusSelectorOpen = ref(false);
const isMentorSelectorOpen = ref(false);


async function generatePDF() {
  generating.value = true;
  try {
    const response = await fetch(`/api/rankInProgress/${props.rankInProgress.id}/generatePDF`, {
      method: "GET",
      headers: {
        'Accept': 'application/pdf'
      }
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Próba-${props.rankInProgress.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    generating.value = false;
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

function deleteRank() {
  fetchDELETE(`/api/rankInProgress/${rankInProgress.value.id}`);
}

function updateRankStatus(status){
  fetchGET(`/api/rankInProgress/${props.rankInProgress.id}`).then(
      response => {
          const rankInProgress = response;
          rankInProgress.status = status.toUpperCase();
          rankInProgress.style = rankStyle.value;
          fetchPUT(`/api/rankInProgress`, rankInProgress)
          .catch(error => {
            console.error('Error updating rank status:', error);
          });
      }
  )
}

const styleTransitions = {
  IDEA_SELECTION: {
    IDEA_SELECTION: 'NONE',
    NONE: 'IDEA_SELECTION',
    MULTI_TASK_ONE_REQUIREMENT: 'IDEA_SELECTION',
    ONE_TASK_MULTI_REQUIREMENTS: 'ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA',
    ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA: 'ONE_TASK_MULTI_REQUIREMENTS',
  },
  MULTI_TASK_ONE_REQUIREMENT: {
    MULTI_TASK_ONE_REQUIREMENT: 'NONE',
    default: 'MULTI_TASK_ONE_REQUIREMENT',
  },
  ONE_TASK_MULTI_REQUIREMENTS: {
    ONE_TASK_MULTI_REQUIREMENTS: 'NONE',
    ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA: 'IDEA_SELECTION',
    IDEA_SELECTION: 'ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA',
    NONE: 'ONE_TASK_MULTI_REQUIREMENTS',
    MULTI_TASK_ONE_REQUIREMENT: 'ONE_TASK_MULTI_REQUIREMENTS',
  },
};

function determineStyle(whatClicked) {
  const current = rankStyle.value;
  const transitions = styleTransitions[whatClicked];
  if (!transitions) return;
  rankStyle.value = transitions[current] ?? transitions.default ?? current;
}

const statusOptions =
  [
    {
      name: 'draft',
      translation: t(`statusOptions.draft`)
    },
    {
      name: 'created',
      translation: t(`statusOptions.created`)
    },
    {
      name: 'pending',
      translation: t(`statusOptions.pending`)
    },
    {
      name: 'inProgress',
      translation: t(`statusOptions.in_progress`)
    },
    {
      name: 'completed',
      translation: t(`statusOptions.completed`)
    },
    {
      name: 'failed',
      translation: t(`statusOptions.failed`)
    }
  ];
</script>

<template>
  <div class="managing-bubble-component">
    <div class="bubble-contents" v-if="isOpen">
      <div @click="isOpen = false"
           style="align-self: flex-end; cursor: pointer;"
           class="close-button">
        x
      </div>
      <button-component
          v-if="!generating"
          button-style="success"
          @click="generatePDF"
          :button-text="$t('advancement.generate')"
      />
      <button-component
          v-if="generating"
          button-style="success"
          button-icon="@/assets/images/loading.gif"
      />
      <button-component
          button-style="warning"
          @click="isStatusSelectorOpen = true"
          :button-text="$t('advancement.changeStatus')"
      />

      <button-component
          button-style="info"
          @click="isMentorSelectorOpen = true"
          :button-text="$t('advancement.changeMentor')"
      />
      <button-component
          button-style="error"
          @click="deleteRank"
          :button-text="$t('advancement.delete')"
      />
      <checkmark-component
          :button-text="$t('advancement.options.selectIdeaForTask')"
          button-style="white"
          :isChecked = "rankStyle === 'IDEA_SELECTION' || rankStyle === 'ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA'"
          @toggle="determineStyle('IDEA_SELECTION')"
      />
      <checkmark-component
          :button-text="$t('advancement.options.multipleTasksForRequirement')"
          button-style="white"
          :isChecked = "rankStyle === 'MULTI_TASK_ONE_REQUIREMENT'"
          @toggle="determineStyle('MULTI_TASK_ONE_REQUIREMENT')"
      />
      <checkmark-component
          :button-text="$t('advancement.options.oneTaskForMultipleRequirements')"
          button-style="white"
          :isChecked = "rankStyle === 'ONE_TASK_MULTI_REQUIREMENTS' || rankStyle === 'ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA'"
          @toggle="determineStyle('ONE_TASK_MULTI_REQUIREMENTS')"
      />

    </div>
    <div class="bubble" v-else @click="isOpen = true">
      <img src="../../assets/images/options.png" alt="Managing Icon" style="contain: content; width: 32px; height: 32px;"/>
    </div>
  </div>
  <full-page-selector-component
      v-if="isStatusSelectorOpen"
      :title="$t('advancement.changeStatus')"
      :options="statusOptions"
      @close="isStatusSelectorOpen = false"
      @optionSelected="status => updateRankStatus(status)"
  />
</template>

<style scoped>
  .managing-bubble-component{
    position: fixed;
    border-radius: 10px;
    padding: 15px;
    right: 20px;
    bottom: 20px;
    background-color: var(--primary-color-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  .bubble-contents {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    flex-direction: column;
    cursor: pointer;
    gap: 10px;
    color: white;
    font-size: 14px;
    font-family: 'Museo', sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  .bubble-contents > * {
    width: auto;
  }
  .bubble {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .close-button {
    cursor: pointer;
    color: var(--primary-color-dark);
    font-size: 18px;
    font-weight: bold;
    background: white;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

  }
</style>