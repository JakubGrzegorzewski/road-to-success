<script setup lang="ts">
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import TextSelectionComponent from "@/components/Universal/TextSelectionComponent.vue";
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import {TaskDTO} from "@/scripts/Model/Task";
import {RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {RankDTO} from "@/scripts/Model/Rank";
import {Style} from "@/scripts/Model/Style";
import {RequirementDTO} from "@/scripts/Model/Requirement";
import {doShowIdea} from "@/scripts/whatToShow";
import {AppUserDTO} from "@/scripts/Model/AppUser";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import {onMounted} from "vue";
import {TaskComment} from "@/scripts/Model/TaskComment.js";
import {Status} from "@/scripts/Model/Status.js";
import {useI18n} from "vue-i18n";

const props = defineProps<{
  task: TaskDTO
  rankInProgress: RankInProgressDTO
  rank : RankDTO,
  requirements : RequirementDTO[]
  user: AppUserDTO
}>();

const emits = defineEmits<{
  (e: 'delete:task', task: TaskDTO): void;
  (e: 'update:task', task: TaskDTO): void;
}>();

function onTextHighlighted (reset: boolean, text: string) {
  if (props.rank === undefined)
    return
  if (reset)
    props.task.partIdea = props.rank.idea;
  else
    props.task.partIdea = text;
  emits('update:task', props.task)
}

function toggleRequirement(requirement: RequirementDTO) {
  console.log("Toggle requirement", props.task.requirementsIds, requirement.id,);
  if (!Array.isArray(props.task.requirementsIds)) return;
  if (isRequirementSelected(requirement))
    props.task.requirementsIds = props.task.requirementsIds.filter(req => req !== requirement.id);
  else
    props.task.requirementsIds.push(requirement.id);
  emits('update:task', props.task)
}

function getReqIds(): number[] {
  return Array.isArray(props.task.requirementsIds) ? props.task.requirementsIds : [];
}

function isRequirementSelected(requirement: RequirementDTO) {
  return getReqIds().find(req => req === requirement.id) !== undefined;
}

const { t } = useI18n();

const statusOptions = [
  { value: Status.CREATED, label: t('statusOptions.created') },
  { value: Status.IN_PROGRESS, label: t('statusOptions.in_progress') },
  { value: Status.COMPLETED, label: t('statusOptions.completed') },
  { value: Status.FAILED, label: t('statusOptions.failed') },
];
</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <TaskComponent
        :task="props.task"
        :user="user"
        :show-delete-task-button="true"
        @delete:task="emits('delete:task', $event)"
    >
      <DropDownSelectionComponent v-model="task.status" @update:modelValue="emits('update:task', props.task)" :options="statusOptions"/>
      <div class="task-content">
        <TextSelectionComponent
            v-if="doShowIdea(rankInProgress.style)"
            :text="props.task.partIdea"
            :original-text="rank?.idea"
            @text-highlighted="data => onTextHighlighted(data.reset, data.text)"
        />
        <textarea class="multiline-text-input" v-model="props.task.content" @change="emits('update:task', props.task)"/>

        <h3 v-if="props.rankInProgress.style !== Style.IDEA_SELECTION"> {{$t("advancement.requirements")}}</h3>

        <div class="task-requirements" v-if="props.rankInProgress.style !== Style.IDEA_SELECTION">
          <ButtonComponent
              v-for="requirement in requirements"
              :key="requirement.id"
              :button-text="requirement.number"
              :buttonStyle="isRequirementSelected(requirement) ? 'primary' : 'default'"
              :button-hint="requirement.content"
              @click="toggleRequirement(requirement)"
          />
          <span v-if="requirements.length === 0"></span>
        </div>
      </div>

    </TaskComponent>
  </div>
</template>

<style scoped>
h3{
  margin: 0;
}
.task-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
  align-items: stretch;
  gap: 20px;
}

.task-requirements {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}
</style>