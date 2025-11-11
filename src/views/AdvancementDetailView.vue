<script setup lang="ts">
import RequirementBasedTaskComponent from "@/components/Advancement/RequirementBasedTaskComponent.vue";
import IdeaBasedTaskComponent from "@/components/Advancement/IdeaBasedTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {doShowIdeaBasedTaskComponent, doShowRequirementBasedTaskComponent} from "@/scripts/whatToShow";
import {onMounted, Ref, ref} from "vue";
import {Status} from "@/scripts/Model/Status";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {Style} from "@/scripts/Model/Style";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement";
import seedDatabase from "@/scripts/seedDatabase";
import {addTask} from "@/scripts/databaseFunctions";

const editedRankInProgress : Ref<RankInProgressDTO> = ref({
  id: Math.floor(Math.random()*1000000000000000),
  rankId: 1,
  userId : 1,
  mentorId : 2,
  status: Status.CREATED,
  style: Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA,
  taskIds: []
});

const tasks : Ref<TaskDTO[] | []> = ref([]);
const rank : Ref<RankDTO | undefined> = ref();
const requirements : Ref<RequirementDTO[]> = ref([]);
const allRanks : Ref<RankDTO[]> = ref([]);

function unconventionalSort(a: RequirementDTO, b: RequirementDTO) {
    if (Math.floor(parseFloat(a.number)) === Math.floor(parseFloat(b.number))) {
      const aNum = parseFloat(a.number.split('.')[1]);
      const bNum = parseFloat(b.number.split('.')[1]);
      if (isNaN(aNum) && isNaN(bNum)) {
        return 0;
      } else if (isNaN(aNum)) {
        return -1;
      } else if (isNaN(bNum)) {
        return 1;
      } else {
        return aNum - bNum;
      }
    }else {
      return parseFloat(a.number) - parseFloat(b.number)
    }
}

onMounted(() => {
  RankInProgress.getById(editedRankInProgress.value.id).then(fetchedRankInProgress => {
    if (fetchedRankInProgress) {
      editedRankInProgress.value = fetchedRankInProgress;
      console.log("Rank in progress loaded:", fetchedRankInProgress);
    }
    else {
      console.log("Rank in progress not loaded");
      RankInProgress.add(editedRankInProgress.value).then(
        () => {
          console.log("Rank in progress created:", editedRankInProgress.value);
        }
      )
    }
  }).then(() => { seedDatabase().then(reload) });
})

function reload() {
  allRanks.value = [];
  rank.value = undefined;
  tasks.value = [];
  requirements.value = [];
  console.log("Reloading...");

  Rank.getAll().then(fetchedRanks => {
    allRanks.value = fetchedRanks;
    rank.value = allRanks.value.find((el) => el.id === editedRankInProgress.value.rankId);
    console.log("Rank loaded:", rank.value);

    const requirementIds = rank.value?.requirementIds ?? [];
    const requirementPromises = requirementIds.map(id => Requirement.getById(id));
    return Promise.all(requirementPromises);
  }).then(fetchedRequirements => {
    requirements.value = fetchedRequirements;
    console.log("Requirements loaded:", requirements.value);
  }).catch(() => {
    requirements.value = [];
  });

  const taskIds = editedRankInProgress.value.taskIds ?? [];
  const taskPromises = taskIds.map(id => Task.getById(id));
  Promise.all(taskPromises).then(fetchedTasks => {
    tasks.value = fetchedTasks;
    console.log("Tasks loaded:", tasks.value);
  }).catch(() => {
    tasks.value = [];
  });
}
</script>

<template>
  <div class="rank" v-if="editedRankInProgress && rank && allRanks">
    <div class="rank-details">
      <div style="display: flex; flex-direction: row; gap: 20px; align-items: center; justify-content: left;">
        <div class="selector-style">
          <div class="text-selection-component">
            <select v-model="editedRankInProgress.rankId" @change="reload">
              <option v-for="rank in allRanks" :value="rank.id">{{ rank.fullName }}</option>
            </select>
          </div>
        </div>
        <div class="selector-style">
          <div class="text-selection-component">
            <select v-model="editedRankInProgress.style">
              <option v-for="currentStyle in Style" :value="currentStyle">{{ $t('advancement.style.'+currentStyle) }}</option>
            </select>
          </div>
        </div>
      </div>


      <h2>{{ rank.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rank.idea }}</p>
    </div>
    <RequirementBasedTaskComponent
        v-if="doShowRequirementBasedTaskComponent(editedRankInProgress.style) && tasks && requirements"
        v-for="requirement in requirements.sort(unconventionalSort)"
        :requirement="requirement"
        :rank-in-progress="editedRankInProgress"
        :tasks="tasks.filter(el => el.requirementsIds.indexOf(requirement.id) !== -1)"
    />
    <div v-if="doShowIdeaBasedTaskComponent(editedRankInProgress.style)" style="display: flex; flex-direction: column; gap: 20px;">
      <IdeaBasedTaskComponent
          v-if="editedRankInProgress.taskIds"
          v-for="task in tasks"
          :rank-in-progress="editedRankInProgress"
          :task="task"
      />
      <ButtonComponent
          class="add-task-button"
          :button-text="$t('advancement.task.add')"
          buttonStyle="default"
          @click="addTask(editedRankInProgress.id, rank);"
      />
    </div>
  </div>

</template>

<style scoped>
.rank {
  padding: 40px;
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
}
.add-task-button {
  align-self: center;
  justify-self: center;
  margin: 10px;
  width: 800px;
}

.selector-style {
  display: flex;
  align-items: center;
  gap: 20px;
}

</style>