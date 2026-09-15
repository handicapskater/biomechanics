const {test, expect} = require('@playwright/test');

const expected = ['The Science', 'Evidence', 'Equality', 'Accommodation', 'Legal', 'Guided Tour', 'Standard'];

test('shared header has ordered, aligned navigation and working actions', async ({page}) => {
  await page.route('https://hs-portal-324477223314.us-central1.run.app/**', route => route.abort());
  await page.goto('/');
  if (await page.locator('#heroModal').isVisible()) await page.locator('[data-modal-close]').click();
  const nav = page.getByRole('navigation', {name:'Primary navigation'});
  const controls = nav.locator(':scope > .nav-link, :scope > .nav-dropdown > summary');
  await expect(controls).toHaveCount(7);
  expect(await controls.allTextContents()).toEqual(expected);

  const accommodation = nav.getByRole('link', {name:'Accommodation'});
  const standard = nav.getByRole('link', {name:'Standard'});
  for (const external of [accommodation, standard]) {
    await expect(external).toHaveClass(/external-link/);
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(accommodation).toHaveAttribute('href', 'https://handicapskater.org/review-tools/');
  await expect(standard).toHaveAttribute('href', 'https://handicapskater.org/');

  const guided = nav.getByRole('link', {name:'Guided Tour'});
  await expect(guided).toHaveClass(/nav-guided-tour/);
  await expect(guided).toHaveAttribute('aria-haspopup', 'dialog');
  await guided.click();
  await expect(page.locator('#heroModal')).toBeVisible();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await expect(page.locator('.home-journey-accommodation span')).toHaveText('Request accommodation help →');

  await page.locator('[data-modal-close]').click();
  const evidence = nav.locator('.nav-dropdown > summary');
  await expect(evidence).toHaveText('Evidence');
  await evidence.press('Space');
  await expect(nav.locator('.nav-dropdown')).toHaveJSProperty('open', true);
  await expect(nav.getByRole('link', {name:'Evidence Brief'})).toBeVisible();

  const geometry = await controls.evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return {height:node.getBoundingClientRect().height, radius:style.borderRadius, font:style.fontSize};
  }));
  expect(new Set(geometry.map(item => Math.round(item.height))).size).toBe(1);
  expect(new Set(geometry.map(item => item.radius)).size).toBe(1);
  expect(new Set(geometry.map(item => item.font)).size).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
