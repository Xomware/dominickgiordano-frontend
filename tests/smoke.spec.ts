import { expect, test } from '@playwright/test';

test('intro plays on first visit and the skip button hands the page back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/intro-on/);
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('html')).not.toHaveClass(/intro-on/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DominickGiordano');
  expect(errors).toEqual([]);
});

test('the intro unlocks, then hands the page back on its own', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.phases li.on')).toHaveText('02 Unlocked', { timeout: 5000 });
  await expect(page.locator('html')).not.toHaveClass(/intro-on/, { timeout: 5000 });
  await expect(page.locator('#intro')).toBeHidden();
});

test('the intro plays once per session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/intro-on/);
});

test('nav scrolls to a section and marks it active', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Sections', exact: true });
  await nav.getByRole('link', { name: 'Apps' }).click();
  await expect(page.locator('#apps')).toBeInViewport();
  await expect(nav.getByRole('link', { name: 'Apps' })).toHaveClass(/on/);
});

test('reduced motion skips the intro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/intro-on/);
  await expect(page.locator('#intro')).toBeHidden();
});

test('structured data parses and describes Dominick', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const person = JSON.parse(raw ?? '{}')['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person');
  expect(person.name).toBe('Dominick Giordano');
  expect(person.sameAs).toContain('https://www.linkedin.com/in/dominick-giordano/');
  const photo = await page.request.get(person.image.replace('https://dominickgiordano.com', ''));
  expect(photo.ok()).toBe(true);
});

test('the look switch persists across reloads', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Light' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-look', 'light');
});

test('the Xomware grid shows four apps at a time, flips them over, and pauses', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  const grid = page.locator('#apps .grid');
  await grid.scrollIntoViewIfNeeded();
  const shown = grid.locator('.app.on');
  await expect(shown).toHaveCount(4);
  expect(await grid.locator('.app').count()).toBeGreaterThan(4);
  const names = async () => (await shown.locator('b').allTextContents()).join();
  const before = await names();
  await expect.poll(names, { timeout: 6000 }).not.toBe(before);
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await names();
  await page.waitForTimeout(3200);
  expect(await names()).toBe(paused);
});

test('reduced motion lists every Xomware app', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#apps .slot')).toHaveCount(0);
  for (const app of await page.locator('#apps .app').all()) await expect(app).toBeVisible();
});

test('emails stay out of the page until the Email button is clicked', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).not.toMatch(/[\w.]+@[\w-]+\.\w+/);
  await page.locator('[data-mail]').click();
  await expect(page.locator('#mail a')).toHaveCount(2);
  await expect(page.locator('#mail a').first()).toHaveAttribute('href', /^mailto:\S+@\S+\.\w+$/);
});
