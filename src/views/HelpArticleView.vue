<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findHelpEntry, helpFeedbackUrl, loadHelpArticle } from '@/scripts/help'
import type { HelpArticle } from '@/scripts/helpSearch'

/** One guide: title, table of contents (sticky on wide screens), content, "see also", feedback link. */
const props = defineProps<{ slug: string }>()

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const article = ref<HelpArticle | null>(null)
const fallback = ref(false)
const state = ref<'loading' | 'ready' | 'missing'>('loading')
const content = ref<HTMLElement | null>(null)

const related = computed(() =>
    (article.value?.meta.related ?? [])
        .map((slug) => findHelpEntry(slug, locale.value)?.entry)
        .filter((e): e is NonNullable<typeof e> => !!e),
)
const toc = computed(() => article.value?.headings.filter((h) => h.level === 2) ?? [])
const feedbackUrl = computed(() => (article.value ? helpFeedbackUrl(article.value.meta.title, route.path) : ''))

async function load() {
  state.value = 'loading'
  const loaded = await loadHelpArticle(props.slug, locale.value).catch(() => null)
  article.value = loaded?.article ?? null
  fallback.value = loaded?.fallback ?? false
  state.value = loaded ? 'ready' : 'missing'
  await nextTick()
  preselectPlatform()
  scrollToHash()
}

function scrollToHash() {
  const id = decodeURIComponent(route.hash.slice(1))
  if (!id) return
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ block: 'start' })
  el.classList.add('help-target')
  setTimeout(() => el.classList.remove('help-target'), 2000)
}

/** Platform tabs (:::ios / :::android / :::desktop) open on the reader's own system. */
function preselectPlatform() {
  const ua = navigator.userAgent
  const platform = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop'
  content.value?.querySelectorAll<HTMLInputElement>(`.help-tabs input[value="${platform}"]`).forEach((input) => (input.checked = true))
}

/** Links inside the article: app routes go through the router (no page reload). */
function onContentClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as HTMLElement).closest('a')
  const href = a?.getAttribute('href')
  if (!a || !href || a.target === '_blank') return
  if (href.startsWith('#')) {
    e.preventDefault()
    void router.push({ hash: href })
    return
  }
  if (href.startsWith('/')) {
    e.preventDefault()
    void router.push(href)
  }
}

watch(() => [props.slug, locale.value], load, { immediate: true })
watch(() => route.hash, () => {
  if (state.value === 'ready') scrollToHash()
})
</script>

<template>
  <div class="page">
    <router-link to="/pomoc" class="back">← {{ t('help.back') }}</router-link>

    <p v-if="state === 'loading'" class="muted">{{ t('help.loading') }}…</p>

    <div v-else-if="state === 'missing'" class="missing">
      <p>{{ t('help.notFound') }}</p>
    </div>

    <article v-else-if="article" class="article" :class="{ 'with-toc': toc.length > 2 }">
      <header class="article-header">
        <h1>{{ article.meta.title }}</h1>
        <p class="lead">{{ article.meta.summary }}</p>
        <p v-if="fallback" class="fallback" role="note">{{ t('help.fallback') }}</p>
      </header>

      <nav v-if="toc.length > 2" class="toc" :aria-label="t('help.toc')">
        <details class="toc-mobile">
          <summary>{{ t('help.toc') }}</summary>
          <ol>
            <li v-for="h in toc" :key="h.id"><router-link :to="{ hash: `#${h.id}` }">{{ h.text }}</router-link></li>
          </ol>
        </details>
        <div class="toc-desktop">
          <p class="toc-title">{{ t('help.toc') }}</p>
          <ol>
            <li v-for="h in toc" :key="h.id"><router-link :to="{ hash: `#${h.id}` }">{{ h.text }}</router-link></li>
          </ol>
        </div>
      </nav>

      <!-- trusted HTML compiled from Markdown in the repository at build time (raw HTML is stripped) -->
      <div ref="content" class="help-content" @click="onContentClick" v-html="article.html" />

      <footer class="article-footer">
        <section v-if="related.length" class="related">
          <h2>{{ t('help.related') }}</h2>
          <ul>
            <li v-for="entry in related" :key="entry.meta.slug">
              <router-link :to="`/pomoc/${entry.meta.slug}`">
                <strong>{{ entry.meta.title }}</strong>
                <span>{{ entry.meta.summary }}</span>
              </router-link>
            </li>
          </ul>
        </section>
        <section class="feedback">
          <h2>{{ t('help.wasHelpful') }}</h2>
          <p>{{ t('help.feedbackText') }} <a :href="feedbackUrl" target="_blank" rel="noopener noreferrer">{{ t('help.reportProblem') }}</a></p>
        </section>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.page {
  max-width: 1040px;
  margin: 0 auto;
  padding: var(--space-md);
  font-family: 'Museo', sans-serif;
}

.back {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--secondary-color);
  text-decoration: none;
  font-size: 15px;
}

.muted {
  color: var(--text-muted);
}

.article {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0 var(--space-lg);
}

.article-header h1 {
  margin: var(--space-xs) 0;
  line-height: 1.2;
}

.lead {
  margin: 0 0 var(--space-sm);
  font-size: 17px;
  line-height: 1.5;
  color: var(--text-muted);
}

.fallback {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(50, 158, 213, 0.15);
  font-size: 14px;
}

