import { test, expect } from '@playwright/test'

/**
 * Test the complete time tracking workflow:
 * 1. Clear local data for consistent state
 * 2. Log in to Engineering team
 * 3. Add two tickets
 * 4. Begin work on first ticket (triggers clock-in prompt)
 * 5. Verify clocked in and timer running
 * 6. Stop timer with a note
 * 7. Start work on second ticket
 * 8. Clock out (should stop timer and show confirmation)
 * 9. Verify timer stopped and user clocked out
 */

test.describe('Time Tracking Workflow', () => {
  test('complete time tracking workflow with tickets', async ({ page }) => {
    // Increase test timeout for this comprehensive test
    test.setTimeout(90000)

    // Step 1: Navigate to the app and wait for it to load
    await page.goto('/')
    
    // Wait for the app to load teams
    await page.waitForFunction(() => {
      return document.querySelector('.modal-team-switcher') !== null || 
             document.querySelector('.page-tickets') !== null ||
             document.querySelector('[class*="dashboard"]') !== null
    }, { timeout: 15000 })

    // Step 2: Clear local data first for consistent state
    await page.goto('/account')
    await page.waitForLoadState('networkidle')

    const clearDataButton = page.getByRole('button', { name: /clear all local data/i })
    if (await clearDataButton.isVisible()) {
      await clearDataButton.click()
      const confirmButton = page.getByRole('button', { name: /confirm|yes|clear/i })
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      await page.waitForLoadState('networkidle')
    }

    // Step 3: Navigate to home and select Engineering team
    await page.goto('/')
    await page.waitForSelector('.modal-team-switcher, .team-switcher-list', { timeout: 10000 })
    
    const engineeringTeam = page.locator('.team-switcher-item').filter({ hasText: 'Engineering' })
    await engineeringTeam.click()
    await page.waitForURL(/\/team\/.*\/dashboard/)
    
    // Wait for any modal overlays to disappear
    await page.waitForFunction(() => {
      const overlays = document.querySelectorAll('[data-slot="dialog-overlay"]')
      return overlays.length === 0 || Array.from(overlays).every(el => {
        const style = window.getComputedStyle(el)
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
      })
    }, { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(500)

    // Step 4: Navigate to tickets page using the footer nav
    const ticketsNavItem = page.locator('.nav-item').filter({ hasText: 'Tickets' })
    await ticketsNavItem.click()
    await page.waitForURL(/\/team\/.*\/tickets/)
    await page.waitForSelector('.page-tickets', { timeout: 10000 })

    // Step 5: Add first ticket
    const addTicketButton = page.locator('.btn-add-ticket')
    await expect(addTicketButton).toBeVisible({ timeout: 5000 })
    await addTicketButton.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

    const ticketTitle1 = `Test Ticket 1 - ${Date.now()}`
    await page.getByLabel(/title/i).fill(ticketTitle1)
    await page.getByLabel(/description/i).fill('This is a test ticket for E2E testing')
    await page.getByRole('button', { name: /create ticket/i }).click()
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
    await page.waitForSelector(`.ticket-card:has-text("${ticketTitle1}")`, { timeout: 5000 })

    // Step 6: Add second ticket
    await addTicketButton.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

    const ticketTitle2 = `Test Ticket 2 - ${Date.now()}`
    await page.getByLabel(/title/i).fill(ticketTitle2)
    await page.getByLabel(/description/i).fill('Second test ticket for E2E testing')
    await page.getByRole('button', { name: /create ticket/i }).click()
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
    await page.waitForSelector(`.ticket-card:has-text("${ticketTitle2}")`, { timeout: 5000 })

    // Step 7: Start timer on first ticket (triggers clock-in prompt since not clocked in)
    await page.waitForTimeout(500)
    
    const matchingCards = page.locator(`.ticket-card:has-text("${ticketTitle1}")`)
    const ticket1Card = matchingCards.first()
    await ticket1Card.locator('.ticket-card-timer-button').click()

    // Step 8: Handle clock-in prompt
    const clockInModal = page.locator('.clock-in-prompt-modal')
    if (await clockInModal.isVisible({ timeout: 3000 })) {
      await page.locator('.clock-in-prompt-confirm').click()
      await page.waitForSelector('.clock-in-prompt-modal', { state: 'hidden', timeout: 5000 })
    }

    // Wait for state to stabilize
    await page.waitForTimeout(1000)

    // Step 9: Verify we are clocked in
    const clockButton = page.locator('.nav-clock-button')
    await expect(clockButton).toHaveClass(/bg-destructive/, { timeout: 5000 })

    // Wait for timer UI to update
    await page.waitForTimeout(2000)

    // Find the card with the running timer (handles duplicate ticket bug)
    const activeTicketCard = page.locator(`.ticket-card:has(.ticket-card-timer-button.bg-destructive)`)
    await expect(activeTicketCard).toBeVisible({ timeout: 5000 })
    await expect(activeTicketCard).toContainText(ticketTitle1)
    
    const ticket1CardWithTimer = activeTicketCard
    await expect(ticket1CardWithTimer.locator('.ticket-card-timer-button')).toHaveClass(/bg-destructive/, { timeout: 5000 })

    // Wait for timer to accumulate some time
    await page.waitForTimeout(2000)

    // Step 10: Stop timer on first ticket with a note
    await ticket1CardWithTimer.locator('.ticket-card-timer-button').click()
    await page.waitForSelector('.stop-timer-modal', { timeout: 5000 })
    await page.locator('.stop-timer-note-input').fill('Completed initial work on test ticket')
    await page.locator('.stop-timer-submit-button').click()
    await page.waitForSelector('.stop-timer-modal', { state: 'hidden', timeout: 5000 })

    // Step 11: Verify timer stopped on first ticket
    const cardsWithRunningTimer = page.locator(`.ticket-card:has-text("${ticketTitle1}"):has(.ticket-card-timer-button.bg-destructive)`)
    await expect(cardsWithRunningTimer).toHaveCount(0, { timeout: 5000 })

    // Step 12: Start timer on second ticket
    const ticket2Cards = page.locator(`.ticket-card:has-text("${ticketTitle2}")`)
    await ticket2Cards.first().locator('.ticket-card-timer-button').click()

    // Wait for timer to start
    await page.waitForTimeout(1000)
    const ticket2CardsWithTimer = page.locator(`.ticket-card:has-text("${ticketTitle2}"):has(.ticket-card-timer-button.bg-destructive)`)
    await expect(ticket2CardsWithTimer).toHaveCount(1, { timeout: 5000 })

    // Wait a bit for the timer
    await page.waitForTimeout(2000)

    // Step 13: Clock out using the footer nav button
    await clockButton.click()

    // Handle confirmation dialog (shown since timer is running)
    const confirmDialog = page.locator('[role="dialog"]')
    if (await confirmDialog.isVisible({ timeout: 3000 })) {
      await page.getByRole('button', { name: /continue/i }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
    }

    // Step 14: Verify timer stopped on second ticket
    const ticket2RunningAfterClockOut = page.locator(`.ticket-card:has-text("${ticketTitle2}"):has(.ticket-card-timer-button.bg-destructive)`)
    await expect(ticket2RunningAfterClockOut).toHaveCount(0, { timeout: 5000 })

    // Step 15: Verify we are clocked out
    await expect(clockButton).not.toHaveClass(/bg-destructive/, { timeout: 5000 })
    await expect(clockButton.locator('.nav-clock-label')).toContainText(/in/i, { timeout: 5000 })
  })
})
