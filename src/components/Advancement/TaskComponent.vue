<script setup lang="ts">
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {onMounted, Ref, ref} from "vue";
import {TaskDTO} from "@/scripts/Model/Task";
import {AppUserDTO} from "@/scripts/Model/AppUser";
import {TaskCommentDTO, TaskComment} from "@/scripts/Model/TaskComment";
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import {Status} from "@/scripts/Model/Status.js";
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{
  task : TaskDTO,
  user : AppUserDTO
  showDeleteTaskButton: boolean
}>(), {
  showDeleteTaskButton: true
});

const emits = defineEmits<{
  (e: 'update:task', task: TaskDTO): void;
  (e: 'delete:task', task: TaskDTO): void;
}>();

const comments : Ref<TaskCommentDTO[] | []> = ref([]);

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
  props.task.commentIds.forEach(commentId => {
    TaskComment.getById(commentId).then(comment => {
      console.log("Comment loaded:", comment);
      if (comment) {
        console.log("Comment loaded:", comment);
        comments.value = [comment, ...comments.value || [] ];
      }
    });
  })
});

function updateComment(updatedComment: TaskCommentDTO) {
  if (comments.value) {
    const index = comments.value.findIndex(comment => comment.id === updatedComment.id);
    if (index !== -1) {
      comments.value[index] = updatedComment;
      TaskComment.update(updatedComment);
    }
  }
}

function addComment(newComment: TaskCommentDTO) {
  if (comments.value) {
    comments.value = [newComment, ...comments.value || [] ];
    TaskComment.add(newComment, props.task.id);
  }
}

function deleteComment(updatedComment: TaskCommentDTO) {
  comments.value = comments.value?.filter(comment => comment.id !== updatedComment.id).map(comment => comment);
  TaskComment.deleteObject(updatedComment.id, props.task.id);
}
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
        @update:modelValue="emits('update:task', props.task)"
        :options="statusOptions"
        styles="align-self: flex-end;"
        :backgroundColor="getStatusStyle(task.status)"
    />
    <slot/>
    <ButtonComponent
        v-if="showDeleteTaskButton && task"
        class="task-delete"
        button-style="error"
        :button-text="$t('advancement.task.delete')"
        @click="emits('delete:task', task)"
    />
  </div>
  <div class="comments box-shadow" v-if="comments">
    <CommentComponent
        v-for="currentComment in comments"
        :comment="currentComment"
        :taskId="props.task.id"
        :user="user"
        @comment:update="updateComment"
        @comment:delete="deleteComment"
    />

    <EditCommentComponent
        v-if="showCommentAdding"
        :comment=null
        :taskId="props.task.id"
        :user="user"
        @comment:close="showCommentAdding = false"
        @comment:save="addComment"
    />

    <p v-if="comments && comments.length === 0" style="align-self: center">
      {{ $t("advancement.comment.noComments") }}
    </p>

    <ButtonComponent
        style="align-self: center"
        :button-text="$t('advancement.comment.add')"
        buttonStyle="default"
        @click="showCommentAdding = true"
    />
  </div>
</div>
</template>

<style scoped>
.task {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
.task-content {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 20px;
  gap: 10px;
  margin-right: 20px;
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