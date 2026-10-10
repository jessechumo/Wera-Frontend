import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'e2e password 123';

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Signs up a fresh account and finishes onboarding with SRE roles. */
export async function signUpAndOnboard(page: Page, email = uniqueEmail()) {
  await page.goto('/signup');
  await page.getByPlaceholder('Your name').fill('Erin Example');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/welcome/);

  await page.getByRole('button', { name: /Skip/ }).click(); // no resume
  await page.getByRole('group', { name: 'Role families' }).getByRole('button', { name: /Site reliability/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();

  // The profile step drafts with the AI when it is configured; either way
  // the text can be written by hand.
  const editor = page.getByLabel('Profile text');
  await expect(editor).toBeVisible();
  await expect(page.getByRole('button', { name: /Save and find my jobs/ })).toBeVisible();
  await editor.fill('# Candidate Profile\n## Target roles\nSite reliability and platform engineering, entry level.\n## Technical skills\nGo, Kubernetes, Terraform.');
  await page.getByRole('button', { name: /Save and find my jobs/ }).click();
  await expect(page).toHaveURL(/\/$/);
  return email;
}

/** Deletes the signed-in account (keeps the test database tidy). */
export async function deleteAccount(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Delete account…' }).click();
  await page.locator('form input[type=password]').last().fill(PASSWORD);
  await page.getByRole('button', { name: /Delete forever/ }).click();
  await expect(page).toHaveURL(/\/signup/);
}
