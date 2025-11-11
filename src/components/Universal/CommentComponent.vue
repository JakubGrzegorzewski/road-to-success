<script setup lang="ts">
import {onMounted, Ref, ref} from 'vue';
import { useI18n } from 'vue-i18n';
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import {CommentDTO} from "@/scripts/Model/TaskComment";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser";

const props = defineProps<{
  comment: CommentDTO | undefined;
  taskId: number;
  currentUser: number
}>();

const emits = defineEmits<{
  (e: 'comment:update', comment: CommentDTO): void;
  (e: 'comment:delete', comment: CommentDTO): void;
}>();

const user : Ref<AppUserDTO | undefined > = ref()


const { t } = useI18n();
const showCommentEdit = ref(false);

onMounted(() => {
  if (!props.comment) {
    return;
  }
  AppUser.getById(props.comment.userId)
      .then(fetchedUser => {
        user.value = fetchedUser
      })
})
</script>

<template>
  <div class="comment-component" v-if="!showCommentEdit && comment && user" >
    <div class="comment-header">
      <h3 class="comment-author">{{ user.fullName || t('user.you') }}</h3>
      <span class="comment-date">{{ comment.date }}</span>
    </div>
    <p class="comment-text">{{ comment.content }}</p>
    <div class="comment-actions">
      <ButtonComponent
          v-if="user && user.id === props.currentUser"
          @click="showCommentEdit = true"
          buttonStyle="default"
          :button-text="$t('edit.edit')"
      />
      <ButtonComponent
          v-if="props.comment"
          @click="emits('comment:delete', props.comment);"
          buttonStyle="error"
          :button-text="$t('edit.delete')"
      />
    </div>
  </div>
  <EditCommentComponent
    v-if="showCommentEdit && props.comment"
    :userId="currentUser"
    :comment="props.comment"
    :taskId="taskId"
    @comment:close="showCommentEdit = false"
    @comment:save="emits('comment:update', $event);"
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