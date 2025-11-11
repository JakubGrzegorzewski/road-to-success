<script setup lang="ts">
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import {onMounted, Ref, ref} from "vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {doShowAddTaskButton, doShowDeleteTaskButton, doShowIdea} from "@/scripts/whatToShow";
import {RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {RequirementDTO} from "@/scripts/Model/Requirement";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {addTask} from "@/scripts/databaseFunctions";

const props = defineProps<{
  requirement: RequirementDTO,
  tasks: TaskDTO[] | []
  rankInProgress: RankInProgressDTO
}>();

const rank : Ref<RankDTO | undefined> = ref();

function onTextHighlighted (reset: boolean, text: string, task: TaskDTO) {
  if (rank.value === undefined)
    return
  if (reset)
    task.partIdea = rank.value.idea;
  else
    task.partIdea = text;
  Task.update(task);
}

onMounted(() => {
  Rank.getById(props.rankInProgress.rankId).then(fetchedRank => {
    rank.value = fetchedRank;
    if (props.tasks.length === 0 && props.rankInProgress) {
      addTask(props.rankInProgress.id, rank.value);
    }
  })
})

</script>

<template>
  <h3 style="margin: 0;">{{requirement.number}}. {{ requirement.content }}</h3>
  <div v-for="task in tasks" style="display: flex; flex-direction: column;">
    <TaskComponent
        v-if="props.rankInProgress"
        :taskId="task.id"
        @update:task="Task.update"
        @delete:task="thisTask => Task.deleteObject(thisTask.id, props.rankInProgress.id)"
        :show-delete-task-button="doShowDeleteTaskButton(props.rankInProgress.style)"
    >

      <textarea class="task-text-value" v-model="task.content" @change="Task.update"/>
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
      @click="addTask(rankInProgress.id, rank)"
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