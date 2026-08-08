<script setup lang="ts">
import {onMounted, ref} from "vue";
import type {IRankInProgress} from '@/scripts/interfaces.ts';
import AdvancementCardComponent from "@/components/Advancement/AdvancementCardComponent.vue";
import {useI18n} from "vue-i18n";
import {CardType, eventBus, ITypesEnum} from "@/main.ts";
import {RankInProgress} from "@/scripts/database/RankInProgress.ts";
import router from "@/scripts/router.ts";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import {User} from "@/scripts/database/User.ts";

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

  await User.getAll().then(
    users => {
      if (users.length === 0) {
        router.push("/dodaj-osobe/");
      }
    }
  );

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
        @click="async ()=>{const rank = await RankInProgress.addDefault(); await router.push('/stopien/' + rank.id)}"
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
    margin-top: var(--space-lg);
    padding: 0 var(--space-sm);
  }
  .advancement-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin: var(--space-lg);
  }

  @media (max-width: 600px) {
    h1 {
      margin-top: var(--space-md);
      font-size: 1.4rem;
    }
    .advancement-container {
      margin: var(--space-md) var(--space-sm);
      gap: var(--space-sm);
    }
  }
</style>