<script setup>

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
  background-color: var(--primary-color-dark);
  box-shadow: 0 10px 10px var(--shadow-light);
  padding: 0 20px;
}


.footer-thing {
  font-family: 'Museo', sans-serif;
  color: white;
  gap: 20px;
}
</style>