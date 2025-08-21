<script setup>
import SelectRankComponent from "@/components/Advancement/SelectRankComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import ObjectTemplates from "@/scripts/objectTemplates.js";
import CheckmarkComponent from "@/components/Universal/CheckmarkComponent.vue";
import {ref, onMounted} from 'vue';
import {fetchDELETE, fetchGET, fetchPOST} from "@/main.js";
import Cookies from 'js-cookie';

const userRanks = ref([]);
const userRanksInProgress = ref([]);
const mentorRanks = ref([]);
const mentorRanksInProgress = ref([]);


onMounted(() => {
  fetchGET(`/api/rankInProgress/user/${Cookies.get('userId')}`).then(data => {
    for (let rank of data) {
      userRanks.value.push(rank);
      fetchGET(`/api/rank/${rank.rankId}`).then(rankData => {
        userRanksInProgress.value.push(rankData);
      })
    }
  });
  fetchGET(`/api/rankInProgress/mentor/${Cookies.get('userId')}`).then(data => {
    for (let rank of data) {
      mentorRanks.value.push(rank);
      fetchGET(`/api/rank/${rank.rankId}`).then(rankData => {
        mentorRanksInProgress.value.push(rankData);
      })
    }
  });
})


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
  <div class="home">
    <div>
      <h2>Realizowane próby</h2>
      <div class="all-ranks" v-if="userRanks">
        <SelectRankComponent
            v-if="userRanks.length > 0"
            v-for="rank in userRanks"
            :key="rank.id"
            :rankName="userRanksInProgress.find( r => r.id === rank.rankId)?.fullName || 'rank not found'"
            :rankImage="`@/assets/images/${userRanksInProgress.find( r => r.id === rank.rankId)?.shortName}.png`"
            :rankStatus="rank.status"
            @click="$router.push(`/Advancement/${rank.id}`)"
        >
        </SelectRankComponent>
      </div>
    </div>

    <div>
      <h2>Podopieczni:</h2>
      <div class="mentee-ranks" v-if="userRanks">
        <SelectRankComponent
            v-if="mentorRanks.length > 0"
            v-for="rank in mentorRanks"
            :key="rank.id"
            :rankName="mentorRanksInProgress.find( r => r.id === rank.rankId)?.fullName || 'rank not found'"
            :rankImage="`@/assets/images/${mentorRanksInProgress.find( r => r.id === rank.rankId)?.shortName}.png`"
            rankOwner="test"
            :rankStatus="rank.status"
            @click="$router.push(`/Advancement/${rank.id}`)"
        >
        </SelectRankComponent>
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
            @click="saveRank"
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