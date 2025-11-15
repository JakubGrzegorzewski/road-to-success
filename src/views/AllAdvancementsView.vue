<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {loadDatabaseData, saveDatabaseData} from "@/scripts/helperFunctions.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {Status} from "@/scripts/Model/Status.js";
import {Style} from "@/scripts/Model/Style.js";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

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
              mentorId : 2,
              status: Status.CREATED,
              style: Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
              taskIds: []
            });
            saveDatabaseData();
            RankInProgress.add(ranksInProgress.value[0])
          }
        })
  })
})
</script>

<template>
  <button-component
      v-for="rankInProgress in ranksInProgress"
      :button-text='rankInProgress.id + " " + rankInProgress.status + " " + rankInProgress.style'
      button-style="default"
      @click="$router.push('/advancement/' + rankInProgress.id)"
  />
</template>

<style scoped>

</style>