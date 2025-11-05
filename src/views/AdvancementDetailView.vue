<script setup lang="ts">
import {RankInProgress, Status, Style, Task} from "@/scripts/objectTemplates";
import {rankInProgress} from "@/scripts/testObjects"
import RequirementBasedTaskComponent from "@/components/Advancement/RequirementBasedTaskComponent.vue";
import {ref, Ref} from "vue";
import IdeaBasedTaskComponent from "@/components/Advancement/IdeaBasedTaskComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

// const props = defineProps<{ rankInProgress: RankInProgress }>();

const editedRankInProgress : Ref<RankInProgress> = ref(rankInProgress);

function addTask() {
  let task : Task;
  task = {
    id: Math.floor(Math.random()*1000000000000000),
    status: Status.CREATED,
    requirements: [],
    rankInProgress: editedRankInProgress.value,
    content: "",
    partIdea: editedRankInProgress.value.rank.idea,
    comments: []
  };
  editedRankInProgress.value.tasks?.push(task);
}
</script>

<template>
  <div class="rank-details" v-if="editedRankInProgress">
    <div class="rank-details-info">
      <h2>{{ editedRankInProgress.rank.fullName }}</h2>
      <div class="nav-buttons">
        <div class="text-selection-component">
          <select v-model="editedRankInProgress.style">
            <option v-for="currentStyle in Style" :value="currentStyle">{{ $t('advancement.style.'+currentStyle) }}</option>
          </select>
        </div>
      </div>
      <p style="text-align: justify">{{ $t("advancement.idea") }} <br> {{ rankInProgress.rank.idea }}</p>
    </div>
    <RequirementBasedTaskComponent
        v-if="[Style.ONE_TASK_ONE_REQUIREMENT,
            Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA,
            Style.MULTI_TASK_ONE_REQUIREMENT,
            Style.MULTI_TASK_ONE_REQUIREMENT_WITH_IDEA,
          ].indexOf(editedRankInProgress.style) !== -1"

        v-for="requirement in editedRankInProgress.rank.requirements"
        :key="requirement.id"
        :requirement="requirement"
        :rank-in-progress="editedRankInProgress"
        :tasks="editedRankInProgress.tasks?.filter(el => el.requirements.find(req => req.id === requirement.id)) || null"
        @update:rank-in-progress="editedRank => editedRankInProgress = editedRank"
    />
    <div v-if="[Style.IDEA_SELECTION,
            Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
            Style.ONE_TASK_MULTI_REQUIREMENTS
          ].indexOf(editedRankInProgress.style) !== -1"
        style="display: flex; flex-direction: column; gap: 20px;"
    >

      <IdeaBasedTaskComponent
          v-for="task in editedRankInProgress.tasks"
          :key="task.id"
          :rank-in-progress="editedRankInProgress"
          :task="task"
          @update:rank-in-progress="editedRank => editedRankInProgress = editedRank"
      />
      <ButtonComponent
          class="add-task-button"
          :button-text="$t('advancement.task.add')"
          buttonStyle="default"
          @click="addTask"
      />
    </div>


  </div>
<!--  <managing-bubble-component :rank-in-progress="rankInProgress"></managing-bubble-component>-->

</template>

<style scoped>
.rank-details {
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

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

</style>