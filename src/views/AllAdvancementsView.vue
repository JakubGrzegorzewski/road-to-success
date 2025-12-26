<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {loadDatabaseData} from "@/scripts/helperFunctions.js";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import AdvancementCardComponent from "@/components/Advancement/AdvancementCardComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";

const ranksInProgress : Ref<RankInProgressDTO[]> = ref([]);

const rankIdToDelete = ref<number | null>(null);

onMounted(() => {
  reloadData()
})

function reloadData() {
  ranksInProgress.value = [];
  loadDatabaseData().then(()=>{
    RankInProgress.getAll()
        .then(fetchedRanksInProgress => {fetchedRanksInProgress.forEach(rank => ranksInProgress.value.push(rank))})
  })
}

function deleteRank(rankId: number) {
  RankInProgress.deleteObject(rankId);
  reloadData();
}

</script>

<template>
  <h1>{{ $t('advancement.your') }}</h1>
  <div class="advancement-container">
    <AdvancementCardComponent
        :rank-in-progress="rankInProgress"
        v-for="rankInProgress in ranksInProgress"
        :key="rankInProgress.id"
        @delete-rank="rankIdToDelete = $event"
    />
    <AdvancementCardComponent/>
    <PopupComponent
        v-if="rankIdToDelete !== null"
        :title="$t('popups.delete.title')"
        :message="$t('popups.delete.message')"
        :option-one="{ text: $t('edit.delete'), action: () => { deleteRank(<number>rankIdToDelete); rankIdToDelete = null } }"
        :option-two="{ text: $t('edit.cancel'), action: () => { rankIdToDelete = null } }"
    />
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