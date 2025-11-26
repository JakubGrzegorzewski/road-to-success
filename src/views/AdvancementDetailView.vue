<script setup lang="ts">
import RequirementBasedTaskComponent from "@/components/Advancement/RequirementBasedTaskComponent.vue";
import IdeaBasedTaskComponent from "@/components/Advancement/IdeaBasedTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {isIdeaBased, isRequirementBased} from "@/scripts/whatToShow";
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {Style} from "@/scripts/Model/Style";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement";
import {
  addTaskToDB,
  isDarkMode,
  loadDatabaseData,
  rankImage,
  requirementSort
} from "@/scripts/helperFunctions.js";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser";
import {onMounted, ref, Ref} from "vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";

const props = defineProps<{
  id: number,
}>();

const editedRankInProgress : Ref<RankInProgressDTO> = ref(null as unknown as RankInProgressDTO);

const tasks : Ref<TaskDTO[]> = ref([]);
const requirements : Ref<RequirementDTO[]> = ref([]);

const user : Ref<AppUserDTO | undefined> = ref(undefined);
const allUsers : Ref<AppUserDTO[]> = ref([]);
const rank : Ref<RankDTO | undefined> = ref();
const allRanks : Ref<RankDTO[]> = ref([]);

const isLoadingData = ref(false);

async function reload() {
  if (isLoadingData.value) return;

  isLoadingData.value = true;
  console.log("Reloading...");
  tasks.value = [];
  requirements.value = [];

  try {
    // Load user
    AppUser.getById(1).then(fetchedUser => {
      console.info("User loaded:", fetchedUser);
      user.value = fetchedUser
    })

    AppUser.getAll().then(fetchedUsers => {
      console.info("Users loaded:", fetchedUsers);
      allUsers.value = fetchedUsers
    })

    // Load ranks
    allRanks.value = await Rank.getAll();
    rank.value = allRanks.value.find((el) => el.id === editedRankInProgress.value.rankId);
    console.info("Rank loaded:", rank.value);

    // Load requirements
    const requirementIds = rank.value?.requirementIds ?? [];
    requirements.value = await Promise.all(
        requirementIds.map(id => Requirement.getById(id))
    );
    console.info("Requirements loaded:", requirements.value);

    // Load tasks
    const taskIds = editedRankInProgress.value.taskIds ?? [];
    tasks.value = await Promise.all(
        taskIds.map(id => Task.getById(id))
    );
    console.info("Tasks loaded:", tasks.value);
  } catch (error) {
    console.error("Error reloading:", error);
  } finally {
    isLoadingData.value = false;
  }
}

function addTask(thisReq : number[] = []) {
  if (!rank.value) return;

  addTaskToDB(editedRankInProgress.value.id, rank.value, thisReq)?.then(task => {
    if (task) {
      tasks.value = [...tasks.value, { ...task }];
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
  Task.deleteObject(task.id, editedRankInProgress.value.id);
}

async function generatePDF() {
  const exportedTasks: object[] = tasks.value.map((task: TaskDTO) => {
    const reqs = requirements.value
        .filter((e: RequirementDTO) => Array.isArray(task.requirementsIds) && task.requirementsIds.indexOf(e.id) !== -1)
        .map((e: RequirementDTO) => e.number + ". " + e.content);
    return {
      requirements: reqs,
      ideaPart: task.partIdea,
      content: task.content.replace(/\n/g, ' ').replace(/\t/g, ' ')
    };
  });

  const exportedDocumentData : object = {
    advancementName: rank.value?.fullName,
    menteeName: user.value?.fullName,
    mentorName: user.value?.fullName,
    idea: rank.value?.idea,
    themeColor: "#1E2F5C",
    tasks: exportedTasks,
    imagePath: "src/main/resources/images/pwd.png",
    sideImagePath: "src/main/resources/images/side-pwd",
    backgroundImagePath: "src/main/resources/images/instructor-background.png",
  }

  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportedDocumentData),
    });

    if (!response.ok) {
      console.error("Failed to generate PDF:", response.statusText);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${rank.value?.fullName || 'advancement'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
}

onMounted(() => {
  console.log("Mounted with id:", props.id);
  if (!props.id) return;
  // Load ranks in progress
  loadDatabaseData().then(()=>{
    RankInProgress.getById(props.id)
        .then(rankInProgress => {
          editedRankInProgress.value = rankInProgress;
          console.log("Rank in progress loaded:", rankInProgress);
        })
        .then(reload)
  })
})

</script>

<template>
  <div class="rank" v-if="editedRankInProgress && rank && allRanks && user && Array.isArray(tasks) && Array.isArray(requirements)">
    <div class="rank-details">
      <div class="option-selection">
        <DropDownSelectionComponent
            v-model="editedRankInProgress.rankId"
            :label="$t('advancement.select') + ':'"
            :options="allRanks.map(r => ({ value: r.id, label: r.fullName }))"
            placeholder="Select rank"
            @update:modelValue="reload"
        />
        <DropDownSelectionComponent
            v-if="false"
            v-model="editedRankInProgress.style"
            :label="$t('advancement.selectStyle') + ':'"
            :options="Object.values(Style).map(s => ({ value: s, label: $t('advancement.style.'+s) }))"
            placeholder="Select style"
        />
      </div>
      <div class="option-selection">
        <DropDownSelectionComponent
            v-model="editedRankInProgress.userId"
            :label="$t('advancement.selectMentee') + ':'"
            :options="Object.values(allUsers).map((s : AppUserDTO) => ({ value: s.id, label: s.fullName }))"
            placeholder="Select mentee"
        />
        <DropDownSelectionComponent
            v-model="editedRankInProgress.mentorId"
            :label="$t('advancement.selectMentor') + ':'"
            :options="Object.values(allUsers).map((s : AppUserDTO) => ({ value: s.id, label: s.fullName }))"
            placeholder="Select mentor"
        />
      </div>
      <ButtonComponent
          :button-text="$t('advancement.generate')"
          buttonStyle="primary"
          @click="generatePDF()"
      />

      <h2>{{ rank.fullName }}</h2>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rank.idea }}</p>
    </div>
    <div v-if="isRequirementBased(editedRankInProgress.style)">
      <RequirementBasedTaskComponent
          v-for="requirement in requirements.sort(requirementSort)"
          :key="requirement.id"
          :requirement="requirement"
          :rank-in-progress="editedRankInProgress"
          :tasks="tasks.filter(el => Array.isArray(el.requirementsIds) ? el.requirementsIds.indexOf(requirement.id) !== -1 : false)"
          :rank="rank"
          :user="user"
          @update:task="updateTask"
          @delete:task="deleteTask"
          @add:task="req => addTask(req)"
      />
    </div>
    <div v-if="isIdeaBased(editedRankInProgress.style)" style="display: flex; flex-direction: column; gap: 20px;">
      <IdeaBasedTaskComponent
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :rank-in-progress="editedRankInProgress"
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
          @click="addTask()"
      />
    </div>
  </div>
  <img v-if="rank" :src="rankImage(rank)" style="width: 500px; height: auto; position: fixed; z-index: -1; top: 200px; right: 50px; opacity: 0.3; transform: rotate(-15deg);" alt="rank-image"/>
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
.option-selection {
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  justify-content: left;
  margin-bottom: 20px;
}

</style>