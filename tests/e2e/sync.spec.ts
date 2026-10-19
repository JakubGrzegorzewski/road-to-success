import { expect, test } from '@playwright/test'
import { addTask, createFirstAdvancement } from './helpers'

test('two devices sync peer-to-peer and merge edits made while one was offline', async ({ browser }) => {
    const laptopContext = await browser.newContext()
    const laptop = await laptopContext.newPage()
    await createFirstAdvancement(laptop, 'hm. Anna Nowak')
    const laptopText = await addTask(laptop, 'Biwak')

    await laptop.getByRole('link', { name: 'Synchronizacja' }).click()
    await laptop.getByRole('button', { name: 'Utwórz pokój' }).click()
    const link = await laptop.locator('.link-field').inputValue()
    expect(link).toMatch(/\/dolacz#r=[\w-]{22}&k=[\w-]{43}$/)

    const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const phone = await phoneContext.newPage()
    await phone.goto(link)
    await expect(phone).toHaveURL(/\/synchronizacja$/) // the key is removed from the address bar
    await expect(phone.getByText(/Zsynchronizowano z 1 urządzeniem/).first()).toBeVisible({ timeout: 20_000 })

    await phone.getByRole('button', { name: 'Próby' }).click()
    await phone.locator('.advancement-card-in.shifts-up').first().click()
    const phoneText = phone.locator('textarea').first()
    await expect(phoneText).toHaveValue('Biwak')

    // live edit: phone → laptop in well under 2 s
    await phoneText.click()
    await phone.keyboard.press('End')
    await phone.keyboard.type(' zastępu')
    await laptop.getByRole('link', { name: 'Próby' }).click()
    await laptop.locator('.advancement-card-in.shifts-up').first().click()
    await expect(laptop.locator('textarea').first()).toHaveValue('Biwak zastępu', { timeout: 2_000 })

    // offline period: both sides edit, then reconnect
    await phoneContext.setOffline(true)
    await laptop.locator('textarea').first().click()
    await laptop.keyboard.press('Home')
    await laptop.keyboard.type('Duży ')
    await phoneText.click()
    await phone.keyboard.press('End')
    await phone.keyboard.type(' w lesie')
    await phoneContext.setOffline(false)

    await expect(laptop.locator('textarea').first()).toHaveValue('Duży Biwak zastępu w lesie', { timeout: 20_000 })
    await expect(phoneText).toHaveValue('Duży Biwak zastępu w lesie', { timeout: 20_000 })
    void laptopText
    await laptopContext.close()
    await phoneContext.close()
})

test('joining with local data: merge keeps both, "start from the room" keeps a backup', async ({ browser }) => {
    const mentorContext = await browser.newContext()
    const mentor = await mentorContext.newPage()
    await createFirstAdvancement(mentor, 'hm. Anna Nowak')
    await mentor.getByRole('link', { name: 'Synchronizacja' }).click()
    await mentor.getByRole('button', { name: 'Utwórz pokój' }).click()
    const link = await mentor.locator('.link-field').inputValue()

    // device with its own data → "Start from the room's data"
    const otherContext = await browser.newContext()
    const other = await otherContext.newPage()
    await createFirstAdvancement(other, 'Ktoś inny')
    await other.goto(link)
    await expect(other.getByText('Na tym urządzeniu są już dane')).toBeVisible()
    await other.getByRole('button', { name: 'Zacznij od danych pokoju' }).click()
    await expect(other).toHaveURL(/\/synchronizacja$/)
    await expect(other.getByText(/Zsynchronizowano z 1 urządzeniem/).first()).toBeVisible({ timeout: 20_000 })
    await other.getByRole('link', { name: 'Próby' }).click()
    await expect(other.getByText('hm. Anna Nowak').first()).toBeVisible()
    await expect(other.getByText('Ktoś inny')).toHaveCount(0)
    await other.getByRole('link', { name: 'Ustawienia' }).click()
    await expect(other.getByText(/Kopia danych sprzed dołączenia do pokoju/)).toBeVisible()
    // the mentor's data was not touched
    await mentor.getByRole('link', { name: 'Próby' }).click()
    await expect(mentor.locator('.advancement-card-in.shifts-up')).toHaveCount(1)

    // a third device merges its own advancement into the room
    const thirdContext = await browser.newContext()
    const third = await thirdContext.newPage()
    await createFirstAdvancement(third, 'Jan z trzeciego')
    await third.goto(link)
    await third.getByRole('button', { name: 'Scal z pokojem' }).click()
    await expect(mentor.locator('.advancement-card-in.shifts-up')).toHaveCount(2, { timeout: 20_000 })
    await expect(mentor.getByText('Jan z trzeciego').first()).toBeVisible()

    await mentorContext.close()
    await otherContext.close()
    await thirdContext.close()
})
