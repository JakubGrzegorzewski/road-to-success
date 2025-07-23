<script setup>
import {ref, onMounted, defineProps} from 'vue';
import ItemComponent from "@/components/RankEdit/ItemComponent.vue";
const props = defineProps(['id'])

const rank = ref(null);
const rankBased = ref(null);

const error = ref(null);

onMounted(() => {
  fetchSelectedRank()
      .finally(async () => {
            fetchRankBasedOn(rank.value.rank)
          }
      ).catch(
          err => console.error('Error during fetching ranks:', err.message
      )
  );
})

async function fetchSelectedRank() {
  return fetch(`/api/rank/${props.id}`, {
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
        rank.value = data;
        console.log(rank.value);
        error.value = null;
      })
      .catch(err => {
        console.error('Error fetching ranks:', err);
        error.value = err.message;
        rank.value = null;
      });
}

async function fetchRankBasedOn(name) {
  return fetch(`/api/ranks/${name}`, {
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
        rankBased.value = data;
        error.value = null;
      })
      .catch(err => {
        console.error('Error fetching ranks:', err);
        error.value = err.message;
        rankBased.value = null;
      });
}

</script>

<template>
  <div class="rank-details" v-if="rank && rankBased">
    <h2>Wybrany stopień: {{ rankBased.rank_name_full }}</h2>
    <p>Idea stopnia: {{ rankBased.rank_idea.description }}</p>
    <item-component
        v-for="item in rankBased.requirements"
        :key="item.id"
        :idea="rankBased.rank_idea.description"
        :task="item.number + '. ' + item.content"
        :task-content="rank.tasks?.find(t => t.number === item.number)?.content || '' "
    >
    </item-component>
  </div>
</template>

<style scoped>

</style>