<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { helpEntries } from '@/scripts/help'
import { HELP_CATEGORIES, searchHelp, type HelpSearchResult } from '@/scripts/helpSearch'

/** "Pomoc": search on top, below it the categories with their guides. */
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const entries = computed(() => helpEntries(locale.value))
const results = computed<HelpSearchResult[]>(() => searchHelp(entries.value.map((e) => e.entry), query.value))
const searching = computed(() => query.value.trim().length > 0)

const categories = computed(() =>
    HELP_CATEGORIES.map((category) => ({
      category,
      items: entries.value.filter((e) => e.entry.meta.category === category),
    })).filter((c) => c.items.length > 0),
)

// keep the query in the address, so "back" from an article returns to the same results
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (route.name === 'Help') void router.replace({ name: 'Help', query: q.trim() ? { q } : {} })
  }, 300)
})
onBeforeUnmount(() => clearTimeout(timer))

function resultLink(r: HelpSearchResult) {
  return { path: `/pomoc/${r.entry.meta.slug}`, hash: r.heading ? `#${r.heading.id}` : '' }
}
</script>

<template>
  <div class="page">
    <h1>{{ t('help.title') }}</h1>
    <p class="lead">{{ t('help.intro') }}</p>

    <form class="search" role="search" @submit.prevent>
      <label for="help-search" class="visually-hidden">{{ t('help.searchLabel') }}</label>
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input
          id="help-search"
          v-model="query"
          type="search"
          class="search-input"
          :placeholder="t('help.searchPlaceholder')"
          autocomplete="off"
          enterkeyhint="search"
      />
      <button v-if="searching" type="button" class="clear" :aria-label="t('help.clear')" @click="query = ''">✕</button>
    </form>

    <section v-if="searching" class="results" aria-live="polite">
      <p class="muted">{{ results.length ? t('help.results', { n: results.length }) : t('help.noResults', { q: query.trim() }) }}</p>
      <ul class="result-list">
        <li v-for="r in results" :key="r.entry.meta.slug">
          <router-link :to="resultLink(r)" class="result">
            <span class="result-title"><template v-for="(part, i) in r.title" :key="i"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
            <span v-if="r.heading" class="result-section">{{ t('help.inSection', { section: r.heading.text }) }}</span>
            <span class="result-summary"><template v-for="(part, i) in r.summary" :key="i"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
            <span v-if="r.snippet.length" class="result-snippet"><template v-for="(part, i) in r.snippet" :key="i"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
          </router-link>
        </li>
      </ul>
    </section>

    <div class="categories" :class="{ dimmed: searching }">
      <section v-for="group in categories" :key="group.category" class="category">
        <h2>{{ t(`help.categories.${group.category}`) }}</h2>
        <ul>
          <li v-for="{ entry } in group.items" :key="entry.meta.slug">
            <router-link :to="`/pomoc/${entry.meta.slug}`" class="article-link">
              <span class="article-title">{{ entry.meta.title }}</span>
              <span class="article-summary">{{ entry.meta.summary }}</span>
            </router-link>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-md);
  font-family: 'Museo', sans-serif;
}

h1 {
  margin: var(--space-md) 0 var(--space-xs);
}

.lead {
  margin: 0 0 var(--space-md);
  line-height: 1.5;
}

.muted {
  color: var(--text-muted);
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-md);
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 20px;
  height: 20px;
  opacity: 0.6;
  pointer-events: none;
}

.search-input {
  width: 100%;
  min-height: 48px;
  padding: 10px 48px 10px 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-raised);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
  box-shadow: 0 4px 14px var(--shadow-light);
}

.search-input:focus {
  outline: 2px solid var(--secondary-color);
  outline-offset: 1px;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  position: absolute;
  right: 2px;
  width: var(--touch-target);
  height: var(--touch-target);
  border: none;
  background: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
}

.results {
  margin-bottom: var(--space-lg);
}

.result-list,
.category ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result,
.article-link {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  min-height: var(--touch-target);
  border-radius: 10px;
  background: var(--surface-raised);
  color: var(--text);
  text-decoration: none;
  box-shadow: 0 2px 8px var(--shadow-light);
  border: 1px solid transparent;
}

@media (hover: hover) {
  .result:hover,
  .article-link:hover {
    border-color: var(--secondary-color);
  }
}

.result-title,
.article-title {
  font-weight: 700;
  font-size: 16px;
}

.result-section {
  font-size: 13px;
  color: var(--secondary-color);
}

.result-summary,
.article-summary {
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-muted);
}

.result-snippet {
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.85;
}

mark {
  background: rgba(245, 158, 11, 0.35);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.categories.dimmed {
  opacity: 0.55;
}

.category h2 {
  font-size: 1.05rem;
  margin: 0 0 var(--space-xs);
}

@media (max-width: 599px) {
  .page {
    padding: var(--space-sm);
  }
  h1 {
    margin-top: var(--space-sm);
  }
  .categories {
    grid-template-columns: 1fr;
  }
}
</style>
