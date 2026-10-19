import { expect, type Page } from '@playwright/test'

/** Elements sticking out of the viewport (horizontal scrolling) — must be empty on phones. */
export async function horizontalOverflow(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const html = document.documentElement
        const body = document.body
        const saved = [html.style.overflowX, body.style.overflowX]
        html.style.overflowX = 'visible'
        body.style.overflowX = 'visible'
        const vw = window.innerWidth
        const offenders: string[] = []
        for (const el of Array.from(document.querySelectorAll('body *'))) {
            const r = el.getBoundingClientRect()
            const style = getComputedStyle(el)
            if (r.width === 0 || style.position === 'fixed' || el.closest('.v-ripple__container')) continue
            if (r.right > vw + 1) offenders.push(`${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')} → ${Math.round(r.right)}px`)
        }
        ;[html.style.overflowX, body.style.overflowX] = saved
        return offenders.slice(0, 10)
    })
}

export async function expectNoHorizontalScroll(page: Page) {
    expect(await horizontalOverflow(page)).toEqual([])
}

/** Fresh start: welcome screen → first person → first advancement. */
export async function createFirstAdvancement(page: Page, person = 'pwd. Jan Kowalski HO') {
    await page.goto('/')
    await page.getByRole('button', { name: 'Dodaj pierwszą osobę' }).click()
    await page.locator('#person-name').fill(person)
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click()
    await page.getByRole('button', { name: 'OK' }).click()
    await page.getByRole('button', { name: 'Dodaj nową próbę' }).click()
    await expect(page).toHaveURL(/\/stopien\//)
    await expect(page.getByRole('heading', { name: 'Przewodnik' })).toBeVisible()
}

export async function addTask(page: Page, content: string) {
    await page.getByRole('button', { name: 'Dodaj zadanie' }).click()
    const textarea = page.locator('textarea').last()
    await textarea.fill(content)
    return textarea
}
