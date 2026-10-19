<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import TextSelectionComponent from "@/components/Universal/TextSelectionComponent.vue";
import CollaborativeTextarea from "@/components/Universal/CollaborativeTextarea.vue";
import TaskComponent from "@/components/Advancement/TaskComponent.vue";
import type { IRank, IRequirement, ITask, Status } from "@/scripts/interfaces.ts";
import { Task } from "@/scripts/database/Task";
import { requirementLabel } from "@/scripts/database/Requirement";
import { useLayout } from "@/scripts/composables";

const { t } = useI18n()
const { isWide } = useLayout()

const props = defineProps<{
  task: ITask
  rank: IRank
  requirements: IRequirement[]
  index?: number
}>();

const ideaWords = computed(() => props.rank.idea.split(' '))
const selected = computed(() => new Set(props.task.requirementIds))
const selectedCount = computed(() => props.requirements.filter(r => selected.value.has(r.id)).length)

function onTextHighlighted(payload: { reset: boolean; text: string[] }) {
  void Task.setPartIdea(props.task.id, payload.reset ? ideaWords.value : payload.text)
}

function toggleRequirement(requirement: IRequirement) {
  void Task.toggleRequirement(props.task.id, requirement.id)
}

function setStatus(status: Status) {
  void Task.setStatus(props.task.id, status)
}

function remove() {
  void Task.deleteObject(props.task.id)
}

const label = (r: IRequirement) => requirementLabel(r, props.requirements)
</script>

<template>
  <TaskComponent :task="props.task" :index="index" @delete:task="remove" @update:status="setStatus">
    <div class="task-content">
      <TextSelectionComponent
          :text="props.task.partIdea"
          :original-text="ideaWords"
          @text-highlighted="onTextHighlighted"
      />
      <CollaborativeTextarea :task-id="props.task.id" :placeholder="t('advancement.task.placeholder')" :label="t('advancement.task.content')" />

      <h3>{{ t("advancement.requirements") }}</h3>

      <!-- wide screens: compact buttons with the full text on hover -->
      <div v-if="isWide" class="task-requirements">
        <ButtonComponent
            v-for="requirement in requirements"
            :key="requirement.id"
            :button-text="label(requirement)"
            :buttonStyle="selected.has(requirement.id) ? 'primary' : 'default'"
            :button-hint="requirement.content"
            :aria-pressed="selected.has(requirement.id)"
            @click="toggleRequirement(requirement)"
        />
      </div>

      <!-- phones/tablets: no hover, so show the text with large touch targets -->
      <details v-else class="requirement-picker">
        <summary>
          {{ t('advancement.requirements') }} · {{ t('advancement.task.selectedCount', { n: selectedCount }) }}
        </summary>
        <ul>
          <li v-for="requirement in requirements" :key="requirement.id">
            <label class="requirement-option" :class="{ checked: selected.has(requirement.id) }">
              <input type="checkbox" :checked="selected.has(requirement.id)" @change="toggleRequirement(requirement)" />
              <span><strong>{{ label(requirement) }}.</strong> {{ requirement.content }}</span>
            </label>
          </li>
        </ul>
      </details>
    </div>
  </TaskComponent>
</template>

<style scoped>
h3 {
  margin: 0;
}
.task-content {
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
  align-items: stretch;
  gap: var(--space-md);
  min-width: 0;
}

.task-requirements {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}

.requirement-picker summary {
  cursor: pointer;
  min-height: var(--touch-target);
  display: flex;
  align-items: center;
  font-weight: 500;
}

.requirement-picker ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.requirement-option {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-height: var(--touch-target);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
}

.requirement-option.checked {
  border-color: var(--secondary-color);
  background: rgba(50, 158, 213, 0.12);
}

.requirement-option input {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 1px;
  accent-color: var(--secondary-color);
}

@media (max-width: 599px) {
  .task-content {
    padding: var(--space-xs) 0;
    gap: var(--space-sm);
  }
}
</style>
