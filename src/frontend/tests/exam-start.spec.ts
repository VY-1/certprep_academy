import { test, expect } from '@playwright/test';

test('start daily quiz navigates to exam page', async ({ page }) => {
  await page.goto('http://frontend.local.localhost:8000/exams/ptcb');

  const startButton = page.getByRole('button', { name: /Start Daily Quiz/i });
  await expect(startButton).toBeVisible({ timeout: 10_000 });
  await startButton.click();

  await page.waitForURL(/\/exam\/.*daily-?quiz|\/exam\/ptcb-?daily-?quiz/i, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/exam\/(ptcb-)?daily-?quiz/i);

  await expect(page.getByText(/Question\s*1|question 1/i)).toBeVisible({ timeout: 10_000 });
});
