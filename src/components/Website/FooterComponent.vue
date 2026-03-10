<script setup lang="ts">

</script>

<template>
  <footer>
    <div class="cf-turnstile" data-sitekey="0x4AAAAAACo1OLKZyUIP-Uhz"></div>
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
  padding: 0 20px;
  gap: 50px
}


.footer-thing {
  font-family: 'Museo', sans-serif;
  color: white;
  gap: 20px;
}
</style>