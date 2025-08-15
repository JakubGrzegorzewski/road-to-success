<script setup>
import {ref, defineProps, onMounted, onBeforeUnmount, computed} from 'vue';
import SelectionComponent from "@/components/Universal/SelectionComponent.vue";
import CommentComponent from "@/components/Universal/CommentComponent.vue";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import EditCommentComponent from "@/components/Universal/EditCommentComponent.vue";
import Cookies from "js-cookie";
import {fetchDELETE, fetchGET, fetchPOST, fetchPUT} from "@/main.js";

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
  "comments": []
});

const onTextHighlighted = (data) => {
  if (data.reset)
    editedTask.value.partIdea = props.idea;
  else
    editedTask.value.partIdea = data.text;

  updateTask();
};

const contentRef = ref(null);
const contentHeight = ref(0);
let observer;

onMounted(() => {
  if (contentRef.value) {
    observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        contentHeight.value = entry.contentRect.height;
      }
    });
    observer.observe(contentRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer && contentRef.value) {
    observer.unobserve(contentRef.value);
  }
});

// Task
function updateTask() {
  if (editedTask.value.id) {
    fetchPUT('/api/task', editedTask.value).then((data) => {
      editedTask.value = data;
    }).catch(error => {
      console.error("Error updating task:", error);
    });
  } else {
    fetchPOST('/api/task', editedTask.value).then((data) => {
      editedTask.value = data;
    }).catch(error => {
      console.error("Error updating task:", error);
    });
  }

}

// User
const getUserName = computed(() => {
  fetchGET(`/api/user/${Cookies.get('userId')}`).then(data => {
    return data.fullName;
  }).catch(() => {
    return null;
  });
})

// Comment edit
function addComment(comment) {

  if (!editedTask.value.id) {
    fetchPOST('/api/task', editedTask.value).then((data) => {
      editedTask.value = data;
      comment.taskId = data.id;
      console.log(data)
      fetchPOST('/api/comment', comment)
          .then(response => {
            editedTask.value.comments.push(response.id);
          })

    }).catch(error => {
      console.error("Error updating task:", error);
    });
  }
}

function saveComment(comment) {
  fetchPUT('/api/comment', comment)
      .then(response => {
        editedTask.value.comments.push(response.id);
      }).catch(error => {
    console.error("Error adding comment:", error);
  });
}

function deleteComment(comment) {
  fetchDELETE('/api/comment', comment.id)
      .then(() => {
        editedTask.value.comments = editedTask.value.comments.filter(c => c.id !== comment.id);
      }).catch(error => {
    console.error("Error deleting comment:", error);
  });
}
</script>

<template>
  <div class="rank-item-components">
    <div class="rank-item-component-content rank-item-component"
         ref="contentRef" >
      <h3>{{props.requirement?.number}} {{ props.requirement?.content }}</h3>
      <textarea class="rank-item-component-content-value" v-model="editedTask.content" @change="updateTask"></textarea>
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
          v-if="editedTask"
          v-for="currentComment in editedTask?.comments"
          :comment="currentComment" :key="currentComment.id"
          :userName="getUserName"
          @save="comment => saveComment(comment)"
          @delete="commentId => deleteComment(commentId)"
      />

      <edit-comment-component
          v-if="showCommentAdding"
          :comment=null
          :userName="getUserName"
          @close="showCommentAdding = false"
          @save="comment => addComment(comment)"
      />

      <p v-if="editedTask && editedTask.comments" style="align-self: center">
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
  border: 1px solid var(--shadow-light);
}

.rank-item-component-content h3 {
  margin: 0;
}

.rank-item-component-content-value{
  resize: vertical;
  min-height: 50px;
}

</style>