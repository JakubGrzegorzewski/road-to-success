<script setup lang="ts">
import RequirementBasedTaskComponent from "@/components/Advancement/RequirementBasedTaskComponent.vue";
import IdeaBasedTaskComponent from "@/components/Advancement/IdeaBasedTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {isIdeaBased, isRequirementBased} from "@/scripts/whatToShow";
import {Status} from "@/scripts/Model/Status";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {Style} from "@/scripts/Model/Style";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement";
import seedDatabase from "@/scripts/seedDatabase";
import {addTaskToDB} from "@/scripts/databaseFunctions";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser";
import {computed, onMounted, ref, Ref} from "vue";

const currentRankInProgress : Ref<RankInProgressDTO> = ref({
  id: Math.floor(Math.random()*1000000000000000),
  rankId: 1,
  userId : 1,
  mentorId : 2,
  status: Status.CREATED,
  style: Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
  taskIds: []
});

const tasks : Ref<TaskDTO[]> = ref([]);
const requirements : Ref<RequirementDTO[]> = ref([]);

const user : Ref<AppUserDTO | undefined> = ref(undefined);
const rank : Ref<RankDTO | undefined> = ref();
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
  RankInProgress.getById(currentRankInProgress.value.id).then(fetchedRankInProgress => {
    if (fetchedRankInProgress) {
      currentRankInProgress.value = fetchedRankInProgress;
      console.log("Rank in progress loaded:", fetchedRankInProgress);
    }
    else {
      console.log("Rank in progress not loaded");
      RankInProgress.add(currentRankInProgress.value).then(
        () => {
          console.log("Rank in progress created:", currentRankInProgress.value);
        }
      )
    }
  }).then(() => { seedDatabase().then(reload) });
})

async function reload() {
  console.log("Reloading...");

  try {
    // Load user
    AppUser.getById(1).then(fetchedUser => {
      console.log("User loaded:", fetchedUser);
      user.value = fetchedUser
    })

    // Load ranks
    allRanks.value = await Rank.getAll();
    rank.value = allRanks.value.find((el) => el.id === currentRankInProgress.value.rankId);
    console.log("Rank loaded:", rank.value);

    // Load requirements
    const requirementIds = rank.value?.requirementIds ?? [];
    requirements.value = await Promise.all(
        requirementIds.map(id => Requirement.getById(id))
    );
    console.log("Requirements loaded:", requirements.value);

    // Load tasks
    const taskIds = currentRankInProgress.value.taskIds ?? [];
    tasks.value = await Promise.all(
        taskIds.map(id => Task.getById(id))
    );
    console.log("Tasks loaded:", tasks.value);
  } catch (error) {
    console.error("Error reloading:", error);
  }
}

function addTask(thisReq : number[] = []) {
  if (!rank.value) return;

  addTaskToDB(currentRankInProgress.value.id, rank.value, thisReq)?.then(task => {
    if (task) {
      tasks.value = [...tasks.value, { ...task }];
      currentRankInProgress.value.taskIds = [...currentRankInProgress.value.taskIds, task.id];
    }
  });
}

function updateTask(updatedTask: TaskDTO) {
  const index = tasks.value.findIndex(task => task.id === updatedTask.id);
  if (index !== -1) {
    tasks.value[index] = updatedTask;
    Task.update(updatedTask);
  }
}

function deleteTask(task: TaskDTO) {
  tasks.value = tasks.value.filter(t => t.id !== task.id);
  currentRankInProgress.value.taskIds = currentRankInProgress.value.taskIds.filter(id => id !== task.id);
  Task.deleteObject(task.id, currentRankInProgress.value.id);
}

function isDarkMode(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function rankImage(){
  if (!rank.value) return;
  return new URL(`../assets/images/${rank.value.shortName}.png`, import.meta.url).href;
}
</script>

<template>
  <div class="rank" v-if="currentRankInProgress && rank && allRanks && user && Array.isArray(tasks) && Array.isArray(requirements)">
    <div class="rank-details">
      <div style="display: flex; flex-direction: row; gap: 20px; align-items: center; justify-content: left;">
        <div class="selector-style">
          <div class="text-selection-component">
            <select v-model="currentRankInProgress.rankId" @change="reload">
              <option v-for="rank in allRanks" :value="rank.id">{{ rank.fullName }}</option>
            </select>
          </div>
        </div>
        <div class="selector-style">
          <div class="text-selection-component">
            <select v-model="currentRankInProgress.style">
              <option v-for="currentStyle in Style" :value="currentStyle">{{ $t('advancement.style.'+currentStyle) }}</option>
            </select>
          </div>
        </div>
        <ButtonComponent
        button-text="Generuj PDF'a"
        buttonStyle="primary"
        @click="RankInProgress.update(currentRankInProgress)"
        />
      </div>


      <h2>{{ rank.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rank.idea }}</p>
    </div>
    <div v-if="isRequirementBased(currentRankInProgress.style)">
      <RequirementBasedTaskComponent
          v-for="requirement in requirements.sort(unconventionalSort)"
          :key="requirement.id"
          :requirement="requirement"
          :rank-in-progress="currentRankInProgress"
          :tasks="tasks.filter(el => Array.isArray(el.requirementsIds) ? el.requirementsIds.indexOf(requirement.id) !== -1 : false)"
          :rank="rank"
          :user="user"
          @update:task="updateTask"
          @delete:task="deleteTask"
          @add:task="addTask"
      />
    </div>
    <div v-if="isIdeaBased(currentRankInProgress.style)" style="display: flex; flex-direction: column; gap: 20px;">
      <IdeaBasedTaskComponent
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :rank-in-progress="currentRankInProgress"
          :rank="rank"
          :requirements="requirements"
          :user="user"
          @update:task="updateTask"
          @delete:task="deleteTask"
      />
      <ButtonComponent
          class="add-task-button"
          :button-text="$t('advancement.task.add')"
          :buttonStyle="isDarkMode() ? 'default-light' : 'default'"
          @click="addTask"
      />
    </div>
  </div>
  <img v-if="rank" :src="rankImage()" style="width: 500px; height: auto; position: fixed; z-index: -1; top: 200px; right: 50px; opacity: 0.3; transform: rotate(-15deg);" alt="rank-image"/></template>

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