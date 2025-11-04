<script setup lang="ts">
import {Task, TaskComment} from "@/scripts/objectTemplates";
import {onMounted, ref, Ref} from "vue";
import {rankInProgress} from "@/scripts/testObjects";
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const props = defineProps<{
  originalTask: Task
}>();

const emits = defineEmits<{
  (e: 'update:task', payload: Task): void;
  (e: 'delete:task', payload: Task): void;
}>();

let editedTask : Ref<Task> = ref(props.originalTask);

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
});

function addComment(comment: TaskComment) {
  editedTask.value.comments.push(comment);
  emits('update:task', editedTask.value);
  showCommentAdding.value = false;
}

function updateComment(comment: TaskComment) {
  let index = editedTask.value.comments.findIndex(c => c.id === comment.id);
  if (index !== -1) {
    editedTask.value.comments[index] = comment;
    emits('update:task', editedTask.value);
  }
}

function deleteComment(comment: TaskComment) {
  let index = editedTask.value.comments.findIndex(c => c.id === comment.id);
  if (index !== -1) {
    editedTask.value.comments.splice(index, 1);
    emits('update:task', editedTask.value);
  }
}
</script>

<template>
<div class="task">
  <div class="task-content" ref="contentDivRef">
    <slot/>
    <ButtonComponent class="task-delete" button-style="error" :button-text="$t('advancement.task.delete')" @click="emits('delete:task', editedTask)"/>
  </div>
  <div class="comments"  v-if="editedTask.comments">
    <CommentComponent
        v-if="editedTask.comments"
        v-for="currentComment in editedTask.comments"
        :key="currentComment.id"
        :comment="currentComment"
        :user="currentComment.user"
        @update="updateComment"
        @delete="deleteComment"
    />

    <EditCommentComponent
        v-if="showCommentAdding"
        :comment=null
        :task="editedTask"
        :user="rankInProgress.user"
        @close="showCommentAdding = false"
        @save="addComment"
    />

    <p v-if="editedTask.comments.length === 0" style="align-self: center">
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