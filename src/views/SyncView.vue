<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ButtonComponent from '@/components/Universal/ButtonComponent.vue'
import PopupComponent from '@/components/Universal/PopupComponent.vue'
import QrCodeComponent from '@/components/Universal/QrCodeComponent.vue'
import { buildJoinLink, parseJoinInput } from '@/scripts/sync/room'
import { createRoom, defaultDeviceName, isSyncSupported, leaveRoom, rotateRoom, setDeviceName, syncStatus } from '@/scripts/sync/syncService'
import { useJoinRoom } from '@/scripts/sync/useJoinRoom'
import { useNow, useRelativeTime } from '@/scripts/composables'

const { t } = useI18n()
const now = useNow(15_000)
const relative = useRelativeTime()
const { pendingJoin, joining, message, requestJoin, join, inOtherRoom } = useJoinRoom()

const supported = isSyncSupported()
const joinInput = ref('')
const joinError = ref('')
const showQr = ref(false)
const copied = ref(false)
const confirm = ref<'leave' | 'rotate' | null>(null)
const busy = ref(false)
const deviceName = ref(syncStatus.deviceName)
watch(() => syncStatus.deviceName, (v) => (deviceName.value = v))

const link = computed(() => (syncStatus.room ? buildJoinLink(syncStatus.room) : ''))
const stateLabel = computed(() =>
    syncStatus.state === 'synced' ? t('sync.state.synced', { n: syncStatus.peers }, syncStatus.peers) : t(`sync.state.${syncStatus.state}`),
)
const lastSynced = computed(() => (syncStatus.lastSyncedAt ? t('sync.lastSynced', { time: relative(syncStatus.lastSyncedAt, now.value) }) : ''))
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const mergeMessage = computed(() =>
    t('sync.mergeMessage') + (pendingJoin.value && inOtherRoom(pendingJoin.value) ? ' ' + t('sync.otherRoom') : ''),
)

function cancelJoin() {
  pendingJoin.value = null
}

async function choose(mode: 'merge' | 'replace') {
  if (pendingJoin.value) await join(pendingJoin.value, mode)
}

async function onCreate() {
  busy.value = true
  try {
    await createRoom()
  } finally {
    busy.value = false
  }
}

async function onJoin() {
  joinError.value = ''
  const cfg = parseJoinInput(joinInput.value)
  if (!cfg) {
    joinError.value = t('sync.invalidLink')
    return
  }
  const result = await requestJoin(cfg)
  if (result === 'joined' || result === 'already') joinInput.value = ''
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    showQr.value = true
  }
}

async function shareLink() {
  try {
    await navigator.share({ title: t('sync.shareTitle'), url: link.value })
  } catch {
    /* cancelled */
  }
}

async function saveDeviceName() {
  if (deviceName.value.trim() !== syncStatus.deviceName) await setDeviceName(deviceName.value)
}

