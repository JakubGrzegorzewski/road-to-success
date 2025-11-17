<script setup lang="ts">
import {RankInProgress, RankInProgressDTO} from "@/scripts/Model/RankInProgress.js";
import {useRouter} from "vue-router";
import {Rank, RankDTO} from "@/scripts/Model/Rank.js";
import {onMounted, ref, Ref} from "vue";
import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser.js";
import {isDarkMode, rankImage} from "@/scripts/helperFunctions.js";
import PlusIconComponent from "@/components/Universal/PlusIconComponent.vue";
import {Status} from "@/scripts/Model/Status.js";
import {Style} from "@/scripts/Model/Style.js";

const props = defineProps<{
  rankInProgress?: RankInProgressDTO
}>();

const rank : Ref<RankDTO> = ref(null as unknown as RankDTO);
const mentor : Ref<AppUserDTO> = ref(null as unknown as AppUserDTO);
const user : Ref<AppUserDTO> = ref(null as unknown as AppUserDTO);

const router = useRouter();

onMounted(() => {
  if (!props.rankInProgress) return;
  Rank.getById(props.rankInProgress.rankId).then(e=>rank.value = e);
  AppUser.getById(props.rankInProgress.mentorId).then(e=>mentor.value = e);
  AppUser.getById(props.rankInProgress.userId).then(e=>user.value = e);
});

function addNewRank() {
  const newRank : RankInProgressDTO = {
    id: Math.floor(Math.random()*1000000000000000),
    rankId: 1,
    userId : 1,
    mentorId : 1,
    status: Status.CREATED,
    style: Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
    taskIds: []
  }
  RankInProgress.add(newRank).then(
      rankInProgress => router.push('/advancement/' + rankInProgress.id)
  );

}
</script>

<template>
  <div v-if="rankInProgress && rank && mentor && user"
      class="box-shadow advancement-card-out"
      @click="router.push('/advancement/' + rankInProgress.id)">
    <div class="advancement-card-in"
      :style="'background-image: url('+rankImage(rank)+')'"
    >
      <h3> {{ $t('user.mentee') }} </h3>
      <h4> {{ user.fullName }} </h4>
      <h3> {{ $t('user.mentor') }} </h3>
      <h4> {{ mentor.fullName }} </h4>
    </div>
  </div>
  <div v-else
       class="advancement-card-out box-shadow" style="justify-content: center; align-items: center;"
       @click="addNewRank()"
  >
    <div class="advancement-card-in">
      <PlusIconComponent :fill-color="isDarkMode() ? 'var(--background-color)' : 'var(--primary-color)'" style="width: 150px; height: 150px; margin-bottom: 10px;"/>
      <h3 style="transform: none">{{$t('advancement.add')}}</h3>
    </div>

  </div>

</template>

<style scoped>
.advancement-card-out {
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
  padding: 20px;
  width: 200px;
  height: 250px;
  font-family: 'Museo', sans-serif;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  background-repeat: no-repeat;
  background-size: 200px;
  background-position: right bottom;
  background-position-x: 100px;
  background-position-y: 100px;
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

img{
  width: 200px;
  display: block;
  position:relative;
  bottom: 0;
  left: 0;
  transform: translate(50px, -50px) rotate(30deg);
  overflow: clip;
  opacity: 0.4;
  z-index: 1;
}
</style>