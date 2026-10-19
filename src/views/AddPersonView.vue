<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import PopupComponent from "@/components/Universal/PopupComponent.vue";
import { User } from "@/scripts/database/User.ts";

const { t } = useI18n();
const router = useRouter();

const fullName = ref('')
const popupMessage = ref('')
const isFirst = ref(false);

async function onSubmit() {
  if (!fullName.value.trim()) return
  await User.add({ fullName: fullName.value })
  fullName.value = ''
  popupMessage.value = t('user.added')
}

function close() {
  popupMessage.value = ''
  if (window.history.state?.back) router.back()
  else void router.push('/')
}

onMounted(async () => {
  isFirst.value = (await User.getAll()).length === 0
})
</script>

<template>
    <form @submit.prevent="onSubmit" class="form">
      <div>
        <h2 v-if="isFirst">{{ t('user.addFirstUser') }}</h2>
        <h2 v-else>{{ t('user.addUser') }}</h2>
        <p v-if="isFirst" class="hint">{{ t('user.firstUserHint') }}</p>
        <label for="person-name">{{ t('user.nameRankCombo') }}</label>
        <input id="person-name" v-model="fullName" required autocomplete="name" enterkeyhint="done" />
      </div>
      <ButtonComponent type="submit" class="submit" :button-text="t('edit.add')" block />
      <PopupComponent
          v-if="popupMessage"
          :title="popupMessage"
          message=""
          :option-two="{ text: t('edit.ok'), action: close }"
      />
    </form>
</template>

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

h2 {
  margin: 0 0 8px;
}

.hint {
  margin: 0 0 12px;
  opacity: 0.85;
  font-size: 14px;
}

label {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 6px;
  font-weight: 500;
}

input {
  padding: 8px 12px;
  min-height: 44px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  background: var(--background-color);
  color: var(--primary-color);
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.submit {
  justify-self: center;
}

@media (max-width: 600px) {
  .form {
    padding: var(--space-md) var(--space-sm);
    margin: var(--space-sm);
  }
}
</style>
