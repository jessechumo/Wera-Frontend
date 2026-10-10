import { expect, test } from '@playwright/test';
import { deleteAccount, signUpAndOnboard } from './helpers';

// Every page loads without errors, on desktop and on a phone.
test('every page renders', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await signUpAndOnboard(page);
  for (const [path, heading] of [
    ['/', 'Today'],
    ['/jobs', 'Jobs'],
    ['/industries', 'Industries'],
    ['/tracker', 'Tracker'],
    ['/sponsorship', 'Sponsorship'],
    ['/interview', 'Interview prep'],
    ['/community', 'Community'],
    ['/profile', 'Erin Example'],
    ['/settings', 'Settings'],
    ['/excluded', 'Excluded'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
  await deleteAccount(page);
});

test('the theme toggle switches and remembers', async ({ page }) => {
  await page.goto('/login');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
  await page.reload();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
});
