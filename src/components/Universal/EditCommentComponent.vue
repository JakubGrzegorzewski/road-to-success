<script setup lang="ts">
import {ref, Ref} from 'vue';
import { useI18n } from 'vue-i18n';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {TaskCommentDTO} from "@/scripts/Model/TaskComment";
import {AppUserDTO} from "@/scripts/Model/AppUser";


const props = defineProps<{
  comment: TaskCommentDTO | null;
  taskId: number;
  user: AppUserDTO
}>();

const emits = defineEmits<{
  (e: 'comment:save', comment: TaskCommentDTO): void;
  (e: 'comment:close'): void;
}>();

const editComment : Ref<TaskCommentDTO> = ref(
    props.comment ||
    {
      id: Math.floor(Math.random()*1000000000000000),
      date: new Date().toISOString().split('T')[0],
      userId: props.user.id,
      content: "",
      taskId: props.taskId,
    }
);
const { t } = useI18n();
</script>

<template>
<div class="comment-component box-shadow">
  <div class="comment-header">
    <h3 class="comment-author" v-if="user">{{ user.fullName || t('user.you') }}</h3>
    <span class="comment-date">{{ editComment.date }}</span>
  </div>
  <textarea class="comment-text multiline-text-input" v-model="editComment.content" />
  <div class="comment-actions">
    <ButtonComponent
      buttonStyle="success"
      @click="emits('comment:close'); emits('comment:save', editComment);"
      :button-text="$t('edit.save')"
    />
    <ButtonComponent
      buttonStyle="warning"
      @click="emits('comment:close')"
      :button-text="$t('edit.cancel')"
    />
  </div>
</div>
</template>

<style scoped>
.comment-component {
  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
    color: var(--primary-color);
  }
  border: 1px solid var(--shadow-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
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
}

.comment-date {
  font-size: 0.9em;
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