<script setup>
import {defineProps, ref, defineEmits, computed} from 'vue';
import ButtonComponent from "@/components/UniversalComponents/ButtonComponent.vue";

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  displayName : String
});

const emit = defineEmits(['closeEdit']);

const text = ref(props.comment.text);
</script>

<template>
  <div class="comment-component">
    <div class="comment-header">
      <h3 class="comment-author">
        {{ displayName }}
      </h3>
      <span class="comment-date">{{ props.comment.date }}</span>
    </div>
    <textarea class="comment-text" v-model="text"/>
    <div class="comment-actions">
      <button-component
          buttonStyle="success"
          @click="$emit('closeEdit')"
          :button-text="$t('edit.save')"
      />
      <button-component
        buttonStyle="warning"
        @click="$emit('closeEdit')"
        :button-text="$t('edit.cancel')"
      />
      </div>
  </div>
</template>

<style scoped>
.comment-component {
  border: 1px solid var(--shadow-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  resize: vertical;
  min-height: 100px;
}

.comment-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

</style>