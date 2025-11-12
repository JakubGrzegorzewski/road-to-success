<script setup lang="ts">
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {onMounted, Ref, ref} from "vue";
import {TaskDTO} from "@/scripts/Model/Task";
import {AppUserDTO} from "@/scripts/Model/AppUser";
import {CommentDTO, TaskComment} from "@/scripts/Model/TaskComment";

const props = withDefaults(defineProps<{
  task : TaskDTO,
  user : AppUserDTO
  showDeleteTaskButton: boolean
}>(), {
  showDeleteTaskButton: true
});

const emits = defineEmits<{
  (e: 'delete:task', task: TaskDTO): void;
}>();

const comments : Ref<CommentDTO[] | []> = ref([]);

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

function updateComment(updatedComment: CommentDTO) {
  if (comments.value) {
    const index = comments.value.findIndex(comment => comment.id === updatedComment.id);
    if (index !== -1) {
      comments.value[index] = updatedComment;
      TaskComment.update(updatedComment);
    }
  }
}

function addComment(newComment: CommentDTO) {
  if (comments.value) {
    comments.value = [newComment, ...comments.value || [] ];
    TaskComment.add(newComment, props.task.id);
  }
}

function deleteComment(updatedComment: CommentDTO) {
  comments.value = comments.value?.filter(comment => comment.id !== updatedComment.id).map(comment => comment);
  TaskComment.deleteObject(updatedComment.id, props.task.id);
}


</script>

<template>
<div class="task">
  <div class="task-content" ref="contentDivRef">
    <slot/>
    <ButtonComponent
        v-if="showDeleteTaskButton && task"
        class="task-delete"
        button-style="error"
        :button-text="$t('advancement.task.delete')"
        @click="emits('delete:task', task)"
    />
  </div>
  <div class="comments" v-if="comments">
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
  background: white;
  flex: 2;
  align-items: stretch;
}

.task-delete {
  align-self: flex-end;
  margin: 10px;
  justify-self: flex-end
}

.comments {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
}
</style>