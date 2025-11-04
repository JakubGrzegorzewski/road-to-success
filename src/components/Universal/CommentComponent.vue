<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import {AppUser, Task, TaskComment} from '@/scripts/objectTemplates';

const props = defineProps<{
  comment: TaskComment,
  user: AppUser
}>();

const emits = defineEmits<{
  (e: 'update', payload: TaskComment): void;
  (e: 'delete', payload: TaskComment): void;
}>();

const { t } = useI18n();
const showCommentEdit = ref(false);

</script>

<template>
  <div class="comment-component" v-if="!showCommentEdit">
    <div class="comment-header">
      <h3 class="comment-author">{{ user.fullName || t('user.you') }}</h3>
      <span class="comment-date">{{ props.comment.date }}</span>
    </div>
    <p class="comment-text">{{ props.comment.content }}</p>
    <div class="comment-actions">
      <ButtonComponent
        @click="showCommentEdit = true"
        buttonStyle="default"
        :button-text="$t('edit.edit')"
      />
      <ButtonComponent
        @click="emits('delete', comment)"
        buttonStyle="error"
        :button-text="$t('edit.delete')"
      />
    </div>
  </div>
  <EditCommentComponent
    v-if="showCommentEdit"
    :user="user"
    :comment="props.comment"
    :task="props.comment.task"
    @close="showCommentEdit = false"
    @save="element => emits('update', element)"
  />
</template>

<style scoped>
  .comment-component {
    border: 1px solid var(--shadow-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
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
  }

  .comment-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
</style>