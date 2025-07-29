<script setup>
import { defineProps, ref, onMounted, computed } from 'vue';
import ButtonComponent from "@/components/UniversalComponents/ButtonComponent.vue";
import EditCommentComponent from "@/components/Advancement/EditCommentComponent.vue";
import {fetchGET} from "@/main.js";

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
});

const user = ref(null);
const showCommentEdit = ref(false);

onMounted(async () => {
  if (props.comment && props.comment.userId) {
    const data = await fetchGET(`/api/user/${props.comment.userId}`);
    console.log('Fetched user:', data);
    user.value = data;
  }
});

const displayName = computed(() => {
  const u = user.value;
  if (!u) return 'Loading...';
  if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
  if (u.first_name) return u.first_name;
  return 'Unknown User';
});


</script>

<template>
  <div class="comment-component" v-if="!showCommentEdit">
    <div class="comment-header">
      <h3 class="comment-author">
        {{ displayName }}
      </h3>
      <span class="comment-date">{{ props.comment.date }}</span>
    </div>
    <p class="comment-text">{{ props.comment.text }}</p>
    <div class="comment-actions">
      <button-component
          @click="showCommentEdit = true"
          class="edit-button" buttonStyle="default"
          :button-text="$t('edit.edit')"/>
      <button-component
          @click="deleteComment(props.comment.id)"
          class="delete-button"
          buttonStyle="error"
          :button-text="$t('edit.delete')"/>
    </div>
  </div>
  <edit-comment-component
      v-if="showCommentEdit"
      :displayName="displayName"
      :comment="props.comment"
      @close-edit="showCommentEdit = false"/>
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