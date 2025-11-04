<script setup lang="ts">
import { ref, Ref} from 'vue';
import { useI18n } from 'vue-i18n';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {AppUser, Task, TaskComment} from "@/scripts/objectTemplates";

const props = defineProps<{
  comment: TaskComment | null;
  task: Task;
  user: AppUser;
}>();

const emits = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: TaskComment): void;
}>();

const editComment : Ref<TaskComment> = ref(
    props.comment ||
    {
      id: 0,
      date: new Date().toISOString().split('T')[0],
      user: props.user,
      content: "",
      task: props.task,
    }
);

const { t } = useI18n();
</script>

<template>
<div class="comment-component">
  <div class="comment-header">
    <h3 class="comment-author">{{ user.fullName || t('user.you') }}</h3>
    <span class="comment-date">{{ editComment.date }}</span>
  </div>
  <textarea class="comment-text" v-model="editComment.content" />
  <div class="comment-actions">
    <ButtonComponent
      buttonStyle="success"
      @click="emits('close'); emits('save', editComment)"
      :button-text="$t('edit.save')"
    />
    <ButtonComponent
      buttonStyle="warning"
      @click="emits('close')"
      :button-text="$t('edit.cancel')"
    />
  </div>
</div>
</template>

<style scoped>
.comment-component {
  border: 1px solid var(--shadow-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  margin: 0;
  font-weight: bold;
  color: var(--primary-color-dark);
}

.comment-date {
  font-size: 0.9em;
  color: var(--primary-color-dark);
}

.comment-text {
  font-family: 'Museo', sans-serif;
  font-size: 12px;
  resize: vertical;
  min-height: 100px;
}

.comment-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>