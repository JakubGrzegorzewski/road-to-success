<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import ObjectTemplates from "@/scripts/objectTemplates.js";
import CheckmarkComponent from "@/components/Universal/CheckmarkComponent.vue";
import {ref, onMounted} from 'vue';
import {fetchGET, fetchPOST} from "@/main.js";
import Cookies from 'js-cookie';

const userRanksInProgress = ref([]);
const mentorRanksInProgress = ref([]);

const allRanks = ref([]);
const selectedRank = ref({});
const selectedRankShortName = ref('pwd');
const rankInProgress = ref({})

onMounted(() => {
  fetchGET(`/api/rankInProgress/user/${Cookies.get('userId')}/basic`)
        .then(data => userRanksInProgress.value = data);

  fetchGET(`/api/rankInProgress/mentor/${Cookies.get('userId')}/basic`)
      .then(data => mentorRanksInProgress.value = data);

  fetchGET('/api/rank')
      .then(data => {
        allRanks.value = data;
        selectedRank.value = data.find(r => r.shortName === selectedRankShortName.value);
      })
})

const onRankChange = () => {
  selectedRank.value = allRanks.value.find(r => r.shortName === selectedRankShortName.value) || null;
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


</script>

<template>
  <div class="home">
    <div>
      <h2>Realizowane próby</h2>
      <div class="all-ranks" v-if="userRanksInProgress">
        <SelectRankComponent
            v-if="userRanksInProgress.length > 0"
            v-for="rank in userRanksInProgress"
            :key="rank.rankInProgressId"
            :rankName="rank.fullName || 'rank not found'"
            :rankImage="`@/assets/images/${rank.shortName}.png`"
            :rankStatus="rank.status"
            @click="$router.push(`/Advancement/${rank.rankInProgressId}`)"
        />
      </div>
    </div>

    <div>
      <h2>Podopieczni:</h2>
      <div class="mentee-ranks" v-if="mentorRanksInProgress">
        <SelectRankComponent
            v-if="mentorRanksInProgress.length > 0"
            v-for="rank in mentorRanksInProgress"
            :key="rank.rankInProgressId"
            :rankName="rank.fullName || 'rank not found'"
            :rankImage="`@/assets/images/${rank.shortName}.png`"
            :rankStatus="rank.status"
            :rank-owner="rank.mentorName"
            @click="$router.push(`/Advancement/${rank.rankInProgressId}`)"
        />
      </div>
    </div>


    <div>
      <h2>Stwórz próbę:</h2>
      <div class="rank-creator">
        <h3> {{ $t('advancement.select') }} </h3>
        <div class="text-selection-component">
          <select v-model="selectedRankShortName" @change="onRankChange">
            <option v-for="thisRank in allRanks" :value="thisRank.shortName"> {{ thisRank.fullName }} </option>
          </select>
        </div>

        <h3> {{ $t('advancement.options') }} </h3>

        <checkmark-component
            :button-text="$t('advancement.options.selectIdeaForTask')"
            button-style="white"
        />
        <checkmark-component
            :button-text="$t('advancement.options.multipleTasksForRequirement')"
            button-style="white"
        />
        <checkmark-component
            :button-text="$t('advancement.options.oneTaskForMultipleRequirements')"
            button-style="white"
        />
        <button-component
            buttonStyle="success"
            @click="addRankInProgress"
            :button-text="$t('edit.save')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

  .all-ranks, .mentee-ranks{
    overflow-y: scroll;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-wrap: nowrap;
    width: 300px;
    height: 400px;
    gap: 20px;
    padding : 20px;

    border-radius: 8px;
    background: white;
  }

  .home{
    padding: 20px;
    display: flex;
    flex-direction: row;
    gap: 20px;

    font-family: "Museo", sans-serif;
  }

  .rank-creator {
    padding: 20px 0 ;
    width: 300px;
    background: white;
    border-radius: 8px;
    font-family: 'Museo', sans-serif;
    display: flex;
    gap: 20px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .rank-creator > h3{
    margin: 0;
  }
</style>