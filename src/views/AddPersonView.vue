<script setup lang="ts">
import { ref } from 'vue'
import { AppUser, AppUserDTO } from '../scripts/Model/AppUser'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";

const emits = defineEmits<{
  (e: 'showPopup', title:string, content: string): void;
}>();

const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref('USER')
const ranks = ref('') // np. "1,2,3"
const mentorRanks = ref('')
const comments = ref('')
const success = ref('')

const toNumArray = (s: string): number[] =>
    s
        .split(',')
        .map(x => Number(x.trim()))
        .filter(n => !Number.isNaN(n))

async function onSubmit() {
  const user: AppUserDTO = {
    id: Math.floor(Math.random()*1000000000000000),
    fullName: fullName.value,
    email: email.value,
    password: password.value,
    role: role.value,
    ranksInProgressIds: toNumArray(ranks.value),
    mentorRanksInProgressIds: toNumArray(mentorRanks.value),
    commentIds: toNumArray(comments.value),
  }

  await AppUser.add(user)

  fullName.value = ''
  email.value = ''
  password.value = ''
  role.value = 'USER'
  ranks.value = ''
  mentorRanks.value = ''
  comments.value = ''
  success.value = 'Użytkownik dodany'
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="form">
    <div>
      <label>{{ $t('user.nameRankCombo') }}</label>
      <input v-model="fullName" required />
    </div>

    <div>
      <label>{{ $t('user.email') }}</label>
      <input v-model="email" type="email" />
    </div>

    <button type="submit">
      <button-component :button-text="$t('user.addUser')"/>
    </button>
    <p v-if="success">{{ success }}</p>
  </form>
</template>

/* css */
<style scoped>
.form {
  max-width: 640px;
  margin: 24px auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 20px;
  border-radius: 10px;
  background: var(--primary-color-light, rgba(30,47,92,0.04));
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  font-family: 'Museo', sans-serif;
  color: var(--background-color);
}

label {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 6px;
  font-weight: 500;
}

input, select, textarea {
  padding: 8px 12px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  background: var(--background-color);
  color: var(--primary-color);
  width: 100%;
  box-sizing: border-box;
}

button{
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

}

input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--primary-color-light);
  outline-offset: 2px;
}

.success {
  color: var(--accent-success);
  font-weight: 600;
  margin-top: 8px;
}

/* drobne dopasowania responsywne */
@media (max-width: 600px) {
  .form {
    padding: 14px;
    margin: 12px;
  }
}
</style>