.toc ol {
  margin: 6px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc a {
  color: inherit;
  text-decoration: none;
  line-height: 1.35;
}

.toc a:hover {
  color: var(--secondary-color);
  text-decoration: underline;
}

.toc-mobile {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px 10px;
  margin-bottom: var(--space-sm);
}

.toc-mobile summary {
  min-height: var(--touch-target);
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
}

.toc-mobile li {
  min-height: 32px;
}

.toc-desktop {
  display: none;
}

.toc-title {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.article-footer {
  margin-top: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.article-footer h2 {
  font-size: 1.05rem;
  margin: 0 0 var(--space-xs);
}

.related ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.related a {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-raised);
  color: var(--text);
  text-decoration: none;
  box-shadow: 0 2px 8px var(--shadow-light);
  height: 100%;
}

.related a span {
  font-size: 13px;
  color: var(--text-muted);
}

.feedback {
  padding: var(--space-sm) var(--space-md);
  border-radius: 10px;
  border: 1px dashed var(--border);
}

.feedback p {
  margin: 0;
  line-height: 1.5;
}

.feedback a {
  color: var(--secondary-color);
  font-weight: 700;
}

/* wide screens: table of contents in a sticky side column */
@media (min-width: 960px) {
  .article.with-toc {
    grid-template-columns: minmax(0, 1fr) 240px;
    grid-template-areas:
      'header header'
      'content toc'
      'footer toc';
  }
  .article.with-toc .article-header { grid-area: header; }
  .article.with-toc .help-content { grid-area: content; }
  .article.with-toc .article-footer { grid-area: footer; }
  .article.with-toc .toc {
    grid-area: toc;
    align-self: start;
    position: sticky;
    top: var(--space-md);
    padding-left: var(--space-md);
    border-left: 2px solid var(--border);
    font-size: 14px;
  }
  .toc-mobile {
    display: none;
  }
  .toc-desktop {
    display: block;
  }
}

@media (max-width: 599px) {
  .page {
    padding: var(--space-sm);
  }
  .article-header h1 {
    font-size: 1.6rem;
  }
}
</style>

<style>
/* Article content (HTML from src/help/*.md) */
.help-content {
  font-size: 16px;
  line-height: 1.6;
  min-width: 0;
  overflow-wrap: break-word;
}

.help-content h2 {
  font-size: 1.35rem;
  margin: 1.6em 0 0.5em;
  scroll-margin-top: 16px;
}

.help-content h3 {
  font-size: 1.1rem;
  margin: 1.3em 0 0.4em;
  scroll-margin-top: 16px;
}

.help-content h2.help-target,
.help-content h3.help-target {
  animation: help-target 2s ease-out;
}

@keyframes help-target {
  0%, 40% { background: rgba(245, 158, 11, 0.35); }
  100% { background: transparent; }
}

.help-content p,
.help-content ul,
.help-content ol {
  margin: 0 0 0.9em;
}

.help-content ul,
.help-content ol {
  padding-left: 1.4em;
}

.help-content li + li {
  margin-top: 0.3em;
}

.help-content a {
  color: var(--secondary-color);
}

.help-content code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(127, 140, 146, 0.18);
}

.help-content img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.6em 0 1em;
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 14px var(--shadow-light);
}

.help-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em;
  font-size: 15px;
  display: block;
  overflow-x: auto;
}

.help-content th,
.help-content td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}

@media (max-width: 599px) {
  .help-content table {
    font-size: 14px;
  }
  .help-content th,
  .help-content td {
    padding: 5px 6px;
    overflow-wrap: anywhere;
  }
}

.help-content blockquote {
  margin: 0 0 1em;
  padding: 4px 14px;
  border-left: 4px solid var(--border);
  color: var(--text-muted);
}

.help-callout {
  margin: 0 0 1em;
  padding: 10px 14px;
  border-radius: 10px;
  border-left: 4px solid var(--accent-info);
  background: rgba(50, 158, 213, 0.12);
}

.help-callout > :last-child {
  margin-bottom: 0;
}

.help-callout-title {
  font-weight: 700;
  margin: 0 0 0.3em !important;
}

.help-callout-warning {
  border-left-color: var(--accent-warning);
  background: rgba(245, 158, 11, 0.14);
}

.help-callout-note {
  border-left-color: var(--accent-success);
  background: rgba(16, 185, 129, 0.12);
}

/* platform tabs: radio buttons + labels, the checked one shows its panel (no script) */
.help-tabs {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  margin: 0 0 1em;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.help-tabs > input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.help-tabs > label {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0 16px;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  background: rgba(127, 140, 146, 0.08);
}

.help-tabs > input:checked + label {
  border-bottom-color: var(--secondary-color);
  font-weight: 700;
  background: transparent;
}

.help-tabs > input:focus-visible + label {
  outline: 2px solid var(--secondary-color);
  outline-offset: -2px;
}

.help-tab-panel {
  display: none;
  width: 100%;
  padding: 12px 16px 2px;
  border-top: 1px solid var(--border);
}

.help-tabs > input:nth-of-type(1):checked ~ .help-tab-panel:nth-of-type(1),
.help-tabs > input:nth-of-type(2):checked ~ .help-tab-panel:nth-of-type(2),
.help-tabs > input:nth-of-type(3):checked ~ .help-tab-panel:nth-of-type(3) {
  display: block;
}
</style>
