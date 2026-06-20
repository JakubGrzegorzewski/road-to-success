<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CardType } from '@/main.ts';
import { isDarkMode } from "@/scripts/helperFunctions.ts";
import PlusIconComponent from "@/components/Universal/Icons/PlusIconComponent.vue";
import ImportIconComponent from "@/components/Universal/Icons/ImportIconComponent.vue";
import {IRank, IRankInProgress, IUser} from "@/scripts/interfaces.ts";
import {onMounted, ref} from "vue";
import {User} from "@/scripts/database/User.js";
import {Rank} from "@/scripts/Model/Rank.ts";

const { t } = useI18n();

const props = withDefaults(defineProps<{
  type: CardType;
  rankInProgress?: IRankInProgress;
}>(), {
  type: CardType.DEFAULT
});

const mentee = ref<IUser>();
const mentor = ref<IUser>();
const rank = ref<IRank>()

const emits = defineEmits<{
  (e: 'click'): void;
  (e: 'delete-rank'): void;
}>();

onMounted(async () => {
  if (props.rankInProgress) {
    User.getById(props.rankInProgress.userId).then(user => mentee.value = user);
    User.getById(props.rankInProgress.mentorId).then(user => mentor.value = user);
    Rank.getById(props.rankInProgress.rankId).then(r => rank.value = r);
  }
});
</script>

<template>
  <div
      class="box-shadow advancement-card-out"
      :class="{ 'centered-card': type !== CardType.DEFAULT }"
      @click="type !== CardType.DEFAULT && emits('click')">

    <div v-if="type === CardType.DEFAULT">
      <div class="advancement-card-delete" @click.stop="emits('delete-rank')">
        <img src="@/assets/images/delete.svg" alt="delete"/>
      </div>

      <div class="advancement-card-in shifts-up"
           @click="emits('click')"
           :style="{ '--bg-image': `url(data:image/png;base64,${rank?.iconInBase64})` }">
        <h3>{{ t('user.mentee') }}</h3>
        <h4>{{ mentee?.fullName }}</h4>
        <h3>{{ t('user.mentor') }}</h3>
        <h4>{{ mentor?.fullName }}</h4>
      </div>
    </div>

    <div v-else-if="type === CardType.ADD" class="advancement-card-in static-layout">
      <PlusIconComponent
          class="card-icon"
          :fill-color="isDarkMode() ? 'var(--background-color)' : 'var(--primary-color)'"
      />
      <h3>{{ t('advancement.add') }}</h3>
    </div>

    <div v-else class="advancement-card-in static-layout">
      <ImportIconComponent
          class="card-icon"
          :fill-color="isDarkMode() ? 'var(--background-color)' : 'var(--primary-color)'"
      />
      <h3>{{ t('advancement.import') }}</h3>
    </div>

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
  cursor: pointer;
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
  --bg-image: none;
  transform: translateY(40px);
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
}

h2, h3, h4{
  transform: translateY(-50px);
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

h2{
  font-size: 20px;
  font-weight: 700;
}

h3{
  font-size: 16px;
  font-weight: 500;
}

h4{
  font-size: 16px;
  font-weight: 300;
}

.advancement-card-delete{
  z-index: 3;
  background: var(--accent-error);
  border-radius: 10px;
  width: 40px;
  height: 40px;
  padding: 5px;
  right: 0;
  top: 0;
  justify-self: flex-end;
  margin : 5px;
  position: absolute;
  transform: translate(20px, -20px);
}
.card-icon{
  transform: translateY(-50px);
}
</style>