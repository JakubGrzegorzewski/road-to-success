<script setup>
import { ref, onMounted } from 'vue';
import ItemComponent from "@/components/RankEdit/ItemComponent.vue";


const rank = ref(null);
const ranks = ref([]);
const selectedRank = ref('pwd');
const error = ref(null);

onMounted(() => {
  fetch("/api/ranks", {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
    }
  })
      .then(response => {
        if (response.status === 403) {
          throw new Error('Access forbidden - check authentication');
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        ranks.value = data;
        rank.value = data.find(r => r.rank_short === selectedRank.value);
        error.value = null;
      })
      .catch(err => {
        console.error('Error fetching ranks:', err);
        error.value = err.message;
        rank.value = null;
      });
})
const onRankChange = () => {
  rank.value = ranks.value.find(r => r.rank_short === selectedRank.value) || null;
}
</script>

<template>
  <select class="rank-select" v-model="selectedRank" @change="onRankChange">
    <option value="pwd">Przewodnik</option>
    <option value="phm">Podharcmistrz</option>
    <option value="hm">Harcmistrz</option>
  </select>

  <div class="rank-details" v-if="rank">
    <h2>Wybrany stopień: {{ rank.rank_name_full }}</h2>
    <p>Idea stopnia: {{ rank.rank_idea.description }}</p>
    <item-component
        v-for="item in rank.requirements"
        :key="item.id"
        :idea="rank.rank_idea.description"
        :task="item.number + '. ' + item.content"
    >
    </item-component>
  </div>
</template>

<style scoped>

</style>