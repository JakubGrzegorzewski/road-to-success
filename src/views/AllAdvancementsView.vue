<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {loadDatabaseData, saveDatabaseData} from "@/scripts/helperFunctions.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {Status} from "@/scripts/Model/Status.js";
import {Style} from "@/scripts/Model/Style.js";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import AdvancementCardComponent from "@/components/Advancement/AdvancementCardComponent.vue";

const ranksInProgress : Ref<RankInProgressDTO[]> = ref([]);

onMounted(() => {
  ranksInProgress.value = [];
  // Load ranks in progress
  loadDatabaseData().then(()=>{
    RankInProgress.getAll()
        .then(fetchedRanksInProgress => {fetchedRanksInProgress.forEach(rank => ranksInProgress.value.push(rank))})
        .then(() => {
          if (ranksInProgress.value.length == 0) {
            ranksInProgress.value.push({
              id: Math.floor(Math.random()*1000000000000000),
              rankId: 1,
              userId : 1,
              mentorId : 1,
              status: Status.CREATED,
              style: Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
              taskIds: []
            });
            RankInProgress.add(ranksInProgress.value[0])
          }
        })
  })
})
</script>

<template>
  <h1>All advancements</h1>
  <div class="advancement-container">
    <AdvancementCardComponent :rank-in-progress="rankInProgress" v-for="rankInProgress in ranksInProgress" :key="rankInProgress.id"/>
    <AdvancementCardComponent/>
  </div>
  </template>

<style scoped>
  h1 {
    text-align: center;
    font-family: 'Museo', sans-serif;
  }
  .advancement-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    margin: 40px;
  }
</style>