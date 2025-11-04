<script setup lang="ts">
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import {RankInProgress, Requirement, Status, Task} from "@/scripts/objectTemplates";
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import {ref} from "vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps<{
  requirement: Requirement,
  tasks: Task[] | null
  rankInProgress: RankInProgress
}>();

const editedRankInProgress = ref(props.rankInProgress);

const emits = defineEmits<{
  (e: 'update:rankInProgress', payload: RankInProgress): void;
}>();

function onTextHighlighted (reset: boolean, text: string, task: Task) {
  if (reset)
    task.partIdea = props.requirement.rank.idea;
  else
    task.partIdea = text;
  updateTask(task);
}

function addTask() {
  let task : Task;
  task = {
    id: 0,
    status: Status.CREATED,
    requirements: [props.requirement],
    rankInProgress: props.rankInProgress,
    content: "",
    partIdea: props.requirement.rank.idea,
    comments: []
  };
  editedRankInProgress.value.tasks?.push(task);
  emits('update:rankInProgress', editedRankInProgress.value);
  console.log(editedRankInProgress.value)
}

function updateTask(task : Task) {
  editedRankInProgress.value.tasks = editedRankInProgress.value.tasks?.map(t => t.id === task.id ? task : t);
  emits('update:rankInProgress', editedRankInProgress.value);
}

function deleteTask(task : Task) {
  editedRankInProgress.value.tasks = editedRankInProgress.value.tasks?.filter(t => t.id !== task.id);
  emits('update:rankInProgress', editedRankInProgress.value);
}

</script>

<template>
  <h3 style="margin: 0;">{{requirement.number}}. {{ requirement.content }}</h3>
  <div v-for="task in tasks" style="display: flex; flex-direction: column;">
    <TaskComponent :original-task="task" @update:task="updateTask" @delete:task="deleteTask">
      <textarea class="task-text-value" v-model="task.content" @change="updateTask(task)"/>
      <SelectionComponent
          v-if="task.partIdea"
          :text="task.partIdea"
          :original-text="task.rankInProgress.rank.idea"
          @text-highlighted="data => onTextHighlighted(data.reset, data.text, task)"
      />

    </TaskComponent>
    <ButtonComponent
        v-if="tasks && tasks.indexOf(task) >= tasks.length - 1"
        class="add-task-button"
        :button-text="$t('advancement.task.add')"
        buttonStyle="default"
        @click="addTask"
    />
  </div>
</template>

<style scoped>
.add-task-button {
  align-self: center;
  margin: 10px;
  width: 100%;
}

.task-text-value{
  resize: none;
  overflow: visible;
  min-height: 150px;
  font-family: "Museo", sans-serif;
  font-size: 14px;
}

</style>