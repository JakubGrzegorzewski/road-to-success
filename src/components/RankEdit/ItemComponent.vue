<template>
  <div class="rank-item-components">
    <div class="rank-item-component-content rank-item-component">
      <h3>Treść</h3>
      <textarea class="rank-item-component-content-value" v-model="content"></textarea>
      <selection-component
          v-if="selectedText"
          :text="selectedText"
          :original-text="idea"
          @text-highlighted="onTextHighlighted"
      />
    </div>
    <div class="rank-item-component-comments rank-item-component">

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SelectionComponent from "@/components/RankEdit/SelectionComponent.vue";

const content = ref("Test fasdf asdfasd fa dfa");
const idea = ref("Swoją postawą propaguje harcerski system wartości wynikający z Przyrzeczenia i Prawa Harcerskiego. Poznaje siebie i motywy swojego postępowania. Pracuje nad własnymi słabościami i rozwija zdolności. Jest wzorem dla harcerzy. We współdziałaniu z dziećmi i młodzieżą znajduje radość, umie być starszym kolegą i przewodnikiem. Bierze aktywny udział w życiu drużyny, świadomie stosując metodę harcerską i wykorzystując przykład osobisty do realizacji celów wychowawczych. Ma poczucie odpowiedzialności za pracę i powierzoną grupę. Współtworzy hufcową wspólnotę. Ma świadomość wychowawczej roli służby w harcerstwie.");
const selectedText = ref(idea.value);

const onTextHighlighted = (data) => {
  if (data.reset)
    selectedText.value = idea.value;
  else
    selectedText.value = data.text;

};
</script>

<style scoped>
.rank-item-components {
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding: 20px;
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
  flex: 1;
}

</style>