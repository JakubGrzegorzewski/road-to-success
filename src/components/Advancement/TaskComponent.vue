<script setup lang="ts">
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {onMounted, Ref, ref} from "vue";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import {useI18n} from "vue-i18n";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import {ITask, ITaskComment, IUser, Status} from "@/scripts/interfaces.ts";
import {TaskComment} from "@/scripts/database/TaskComment.ts"

const props = defineProps<{
  task : ITask,
}>();

const emits = defineEmits<{
  (e: 'delete:task'): void;
}>();

const shouldShowAccept = ref<boolean>( false);
const commentIdToDelete = ref<number | undefined>(undefined);

const comments : Ref<ITaskComment[] | []> = ref([]);

const showCommentAdding = ref(false);
const contentDivRef = ref(null);
const contentDivHeight = ref(0);

function sizeObserver() {
  if (contentDivRef.value) {
    let observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        contentDivHeight.value = entry.contentRect.height;
      }
    });
    observer.observe(contentDivRef.value);
  }
}

onMounted(() => {
  sizeObserver()
  props.task.commentIds.forEach((commentId: number) => {
    TaskComment.getById(commentId).then((comment: ITaskComment | null) => {
      if (comment) {
        comments.value = [comment, ...comments.value || [] ];
      }
    });
  })
});

const { t } = useI18n();

const statusOptions = [
  { value: Status.CREATED, label: 'statusOptions.created' },
  { value: Status.IN_PROGRESS, label: 'statusOptions.in_progress' },
  { value: Status.COMPLETED, label: 'statusOptions.completed' },
  { value: Status.FAILED, label: 'statusOptions.failed' },
];

const getStatusStyle = (status: Status) => {
  switch (status) {
    case Status.CREATED:
      return 'var(--primary-color)';
    case Status.PENDING:
      return 'var(--accent-warning)';
    case Status.IN_PROGRESS:
      return 'var(--accent-info)';
    case Status.COMPLETED:
      return 'var(--accent-success)';
    case Status.FAILED:
      return 'var(--accent-error)';
    default:
      return '';
  }
};
</script>

<template>
<div class="task">
  <div class="task-content box-shadow" ref="contentDivRef" :style="{'border-color': getStatusStyle(task.status)}">
    <DropDownSelectionComponent
        v-model="task.status"
        :options="statusOptions"
        styles="align-self: flex-end;"
        :backgroundColor="getStatusStyle(task.status)"
    />
    <slot/>
    <ButtonComponent
        v-if="task"
        class="task-delete"
        button-style="error"
        :button-text="t('advancement.task.delete')"
        @click="shouldShowAccept = true"
    />
    <PopupComponent
        v-if="shouldShowAccept"
        :title="t('popups.delete.title')"
        :message="t('popups.delete.message')"
        :option-one="{ text: t('edit.delete'), action: () => { emits('delete:task'); shouldShowAccept = false } }"
        :option-two="{ text: t('edit.cancel'), action: () => { shouldShowAccept = false} }"
    />

  </div>
<!--  <div class="comments box-shadow">-->
<!--    <CommentComponent-->
<!--        v-for="currentComment in comments"-->
<!--        :comment="currentComment"-->
<!--        :taskId="props.task.id"-->
<!--        :user="user"-->
<!--        @comment:update="updateComment"-->
<!--        @comment:delete="commentIdToDelete = currentComment.id"-->
<!--    />-->
<!--    <PopupComponent-->
<!--        v-if="commentIdToDelete !== null"-->
<!--        :title="t('popups.delete.title')"-->
<!--        :message="t('popups.delete.message')"-->
<!--        :option-one="{ text: t('edit.delete'), action: () => { commentIdToDelete ? emits('delete:task') : null; commentIdToDelete = null } }"-->
<!--        :option-two="{ text: t('edit.cancel'), action: () => { commentIdToDelete = null } }"-->
<!--    />-->

<!--    <EditCommentComponent-->
<!--        v-if="showCommentAdding"-->
<!--        :comment=null-->
<!--        :taskId="props.task.id"-->
<!--        :user="user"-->
<!--        @comment:close="showCommentAdding = false"-->
<!--        @comment:save="addComment"-->
<!--    />-->

<!--    <p v-if="comments && comments.length === 0" style="align-self: center">-->
<!--      {{ t("advancement.comment.noComments") }}-->
<!--    </p>-->

<!--    <ButtonComponent-->
<!--        style="align-self: center"-->
<!--        :button-text="t('advancement.comment.add')"-->
<!--        buttonStyle="default"-->
<!--        @click="showCommentAdding = true"-->
<!--    />-->
<!--  </div>-->
</div>
</template>

<style scoped>
.task {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 20px;
}
.task-content {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 20px;
  gap: 10px;
  flex: 2;
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

.task-delete {
  align-self: flex-end;
  margin: 10px;
  justify-self: flex-end
}

.comments {
  background-image: url("@/assets/images/chatBubble.svg");
  background-repeat: no-repeat;
  background-size: 300px;
  background-position: bottom;
  background-position-x: 170px;
  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
    color: var(--primary-color);
  }
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
}
</style>