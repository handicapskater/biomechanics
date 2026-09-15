const {test, expect} = require('@playwright/test');
const portal = 'https://hs-portal-324477223314.us-central1.run.app';
const keys = ['walking', 'rolling', 'evidence', 'lifelong', 'recognition'];

test.beforeEach(async ({page}) => {
  await page.route(portal + '/**', route => route.abort());
});

test('tour works without homepage cards, panel, video block or extra opener', async ({page}, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__guidedFirstPaint = [];
    const showModal = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function () {
      showModal.call(this);
      const started = performance.now();
      const sample = () => {
        const heading = this.querySelector('#guided-modal-title');
        const header = this.querySelector('.guided-modal-header');
        const headingStyle = getComputedStyle(heading);
        window.__guidedFirstPaint.push({
          elapsed: performance.now() - started,
          headingBackground: headingStyle.backgroundColor,
          headingBorder: headingStyle.borderTopWidth,
          headingOutline: headingStyle.outlineStyle,
          headerBackground: getComputedStyle(header).backgroundColor
        });
        if (performance.now() - started < 220) requestAnimationFrame(sample);
      };
      sample();
    };
  });
  await page.goto('/');
  await expect(page.locator('main #home-journey-panel, main .home-journey-grid, main .home-motorcycle-hook, .home-guided-open')).toHaveCount(0);
  const modal = page.locator('#heroModal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#guided-modal-title')).toBeFocused();
  await expect(modal).toHaveAttribute('aria-labelledby', 'guided-tour-label');
  await expect(modal).toHaveAttribute('aria-describedby', 'guided-tour-subtitle');
  await expect(page.locator('#guided-tour-label')).toHaveText('HANDICAPSKATER · GUIDED TOUR');
  await expect(page.locator('#guided-tour-subtitle')).toHaveText('Start with the story. Then choose what you want to understand.');
  await expect(page.locator('.guided-modal-header')).toHaveCSS('background-color', 'rgb(21, 78, 65)');
  const firstPaint = await page.evaluate(() => window.__guidedFirstPaint);
  expect(firstPaint.length).toBeGreaterThan(0);
  for (const frame of firstPaint) {
    expect(frame.headingBackground).toBe('rgba(0, 0, 0, 0)');
    expect(frame.headingBorder).toBe('0px');
    expect(frame.headingOutline).toBe('none');
    expect(frame.headerBackground).toBe('rgb(21, 78, 65)');
  }
  await expect(page.locator('[data-modal-landing]')).toContainText('Because of my disability, reaching down to remove them or put them back on is extremely painful.');
  await expect(page.locator('[data-modal-landing]')).toContainText('Public transportation refused to let me ride with my skates, citing safety concerns, while initially providing no alternative transportation.');
  await expect(page.locator('.guided-modal-continuity')).toHaveText('Shop. Skate. Ride. Continuous mobility.');
  await expect(page.locator('[data-modal-landing]')).toContainText('The transportation changes, but my need for the mobility device doesn’t.');
  await expect(modal.locator('[data-modal-choices] a')).toHaveCount(6);
  const video = modal.locator('[data-modal-video] a');
  await expect(video).toHaveAttribute('href', 'https://www.reddit.com/r/HandicapSkater/s/6pPCv2k02t');
  await expect(modal.locator('[data-modal-video-text]')).toHaveAttribute('href', await video.getAttribute('href'));
  await expect.poll(() => video.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  for (const key of keys) {
    const link = modal.locator(`[data-modal-choices] [data-home-journey="${key}"]`);
    const title = await link.locator('strong').innerText();
    await link.click();
    await expect(page.locator('#home-journey-title')).toHaveText(title);
    await expect(page.locator('#home-journey-title')).toBeFocused();
    await expect(page.locator('[data-journey-context]')).not.toBeEmpty();
    await expect(page.locator('[data-demo-signin]')).toHaveAttribute('href', new RegExp(`journey%3D${key}`));
    await page.locator('[data-all-questions]').click();
    await expect(page.locator('#guided-modal-title')).toBeFocused();
  }
  await expect(page.locator('#heroModal iframe')).toHaveCount(1);
  await expect(modal.locator('.home-journey-accommodation')).toHaveAttribute('href', 'https://handicapskater.org/review-tools/');
  expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  if (info.project.name === 'chromium-desktop') {
    const box = await modal.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(940);
    expect(box.width).toBeLessThanOrEqual(960);
  }
  await page.screenshot({path:info.outputPath('independent-tour.png')});
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#timeline')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  expect(errors).toEqual([]);
});

test('checkbox suppression, footer reopening, focus trap and unchecked refresh work', async ({page}) => {
  await page.goto('/');
  const modal = page.locator('#heroModal');
  await expect(modal).toBeVisible();
  await page.locator('[data-modal-close]').click();
  await page.reload();
  await expect(modal).toBeVisible();
  const checkbox = page.getByRole('checkbox', {name:"Don't show this again"});
  await checkbox.check();
  await checkbox.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-modal-close]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(checkbox).toBeFocused();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(modal).not.toBeVisible();
  await page.locator('[data-welcome-modal]').click();
  await expect(modal).toBeVisible();
  await expect(checkbox).toBeChecked();
  await page.locator('[data-modal-close]').click();
  await expect(page.locator('[data-welcome-modal]')).toBeFocused();
});

test('sign-in journey returns and footer URL open the independent tour', async ({page}) => {
  await page.goto('/?journey=evidence');
  await expect(page.locator('#home-journey-title')).toHaveText('Is there actual evidence?');
  await page.keyboard.press('Escape');
  await expect(page.locator('#main')).toBeFocused();
  await page.goto('/?welcome=1');
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await expect(page).toHaveURL('/');
  await page.route('https://handicapskater.org/review-tools/', route => route.fulfill({body:'Review Tools entry'}));
  await page.locator('#heroModal .home-journey-accommodation').click();
  await expect(page).toHaveURL('https://handicapskater.org/review-tools/');
});