async function onConfirm() {
  const action = confirm.value
  confirm.value = null
  busy.value = true
  try {
    if (action === 'leave') await leaveRoom()
    if (action === 'rotate') {
      await rotateRoom()
      showQr.value = false
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>{{ t('sync.title') }}</h1>
    <p class="lead">{{ t('sync.intro') }}</p>

    <section class="card status-card" :class="`state-${syncStatus.state}`" aria-live="polite">
      <div class="status-line">
        <span class="dot" aria-hidden="true" />
        <strong>{{ stateLabel }}</strong>
        <span v-if="lastSynced" class="muted">· {{ lastSynced }}</span>
      </div>
      <template v-if="syncStatus.room">
        <h2 class="small-title">{{ t('sync.devices') }}</h2>
        <ul v-if="syncStatus.devices.length" class="devices">
          <li v-for="device in syncStatus.devices" :key="device.clientId">{{ device.name }}</li>
        </ul>
        <p v-else class="muted">{{ t('sync.noDevices') }}</p>
      </template>
      <p v-if="!supported" class="unsupported-note">{{ t('sync.state.unsupported') }}</p>
    </section>

    <section class="card">
      <label for="device-name" class="small-title">{{ t('sync.deviceName') }}</label>
      <input id="device-name" v-model="deviceName" class="text-field" :placeholder="defaultDeviceName()" maxlength="60" enterkeyhint="done" @change="saveDeviceName" @keyup.enter="saveDeviceName" />
      <p class="muted hint">{{ t('sync.deviceNameHint') }}</p>
    </section>

    <template v-if="!syncStatus.room">
      <section class="card">
        <h2 class="small-title">{{ t('sync.createRoom') }}</h2>
        <ButtonComponent :button-text="t('sync.createRoom')" button-style="primary" block :disabled="busy || !supported" @click="onCreate" />
      </section>

      <section class="card">
        <h2 class="small-title">{{ t('sync.joinRoom') }}</h2>
        <form class="join-form" @submit.prevent="onJoin">
          <input v-model="joinInput" class="text-field" :placeholder="t('sync.joinPlaceholder')" :aria-label="t('sync.joinPlaceholder')" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <ButtonComponent type="submit" :button-text="t('sync.join')" :disabled="joining || !joinInput.trim() || !supported" />
        </form>
        <p v-if="joinError" class="form-error" role="alert">{{ joinError }}</p>
      </section>
    </template>

    <template v-else>
      <section class="card">
        <h2 class="small-title">{{ t('sync.link') }}</h2>
        <input class="text-field link-field" :value="link" readonly :aria-label="t('sync.link')" @focus="($event.target as HTMLInputElement).select()" />
        <p class="muted hint">{{ t('sync.linkHint') }}</p>
        <div class="actions">
          <ButtonComponent :button-text="copied ? t('sync.copied') : t('sync.copy')" button-style="primary" @click="copyLink" />
          <ButtonComponent v-if="canShare" :button-text="t('sync.shareLink')" @click="shareLink" />
          <ButtonComponent :button-text="showQr ? t('sync.hideQr') : t('sync.showQr')" button-style="ghost" @click="showQr = !showQr" />
        </div>
        <div v-if="showQr" class="qr-wrap">
          <QrCodeComponent :value="link" :size="220" :alt="t('sync.link')" />
          <p class="muted hint">{{ t('sync.qrHint') }}</p>
        </div>
      </section>

      <section class="card">
        <h2 class="small-title">{{ t('sync.joinRoom') }}</h2>
        <form class="join-form" @submit.prevent="onJoin">
          <input v-model="joinInput" class="text-field" :placeholder="t('sync.joinPlaceholder')" :aria-label="t('sync.joinPlaceholder')" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <ButtonComponent type="submit" :button-text="t('sync.join')" :disabled="joining || !joinInput.trim()" />
        </form>
        <p v-if="joinError" class="form-error" role="alert">{{ joinError }}</p>
        <div class="actions danger-zone">
          <ButtonComponent :button-text="t('sync.rotate')" button-style="warning" :disabled="busy" @click="confirm = 'rotate'" />
          <ButtonComponent :button-text="t('sync.leave')" button-style="error" :disabled="busy" @click="confirm = 'leave'" />
        </div>
      </section>
    </template>

    <p class="muted small">{{ t('sync.privacy') }}</p>
    <p class="muted small">{{ t('sync.bothOnline') }}</p>

    <PopupComponent
        v-if="confirm"
        :title="confirm === 'leave' ? t('sync.leave') : t('sync.rotate')"
        :message="confirm === 'leave' ? t('sync.leaveConfirm') : t('sync.rotateConfirm')"
        :option-one="{ text: confirm === 'leave' ? t('sync.leave') : t('sync.rotate'), style: confirm === 'leave' ? 'error' : 'warning', action: onConfirm }"
        :option-two="{ text: t('edit.cancel'), action: () => { confirm = null } }"
    />
    <PopupComponent
        v-if="pendingJoin"
        :title="t('sync.mergeTitle')"
        :message="mergeMessage"
        :option-three="{ text: t('edit.cancel'), style: 'ghost', action: cancelJoin }"
        :option-one="{ text: t('sync.replace'), action: () => choose('replace'), disabled: joining }"
        :option-two="{ text: t('sync.merge'), action: () => choose('merge'), disabled: joining }"
        :dismiss="cancelJoin"
    />
    <PopupComponent
        v-if="message"
        :title="message"
        :option-two="{ text: t('edit.ok'), action: () => { message = null } }"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-md);
  font-family: 'Museo', sans-serif;
}

h1 {
  margin: var(--space-md) 0 var(--space-xs);
}

.lead {
  line-height: 1.5;
  margin: 0 0 var(--space-md);
}

.card {
  background: var(--surface-raised);
  color: var(--text);
  border-radius: 12px;
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: 0 4px 14px var(--shadow-light);
}

.small-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 var(--space-xs);
}

.status-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: var(--space-sm);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #9aa5ab;
}

.state-synced .dot { background: var(--accent-success); }
.state-alone .dot { background: var(--accent-info); }
.state-connecting .dot { background: var(--accent-warning); }
.state-offline .dot,
.state-unsupported .dot { background: var(--accent-error); }

.devices {
  margin: 0;
  padding-left: 20px;
}

.muted {
  color: var(--text-muted);
}

.hint {
  font-size: 13px;
  margin: 6px 0 0;
}

.small {
  font-size: 13px;
  line-height: 1.5;
}

.unsupported-note {
  color: var(--accent-error);
}

.form-error {
  color: var(--accent-error);
  margin: 8px 0 0;
}

.text-field {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
}

.link-field {
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.join-form {
  display: flex;
  gap: var(--space-xs);
  align-items: stretch;
}

.join-form .text-field {
  flex: 1;
  min-width: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.danger-zone {
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border);
}

.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: var(--space-md);
}

@media (max-width: 599px) {
  .page {
    padding: var(--space-sm);
  }
  .card {
    padding: var(--space-sm) var(--space-sm) var(--space-md);
  }
  .join-form {
    flex-direction: column;
  }
  .actions :deep(.button) {
    flex: 1 1 100%;
  }
}
</style>
