<script setup lang="ts">
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {onMounted, ref, Ref} from "vue";
import {Task, TaskDTO} from "@/scripts/Model/Task";
import {CommentDTO, TaskComment} from "@/scripts/Model/TaskComment";

const props = withDefaults(defineProps<{
  taskId: number
  showDeleteTaskButton: boolean
}>(), {
  showDeleteTaskButton: true
});

const emits = defineEmits<{
  (e: 'delete:task', task: TaskDTO): void;
}>();

let editedTask : Ref<TaskDTO | undefined> = ref();
let comments : Ref<CommentDTO[] | undefined> = ref();

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
  Task.getById(props.taskId)
      .then(task => {editedTask.value = task})
      .then(()=>{
        if (editedTask.value) {
          editedTask.value?.commentIds.forEach(commentId => {
            TaskComment.getById(commentId)
                .then(comment => {
                  if (!comments.value) {
                    comments.value = [];
                  }
                  comments.value.push(comment);
                });
          });
        }
      })

});

</script>

<template>
<div class="task">
  <div class="task-content" ref="contentDivRef">
    <slot/>
    <ButtonComponent
        v-if="showDeleteTaskButton && editedTask"
        class="task-delete"
        button-style="error"
        :button-text="$t('advancement.task.delete')"
        @click="emits('delete:task', editedTask)"
    />
  </div>
  <div class="comments" v-if="comments">
    <CommentComponent
        v-for="currentComment in comments"
        :comment="currentComment"
        :taskId="props.taskId"
        :currentUser="currentComment.id"
        @comment:update="TaskComment.update"
        @comment:delete="comment => TaskComment.deleteObject(comment.id, props.taskId)"
    />

    <EditCommentComponent
        v-if="showCommentAdding"
        :comment=null
        :taskId="props.taskId"
        :userId="0"
        @comment:close="showCommentAdding = false"
        @comment:save="comment => TaskComment.add(comment, props.taskId)"
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