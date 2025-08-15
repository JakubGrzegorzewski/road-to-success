<script setup>
  import { ref, onMounted } from 'vue';
  import ItemComponent from "@/components/Advancement/ItemComponent.vue";
  import {fetchDELETE, fetchGET, fetchPOST} from "@/main.js";
  import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
  import Cookies from "js-cookie";
  import ObjectTemplates from "@/scripts/objectTemplates.js";

  const allRanks = ref([]);
  const selectedRank = ref({});
  const requirements = ref([]);
  const selectedRankShortName = ref('pwd');
  const rankInProgress = ref({})

  onMounted(() => {
    fetchGET('/api/rank')
      .then(data => {
        allRanks.value = data;
        selectedRank.value = data.find(r => r.shortName === selectedRankShortName.value);
        if (Cookies.get('rankInProgressId') === undefined)
          addRankInProgress();
        else
          fetchGET(`/api/rankInProgress/${Cookies.get('rankInProgressId')}`)
            .then(data => {
              rankInProgress.value = data;
              selectedRankShortName.value = selectedRank.value.shortName;
            }).catch( () => {
                Cookies.set("rankInProgressId", undefined, { expires: 1 });
                addRankInProgress();
              }
          );
        getRequirements();
      })
  });

  const onRankChange = () => {
    selectedRank.value = allRanks.value.find(r => r.shortName === selectedRankShortName.value) || null;
    saveRank();
  }

  async function getRequirements() {
    const requirementPromises = selectedRank.value.requirementIds.map(id =>
        fetchGET(`/api/requirement/${id}`)
    );

    const requirementData = await Promise.all(requirementPromises);
    requirements.value = requirementData.sort((a, b) => a.id - b.id);
  }

  // Rank edit
  function addRankInProgress() {
    let defaultRank = ObjectTemplates.RankInProgressDto;
    defaultRank.rankId = selectedRank.value.id;
    defaultRank.userId = Cookies.get("userId") || null;
    defaultRank.status = "DRAFT";

    fetchPOST('/api/rankInProgress', defaultRank).then(data => {
      rankInProgress.value = data;
      Cookies.set("rankInProgressId", rankInProgress.value.id);
    })
  }

  function saveRank() {
    fetchPOST('/api/rankInProgress', rankInProgress.value)
  }

  function deleteRank() {
    fetchDELETE(`/api/rankInProgress/${rankInProgress.value.id}`);
  }

</script>

<template>
  <div class="rank-select-panel">
    <h3> {{ $t('advancement.select') }} </h3>
    <div class="text-selection-component">
      <select v-model="selectedRankShortName" @change="onRankChange">
        <option v-for="thisRank in allRanks" :value="thisRank.shortName"> {{ thisRank.fullName }} </option>
      </select>
    </div>
    <button-component
        buttonStyle="success"
        @click="saveRank"
        :button-text="$t('edit.save')"
    />
    <button-component
        buttonStyle="error"
        @click="deleteRank"
        :button-text="$t('edit.delete')"
    />
  </div>
  <div class="rank-details" v-if="selectedRank">
    <div class="rank-details-info">
      <p style="text-align: justify">Idea stopnia: <br> {{ selectedRank.idea }}</p>
    </div>
    <item-component
        v-for="item in requirements"
        :key="item.id"
        :idea="selectedRank.idea"
        :requirement="item"
        style="margin-bottom: 20px;"
    />
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
.rank-details {
  padding: 40px;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
}
</style>