<script setup lang="ts">
import IdeaBasedTaskComponent from "@/components/Advancement/IdeaBasedTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";
import {Rank} from "@/scripts/database/Rank.ts";
import {IRank, IRankInProgress, IRequirement, ITask, IUser} from "@/scripts/interfaces.ts";
import {RankInProgress} from "@/scripts/database/RankInProgress.ts";
import {User} from "@/scripts/database/User.ts";
import {Requirement} from "@/scripts/database/Requirement.ts";
import {Task} from "@/scripts/database/Task.ts";
import {getIdeaWithSelectedParts, isDarkMode} from "@/scripts/helperFunctions.ts";
import {eventBus, ITypesEnum} from "@/main.ts";

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

function GetIsRequirementCompleted(id:number | undefined) : boolean{
  if (id == undefined)
    return false;
  for (const task of cashedTasks.value)
    if (task.requirementsIds.includes(id))
      return true
  return false;
}

const isDataLoaded = ref(false);

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
    User.getAll().then(users => cashedUsers.value = users),
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

  <div class="rank" v-else v-if="cashedRankInProgress">
    <div class="rank-details">
      <div class="option-selection">
        <DropDownSelectionComponent
            v-model="rankToChangeTo"
            :label="t('advancement.select') + ':'"
            :options="cashedRanks.map(r => ({ value: r.id, label: r.fullName }))"
            placeholder="Select rank"
        />
        <PopupComponent
            v-if="rankToChangeTo !== cashedRankInProgress.rankId"
            :title="t('popups.changeRank.title')"
            :message="t('popups.changeRank.message')"
            :option-one="{text: t('edit.yes'), action: () => {
              if (cashedRankInProgress){
                cashedRankInProgress.rankId = <number>rankToChangeTo;
                RankInProgress.update(cashedRankInProgress);
              }
            }}"
            :option-two="{text: t('edit.no'), action: () => {
              if (cashedRankInProgress)
                rankToChangeTo = cashedRankInProgress.rankId;
            }}"
        />
        <router-link :to="'/dodaj-osobe/'"><button class="add-button">✎</button></router-link>
      </div>
      <div class="option-selection">
        <DropDownSelectionComponent
            v-model="cashedRankInProgress.userId"
            :label="t('advancement.selectMentee') + ':'"
            :options="cashedUsers.map((s : IUser) => ({ value: s.id, label: s.fullName }))"
            placeholder="Select mentee"
        />
        <DropDownSelectionComponent
            v-model="cashedRankInProgress.mentorId"
            :label="t('advancement.selectMentor') + ':'"
            :options="cashedUsers.map((s : IUser) => ({ value: s.id, label: s.fullName }))"
            placeholder="Select mentor"
        />
        <router-link :to="'/dodaj-osobe/'"><button class="add-button">✎</button></router-link>
      </div>
      </div>

      <h1 style="margin-top: 20px; justify-self: center">{{ GetMyRank().fullName }}</h1>
      <details style="margin-bottom: 20px;" v-if="GetMyRank().startRequirements.length > 0 && GetMyRank().endRequirements.length >0">
        <summary>{{ t('advancement.requirement.showRequirements') }}</summary>
        <div
            class="requirement-item box-shadow"
            style="padding: 20px"
        >
          <h3> {{ t('advancement.requirement.start') }} </h3>
          <br/>
          <ul
               v-for="req in GetMyRank().startRequirements"
               :key="req"
               style="padding-left: 30px"
          >
            <li> {{ req }} </li>
          </ul>
          <br/>
          <h3> {{ t('advancement.requirement.end') }} </h3>
          <br/>
          <ul
               v-for="req in GetMyRank().endRequirements"
               :key="req"
                style="padding-left: 30px"
          >
            <li> {{ req }} </li>
          </ul>
        </div>
      </details>
      <p style="text-align: justify" v-if="GetMyRank().idea" v-html="getIdeaWithSelectedParts(GetMyRank(), cashedTasks)"/>
      <details style="margin-top: 20px; cursor: pointer " v-if="cashedRequirements && cashedTasks">
          <summary>{{ t('advancement.requirement.showSelected') }}</summary>
          <div class="requirements-collapsed">
            <div class="requirement-item box-shadow"
                 v-for="requirement in cashedRequirements"
                 :key="requirement.id"
            >
              <div
                  class="requirement-item-status"
                  :style="{ backgroundColor: GetIsRequirementCompleted(requirement.id) ? 'var(--accent-success)' : 'var(--accent-error)' }"
              >
                {{  GetIsRequirementCompleted(requirement.id)  ? "✔ " + t('advancement.requirement.added') : "𐄂 " + t('advancement.requirement.notAdded') }}
              </div>
              <p> {{ requirement.content }} </p>
            </div>
          </div>
      </details>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px;" v-if="isDataLoaded && cashedRankInProgress">
      <IdeaBasedTaskComponent
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
      <ButtonComponent
          class="add-task-button"
          :button-text="t('advancement.task.add')"
          :buttonStyle="isDarkMode() ? 'default-light' : 'default'"
          @click="Task.addDefault(cashedRankInProgress.id);"
      />
    </div>
  <img v-if="GetMyRank()" :src="'data:image/png;base64,'+GetMyRank().iconInBase64" style="width: 500px; height: auto; position: fixed; z-index: -1; top: 200px; right: 50px; opacity: 0.3; transform: rotate(-15deg);" alt="rank-image"/>
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

.add-button {
  width: 30px;
  height: 30px;
  background-color: var(--accent-info);
  mask-size: contain;
  -webkit-mask-size: contain;
  border: none;
  cursor: pointer;
  border-radius: 100%;
  color: white;
  transition: all 0.2s ease;
}

.add-button:hover {
  transform: scale(1.1);
}

.add-button:active {
  transform: scale(0.9);
}
.requirements-collapsed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
  cursor: default;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 8px;
  gap : 5px;

  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
  }
}
.requirement-item-status{
  padding: 4px 8px;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  min-width: 100px;
  text-align: center;
  position: relative;
  align-self: flex-end;
  font-size: 12px;
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

<style>
.idea-part-highlight {
  text-decoration: underline;
  text-decoration-color: var(--background-color);
  text-decoration-thickness: 3px;
}
</style>