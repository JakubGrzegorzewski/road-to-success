<script setup lang="ts">
import {onMounted, ref} from "vue";
import type {IRankInProgress} from '@/scripts/interfaces.ts';
import AdvancementCardComponent from "@/components/Advancement/AdvancementCardComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import {useI18n} from "vue-i18n";
import {CardType, eventBus, ITypesEnum} from "@/main.ts";
import {RankInProgress} from "@/scripts/database/RankInProgress.ts";
import router from "@/scripts/router.ts";

const { t } = useI18n();

const ranks = ref<IRankInProgress[]>([]);
const rankToDelete = ref<number | undefined>(undefined);

onMounted(async () => {
  ranks.value = await RankInProgress.getAll();
  eventBus.on("db-update", async (data: { type: ITypesEnum}) => {
    if (data.type === ITypesEnum.ERankInProgress) {
      ranks.value = await RankInProgress.getAll();
    }
  });

});


</script>

<template>
  <h1>{{ t('advancement.your') }}</h1>
  <div class="advancement-container">
    <AdvancementCardComponent
        v-for="rankInProgress in ranks"
        :type="CardType.DEFAULT"
        :key="rankInProgress.id"
        :rankInProgress="rankInProgress"
        @click="router.push('/stopien/' + rankInProgress.id)"
        @delete-rank="rankToDelete = rankInProgress.id"
    />
    <AdvancementCardComponent
        :type="CardType.ADD"
        @click="RankInProgress.addDefault();"
    />
    <AdvancementCardComponent
        :type="CardType.IMPORT"
    />
    <PopupComponent
        v-if="rankToDelete"
        :title="t('popups.delete.title')"
        :message="t('popups.delete.message')"
        :option-one="{ text: t('edit.delete'), action: () => { if (rankToDelete !== undefined) RankInProgress.deleteObject(rankToDelete); rankToDelete = undefined } }"
        :option-two="{ text: t('edit.cancel'), action: () => { rankToDelete = undefined } }"
    />
  </div>
  </template>

<style scoped>
  h1 {
    text-align: center;
    font-family: 'Museo', sans-serif;
  }
  .advancement-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    margin: 40px;
  }
</style>