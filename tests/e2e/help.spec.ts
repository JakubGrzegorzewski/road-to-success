import { expect, test } from '@playwright/test'

test('help: search, article sections and contextual "?" links', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Pomoc' }).click()
    await expect(page.getByRole('heading', { name: 'Pomoc', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /Synchronizacja między urządzeniami/ })).toBeVisible()

    // search ignores Polish characters and ranks titles first
    await page.getByLabel('Szukaj w poradnikach').fill('qr')
    const first = page.locator('.result').first()
    await expect(first).toContainText('Synchronizacja między urządzeniami')
    await expect(first.locator('mark').first()).toHaveText(/qr/i)
    await page.getByLabel('Szukaj w poradnikach').fill('zmien pokoj')
    await expect(page.locator('.result').first()).toContainText('Synchronizacja między urządzeniami')
    await expect(page.locator('.result').first()).toContainText('w sekcji „Zmień pokój”')
    await page.getByLabel('Szukaj w poradnikach').fill('kopia zapasowa')
    await page.locator('.result').first().click()
    await expect(page).toHaveURL(/\/pomoc\/kopie-zapasowe/)
    await expect(page.getByRole('heading', { name: 'Kopie zapasowe', level: 1 })).toBeVisible()

    // table of contents and links between articles stay inside the app
    await page.getByRole('navigation', { name: 'Spis treści' }).getByRole('link', { name: 'Import i scalanie' }).click()
    await expect(page).toHaveURL(/#import-i-scalanie$/)
    await expect(page.locator('#import-i-scalanie')).toBeInViewport()
    await page.locator('.help-content a[href="/pomoc/synchronizacja#scal-czy-zacznij-od-danych-pokoju"]').first().click()
    await expect(page).toHaveURL(/\/pomoc\/synchronizacja#scal-czy-zacznij-od-danych-pokoju$/)
    await expect(page.locator('#scal-czy-zacznij-od-danych-pokoju')).toBeInViewport()

    // "?" next to the sync state opens the right section
    await page.getByRole('link', { name: 'Synchronizacja', exact: true }).click()
    await page.locator('.status-card').getByRole('link', { name: 'Pomoc do tego miejsca' }).click()
    await expect(page).toHaveURL(/\/pomoc\/synchronizacja#stany-synchronizacji$/)
    await expect(page.locator('#stany-synchronizacji')).toBeInViewport()

    // platform tabs: the computer's own tab is preselected, the others can be opened
    await page.goto('/pomoc/instalacja')
    const tabs = page.locator('.help-tabs').first()
    await expect(tabs.locator('.help-tab-panel[data-platform="desktop"]')).toBeVisible()
    await tabs.getByText('iPhone i iPad').click()
    await expect(tabs.locator('.help-tab-panel[data-platform="ios"]')).toContainText('Do ekranu początkowego')
    await expect(tabs.locator('.help-tab-panel[data-platform="desktop"]')).toBeHidden()
})

test('help in English, with the Polish text where a translation is missing', async ({ page }) => {
    await page.goto('/ustawienia')
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'English' }).click()
    await page.getByRole('link', { name: 'Help', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Help', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /Sync between devices/ })).toBeVisible()
    // contextual links use the same section ids in every language
    await page.goto('/pomoc/synchronizacja#zmien-pokoj')
    await expect(page.locator('#zmien-pokoj')).toHaveText('Change room')
    await expect(page.locator('#zmien-pokoj')).toBeInViewport()
})

test('help works offline after the first visit', async ({ page, context }) => {
    await page.goto('/pomoc')
    await expect(page.getByRole('heading', { name: 'Pomoc', level: 1 })).toBeVisible()
    // wait until the service worker has precached the app and controls the page
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready
        if (!navigator.serviceWorker.controller) {
            await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
        }
    })
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Pomoc', level: 1 })).toBeVisible()
    await page.getByRole('link', { name: /Praca offline i prywatność/ }).click()
    await expect(page.getByRole('heading', { name: 'Praca offline i prywatność', level: 1 })).toBeVisible()
    await expect(page.locator('.help-content')).toContainText('Po pierwszym otwarciu aplikacja działa bez internetu')
    await context.setOffline(false)
})
