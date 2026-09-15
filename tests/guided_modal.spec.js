const {test, expect} = require('@playwright/test');

const portal = 'https://hs-portal-324477223314.us-central1.run.app';
const storageKey = 'handicapskater_welcome_modal';
const modalVersion = 1;
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
const keys = ['walking', 'rolling', 'evidence', 'lifelong', 'recognition'];
const home = key => `main [data-home-journey="${key}"]`;

async function seedPreference(page, value) {
  await page.addInitScript(({key, stored}) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, stored);
  }, {
    key: storageKey,
    stored: typeof value === 'string' ? value : JSON.stringify(value)
  });
}

test.beforeEach(async ({page}) => {
  await page.route(portal + '/**', route => route.abort());
});

test('fresh browser auto-opens, keeps one shared landing, and remembers deliberate dismissal', async ({page, browserName}, info) => {
  await page.goto('/');
  const modal = page.locator('#heroModal');
  const opener = page.locator('.home-guided-open');
  await expect(modal).toBeVisible();
  await expect(page.locator('#guided-modal-title')).toBeFocused();
  await expect(page.locator('#main')).toHaveJSProperty('inert', true);
  await expect(opener).toHaveText('Explore HandicapSkater');
  await expect(modal.getByRole('heading', {name:'Riding a Motorcycle with Skates'})).toBeVisible();
  await expect(modal).toContainText('Public transportation refused to carry me with my skates');
  const source = await page.locator('main .home-journey-grid a').evaluateAll(nodes => nodes.map(node => [node.textContent, node.href]));
  expect(await modal.locator('[data-modal-choices] a').evaluateAll(nodes => nodes.map(node => [node.textContent, node.href]))).toEqual(source);
  await expect(modal.locator('[data-modal-choices] a')).toHaveCount(6);
  const video = await page.locator('.home-motorcycle-hook figure a').getAttribute('href');
  await expect(modal.locator('[data-modal-video] a')).toHaveAttribute('href', video);
  await expect(modal.locator('[data-modal-video] a')).toHaveAccessibleName(/Watch Troy ride/);
  await expect(modal.locator('[data-modal-video-text]')).toHaveAttribute('href', video);
  await expect(modal.locator('img')).toBeVisible();
  expect(await modal.locator('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  for (let index = 0; index < 15; index++) {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await page.evaluate(() => document.activeElement.closest('#heroModal') !== null)).toBe(true);
  }
  await modal.locator('[data-modal-choices] [data-home-journey="evidence"]').click();
  await expect(page.locator('#home-journey-title')).toHaveText('Is there actual evidence?');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.locator('[data-all-questions]').click();
  await expect(page.locator('#guided-modal-title')).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  const close = modal.locator('[data-modal-close]');
  const closeBox = await close.boundingBox();
  expect(closeBox.y).toBeGreaterThanOrEqual(0);
  expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await modal.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('modal-landing.png')});
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#main')).toHaveJSProperty('inert', false);
  expect(await page.locator('body').evaluate(node => node.style.overflow)).not.toBe('hidden');
  const dismissed = JSON.parse(await page.evaluate(key => localStorage.getItem(key), storageKey));
  expect(dismissed.version).toBe(modalVersion);
  expect(Date.now() - dismissed.dismissedAt).toBeLessThan(5000);
  await page.reload();
  await expect(modal).not.toBeVisible();
  const beforeManualOpen = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await opener.click();
  await expect(modal).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeManualOpen);
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await close.click();
  await expect(modal).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), storageKey)).version).toBe(modalVersion);
  if (page.viewportSize().width > 600) {
    await opener.click();
    await page.evaluate(key => localStorage.removeItem(key), storageKey);
    await page.mouse.click(1, 1);
    await expect(modal).not.toBeVisible();
    expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), storageKey)).version).toBe(modalVersion);
  }
});

test('current dismissal suppresses auto-open while expired, mismatched, and malformed state reopen', async ({page}) => {
  await seedPreference(page, {dismissedAt:Date.now(), version:modalVersion});
  await page.goto('/');
  await expect(page.locator('#heroModal')).not.toBeVisible();
  await page.locator('.home-guided-open').click();
  await expect(page.locator('#heroModal')).toBeVisible();
  await page.locator('[data-modal-close]').click();

  await page.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {
    key:storageKey,
    value:{dismissedAt:Date.now() - thirtyDays - 1, version:modalVersion}
  });
  await page.reload();
  await expect(page.locator('#heroModal')).toBeVisible();
  await page.locator('[data-modal-close]').click();

  await page.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {
    key:storageKey,
    value:{dismissedAt:Date.now(), version:modalVersion - 1}
  });
  await page.reload();
  await expect(page.locator('#heroModal')).toBeVisible();
  await page.locator('[data-modal-close]').click();

  await page.evaluate(key => localStorage.setItem(key, '{malformed'), storageKey);
  await page.reload();
  await expect(page.locator('#heroModal')).toBeVisible();
});

