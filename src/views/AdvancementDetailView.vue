<script setup>
import {ref, onMounted, defineProps} from 'vue';
import ItemComponent from "@/components/Advancement/ItemComponent.vue";
import {fetchGET} from "@/main.js";
const props = defineProps(['id'])

const selectedRank = ref(null);

onMounted(() => {
  // fetchGET(`/api/rankInProgress/${props.id}`)
  //     .then(data => {
  //       selectedRank.value = data
  //     })
})

</script>

<template>
  <div class="rank-details" v-if="selectedRank">
    <div class="rank-details-info">
      <h2>{{ selectedRank.rank.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ selectedRank.rank.idea }}</p>
    </div>
    <item-component
        v-for="item in selectedRank.rank.requirements"
        :key="item.id"
        :idea="selectedRank.rank.idea"
        :task="item.number + '. ' + item.content"
        :task-content="selectedRank.tasks?.find(t => t.number === item.number) || null "
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