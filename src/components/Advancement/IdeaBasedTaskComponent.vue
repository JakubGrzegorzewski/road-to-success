<script setup lang="ts">
import {onMounted, Ref, ref} from "vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {RankInProgressDTO} from "@/scripts/Model/RankInProgress";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {Style} from "@/scripts/Model/Style";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement";

const props = defineProps<{
  task: TaskDTO
  rankInProgress: RankInProgressDTO
}>();

const rank : Ref<RankDTO | undefined> = ref();
const requirements : Ref<RequirementDTO[]> = ref([]);

function onTextHighlighted (reset: boolean, text: string, task: TaskDTO) {
  if (rank.value === undefined)
    return

  if (reset)
    task.partIdea = rank.value.idea;
  else
    task.partIdea = text;
  Task.update(task);
}

const text = ref("");

function toggleRequirement(requirement: RequirementDTO) {
  if (isRequirementSelected(requirement))
    props.task.requirementsIds = props.task.requirementsIds.filter(req => req !== requirement.id);
  else
    props.task.requirementsIds.push(requirement.id);
  Task.update(props.task);
}
function isRequirementSelected(requirement: RequirementDTO) {
  return props.task.requirementsIds.find(req => req === requirement.id) !== undefined;
}


onMounted(() => {
  Rank.getById(props.rankInProgress.rankId).then(fetchedRank => {
    rank.value = fetchedRank;
    const requirementIds = rank.value?.requirementIds ?? [];
    const requirementPromises = requirementIds.map(id => Requirement.getById(id));
    return Promise.all(requirementPromises);
  }).then(fetchedRequirements => {
    requirements.value = fetchedRequirements;
  }).catch(() => {
    requirements.value = [];
  });
})


</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <TaskComponent :taskId="props.task.id" @update:task="Task.update" @delete:task="thisTask => Task.deleteObject(thisTask.id, props.rankInProgress.id)" :show-delete-task-button="true">
      <div class="task-content">
        <SelectionComponent
            v-if="rank && props.task.partIdea && props.rankInProgress.style !== Style.ONE_TASK_MULTI_REQUIREMENTS"
            :text="props.task.partIdea"
            :original-text="rank?.idea"
            @text-highlighted="data => onTextHighlighted(data.reset, data.text, props.task)"
        />
        <textarea class="task-text-value" v-model="text" @change="Task.update(props.task)"/>
        <h3 v-if="props.rankInProgress.style !== Style.IDEA_SELECTION"> {{$t("advancement.requirements")}}</h3>
        <div class="task-requirements" v-if="props.rankInProgress.style !== Style.IDEA_SELECTION">
          <ButtonComponent
              v-for="requirement in requirements"
              :key="requirement.id"
              :button-text="requirement.number + '.'"
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