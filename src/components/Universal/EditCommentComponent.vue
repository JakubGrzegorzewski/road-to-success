<script setup lang="ts">
import {ref, Ref} from 'vue';
import { useI18n } from 'vue-i18n';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {CommentDTO} from "@/scripts/Model/TaskComment";
import {AppUserDTO} from "@/scripts/Model/AppUser";


const props = defineProps<{
  comment: CommentDTO | null;
  taskId: number;
  user: AppUserDTO
}>();

const emits = defineEmits<{
  (e: 'comment:save', comment: CommentDTO): void;
  (e: 'comment:close'): void;
}>();

const editComment : Ref<CommentDTO> = ref(
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
<div class="comment-component">
  <div class="comment-header">
    <h3 class="comment-author" v-if="user">{{ user.fullName || t('user.you') }}</h3>
    <span class="comment-date">{{ editComment.date }}</span>
  </div>
  <textarea class="comment-text" v-model="editComment.content" />
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