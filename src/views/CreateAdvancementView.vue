<script setup>
import { ref, onMounted } from 'vue';
import ItemComponent from "@/components/Advancement/ItemComponent.vue";
import {fetchGET} from "@/main.js";


const rank = ref(null);
const ranks = ref([]);
const selectedRank = ref('pwd');

onMounted(() => {
  fetchGET('/api/ranks').then(data => {
    ranks.value = data
    rank.value = data.find(r => r.rank_short === selectedRank.value);
  });
})
const onRankChange = () => {
  rank.value = ranks.value.find(r => r.rank_short === selectedRank.value) || null;
}
</script>

<template>
  <div class="rank-select-panel">
    <h3>Wybierz stopień</h3>
    <div class="text-selection-component">
      <select class="rank-select " v-model="selectedRank" @change="onRankChange">
        <option v-for="thisRank in ranks" :value="thisRank.rank_short"> {{ thisRank.rank_name_full }} </option>

      </select>
    </div>
  </div>
  <div class="rank-details" v-if="rank">
    <div class="rank-details-info">
      <p style="text-align: justify">Idea stopnia: <br> {{ rank.rank_idea.description }}</p>
    </div>
    <item-component
        v-for="item in rank.requirements"
        :key="item.id"
        :idea="rank.rank_idea.description"
        :task="item.number + '. ' + item.content"
        style="margin-bottom: 20px;"
    >
    </item-component>
  </div>
</template>

<style scoped>
.rank-select-panel {
  padding: 40px 40px 0 40px;
  font-family: 'Museo', sans-serif;
  display: flex;
  gap: 20px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.text-selection-component {
  height: 40px;
}
.rank-details {
  padding: 0 40px 40px 40px;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rank-details-info {
  max-width: 1000px;
}
</style>