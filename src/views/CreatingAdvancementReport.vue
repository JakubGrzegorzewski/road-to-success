<script setup lang="ts">
import IdeaTaskComponent from "@/components/Advancement/IdeaTaskComponent.vue";
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";
import {Rank} from "@/scripts/database/Rank.ts";
import {IRank, IRankInProgress, IRequirement, ITask, IUser} from "@/scripts/interfaces.ts";
import {RankInProgress} from "@/scripts/database/RankInProgress.ts";
import {User} from "@/scripts/database/User.ts";
import {Requirement} from "@/scripts/database/Requirement.ts";
import {Task} from "@/scripts/database/Task.ts";
import {eventBus, ITypesEnum} from "@/main.ts";
import router from "@/scripts/router.ts";
import EyeIconComponent from "@/components/Universal/Icons/EyeIconComponent.vue";
import PrintIconComponent from "@/components/Universal/Icons/PrintIconComponent.vue";
import TaskReportComponent from "@/components/Advancement/TaskReportComponent.vue";
import AsReportComponent from "@/components/Advancement/AsReportComponent.vue";

const { t } = useI18n();

const props = defineProps<{
  id: number,
}>();

const cashedRankInProgress = ref<IRankInProgress>();
const rankToChangeTo = ref<number>();
const cashedRanks = ref<IRank[]>([]);
const cashedUsers = ref<IUser[]>([]);
const cashedRequirements = ref<IRequirement[]>([]);
const cashedTasks = ref<ITask[]>([])

function GetMyRank() : IRank{
  return cashedRanks.value?.find(r => r.id === cashedRankInProgress.value?.rankId) as IRank;
}

function GetMe() : IUser{
  return cashedUsers.value?.find(u => u.id === cashedRankInProgress.value?.userId) as IUser;
}

function Print(): void {
  window.print();
}

const isDataLoaded = ref(false);
const isPdfHidden = ref(true);

onMounted(() => {
  eventBus.on('db-update', async (data: { type: ITypesEnum}) => {
    switch (data.type) {
      case ITypesEnum.ERank:
        cashedRanks.value = await Rank.getAll();
        break;
      case ITypesEnum.ERankInProgress:
        cashedRankInProgress.value = await RankInProgress.getById(props.id);
        rankToChangeTo.value = cashedRankInProgress.value?.rankId;
        break;
      case ITypesEnum.EUser:
        cashedUsers.value = await User.getAll();
        break;
      case ITypesEnum.ERequirement:
        cashedRequirements.value = await Requirement.getByRankId(props.id);
        break;
      case ITypesEnum.ETask:
        cashedTasks.value = await Task.getByRankInProgressId(props.id);
        break;
    }
  });
  Promise.all([
    Rank.getAll().then(ranks => cashedRanks.value = ranks),
    RankInProgress.getById(props.id).then(rankInProgress => {
      cashedRankInProgress.value = rankInProgress;
      rankToChangeTo.value = rankInProgress.rankId;
    }),
    User.getAll().then(async users => {
      cashedUsers.value = users
      if (users.length === 0)
        await router.push("/dodaj-osobe/");
    }),
    Requirement.getByRankId(props.id).then(requirements => cashedRequirements.value = requirements),
    Task.getByRankInProgressId(props.id).then(tasks => cashedTasks.value = tasks)
  ]).then(() => {
    isDataLoaded.value = true;
  }).catch(err => {
    console.error("Failed to load data:", err);
  });
});

</script>

<template>
  <div v-if="!isDataLoaded" style="display: flex; justify-content: center; align-items: center; height: 100vh;">
    <p>{{ t('statusOptions.loading') }}<span class="loading-dots"></span></p>
  </div>

  <div class="rank" v-else v-if="cashedRankInProgress && isPdfHidden">
    <h1 style="margin-top: 20px; justify-self: center">{{ GetMyRank().fullName }}</h1>
  </div>
  <div class="rank-content" v-if="isDataLoaded && cashedRankInProgress && isPdfHidden">
    <TaskReportComponent
        v-for="task in cashedTasks"
        :key="task.id"
        :task="task"
        :rank-in-progress="cashedRankInProgress"
        :rank="GetMyRank()"
        :requirements="cashedRequirements"
        :user="GetMe()"
        @update:task="Task.update"
        @delete:task="Task.deleteObject(task.id); console.log(task)"
    />
  </div>
  <div id="print-capture-target">
    <AsReportComponent
        v-if="isDataLoaded && cashedRankInProgress && !isPdfHidden"
        :rank-in-progress="cashedRankInProgress"
        :rank="GetMyRank()"
        :requirements="cashedRequirements"
        :tasks="cashedTasks"
        :user="GetMe()"
    />
  </div>

  <EyeIconComponent class="icon-button show-pdf-button" color="var(--primary-color)" v-model="isPdfHidden" />
  <PrintIconComponent color="var(--primary-color)" v-if="!isPdfHidden" @click="Print()" class="icon-button print-button" />
  <img v-if="GetMyRank() && isPdfHidden" :src="'data:image/png;base64,'+GetMyRank().iconInBase64" style="width: 500px; height: auto; position: fixed; z-index: -1; top: 200px; right: 50px; opacity: 0.3; transform: rotate(-15deg);" alt="rank-image"/>
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

.rank-content{
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media print {
  .rank-content{
    display: none;
  }
  .rank{
    display: none;
  }

}

.show-pdf-button {
  bottom: 10px;
}
.print-button{
  bottom: 70px;
}

.icon-button {
  @media print {
    display: none;
  }
  position: fixed;
  right: 10px;
  width: 50px;
  height: 50px;
  line-height: 50px;
  padding: 5px;
  cursor: pointer;
  border: var(--secondary-color) 2px solid;

  background-color: var(--secondary-color);
  border-radius: 5px;
}

.loading-dots::after {
  content: '.';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}
</style>