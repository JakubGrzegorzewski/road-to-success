<script setup>
import {ref, onMounted, defineProps} from 'vue';
import ItemComponent from "@/components/Advancement/ItemComponent.vue";
import {fetchGET} from "@/main.js";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import ManagingBubbleComponent from "@/components/Advancement/ManagingBubbleComponent.vue";
const props = defineProps(['id'])

const selectedRank = ref(null);
const rankBasedOn = ref(null);
const tasksData = ref([]);
const requirements = ref([]);

onMounted(() => {
  fetchGET(`/api/rankInProgress/${props.id}`)
    .then(data => {
      selectedRank.value = data;
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


</script>

<template>
  <div class="rank-details" v-if="rankBasedOn && requirements">
    <div class="rank-details-info">
      <h2>{{ rankBasedOn.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rankBasedOn.idea }}</p>
    </div>
    <item-component
        v-for="item in requirements"
        :key="item.id"
        :task="tasksData.find(task => task.requirementId === item.id) || null"
        :requirement="item"
        :idea="rankBasedOn.idea"
        :rankInProgressId="props.id"
    >
    </item-component>
  </div>
  <managing-bubble-component :rank-in-progress="selectedRank"></managing-bubble-component>

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