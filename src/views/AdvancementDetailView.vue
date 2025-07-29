<script setup>
import {ref, onMounted, defineProps} from 'vue';
import ItemComponent from "@/components/Advancement/ItemComponent.vue";
import {fetchGET} from "@/main.js";
const props = defineProps(['id'])

const rank = ref(null);
const rankBased = ref(null);

onMounted(() => {
  fetchGET(`/api/rank/${props.id}`)
      .then(data => {
        rank.value = data
        fetchGET(`/api/ranks/${data.rank}`).then(rankData => rankBased.value = rankData)
      })
})

</script>

<template>
  <div class="rank-details" v-if="rank && rankBased">
    <div class="rank-details-info">
      <h2>{{ rankBased.rank_name_full }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rankBased.rank_idea.description }}</p>
    </div>
    <item-component
        v-for="item in rankBased.requirements"
        :key="item.id"
        :idea="rankBased.rank_idea.description"
        :task="item.number + '. ' + item.content"
        :task-content="rank.tasks?.find(t => t.number === item.number) || null "
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