<script setup>
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import {ref, defineProps, onMounted, onBeforeUnmount, computed} from 'vue';
import {fetchDELETE, fetchGET, fetchPOST, fetchPUT} from "@/main.js";
import Cookies from "js-cookie";

const props = defineProps({
  task : {
    type: Object,
    required: false
  },
  requirement : {
    type: Object,
    required: false
  },
  idea : String,
})

const showCommentAdding = ref(false);

const editedTask = ref(props.task || {
  "rankInProgressId": Cookies.get("rankInProgressId") || null,
  "requirementId": props.requirement?.id || null,
  "content": "",
  "status": "DRAFT",
  "partIdea": props.idea || "",
  "commentIds": []
});

const taskContent = ref(editedTask.value.content || "");
const taskComments = ref([]);

const getUserName = computed(() => {
  fetchGET(`/api/user/${Cookies.get('userId')}`)
      .then(response => {
        return response.fullName;
      })
      .catch(error => {
        console.error("Error fetching user name:", error);
        return "Unknown User";
      });
});

const contentRef = ref(null);
const contentHeight = ref(0);
let observer;

onMounted(() => {
  if (!props.task){
    fetchPOST("/api/task", editedTask.value)
        .then(response => {
          editedTask.value = response;
        })
        .catch(error => {
          console.error("Error saving task:", error);
        });
  }

  Promise.all(editedTask.value.commentIds.map(id => fetchGET(`/api/comment/${id}`)))
      .then(comments => {
        taskComments.value = comments;
      })
      .catch(error => {
        console.error("Error fetching comments:", error);
      });

  sizeObserver()
});

const onTextHighlighted = (data) => {
  if (data.reset)
    editedTask.value.partIdea = props.idea;
  else
    editedTask.value.partIdea = data.text;

  updateTask();
};

function sizeObserver() {
  if (contentRef.value) {
    observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        contentHeight.value = entry.contentRect.height;
      }
    });
    observer.observe(contentRef.value);
  }
}

function updateTask() {
  editedTask.value.content = taskContent.value.replace(/\n/g, " ");
  fetchPUT("/api/task", editedTask.value)
      .then(response => {
        editedTask.value = response;
      })
      .catch(error => {
        console.error("Error updating task:", error);
      });
}

function updateComment(comment) {
  comment.taskId = editedTask.value.id;
  if (comment.id) {
    fetchPUT(`/api/comment/${comment.id}`, comment)
        .then(response => {
          const index = taskComments.value.findIndex(c => c.id === comment.id);
          if (index !== -1) {
            taskComments.value[index] = response;
          }
        })
        .catch(error => {
          console.error("Error updating comment:", error);
        });
  } else {
    fetchPOST("/api/comment", comment)
        .then(response => {
          taskComments.value.push(response);
          editedTask.value.commentIds.push(response.id);
        })
        .catch(error => {
          console.error("Error adding comment:", error);
        });
  }
}

function deleteComment(comment) {
  fetchDELETE(`/api/comment/${comment.id}`)
      .then(() => {
        taskComments.value = taskComments.value.filter(c => c.id !== comment.id);
        editedTask.value.commentIds = editedTask.value.commentIds.filter(id => id !== comment.id);
      })
      .catch(error => {
        console.error("Error deleting comment:", error);
      });

}
</script>

<template>
  <div class="rank-item-components">
    <div class="rank-item-component-content rank-item-component"
         ref="contentRef" >
      <h3>{{props.requirement?.number}}. {{ props.requirement?.content }}</h3>
      <textarea class="rank-item-component-content-value" v-model="taskContent" @change="updateTask"></textarea>
      <selection-component
          v-if="editedTask.partIdea"
          :text="editedTask.partIdea"
          :original-text="props.idea"
          @text-highlighted="onTextHighlighted"
      />
    </div>
    <div class="rank-item-component-comments rank-item-component"
         :style="{ height: contentHeight + 'px' }"
    >
      <comment-component
          v-if="taskComments"
          v-for="currentComment in taskComments"
          :comment="currentComment"
          :key="currentComment.id"
          :userName="getUserName"
          @save="comment => updateComment(comment)"
          @delete="comment => deleteComment(comment)"
      />

      <edit-comment-component
          v-if="showCommentAdding"
          :comment=null
          :userName="getUserName"
          @close="showCommentAdding = false"
          @save="comment => updateComment(comment)"
      />

      <p v-if="taskComments.length === 0" style="align-self: center">
        {{ $t("advancement.comment.noComments") }}
      </p>

      <button-component
          style="align-self: center"
          :button-text="$t('advancement.comment.add')"
          buttonStyle="default"
          @click="showCommentAdding = true"
      />
    </div>
  </div>
</template>

<style scoped>
.rank-item-components {
  display: flex;
  flex-direction: row;
  gap: 20px;
  border-radius: 8px;
  align-items: stretch;
  font-family: "Museo", sans-serif;
}

.rank-item-component-content {
  max-width: 1000px;
  min-width: 500px;
  flex: 2;
}
.rank-item-component-comments {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.rank-item-component {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 20px;
  gap: 10px;
  background: white;
}

.rank-item-component-content h3 {
  margin: 0;
}

.rank-item-component-content-value{
  resize: vertical;
  min-height: 50px;
}

</style>