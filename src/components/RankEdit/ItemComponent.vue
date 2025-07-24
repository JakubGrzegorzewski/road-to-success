<template>
  <div class="rank-item-components">
    <div class="rank-item-component-content rank-item-component">
      <h3>{{props.task}}</h3>
      <textarea class="rank-item-component-content-value" v-model="content"></textarea>
      <selection-component
          v-if="selectedText"
          :text="selectedText"
          :original-text="props.idea"
          @text-highlighted="onTextHighlighted"
      />
    </div>
    <div class="rank-item-component-comments rank-item-component">

    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import SelectionComponent from "@/components/RankEdit/SelectionComponent.vue";

const props = defineProps({
  idea : String,
  task: String,
  taskContent: String
})

const content = ref(props.taskContent);
const selectedText = ref(props.idea);

const onTextHighlighted = (data) => {
  if (data.reset)
    selectedText.value = props.idea;
  else
    selectedText.value = data.text;

};
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