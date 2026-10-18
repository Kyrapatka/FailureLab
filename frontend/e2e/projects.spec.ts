import { expect, test as base } from '@playwright/test'

const test = base.extend<{ consoleAudit: void }>({
  consoleAudit: [
    async ({ page }, use) => {
      const issues: string[] = []
      page.on('pageerror', (error) => issues.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') issues.push(message.text())
      })
      await use()
      expect(issues, 'Browser console should have no errors or warnings').toEqual([])
    },
    { auto: true },
  ],
})

test('E2E-01/02/04/05/06/07: manual registration, validation, persistence and search', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByText('No projects yet')).toBeVisible()
  await page.getByRole('button', { name: 'Add Project', exact: true }).click()
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('Repository path is required.')).toBeVisible()
  await page.getByLabel('Repository path').fill('   ')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('Repository path is required.')).toBeVisible()
  await page.getByLabel('Repository path').fill('C:\\work\\ledger-api\\')
  await page.getByRole('button', { name: 'Create Project' }).dblclick()
  await expect(page.getByRole('heading', { name: 'ledger-api', exact: true })).toBeVisible()
  await expect(page.getByText('Not verified', { exact: true })).toBeVisible()
  await expect(page.getByText('Setup Required')).toBeVisible()
  const overviewUrl = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ledger-api', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'All projects' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.getByRole('searchbox').fill('LEDGER')
  await expect(page.getByRole('link', { name: /ledger-api/ })).toBeVisible()
  await page.getByRole('searchbox').fill('C:/work')
  await expect(page.getByRole('link', { name: /ledger-api/ })).toBeVisible()
  await page.getByRole('searchbox').fill('missing')
  await expect(page.getByText('No Search Results')).toBeVisible()
  await expect(page.getByText('No projects yet')).toHaveCount(0)
  await page.getByRole('searchbox').fill('')
  await page.getByRole('button', { name: 'Add Project', exact: true }).click()
  await page.getByLabel('Repository path').fill(' C:/work/ledger-api/ ')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('This repository path is already registered.')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.getByRole('link', { name: /ledger-api/ }).click()
  await expect(page).toHaveURL(overviewUrl)
  await page.goBack()
  await expect(page).toHaveURL(/\/projects$/)
  await page.goForward()
  await expect(page).toHaveURL(overviewUrl)
  expect(errors).toEqual([])
})

test('E2E-03/08: mock Browse preserves a custom name and project switching isolates data', async ({
  page,
}) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: 'Add Project', exact: true }).click()
  await page.getByLabel('Project name').fill('Payments sandbox')
  await page.getByRole('button', { name: 'Browse' }).click()
  await expect(page.getByText('Demo directories')).toBeVisible()
  await page.getByRole('button', { name: /payment-api/ }).click()
  await expect(page.getByLabel('Repository path')).toHaveValue('/home/dev/projects/payment-api')
  await expect(page.getByLabel('Project name')).toHaveValue('Payments sandbox')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByRole('heading', { name: 'Payments sandbox' })).toBeVisible()
  await expect(page.getByText('Setup Required')).toBeVisible()
  await page.getByRole('link', { name: 'All projects' }).click()
  await page.getByRole('button', { name: 'Add Project', exact: true }).click()
  await page.getByRole('button', { name: 'Browse' }).click()
  await page.getByRole('button', { name: /auth-service/ }).click()
  await expect(page.getByLabel('Project name')).toHaveValue('auth-service')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByRole('heading', { name: 'auth-service', exact: true })).toBeVisible()
  await page.getByLabel('Switch project').selectOption({ label: 'Payments sandbox' })
  await expect(page.getByRole('heading', { name: 'Payments sandbox' })).toBeVisible()
  await expect(page.getByText('No environments yet')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Payments sandbox' })).toBeVisible()
})

