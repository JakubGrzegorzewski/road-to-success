import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { addTask, createFirstAdvancement } from './helpers'

test('backup exported in one browser merges into another', async ({ browser }) => {
    const first = await browser.newContext()
    const a = await first.newPage()
    await createFirstAdvancement(a, 'hm. Anna Nowak')
    await addTask(a, 'Zadanie z pierwszej przeglądarki')
    await a.getByRole('link', { name: 'Ustawienia' }).click()
    const [download] = await Promise.all([a.waitForEvent('download'), a.getByRole('button', { name: 'Eksportuj kopię (.rts)' }).click()])
    const file = await download.path()
    expect((await readFile(file!)).subarray(0, 6).toString()).toBe('RTSDOC')

    const second = await browser.newContext()
    const b = await second.newPage()
    await b.goto('/')
    const chooser = b.waitForEvent('filechooser')
    await b.getByRole('button', { name: 'Importuj kopię zapasową' }).click()
    await (await chooser).setFiles(file!)
    await expect(b.getByText('Scalić kopię z danymi na tym urządzeniu?')).toBeVisible()
    await b.getByRole('button', { name: 'Scal' }).click()
    await b.getByRole('button', { name: 'OK' }).click()
    await expect(b.getByText('hm. Anna Nowak').first()).toBeVisible()

    // importing the same file again changes nothing
    await b.getByRole('link', { name: 'Ustawienia' }).click()
    const chooser2 = b.waitForEvent('filechooser')
    await b.getByRole('button', { name: 'Importuj / scal kopię' }).click()
    await (await chooser2).setFiles(file!)
    await expect(b.getByText(/osoby 1, próby 1, zadania 1\.$/)).toBeVisible()
    await first.close()
    await second.close()
})

test('preview shows the requirement table on wide screens', async ({ page }) => {
    await createFirstAdvancement(page)
    await addTask(page, 'Zbiórka')
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: 'Podgląd dokumentu' }).click()
    await expect(page.locator('table.matrix-table')).toBeVisible()
    await expect(page.locator('table.matrix-table tbody tr').first()).toContainText('Zbiórka')
    await page.getByRole('radio', { name: 'Lista zadań' }).click()
    await expect(page.getByText('Zadanie 1')).toBeVisible()
})
