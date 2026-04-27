<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import Cookies from 'js-cookie'
import DropDownSelectionComponent from "@/components/Universal/DropDownSelectionComponent.vue";
import { msalInstance, loginRequest } from '@/scripts/authConfig';
import {pagesLinks} from "@/scripts/pagesLinks";

const { locale } = useI18n()
const currentLocale = ref<string>('en')

const changeLocale = () => {
  const newLocale: string = currentLocale.value
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  Cookies.set('locale', newLocale, { expires: 365 })
}

onMounted(() => {
  // 1. Logic for Locale
  const savedLocale = localStorage.getItem('locale') || 'en'
  locale.value = savedLocale
  currentLocale.value = savedLocale
  Cookies.set('locale',  savedLocale, { expires: 365 })

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    user.value = accounts[0];
    msalInstance.setActiveAccount(accounts[0]);
  }
})

const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' }
]


const user = ref(null);

const login = async () => {
  try {
    // Ensure we are using the initialized instance
    const response = await msalInstance.loginPopup(loginRequest);
    msalInstance.setActiveAccount(response.account);
    user.value = response.account;
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed_out")) {
      console.warn("Login timed out. Retrying or switching to redirect...");
      // Optional: fallback to redirect if popup fails
      // await msalInstance.loginRedirect(loginRequest);
    } else {
      console.error("Login failed:", error);
    }
  }
};

const logout = () => {
  msalInstance.logoutPopup();
  user.value = null;
};

</script>



<template>
  <nav>
    <router-link class="" :to="pagesLinks.roadToSuccess"><img class="nav-logo" src="../../../public/favicon.svg" alt="logo"></router-link>

    <button v-if="!user" @click="login" id="azureLogin" class="azure-login-button">
      <img src="../../assets/images/msc_logo.svg" width="20" style="margin-right: 10px;"  alt="Login with microsoft account"/>
      Sign in with Microsoft
    </button>
    <button v-else @click="logout" id="azureLogout" class="azure-login-button">
      <img src="../../assets/images/msc_logo.svg" width="20" style="margin-right: 10px;" alt="Logout from microsoft account"/>
      Logout
    </button>

    <div v-if="user">
      {{user }}
    </div>

    <div class="selector-style">
      <DropDownSelectionComponent v-model="currentLocale" :options="langOptions" @update:modelValue="changeLocale"/>
    </div>
  </nav>
</template>

<style scoped>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--primary-color);
    box-shadow: 0 10px 10px var(--shadow-light);
    padding: 0 20px;
  }

  .nav-logo {
    width: 64px;
  }

  .selector-style {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .azure-login-button {
    display: flex;
    align-items: center;
    background-color: var(--primary-color-light);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Museo', sans-serif;
  }
</style>