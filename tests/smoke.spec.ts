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
