<script setup lang="ts">
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {onMounted} from "vue";
import {doShowAddTaskButton, doShowDeleteTaskButton, doShowIdea} from "@/scripts/whatToShow";
import {RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {TaskDTO} from "@/scripts/Model/Task";
import {RequirementDTO} from "@/scripts/Model/Requirement";
import {RankDTO} from "@/scripts/Model/Rank";
import {AppUserDTO} from "@/scripts/Model/AppUser";

const props = defineProps<{
  requirement: RequirementDTO,
  tasks: TaskDTO[]
  rankInProgress: RankInProgressDTO
  rank : RankDTO
  user: AppUserDTO
}>();

const emits = defineEmits<{
  (e: 'delete:task', task: TaskDTO): void;
  (e: 'update:task', task: TaskDTO): void;
  (e: 'add:task', requirements: number[]): void;
}>();

function onTextHighlighted (reset: boolean, text: string, task: TaskDTO) {
  if (reset)
    task.partIdea = props.rank.idea;
  else
    task.partIdea = text;
  emits('update:task', task)
}

onMounted(() => {
  if (props.tasks.length === 0 && props.rankInProgress) {
    emits('add:task', [props.requirement.id])
  }
})

</script>

<template>
  <h3 style="margin: 0;">{{requirement.number}}. {{ requirement.content }}</h3>
  <div v-for="task in tasks" style="display: flex; flex-direction: column;">
    <TaskComponent
        v-if="props.rankInProgress"
        :task="task"
        :user="user"
        @delete:task="emits('delete:task', $event)"
        :show-delete-task-button="doShowDeleteTaskButton(props.rankInProgress.style)"
    >

      <textarea class="task-text-value" v-model="task.content" @change="emits('update:task', task)"/>
      <SelectionComponent
          v-if="rank && task.partIdea && doShowIdea(props.rankInProgress.style)"
          :text="task.partIdea"
          :original-text="rank.idea"
          @text-highlighted="data => onTextHighlighted(data.reset, data.text, task)"
      />

    </TaskComponent>
  </div>
  <ButtonComponent
      v-if="doShowAddTaskButton(props.rankInProgress.style) && rank"
      class="add-task-button"
      :button-text="$t('advancement.task.add')"
      buttonStyle="default"
      @click="emits('add:task', [requirement.id])"
  />
</template>

<style scoped>
.add-task-button {
  align-self: center;
  margin: 10px;
  width: 800px;
}

.task-text-value{
  resize: none;
  overflow: visible;
  min-height: 150px;
  font-family: "Museo", sans-serif;
  font-size: 14px;
}

</style>