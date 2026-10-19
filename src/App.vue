<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import NavBarComponent from '@/components/Website/NavBarComponent.vue'
import FooterComponent from '@/components/Website/FooterComponent.vue'
import MobileNavComponent from '@/components/Website/MobileNavComponent.vue'
import BackupReminderComponent from '@/components/Website/BackupReminderComponent.vue'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import { appState } from '@/scripts/appState'
import { useLayout } from '@/scripts/composables'

const { t } = useI18n()
const { isMobile } = useLayout()

function reload() {
  location.reload()
}
</script>

<template>
  <v-app class="app-container">
    <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>
    <NavBarComponent class="app-bar" />
    <v-main id="main" class="main-content" :class="{ 'with-bottom-nav': isMobile }">
      <p v-if="appState.storeReady && appState.storageMode === 'memory'" class="app-banner banner-warning" role="status">
        {{ t('app.memoryOnly') }}
      </p>
      <BackupReminderComponent />
      <router-view />
    </v-main>
    <FooterComponent v-if="!isMobile" class="footer" />
    <MobileNavComponent v-if="isMobile" class="footer" />

    <div v-if="appState.replacedInOtherTab" class="blocking-overlay" role="alertdialog" aria-modal="true">
      <div class="blocking-card">
        <p>{{ t('app.replacedInOtherTab') }}</p>
        <button type="button" class="plain-button" @click="reload">
          <ButtonComponent :button-text="t('app.reload')" button-style="primary" />
        </button>
      </div>
    </div>
  </v-app>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  min-height: 100dvh;
}

.main-content {
  /* own stacking context, so decorative layers with z-index: -1 stay visible */
  position: relative;
  z-index: 0;
  flex: 1 0 auto;
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}

.main-content.with-bottom-nav {
  /* Vuetify reserves the navigation height; the home indicator needs extra room */
  padding-bottom: calc(var(--v-layout-bottom, var(--bottom-nav-height)) + var(--safe-bottom)) !important;
}

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 2000;
  background: var(--secondary-color);
  color: white;
  padding: 8px 12px;
}

.skip-link:focus {
  left: 8px;
}

.app-banner {
  margin: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: 8px;
  font-family: 'Museo', sans-serif;
  font-size: 14px;
}

.app-banner.banner-warning {
  background: var(--accent-warning);
  color: #1f1300;
}

.blocking-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.6);
}

.blocking-card {
  max-width: 420px;
  background: var(--surface-raised);
  color: var(--text);
  border-radius: 12px;
  padding: var(--space-md);
  font-family: 'Museo', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
}

.plain-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

@media print {
  .app-bar, .footer {
    display: none !important;
  }
}
</style>

<style>
@import url('assets/css/default.css');
@import url('assets/css/custom_components.css');
</style>
