<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CardType } from '@/scripts/enums';
import { isDarkMode } from "@/scripts/helperFunctions.ts";
import PlusIconComponent from "@/components/Universal/Icons/PlusIconComponent.vue";
import ImportIconComponent from "@/components/Universal/Icons/ImportIconComponent.vue";
import type { IRank } from "@/scripts/interfaces.ts";
import { rankIconUrl } from "@/scripts/rankAssets";

const { t } = useI18n();

const props = withDefaults(defineProps<{
  type?: CardType;
  rank?: IRank;
  menteeName?: string;
  mentorName?: string;
  /** Open comments of the advancement (badge). */
  openComments?: number;
  /** Someone else wrote since this device last left the advancement. */
  newComments?: boolean;
}>(), {
  type: CardType.DEFAULT,
  openComments: 0,
  newComments: false,
});

defineEmits<{
  (e: 'click'): void;
  (e: 'delete-rank'): void;
}>();
</script>

<template>
  <div
      class="box-shadow advancement-card-out"
      :class="{ 'centered-card': props.type !== CardType.DEFAULT }"
  >
    <template v-if="props.type === CardType.DEFAULT">
      <button type="button" class="advancement-card-delete" :aria-label="t('advancement.delete')" @click.stop="$emit('delete-rank')">
        <img src="@/assets/images/delete.svg" alt=""/>
      </button>

      <button
          type="button"
          class="advancement-card-in shifts-up"
          :style="{ '--bg-image': rankIconUrl(rank) ? `url(${rankIconUrl(rank)})` : 'none' }"
          @click="$emit('click')"
      >
        <span class="card-rank">{{ rank?.fullName }}</span>
        <h3>{{ t('user.mentee') }}</h3>
        <h4>{{ menteeName || '—' }}</h4>
        <h3>{{ t('user.mentor') }}</h3>
        <h4>{{ mentorName || '—' }}</h4>
        <span v-if="openComments > 0" class="comments-badge" :class="{ 'has-new': newComments }">
          <span v-if="newComments" class="new-dot" aria-hidden="true" />
          {{ t('advancement.comment.openCount', { n: openComments }, openComments) }}
        </span>
      </button>
    </template>

    <button v-else-if="props.type === CardType.ADD" type="button" class="advancement-card-in static-layout" @click="$emit('click')">
      <PlusIconComponent
          class="card-icon"
          :fill-color="isDarkMode() ? 'var(--background-color)' : 'var(--primary-color)'"
      />
      <h3>{{ t('advancement.add') }}</h3>
    </button>

    <button v-else type="button" class="advancement-card-in static-layout" @click="$emit('click')">
      <ImportIconComponent
          class="card-icon"
          :fill-color="isDarkMode() ? 'var(--background-color)' : 'var(--primary-color)'"
      />
      <h3>{{ t('advancement.import') }}</h3>
    </button>
  </div>
</template>

<style scoped>
.advancement-card-out {
  position: relative;
  margin: 10px;
  border-radius: 8px;
  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-color-light);
  }
  @media (prefers-color-scheme: light) {
    background-color: var(--background-color);
  }
  background-image: url("@/assets/images/background.svg");
  background-repeat: no-repeat;
  background-size: 600px;
  background-position: left bottom;
  background-position-x: -150px;
  overflow: visible;
}

.advancement-card-in {
  position: relative;
  padding: 20px;
  width: 200px;
  height: 250px;
  font-family: 'Museo', sans-serif;
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: none;
  border: none;
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  --bg-image: none;
  padding-top: 60px;
  -webkit-tap-highlight-color: transparent;
}
.advancement-card-in:before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-repeat: no-repeat;
  background-size: 150px auto;
  opacity: 0.5;
  z-index: 0;
  top: 70px;
  left: 60px;
  clip: rect(0, 140px, 140px, 0);
  pointer-events: none;
}

.static-layout {
  justify-content: center;
  padding-top: 20px;
}

.card-rank {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  opacity: 0.8;
  z-index: 2;
}

h2, h3, h4{
  @media (prefers-color-scheme: dark) {
    color: var(--background-color);
  }
  @media (prefers-color-scheme: light) {
    color: var(--primary-color);
  }
  margin: 0;
  padding: 3px;
  text-align: center;
  z-index: 2;
}

h3{
  font-size: 16px;
  font-weight: 500;
}

h4{
  font-size: 16px;
  font-weight: 300;
  overflow-wrap: anywhere;
}

.advancement-card-delete{
  z-index: 3;
  background: var(--accent-error);
  border: none;
  border-radius: 10px;
  width: 40px;
  height: 40px;
  padding: 5px;
  right: 0;
  top: 0;
  margin : 5px;
  position: absolute;
  transform: translate(20px, -20px);
  cursor: pointer;
}

.advancement-card-delete img {
  width: 100%;
  height: 100%;
}

.comments-badge {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-warning);
  color: #1f1300;
  font-size: 12px;
  font-weight: 700;
}

.comments-badge .new-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-error);
  box-shadow: 0 0 0 2px white;
}

.card-icon{
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
  pointer-events: none;
}

/* Phones: full-width rows instead of tiles */
@media (max-width: 599px) {
  .advancement-card-out {
    margin: 0;
    width: 100%;
    background-size: 360px;
    background-position-x: -80px;
  }

  .advancement-card-in {
    width: 100%;
    height: auto;
    min-height: 96px;
    padding: 14px 64px 14px 112px;
    align-items: flex-start;
    text-align: left;
  }

  .advancement-card-in:before {
    width: 80px;
    height: 80px;
    top: 8px;
    left: 12px;
    background-size: 80px auto;
    background-position: center;
    clip: auto;
    opacity: 0.85;
  }

  .card-rank {
    position: static;
    text-align: left;
    font-size: 15px;
    margin-bottom: 2px;
    opacity: 1;
  }

  h3, h4 {
    text-align: left;
    padding: 0;
  }

  h3 {
    font-size: 12px;
    opacity: 0.7;
  }

  h4 {
    font-size: 15px;
  }

  .comments-badge {
    margin-top: 6px;
  }

  .static-layout {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    min-height: 64px;
    padding: 12px 16px;
  }

  .static-layout .card-icon {
    width: 32px;
    height: 32px;
    margin: 0;
  }

  .advancement-card-delete {
    top: 50%;
    right: 8px;
    margin: 0;
    width: 44px;
    height: 44px;
    transform: translateY(-50%);
  }
}
</style>
