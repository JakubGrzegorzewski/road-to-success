<script setup>
import { ref } from 'vue'
import ButtonComponent from "@/components/Universal/ButtonComponent.vue";
import {fetchPOST} from "@/main.js";
import ObjectTemplates from "@/scripts/objectTemplates.js";
import router from "@/scripts/router.js";

const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref('')

const handleSubmit = () => {
  let user = ObjectTemplates.AppUserDto
  user.fullName = fullName.value
  user.email = email.value
  user.password = password.value
  user.role = role.value

  fetchPOST("/api/user", user).then(
    router.push("/")
  )
}
</script>

<template>
  <div class="register-background">
    <div class="register-container">
      <h2>{{ $t('register.registerUser') }}</h2>
        <div class="form-group">
          <label for="fullName">{{ $t('register.username') }}</label>
          <input
              id="fullName"
              v-model="fullName"
              type="text"
              required
              placeholder="userName123"
          />
        </div>
        <div class="form-group">
          <label for="email">{{ $t('register.email') }}</label>
          <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="name@email.com"
          />
        </div>
        <div class="form-group">
          <label for="password">{{ $t('register.password') }}</label>
          <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="******"
          />
        </div>
        <button-component :button-text="$t('register.register')" button-style="default" @click="handleSubmit"/>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  padding: 20px;
  gap: 10px;

  font-family: 'Museo', sans-serif;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  width: 300px;
  height: 400px;
}

.register-background {
  width: 100%;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-form h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--primary-color-dark);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--primary-color-dark);
}

.form-group input,
.form-group select {
  width: auto;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color-dark);
}
</style>