<script setup lang="ts">
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import TextSelectionComponent from "@/components/Universal/TextSelectionComponent.vue";
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import {useI18n} from "vue-i18n";
import {IRank, IRankInProgress, IRequirement, ITask, IUser} from "@/scripts/interfaces.ts";

const { t } = useI18n()

const props = defineProps<{
  task: ITask
  rankInProgress: IRankInProgress
  rank : IRank,
  requirements : IRequirement[]
  user: IUser
}>();

const emits = defineEmits<{
  (e: 'delete:task'): void;
  (e: 'update:task', task: ITask): void;
}>();

function onTextHighlighted (reset: boolean, text: string[]) {
  if (props.rank === undefined)
    return
  if (reset)
    props.task.partIdea = props.rank.idea.split(' ');
  else
    props.task.partIdea = text;
  emits('update:task', props.task)
}

function getReqIds(): number[] {
  return Array.isArray(props.task.requirementsIds) ? props.task.requirementsIds : [];
}

function toggleRequirement(requirement: IRequirement) {
  console.log("Toggle requirement", props.task.requirementsIds, requirement.id,);
  if (!Array.isArray(props.task.requirementsIds)) return;
  if (isRequirementSelected(requirement))
    props.task.requirementsIds = props.task.requirementsIds.filter(req => req !== requirement.id);
  else if (requirement.id != null) {
    props.task.requirementsIds.push(requirement.id);
  }
  emits('update:task', props.task)
}

function isRequirementSelected(requirement: IRequirement) {
  return getReqIds().find(req => req === requirement.id) !== undefined;
}

function hasMoreThenOneRequirementWithSameNumber(number : string) {
  return props.requirements.filter(req => req.number === number).length > 1;
}

function getRequirementSubIndex(requirement : IRequirement) {
  return props.requirements.filter(req => req.number === requirement.number).indexOf(requirement) + 1;
}
</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <TaskComponent
        :task="props.task"
        :user="user"
        :show-delete-task-button="true"
        @delete:task="emits('delete:task')"
    >
      <div class="task-content">
        <TextSelectionComponent
            :text="props.task.partIdea"
            :original-text="rank?.idea.split(' ')"
            @text-highlighted="data => onTextHighlighted(data.reset, data.text)"
        />
        <textarea class="multiline-text-input" v-model="props.task.content" @change="emits('update:task', props.task)"/>

        <h3> {{t("advancement.requirements")}}</h3>

        <div class="task-requirements">
          <ButtonComponent
              v-for="requirement in requirements"
              :key="requirement.id"
              :button-text="hasMoreThenOneRequirementWithSameNumber(requirement.number) ? getRequirementSubIndex(requirement) + '. ' + requirement.number: requirement.number"
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
  padding: var(--space-md);
  align-items: stretch;
  gap: var(--space-md);
}

.task-requirements {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 600px) {
  .task-content {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }
}
</style>