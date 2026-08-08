<script setup lang="ts">

</script>

<template>
  <footer>
    <div class="footer-thing">
      <p>&copy; 2025 Jakub Grzegorzewski</p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: var(--primary-color);
  box-shadow: 0 10px 10px var(--shadow-light);
  padding: var(--space-sm) var(--space-md);
}

.footer-thing {
  font-family: 'Museo', sans-serif;
  color: white;
  font-size: 14px;
  text-align: right;
}

@media (max-width: 600px) {
  footer {
    padding: var(--space-xs) var(--space-sm);
  }

  .footer-thing {
    font-size: 12px;
  }
}
</style>