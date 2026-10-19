import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'

/**
 * Screenshots for the help articles (src/help/img/*.webp): `npm run help:screens`.
 * Fills a fresh browser with sample data through the UI, takes phone and desktop shots of the key
 * screens, outlines the element a guide talks about and converts the PNGs to WebP in the browser
 * (no image library needed). Re-run after UI changes; the diff of the images shows up in the PR.
 */
const OUT = fileURLToPath(new URL('../../src/help/img/', import.meta.url))
const PHONE = { viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const DESKTOP = { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }
const OUTLINE = '3px solid #F59E0B'

test.skip(!process.env.HELP_SCREENS, 'run with `npm run help:screens`')
test.describe.configure({ mode: 'serial' })

async function toWebp(page: Page, png: Buffer, name: string, quality = 0.8) {
    const scratch = await page.context().newPage()
    const dataUrl = await scratch.evaluate(
        async ({ src, q }) => {
            const img = new Image()
            img.src = src
            await img.decode()
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            canvas.getContext('2d')!.drawImage(img, 0, 0)
            return canvas.toDataURL('image/webp', q)
        },
        { src: `data:image/png;base64,${png.toString('base64')}`, q: quality },
    )
    await scratch.close()
    expect(dataUrl.startsWith('data:image/webp')).toBe(true)
    mkdirSync(OUT, { recursive: true })
    writeFileSync(OUT + name, Buffer.from(dataUrl.split(',')[1]!, 'base64'))
}

async function outline(locator: Locator, on = true) {
    await locator.evaluate((el, value) => {
        ;(el as HTMLElement).style.outline = value
        ;(el as HTMLElement).style.outlineOffset = value ? '3px' : ''
    }, on ? OUTLINE : '')
}

async function choose(page: Page, combobox: string, option: string) {
    const trigger = page.getByRole('combobox', { name: combobox })
    await trigger.click()
    await page.locator('.dropdown-root', { has: trigger }).getByRole('option', { name: option, exact: true }).click()
}

async function addPerson(page: Page, name: string) {
    await page.goto('/dodaj-osobe/')
    await page.locator('#person-name').fill(name)
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click()
    await page.getByRole('button', { name: 'OK' }).click()
}

async function writeComment(scope: Locator, text: string) {
    await scope.locator('.composer-input').fill(text)
    await scope.getByRole('button', { name: 'Wyślij' }).click()
    await expect(scope.locator('.entry .content', { hasText: text })).toBeVisible()
}

/** Sample advancement: two people, three tasks with statuses, requirements and comments. */
async function seed(page: Page) {
    await page.goto('/')
    await addPerson(page, 'hm. Anna Nowak')
    await addPerson(page, 'pwd. Jan Kowalski HO')
    await page.goto('/')
    await page.getByRole('button', { name: 'Dodaj nową próbę' }).click()
    await expect(page).toHaveURL(/\/stopien\//)
    await choose(page, 'Wybierz podopiecznego:', 'pwd. Jan Kowalski HO')
    await choose(page, 'Wybierz opiekuna:', 'hm. Anna Nowak')

    const tasks = [
        ['Poprowadzę cykl trzech zbiórek o Prawie Harcerskim dla zastępowych.', 'W trakcie'],
        ['Zorganizuję dwudniowy biwak drużyny w Puszczy Kampinoskiej.', 'Stworzone'],
        ['Przygotuję i przeprowadzę kurs pierwszej pomocy dla drużyny.', 'Zakończone'],
    ]
    for (const [i, [content, status]] of tasks.entries()) {
        await page.getByRole('button', { name: 'Dodaj zadanie' }).click()
        const card = page.locator('article.task').nth(i)
        await card.locator('textarea').fill(content!)
        await card.locator('.task-header [role=combobox]').click()
        await card.getByRole('option', { name: status! }).click()
        const requirementButtons = card.locator('.task-requirements button')
        if (await requirementButtons.count()) for (const n of [i, i + 4]) await requirementButtons.nth(n).click()
    }
    // a fragment of the idea for the first task
    const words = page.locator('article.task').first().locator('.snipped-word')
    if (await words.count()) {
        for (const n of [13, 14, 15, 16]) await words.nth(n).click()
        await page.locator('article.task').first().getByRole('button', { name: 'Zapisz', exact: true }).click()
    }

    // comments: the mentor writes, a reply, a general note, a requirement note
    await page.locator('.task-header .comment-button').first().click()
    const thread = page.locator('.task-comments').first()
    await thread.getByRole('button', { name: /hm\. Anna Nowak/ }).click()
    await writeComment(thread, 'Dopisz, kiedy będą zbiórki i jak sprawdzisz, czego się nauczyli.')
    await writeComment(thread, 'Ustalone: trzy kolejne czwartki, na koniec krótki quiz.')
    await page.locator('#uwagi-ogolne .comment-button').click()
    await writeComment(page.locator('#uwagi-ogolne'), 'Dobry plan. Brakuje jeszcze zadania do wymagania 5c.')
    await page.locator('#uwagi-ogolne .comment-button').click()
    await page.locator('.task-header .comment-button').first().click()
}

async function contextWith(browser: Browser, options: object) {
    return browser.newContext({ ...options, locale: 'pl-PL', colorScheme: 'light', serviceWorkers: 'block' })
}

test('help screenshots', async ({ browser }) => {
    test.setTimeout(240_000)

    // ------------------------------------------------------------- desktop
    const desktop = await contextWith(browser, DESKTOP)
    const page = await desktop.newPage()
    await seed(page)
    const advancementUrl = page.url()

    // the floating preview button would cover the corner of element screenshots
    const fab = page.locator('.show-pdf-button')
    await fab.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'))
    const firstTask = page.locator('article.task').first()
    const status = firstTask.locator('.task-header [role=combobox]')
    await outline(status)
    await toWebp(page, await firstTask.screenshot(), 'zadanie.webp')
    await outline(status, false)

    await firstTask.locator('.comment-button').click()
    const button = firstTask.locator('.comment-button')
    await outline(button)
    await page.mouse.move(0, 0)
    // the card without the idea and the text field: header + comment thread
    const body = firstTask.locator('.task-comments').locator('xpath=..')
    const toggleBody = (hide: boolean) =>
        body.evaluate((parent, h) => {
            for (const child of Array.from(parent.children) as HTMLElement[]) if (!child.classList.contains('task-comments')) child.style.display = h ? 'none' : ''
        }, hide)
    await toggleBody(true)
    await toWebp(page, await firstTask.screenshot(), 'komentarze-watek.webp')
    await toggleBody(false)
    await outline(button, false)

    await fab.evaluate((el) => ((el as HTMLElement).style.visibility = ''))
    await fab.click()
    await expect(page.locator('.report-container')).toBeVisible()
    await toWebp(page, await page.screenshot(), 'podglad-pdf.webp')
    await page.getByRole('button', { name: 'Wróć do edycji' }).click()

    await page.getByRole('link', { name: 'Synchronizacja' }).click()
    await page.getByRole('button', { name: 'Utwórz pokój' }).click()
    await page.locator('#device-name').fill('Laptop Anny')
    await page.locator('#device-name').press('Enter')
    await toWebp(page, await page.screenshot({ mask: [page.locator('.link-field')], maskColor: '#CBD5E1' }), 'synchronizacja.webp')

    // ------------------------------------------------------------- phone (same data through a backup)
    await page.getByRole('link', { name: 'Ustawienia' }).click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Eksportuj kopię (.rts)' }).click()])
    const backup = (await download.path())!
    const phoneContext = await contextWith(browser, PHONE)
    const phone = await phoneContext.newPage()
    await phone.goto('/')
    const chooser = phone.waitForEvent('filechooser')
    await phone.getByRole('button', { name: 'Importuj kopię zapasową' }).tap()
    await (await chooser).setFiles(backup)
    await phone.getByRole('button', { name: 'Scal' }).tap()
    await phone.getByRole('button', { name: 'OK' }).tap()
    await expect(phone.locator('.advancement-card-in.shifts-up')).toHaveCount(1)
    await outline(phone.locator('.comments-badge'))
    await toWebp(phone, await phone.screenshot(), 'lista-prob.webp', 0.75)

    await phone.goto(new URL(advancementUrl).pathname)
    await expect(phone.getByRole('heading', { name: 'Przewodnik' })).toBeVisible()
    await toWebp(phone, await phone.screenshot(), 'proba-telefon.webp', 0.75)

    await phone.locator('.task-header .comment-button').first().tap()
    const sheet = phone.getByRole('dialog', { name: /Komentarze · Zadanie 1/ })
    await sheet.getByRole('button', { name: /pwd\. Jan Kowalski HO/ }).tap()
    await expect(sheet.locator('.composer-input')).toBeVisible()
    await toWebp(phone, await phone.screenshot(), 'komentarze-telefon.webp', 0.75)
    await sheet.getByRole('button', { name: 'Zamknij' }).tap()

    await phone.getByRole('button', { name: 'Ustawienia' }).tap()
    const backupCard = phone.locator('section.card', { hasText: 'Kopia zapasowa' })
    await toWebp(phone, await backupCard.screenshot(), 'kopie.webp', 0.75)

    await desktop.close()
    await phoneContext.close()
})
