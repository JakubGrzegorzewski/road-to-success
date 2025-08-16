<script setup>
import {ref, defineProps} from 'vue';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {fetchDELETE} from "@/main.js";
import FullPageSelectorComponent from "@/components/Universal/FullPageSelectorComponent.vue";
import CheckmarkComponent from "@/components/Universal/CheckmarkComponent.vue";

const props = defineProps({
  rankInProgress : {
    type: Object,
    required: false
  },
})

const generating = ref(false);
const isOpen = ref(false);

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
      />
      <checkmark-component
          :button-text="$t('advancement.options.multipleTasksForRequirement')"
          button-style="white"
      />
      <checkmark-component
          :button-text="$t('advancement.options.oneTaskForMultipleRequirements')"
          button-style="white"
      />

    </div>
    <div class="bubble" v-else @click="isOpen = true">
      <img src="../../assets/images/options.png" alt="Managing Icon" style="contain: content; width: 32px; height: 32px;"/>
    </div>
  </div>
  <full-page-selector-component
      v-if="isStatusSelectorOpen"
      @close="isStatusSelectorOpen = false"
      :title="$t('advancement.changeStatus')"
      :options="['W trakcie', 'Zakończone', 'Anulowane']"
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