test('E2E-09/10: isolated demo readiness, active run and unavailable history', async ({ page }) => {
  await page.goto('/projects?demo=1')
  await expect(page.getByText('Demo workspace', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /auth-service/ }).click()
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  await expect(page.getByText('Repository usable')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Active experiment' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New Experiment' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Configure Environment' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Create Scenario' })).toBeDisabled()
  await expect(page.getByRole('row')).toHaveCount(6)
  await page.reload()
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  await page.getByLabel('Switch project').selectOption('demo-order')
  await expect(page.getByRole('heading', { name: 'order-service', exact: true })).toBeVisible()
  await expect(page.getByText('Needs Attention')).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(5)
  await expect(page.getByText('order-run-104', { exact: true })).toBeVisible()
  await expect(page.getByText('Token validation', { exact: true })).toHaveCount(0)
  await page.getByLabel('Switch project').selectOption('demo-payment')
  await expect(page.getByText('Setup Required')).toBeVisible()
  await expect(page.getByText('No experiments yet')).toBeVisible()
  await page.getByRole('link', { name: 'Exit demo' }).click()
  await expect(page.getByText('No projects yet')).toBeVisible()
})

test('load/create failures recover and unknown routes remain navigable', async ({ page }) => {
  await page.goto('/projects?failLoad=1&failCreate=1&delay=350')
  await expect(page.getByRole('status').filter({ hasText: /Loading/ })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(/load/i)
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('No projects yet')).toBeVisible()
  await page.getByRole('button', { name: 'Add Project', exact: true }).click()
  await page.getByLabel('Repository path').fill('/repos/retry')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByRole('alert')).toContainText(/create/i)
  await expect(page.getByLabel('Repository path')).toHaveValue('/repos/retry')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByRole('heading', { name: 'retry', exact: true })).toBeVisible()
  await page.goto('/projects/unknown')
  await expect(page.getByRole('heading', { name: 'Project Not Found' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to Projects' }).click()
  await expect(page.getByRole('link', { name: /retry/ })).toBeVisible()
  await page.goto('/unknown')
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
})

test('keyboard dialog focus, Escape, and narrow layout with long paths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/projects')
  const add = page.getByRole('button', { name: 'Add Project', exact: true })
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Repository path')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('dialog')).toContainText('Add Project')
  expect(
    await page.evaluate(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    ),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(add).toBeFocused()
  await page.keyboard.press('Enter')
  await page
    .getByLabel('Repository path')
    .fill(
      '/home/developer/very-long-directory-name/another-long-directory/engineering-service-with-a-long-name',
    )
  await page.getByLabel('Project name').fill('Engineering service')
  await page.screenshot({ path: 'test-results/mobile-dialog.png', fullPage: true })
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(
    page.getByRole('heading', { name: 'Engineering service', exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/mobile-overview.png', fullPage: true })
  await page.goto('/projects/demo-auth?demo=1')
  await expect(page.getByText('Ready', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/mobile-demo.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: 'test-results/desktop-overview.png', fullPage: true })
  await page.getByRole('link', { name: 'All projects' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/desktop-projects.png', fullPage: true })
  await page.getByRole('link', { name: 'Exit demo' }).click()
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop-user-projects.png', fullPage: true })
})

test('corrupt storage is preserved until an explicit confirmed reset', async ({ page }) => {
  await page.goto('/projects')
  await page.evaluate(() => localStorage.setItem('failurelab.projects.v1', 'invalid data'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(/stored data/i)
  expect(await page.evaluate(() => localStorage.getItem('failurelab.projects.v1'))).toBe(
    'invalid data',
  )
  await page.getByRole('button', { name: 'Reset local data' }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('failurelab.projects.v1'))).toBe(
    'invalid data',
  )
  await page.getByRole('button', { name: 'Reset local data' }).click()
  await page.getByRole('button', { name: 'Confirm reset' }).click()
  await expect(page.getByText('No projects yet')).toBeVisible()
})
