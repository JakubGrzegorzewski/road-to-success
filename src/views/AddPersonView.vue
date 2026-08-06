<script setup lang="ts">
import {onMounted, ref} from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {useI18n} from "vue-i18n";
import {IUser} from "@/scripts/interfaces.ts";
import {User} from "@/scripts/database/User.ts";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import router from "@/scripts/router.ts";

const { t } = useI18n();

const fullName = ref('')
const popupMessage = ref('')
const isFirst = ref(false);

async function onSubmit() {
  const user: Omit<IUser, 'id'> = {
    fullName: fullName.value,
    ranksInProgressIds: [],
    mentorRanksInProgressIds: [],
    commentIds: [],
  }
  await User.add(user)

  fullName.value = ''
  popupMessage.value = 'Użytkownik dodany'
}

onMounted(async () => {
  User.getAll().then(users => {
    if (users.length === 0)
      isFirst.value = true;
  })
})
</script>

<template>
    <form @submit.prevent="onSubmit" class="form">
      <div>
        <h2 v-if="isFirst">{{ t('user.addFirstUser') }}</h2>
        <h2 v-else>{{ t('user.addUser') }}</h2>
        <label>{{ t('user.nameRankCombo') }}</label>
        <input v-model="fullName" required />
      </div>
      <button type="submit" style="display: flex; justify-content: center;">
        <ButtonComponent :button-text="t('edit.add')"/>
      </button>
      <PopupComponent
          v-if="popupMessage"
          :title="popupMessage"
          message=""
          :option-two="{ text: t('edit.ok'), action: () => { popupMessage = ''; router.go(-1) } }"
      />
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

