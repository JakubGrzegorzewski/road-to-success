<script setup>
import {ref, onMounted, defineProps} from 'vue';
import ItemComponent from "@/components/Advancement/ItemComponent.vue";
import {fetchGET} from "@/main.js";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
const props = defineProps(['id'])

const selectedRank = ref(null);
const rankBasedOn = ref(null);
const tasksData = ref([]);
const requirements = ref([]);
const generating = ref(false);

onMounted(() => {
  fetchGET(`/api/rankInProgress/${props.id}`)
    .then(data => {
      selectedRank.value = data;
      console.log(data);
      return Promise.all(data.taskIds.map(task => fetchGET(`/api/task/${task}`)));
    })
    .then(tasks => {
      tasksData.value = tasks;
      return fetchGET(`/api/rank/${selectedRank.value.rankId}`);
    })
    .then(rankData => {
      rankBasedOn.value = rankData;
      return Promise.all(rankData.requirementIds.map(reqId => fetchGET(`/api/requirement/${reqId}`)));
    })
    .then(requirementsData => {
      requirements.value = requirementsData.sort((a, b) => a.id - b.id);
    })
});


async function generatePDF() {
generating.value = true;
try {
  const response = await fetch(`/api/rankInProgress/${props.id}/generatePDF`, {
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
  a.download = `Próba-${rankBasedOn.value.shortName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  generating.value = false;
  window.URL.revokeObjectURL(url);
} catch (err) {
  console.error('Error generating PDF:', err);
}
}

</script>

<template>
  <div class="rank-details" v-if="rankBasedOn && requirements">
    <div class="rank-details-info">
      <h2>{{ rankBasedOn.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rankBasedOn.idea }}</p>
      <button-component v-if="!generating" button-style="success" @click="generatePDF" :button-text="$t('advancement.generate')"></button-component>

      <button-component v-if="generating" button-style="success" button-icon="@/assets/images/loading.gif"></button-component>

    </div>
    <item-component
        v-for="item in requirements"
        :key="item.id"
        :task="tasksData.find(task => task.requirementId === item.id) || null"
        :requirement="item"
        :idea="rankBasedOn.idea"
    >
    </item-component>
  </div>
</template>

<style scoped>
.rank-details {
  padding: 40px;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
}
</style>