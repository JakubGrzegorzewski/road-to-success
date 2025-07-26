<template>
  <div class="rank-item-components">
    <div class="rank-item-component-content rank-item-component"
         ref="contentRef" >
      <h3>{{props.task}}</h3>
      <textarea class="rank-item-component-content-value" v-model="content"></textarea>
      <selection-component
          v-if="selectedText"
          :text="selectedText"
          :original-text="props.idea"
          @text-highlighted="onTextHighlighted"
      />
    </div>
    <div class="rank-item-component-comments rank-item-component"
         :style="{ height: contentHeight + 'px' }"
    >
      <comment-component v-if="props.taskContent" v-for="currentTask in props.taskContent?.comments" :comment="currentTask" :key="currentTask.id" />
      <button-component v-if="props.taskContent" style="align-self: center" :button-text="$t('advancement.comment.add')" buttonStyle="default" @click="$emit('addComment', props.task, content)" />
      <p v-else style="align-self: center">{{ $t("advancement.comment.noComments") }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, onBeforeUnmount } from 'vue';
import SelectionComponent from "@/components/UniversalComponents/SelectionComponent.vue";
import CommentComponent from "@/components/Advancement/CommentComponent.vue";
import ButtonComponent from "@/components/UniversalComponents/ButtonComponent.vue";

const props = defineProps({
  idea : String,
  task: String,
  taskContent: {
    type: Object,
    required: false
  }
})

const content = ref(props.taskContent?.content);
const selectedText = ref(props.idea);

const onTextHighlighted = (data) => {
  if (data.reset)
    selectedText.value = props.idea;
  else
    selectedText.value = data.text;

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
</script>

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
;
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