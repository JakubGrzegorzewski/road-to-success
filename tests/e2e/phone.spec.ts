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