test('storage failures do not block auto-open, dismissal, or manual reopen', async ({page}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('storage unavailable'); };
  });
  await page.goto('/');
  await expect(page.locator('#heroModal')).toBeVisible();
  await page.locator('[data-modal-close]').click();
  await expect(page.locator('#heroModal')).not.toBeVisible();
  await page.locator('.home-guided-open').click();
  await expect(page.locator('#heroModal')).toBeVisible();
});

test('homepage cards open five modal journeys and the sixth hands off to .org', async ({page}, info) => {
  await seedPreference(page, {dismissedAt:Date.now(), version:modalVersion});
  await page.goto('/');
  for (const key of keys) {
    const trigger = page.locator(home(key));
    const title = await trigger.locator('strong').textContent();
    await trigger.click();
    await expect(page.locator('#heroModal')).toBeVisible();
    await expect(page.locator('#home-journey-title')).toHaveText(title);
    await expect(page.locator('#home-journey-title')).toBeFocused();
    await expect(page.locator('[data-journey-context]')).toBeVisible();
    expect(await page.locator('[data-journey-links] a').count()).toBeGreaterThan(1);
    expect(new URL(await page.locator('[data-demo-signin]').getAttribute('href')).searchParams.get('return_to')).toContain(`journey=${key}`);
    await page.locator('[data-all-questions]').click();
    await expect(page.locator('#guided-modal-title')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  await page.goto('/?journey=lifelong&route=MEASURED#audience-routing');
  await expect(page.locator('#heroModal')).toBeVisible();
  await expect(page.locator('#home-journey-title')).toHaveText('What does this mean for lifelong mobility?');
  await page.screenshot({path: info.outputPath('modal-journey.png')});
  await page.locator('[data-all-questions]').click();
  const accommodation = page.locator('[data-modal-choices] .home-journey-accommodation');
  await expect(accommodation).not.toHaveAttribute('role', 'button');
  await expect(accommodation).toHaveAttribute('href', 'https://handicapskater.org/review-tools/');
  await page.route('https://handicapskater.org/review-tools/', route => route.fulfill({contentType:'text/html', body:'<h1>Review Tools entry</h1>'}));
  await accommodation.click();
  await expect(page).toHaveURL('https://handicapskater.org/review-tools/');
});

test('one trusted broker frame survives perspective changes and trusted Escape persists dismissal', async ({page}) => {
  await seedPreference(page, {dismissedAt:Date.now(), version:modalVersion});
  let loads = 0;
  await page.unroute(portal + '/**');
  await page.route(portal + '/embed/cx**', route => {
    loads++;
    return route.fulfill({contentType:'text/html', body:`<!doctype html><h2 tabindex="-1">Guided fixture</h2><button id="child">Measured boundaries</button><button id="main">All questions</button><script>
      const parentOrigin=new URL(location.href).searchParams.get('parent_origin');
      parent.postMessage({type:'hs-ready'},parentOrigin);
      parent.postMessage({type:'hs-size',height:250},parentOrigin);
      onmessage=event=>{if(event.origin===parentOrigin&&event.data.type==='hs-journey')document.querySelector('h2').textContent=event.data.entry;};
      document.querySelector('#child').onclick=()=>document.querySelector('h2').textContent='Internal joint forces are not directly measured.';
      document.querySelector('#main').onclick=()=>parent.postMessage({type:'hs-close'},parentOrigin);
      document.addEventListener('keydown',event=>{if(event.key==='Escape')parent.postMessage({type:'hs-escape'},parentOrigin);});
    </script>`});
  });
  await page.goto('/');
  await page.locator(home('walking')).click();
  const frame = page.frameLocator('#heroModal iframe');
  await expect(frame.locator('h2')).toBeVisible();
  await frame.locator('#child').click();
  await expect(frame.locator('h2')).toContainText('not directly measured');
  await frame.locator('#main').click();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await page.locator('[data-modal-choices] [data-home-journey="evidence"]').click();
  await expect(frame.locator('h2')).toHaveText('PUBLIC_EVIDENCE');
  await page.evaluate(() => window.postMessage({type:'hs-close'}, location.origin));
  await expect(page.locator('#home-journey-panel')).toBeVisible();
  await frame.locator('#child').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#heroModal')).not.toBeVisible();
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), storageKey)).version).toBe(modalVersion);
  await page.locator(home('recognition')).click();
  await expect(frame.locator('h2')).toHaveText('PUBLIC_LEGAL');
  expect(loads).toBe(1);
  await expect(page.locator('#heroModal iframe')).toHaveCount(1);
});
