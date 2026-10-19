<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import { Status, type ITask } from "@/scripts/interfaces.ts";

/** Card frame of a task: status selector, content slot, delete with confirmation. */
const props = defineProps<{
  task: ITask,
  index?: number,
}>();

const emits = defineEmits<{
  (e: 'delete:task'): void;
  (e: 'update:status', status: Status): void;
}>();

const { t } = useI18n();
const shouldShowAccept = ref<boolean>(false);

function onStatusChange(status: Status) {
  emits('update:status', status);
}

const statusOptions = [
  { value: Status.CREATED, label: 'statusOptions.created' },
  { value: Status.IN_PROGRESS, label: 'statusOptions.in_progress' },
  { value: Status.PENDING, label: 'statusOptions.pending' },
  { value: Status.COMPLETED, label: 'statusOptions.completed' },
  { value: Status.FAILED, label: 'statusOptions.failed' },
];

const getStatusStyle = (status: Status) => {
  switch (status) {
    case Status.CREATED:
      return 'var(--primary-color-light)';
    case Status.PENDING:
      return 'var(--accent-warning)';
    case Status.IN_PROGRESS:
      return 'var(--accent-info)';
    case Status.COMPLETED:
      return 'var(--accent-success)';
    case Status.FAILED:
      return 'var(--accent-error)';
    default:
      return 'var(--primary-color-light)';
  }
};
</script>

<template>
<article class="task">
  <div class="task-content box-shadow" :style="{'border-color': getStatusStyle(props.task.status)}">
    <header class="task-header">
      <h2 v-if="index !== undefined" class="task-number">{{ t('advancement.task.task') }} {{ index }}</h2>
      <DropDownSelectionComponent
          :model-value="props.task.status"
          :options="statusOptions"
          translate-labels
          styles="width: 180px"
          :background-color="getStatusStyle(props.task.status)"
          @update:model-value="onStatusChange"
      />
    </header>
    <slot/>
    <ButtonComponent
        class="task-delete"
        button-style="error"
        :button-text="t('advancement.task.delete')"
        @click="shouldShowAccept = true"
    />
    <PopupComponent
        v-if="shouldShowAccept"
        :title="t('popups.delete.title')"
        :message="t('popups.delete.message')"
        :option-one="{ text: t('edit.delete'), style: 'error', action: () => { emits('delete:task'); shouldShowAccept = false } }"
        :option-two="{ text: t('edit.cancel'), action: () => { shouldShowAccept = false } }"
    />
  </div>
</article>
</template>

<style scoped>
.task {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: var(--space-md);
}
.task-content {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: var(--space-md);
  gap: 10px;
  flex: 2;
  min-width: 0;
  align-items: stretch;
  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
    color: var(--primary-color);
  }
  background-image: url("@/assets/images/background.svg");
  background-repeat: no-repeat;
  background-size: 600px;
  background-position: left bottom;
  background-position-x: -150px;
  border-style: solid;
  border-width: 4px;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.task-number {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.task-delete {
  align-self: flex-end;
  margin: 10px;
}

@media (max-width: 599px) {
  .task-content {
    padding: var(--space-sm);
    border-width: 3px;
    background-size: 420px;
  }
  .task-delete {
    margin: 4px 0 0;
  }
}
</style>
