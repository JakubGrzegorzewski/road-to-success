<script setup lang="ts">
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import {RankInProgress, Requirement, Style, Task} from "@/scripts/objectTemplates";
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import {ref} from "vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps<{
  task: Task
  rankInProgress: RankInProgress
}>();

const editedRankInProgress = ref(props.rankInProgress);

const emits = defineEmits<{
  (e: 'update:rankInProgress', payload: RankInProgress): void;
}>();

function onTextHighlighted (reset: boolean, text: string, task: Task) {
  if (reset)
    task.partIdea = task.rankInProgress.rank.idea;
  else
    task.partIdea = text;
  updateTask(task);
}
const text = ref("");

function updateTask(task : Task) {
  editedRankInProgress.value.tasks = editedRankInProgress.value.tasks?.map(t => t.id === task.id ? task : t);
  emits('update:rankInProgress', editedRankInProgress.value);
}

function deleteTask(task : Task) {
  editedRankInProgress.value.tasks = editedRankInProgress.value.tasks?.filter(t => t.id !== task.id);
  emits('update:rankInProgress', editedRankInProgress.value);
}

function toggleRequirement(requirement: Requirement) {
  if (isRequirementSelected(requirement))
    props.task.requirements = props.task.requirements.filter(req => req.id !== requirement.id);
  else
    props.task.requirements.push(requirement);
  updateTask(props.task);
}
function isRequirementSelected(requirement: Requirement) {
  return props.task.requirements.find(req => req.id === requirement.id) !== undefined;
}

</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <TaskComponent :original-task="props.task" @update:task="updateTask" @delete:task="deleteTask" :show-delete-task-button="true">
      <div class="task-content">
        <SelectionComponent
            v-if="props.task.partIdea && props.rankInProgress.style !== Style.ONE_TASK_MULTI_REQUIREMENTS"
            :text="props.task.partIdea"
            :original-text="props.task.rankInProgress.rank.idea"
            @text-highlighted="data => onTextHighlighted(data.reset, data.text, props.task)"
        />
        <textarea class="task-text-value" v-model="text" @change="updateTask(props.task)"/>
        <h3 v-if="props.rankInProgress.style !== Style.IDEA_SELECTION"> {{$t("advancement.requirements")}}</h3>
        <div class="task-requirements" v-if="props.rankInProgress.style !== Style.IDEA_SELECTION">
          <ButtonComponent
              v-for="requirement in rankInProgress.rank.requirements"
              :key="requirement.id"
              :button-text="requirement.number + '.'"
              :buttonStyle="isRequirementSelected(requirement) ? 'primary' : 'default'"
              :button-hint="requirement.content"
              @click="toggleRequirement(requirement)"
          />
          <span v-if="props.task.requirements.length === 0"></span>
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

.task-text-value{
  resize: none;
  overflow: visible;
  min-height: 150px;
  font-family: "Museo", sans-serif;
  font-size: 14px;
}

.task-requirements {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}
</style>