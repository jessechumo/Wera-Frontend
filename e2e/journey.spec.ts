import { expect, test } from '@playwright/test';
import { deleteAccount, PASSWORD, signUpAndOnboard } from './helpers';

// One user's whole journey: sign up, onboard, find a seeded job, open it,
// track it, change settings, practice an interview question, log out and
// back in, and delete the account.
test('a new user from sign-up to account deletion', async ({ page }) => {
  const email = await signUpAndOnboard(page);

  // Matches appear right away (estimates), without waiting for AI scores.
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  // The seeded SRE job matches; the senior one was filtered out.
  await page.goto('/jobs?q=E2E%20Robotics');
  await expect(page.getByText('Site Reliability Engineer', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Senior Staff Site Reliability Engineer')).toHaveCount(0);

  // Open it, read the posting, save it to the tracker.
  await page.getByText('Site Reliability Engineer', { exact: true }).first().click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText('Keep our robot fleet services reliable')).toBeVisible();
  await drawer.getByRole('button', { name: 'Save', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.goto('/tracker');
  await expect(page.getByText('Site Reliability Engineer').first()).toBeVisible();

  // Settings persist across reloads.
  await page.goto('/settings');
  const saved = page.waitForResponse((r) => r.url().endsWith('/api/settings') && r.request().method() === 'PUT');
  await page.getByRole('radio', { name: 'Weekly' }).click();
  await saved;
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Weekly' })).toHaveAttribute('aria-checked', 'true');

  // Interview practice: answer one question and get an explanation.
  await page.goto('/interview');
  await page.getByRole('button', { name: /Start 10 questions/ }).click();
  await page.getByRole('button', { name: /^A/ }).first().click();
  await expect(page.getByText(/Correct|Not quite/)).toBeVisible();

  // Log out, then log back in: the app returns to the page you were on.
  await page.getByRole('button', { name: /Log out/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/interview/);
  await expect(page.getByRole('heading', { name: 'Interview prep' })).toBeVisible();

  await deleteAccount(page);
});
