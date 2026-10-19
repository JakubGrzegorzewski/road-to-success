<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Round "?" that opens a help article at a section: `to="synchronizacja#zmien-pokoj"`.
 * Every `to` used in a component is checked against the articles by tests/unit/help.test.ts.
 */
const props = defineProps<{
  to: string
  /** Accessible name; default "Pomoc". */
  label?: string
  /** Open in a new tab: for dialogs whose state would be lost by leaving the page. */
  newTab?: boolean
}>()

const { t } = useI18n()
const href = computed(() => {
  const [slug, section] = props.to.split('#')
  return { path: `/pomoc/${slug}`, hash: section ? `#${section}` : '' }
})
</script>

<template>
  <router-link
      :to="href"
      class="help-link"
      :aria-label="label ?? t('help.contextLink')"
      :title="label ?? t('help.contextLink')"
      :target="newTab ? '_blank' : undefined"
      @click.stop
  >
    <span aria-hidden="true">?</span>
  </router-link>
</template>

<style scoped>
.help-link {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  margin: -10px;
  border-radius: 50%;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.help-link span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  font-family: 'Museo', sans-serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  opacity: 0.75;
  transition: opacity 0.15s, background-color 0.15s;
}

@media (hover: hover) {
  .help-link:hover span {
    opacity: 1;
    background: rgba(50, 158, 213, 0.15);
  }
}

.help-link:focus-visible {
  outline: none;
}

.help-link:focus-visible span {
  opacity: 1;
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}
</style>
