import { expect, test } from '@playwright/test'
import { addTask, createFirstAdvancement, expectNoHorizontalScroll } from './helpers'

test.describe('phone (360 px)', () => {
    test('whole flow without horizontal scrolling, data survives a reload', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('Witaj w Drodze do sukcesu')).toBeVisible()
        await expectNoHorizontalScroll(page)

        await createFirstAdvancement(page)
        await expectNoHorizontalScroll(page)

        await addTask(page, 'Poprowadzę cykl zbiórek o Prawie Harcerskim.')
        // tap words of the idea instead of selecting text
        const words = page.locator('.snipped-word')
        for (const i of [13, 14, 15]) await words.nth(i).tap()
        await page.getByRole('button', { name: 'Zapisz', exact: true }).click()
        // requirements as a checklist with the full text (no hover on phones)
        await page.locator('.requirement-picker summary').click()
        await page.locator('.requirement-option').first().click()
        await page.locator('.task-header [role=combobox]').click()
        await page.getByRole('option', { name: 'W trakcie' }).click()
        await expectNoHorizontalScroll(page)

        await page.reload()
        await expect(page.locator('textarea').first()).toHaveValue('Poprowadzę cykl zbiórek o Prawie Harcerskim.')
        await expect(page.locator('.task-header .dropdown-value')).toHaveText('W trakcie')
        await expect(page.locator('.requirement-picker summary')).toContainText('wybrano: 1')

        for (const tab of ['Synchronizacja', 'Ustawienia', 'Próby']) {
            await page.getByRole('button', { name: tab }).click()
            await expectNoHorizontalScroll(page)
        }
    })

    test('help: fourth tab, readable articles without horizontal scrolling', async ({ page }) => {
        await page.goto('/')
        const nav = page.locator('.mobile-nav')
        await expect(nav.getByRole('button')).toHaveCount(4)
        await page.getByRole('button', { name: 'Jak to działa?' }).tap()
        await expect(page).toHaveURL(/\/pomoc\/pierwsze-kroki$/)
        await expect(page.getByRole('heading', { name: 'Pierwsze kroki', level: 1 })).toBeVisible()
        await expectNoHorizontalScroll(page)
        await nav.getByRole('button', { name: 'Pomoc' }).tap()
        await expect(page).toHaveURL(/\/pomoc$/)
        await expectNoHorizontalScroll(page)
        for (const slug of ['synchronizacja', 'statusy', 'pdf', 'komentarze']) {
            await page.goto(`/pomoc/${slug}`)
            await expect(page.locator('.help-content h2').first()).toBeVisible()
            await expectNoHorizontalScroll(page)
        }
        // table of contents is folded on phones
        await page.locator('.toc-mobile summary').tap()
        await page.getByRole('navigation', { name: 'Spis treści' }).getByRole('link', { name: 'Piszę jako' }).first().tap()
        await expect(page.locator('#pisze-jako')).toBeInViewport()
    })

    test('task comments open in a bottom sheet that fits the screen', async ({ page }) => {
        await createFirstAdvancement(page)
        await addTask(page, 'Zbiórka')
        await page.locator('.task-header .comment-button').first().tap()
        const sheet = page.getByRole('dialog', { name: /Komentarze · Zadanie 1/ })
        await expect(sheet).toBeVisible()
        // the thread is not expanded inside the card on phones
        await expect(page.locator('.task-comments')).toHaveCount(0)
        await sheet.getByRole('button', { name: /pwd\. Jan Kowalski HO/ }).tap()
        const input = sheet.locator('.composer-input')
        await input.tap()
        await expect(input).toBeInViewport()
        await input.fill('Uwaga z telefonu')
        await sheet.getByRole('button', { name: 'Wyślij' }).tap()
        await expect(sheet.locator('.entry .content')).toHaveText('Uwaga z telefonu')
        await expectNoHorizontalScroll(page)
        const box = (await sheet.boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(360)
        expect(box.y + box.height).toBeLessThanOrEqual(780 + 1)
        await sheet.getByRole('button', { name: 'Zamknij' }).tap()
        await expect(page.locator('.task-header .comment-button').first()).toHaveAttribute('aria-label', 'Komentarze (otwarte: 1)')
    })

    test('PDF is generated from data and handed over as a file', async ({ page }) => {
        await createFirstAdvancement(page)
        await addTask(page, 'Zorganizuję biwak drużyny.')
        await page.getByRole('button', { name: 'Podgląd dokumentu' }).click()
        await expect(page.locator('.report-container')).toBeVisible()
        await expectNoHorizontalScroll(page)
        // no Web Share API in headless Chromium → falls back to a download
        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pobierz PDF' }).click()])
        expect(download.suggestedFilename()).toBe('przewodnik-pwd-jan-kowalski-ho.pdf')
        const stream = await download.createReadStream()
        const chunks: Buffer[] = []
        for await (const chunk of stream) chunks.push(chunk as Buffer)
        const pdf = Buffer.concat(chunks)
        expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
        expect(pdf.length).toBeGreaterThan(50_000)
    })
})
