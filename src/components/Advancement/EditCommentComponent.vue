<script setup>
  import { computed, defineProps, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ButtonComponent from "@/components/UniversalComponents/ButtonComponent.vue";

  const props = defineProps({
    comment: { type: Object, required: true }
  });

  const text = ref(props.comment.text);
  const { t } = useI18n();

  const displayName = computed(() => {
    const user = props.comment?.user?.value;
    return user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || t('user.you');
  });
</script>

<template>
    <div class="comment-component">
      <div class="comment-header">
        <h3 class="comment-author">{{ displayName }}</h3>
        <span class="comment-date">{{ props.comment.date }}</span>
      </div>
      <textarea class="comment-text" v-model="text" />
      <div class="comment-actions">
        <button-component
          buttonStyle="success"
          @click="$emit('close'); $emit('save', text)"
          :button-text="$t('edit.save')"
        />
        <button-component
          buttonStyle="warning"
          @click="$emit('close')"
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