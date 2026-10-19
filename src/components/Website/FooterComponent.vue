<script setup lang="ts">
const version = __APP_VERSION__
const year = new Date().getFullYear()
</script>

<template>
  <footer>
    <div class="footer-thing">
      <span class="version">v{{ version }}</span>
      <p>&copy; 2025–{{ year }} Jakub Grzegorzewski</p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: var(--primary-color);
  box-shadow: 0 10px 10px var(--shadow-light);
  padding: var(--space-sm) var(--space-md);
  padding-bottom: calc(var(--space-sm) + var(--safe-bottom));
}

.footer-thing {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-family: 'Museo', sans-serif;
  color: white;
  font-size: 14px;
  text-align: right;
}

.footer-thing p {
  margin: 0;
}

.version {
  opacity: 0.6;
  font-size: 12px;
}
</style>
