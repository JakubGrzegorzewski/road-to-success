import { expect, test, type Page } from '@playwright/test'
import { addTask, createFirstAdvancement } from './helpers'

/** Opens the task's thread and writes a comment (choosing "Piszę jako" the first time). */
async function commentOnFirstTask(page: Page, author: RegExp, text: string) {
    await page.locator('.task-header .comment-button').first().click()
    const thread = page.locator('.task-comments').first()
    const picker = thread.getByRole('button', { name: author })
    if (await picker.isVisible().catch(() => false)) await picker.click()
    await thread.locator('.composer-input').fill(text)
    await thread.getByRole('button', { name: 'Wyślij' }).click()
    await expect(thread.locator('.entry .content', { hasText: text })).toBeVisible()
}

test('mentor comments on one device, mentee sees and resolves it on another', async ({ browser }) => {
    const mentorContext = await browser.newContext()
    const mentor = await mentorContext.newPage()
    await createFirstAdvancement(mentor, 'hm. Anna Nowak')
    await addTask(mentor, 'Biwak zastępu')
    await mentor.getByRole('link', { name: 'Synchronizacja' }).click()
    await mentor.getByRole('button', { name: 'Utwórz pokój' }).click()
    const link = await mentor.locator('.link-field').inputValue()

    const menteeContext = await browser.newContext()
    const mentee = await menteeContext.newPage()
    await mentee.goto(link)
    await expect(mentee.getByText(/Zsynchronizowano z 1 urządzeniem/).first()).toBeVisible({ timeout: 20_000 })

    await mentor.getByRole('link', { name: 'Próby' }).click()
    await mentor.locator('.advancement-card-in.shifts-up').first().click()
    await commentOnFirstTask(mentor, /hm\. Anna Nowak/, 'Doprecyzuj termin biwaku.')
    const mentorButton = mentor.locator('.task-header .comment-button').first()
    await expect(mentorButton).toHaveAttribute('aria-label', 'Komentarze (otwarte: 1)')

    // the list shows a badge, the advancement a counter, the thread the comment
    await mentee.getByRole('link', { name: 'Próby' }).click()
    await expect(mentee.locator('.comments-badge')).toHaveText(/1 otwarta uwaga/, { timeout: 5_000 })
    await mentee.locator('.advancement-card-in.shifts-up').first().click()
    const menteeButton = mentee.locator('.task-header .comment-button').first()
    await expect(menteeButton).toHaveAttribute('aria-label', 'Komentarze (otwarte: 1)')
    await expect(menteeButton.locator('.new-dot')).toBeVisible()
    await expect(mentee.getByText('Otwarte uwagi (1)')).toBeVisible()
    await menteeButton.click()
    const thread = mentee.locator('.task-comments').first()
    await expect(thread.getByText('Doprecyzuj termin biwaku.')).toBeVisible()
    await expect(thread.locator('.role').first()).toHaveText('Opiekun')
    // someone else's comment: no edit/delete
    await expect(thread.getByRole('button', { name: 'Edytuj' })).toHaveCount(0)
    await thread.getByRole('button', { name: 'Załatwione ✓' }).click()

    await expect(mentorButton).toHaveAttribute('aria-label', 'Komentarze (1, wszystkie załatwione)', { timeout: 5_000 })
    await expect(mentor.getByText(/Otwarte uwagi/)).toHaveCount(0)

    await mentorContext.close()
    await menteeContext.close()
})

test('general notes, requirement notes and a link that opens the thread', async ({ page }) => {
    await createFirstAdvancement(page, 'hm. Anna Nowak')
    await addTask(page, 'Zbiórka')

    // general notes
    await page.locator('#uwagi-ogolne .comment-button').click()
    await page.locator('#uwagi-ogolne').getByRole('button', { name: /hm\. Anna Nowak/ }).click()
    await page.locator('#uwagi-ogolne .composer-input').fill('Dobry start')
    await page.locator('#uwagi-ogolne .composer-input').press('Control+Enter')
    await expect(page.locator('#uwagi-ogolne .entry')).toHaveCount(1)

    // requirement notes open in a dialog
    await page.getByText('Pokaż wybrane wymagania w zadaniach').click()
    await page.locator('.requirement-item .comment-button').first().click()
    const sheet = page.getByRole('dialog', { name: /Komentarze · Wymaganie 1/ })
    await sheet.locator('.composer-input').fill('Brakuje zadania')
    await sheet.getByRole('button', { name: 'Wyślij' }).click()
    await expect(sheet.locator('.entry')).toHaveCount(1)
    await sheet.getByRole('button', { name: 'Zamknij' }).click()
    await expect(page.getByText('Otwarte uwagi (2)')).toBeVisible()

    // own comment: edit and delete
    const general = page.locator('#uwagi-ogolne')
    await general.getByRole('button', { name: 'Edytuj' }).click()
    await general.locator('.edit-input').fill('Bardzo dobry start')
    await general.getByRole('button', { name: 'Zapisz' }).click()
    await expect(general.locator('.entry .content')).toHaveText('Bardzo dobry start')
    await expect(general.getByText('edytowano')).toBeVisible()

    // a link to a task thread (e.g. sent in a messenger) opens it
    await page.locator('.task-header .comment-button').first().click()
    const taskThread = page.locator('.task-comments').first()
    await taskThread.locator('.composer-input').fill('Do zadania')
    await taskThread.getByRole('button', { name: 'Wyślij' }).click()
    const taskId = (await page.locator('article.task').first().getAttribute('id'))!
    expect(taskId).toMatch(/^zadanie-/)
    const advancementUrl = page.url().split('#')[0]
    await page.goto('/')
    await page.goto(`${advancementUrl}#${taskId}`)
    await expect(page.locator('.task-comments').first().getByText('Do zadania')).toBeVisible()
    await expect(page.locator('.task-comments').first()).toBeInViewport()

    await general.getByRole('button', { name: 'Usuń' }).click()
    await page.getByRole('dialog', { name: 'Usunąć komentarz?' }).getByRole('button', { name: 'Usuń' }).click()
    await expect(general.locator('.entry')).toHaveCount(0)
})

test('comments in the preview and the PDF only when asked for', async ({ page }) => {
    await createFirstAdvancement(page, 'hm. Anna Nowak')
    await addTask(page, 'Zbiórka')
    await commentOnFirstTask(page, /hm\. Anna Nowak/, 'Uwaga do PDF')
    await page.getByRole('button', { name: 'Podgląd dokumentu' }).click()
    await expect(page.locator('.report-container')).toBeVisible()
    await expect(page.getByText('Uwaga do PDF')).toHaveCount(0)

    const download = async () => {
        const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pobierz PDF' }).click()])
        const chunks: Buffer[] = []
        for await (const chunk of await file.createReadStream()) chunks.push(chunk as Buffer)
        return Buffer.concat(chunks)
    }
    const without = await download()

    await page.getByLabel('Dołącz komentarze').check()
    await expect(page.locator('.comments-appendix')).toContainText('Uwaga do PDF')
    await expect(page.locator('.comments-appendix')).toContainText('Zad. 1')
    const withComments = await download()
    expect(withComments.subarray(0, 5).toString()).toBe('%PDF-')
    expect(withComments.length).toBeGreaterThan(without.length)

    await page.getByRole('radio', { name: 'Lista zadań' }).click()
    await expect(page.locator('.task-card')).toContainText('Uwaga do PDF')
})
