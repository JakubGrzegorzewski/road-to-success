<template>
  <div class="rank-item-component">
    <div class="rank-item-component-content">
      <h2>Nazwa</h2>
      <h3>Treść</h3>
      <textarea v-model="content"></textarea>
      <selection-component
          v-if="selectedText"
          :text="selectedText"
          @text-highlighted="onTextHighlighted"
      />
    </div>
    <div class="rank-item-component-comments">

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SelectionComponent from "@/components/SelectionComponent.vue";

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
.rank-item-component {
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
.rank-item-component-content {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 20px;
}
.rank-item-component-comments {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>