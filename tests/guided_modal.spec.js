const {test, expect} = require('@playwright/test');

const portal = 'https://hs-portal-324477223314.us-central1.run.app';
const storageKey = 'handicapskater_welcome_modal';
const modalVersion = 2;
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
const keys = ['walking', 'rolling', 'evidence', 'lifelong', 'recognition'];
const home = key => `main [data-home-journey="${key}"]`;
const currentPreference = () => ({suppressAutoOpen:true, suppressedAt:Date.now(), version:modalVersion});

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

test('fresh browser auto-opens; only the explicit checkbox suppresses later auto-open', async ({page, browserName}, info) => {
  await page.goto('/');
  const modal = page.locator('#heroModal');
  const checkbox = modal.getByRole('checkbox', {name:"Don't show this again"});
  const opener = page.locator('.home-guided-open');
  const footerOpener = page.locator('[data-welcome-modal]');
  const close = modal.locator('[data-modal-close]');

  await expect(modal).toBeVisible();
  await expect(page.locator('#guided-modal-title')).toBeFocused();
  await expect(page.locator('#main')).toHaveJSProperty('inert', true);
  await expect(checkbox).not.toBeChecked();
  await expect(opener).toHaveText('Explore HandicapSkater');
  await expect(footerOpener).toHaveText('Welcome');
  await expect(footerOpener).toHaveAttribute('href', '/?welcome=1');
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

  const closeBox = await close.boundingBox();
  const checkboxBox = await checkbox.boundingBox();
  expect(closeBox.y).toBeGreaterThanOrEqual(0);
  expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(checkboxBox.y + checkboxBox.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await modal.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('modal-landing.png')});

  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.reload();
  await expect(modal).toBeVisible();
  await close.click();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.reload();
  await expect(modal).toBeVisible();

  await checkbox.check();
  const suppressed = JSON.parse(await page.evaluate(key => localStorage.getItem(key), storageKey));
  expect(suppressed).toMatchObject({suppressAutoOpen:true, version:modalVersion});
  expect(Date.now() - suppressed.suppressedAt).toBeLessThan(5000);
  await close.click();
  await page.reload();
  await expect(modal).not.toBeVisible();

  const beforeManualOpen = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await footerOpener.click();
  await expect(modal).toBeVisible();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await expect(checkbox).toBeChecked();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeManualOpen);
  await close.click();
  await expect(footerOpener).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeManualOpen);
  await page.reload();
  await expect(modal).not.toBeVisible();
  await opener.click();
  await expect(modal).toBeVisible();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await close.click();
  await expect(opener).toBeFocused();
});

test('current suppression is respected while expired, mismatched, and malformed state reopen', async ({page}) => {
  await seedPreference(page, currentPreference());
  await page.goto('/');
  const modal = page.locator('#heroModal');
  const checkbox = modal.getByRole('checkbox', {name:"Don't show this again"});
  await expect(modal).not.toBeVisible();

  await page.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {
    key:storageKey,
    value:{suppressAutoOpen:true, suppressedAt:Date.now() - thirtyDays - 1, version:modalVersion}
  });
  await page.reload();
  await expect(modal).toBeVisible();
  await expect(checkbox).not.toBeChecked();
  await page.locator('[data-modal-close]').click();

  await page.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {
    key:storageKey,
    value:{suppressAutoOpen:true, suppressedAt:Date.now(), version:modalVersion - 1}
  });
  await page.reload();
  await expect(modal).toBeVisible();
  await expect(checkbox).not.toBeChecked();
  await page.locator('[data-modal-close]').click();

  await page.evaluate(key => localStorage.setItem(key, '{malformed'), storageKey);
  await page.reload();
  await expect(modal).toBeVisible();
  await expect(checkbox).not.toBeChecked();
});

test('storage failures do not block auto-open, checkbox choice, close, or manual reopen', async ({page}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('storage unavailable'); };
    Storage.prototype.removeItem = () => { throw new Error('storage unavailable'); };
  });
  await page.goto('/');
  const modal = page.locator('#heroModal');
  await expect(modal).toBeVisible();
  await modal.getByRole('checkbox', {name:"Don't show this again"}).check();
  await page.locator('[data-modal-close]').click();
  await expect(modal).not.toBeVisible();
  await page.locator('[data-welcome-modal]').click();
  await expect(modal).toBeVisible();
});

test('shared footer reopens landing from another page without clearing suppression', async ({page}) => {
  await seedPreference(page, currentPreference());
  await page.goto('/story/');
  const footerOpener = page.locator('[data-welcome-modal]');
  await expect(footerOpener).toHaveText('Welcome');
  await expect(footerOpener).toHaveAttribute('href', '/?welcome=1');
  const beforeManualOpen = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await footerOpener.click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#heroModal')).toBeVisible();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await expect(page.getByRole('checkbox', {name:"Don't show this again"})).toBeChecked();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeManualOpen);
  await page.locator('[data-modal-close]').click();
  await expect(page.locator('[data-welcome-modal]')).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeManualOpen);
  await page.reload();
  await expect(page.locator('#heroModal')).not.toBeVisible();
});

test('homepage cards open five modal journeys and the sixth hands off to .org', async ({page}, info) => {
  await seedPreference(page, currentPreference());
  await page.goto('/');
  const beforeJourneys = await page.evaluate(key => localStorage.getItem(key), storageKey);
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
    expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), storageKey)).toBe(beforeJourneys);
    await page.locator('[data-all-questions]').click();
    await expect(page.locator('#guided-modal-title')).toBeFocused();
    expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), storageKey)).toBe(beforeJourneys);
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

test('one trusted broker frame survives perspective changes and preserves suppression on Escape', async ({page}) => {
  await seedPreference(page, currentPreference());
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
  const beforeJourney = await page.evaluate(key => localStorage.getItem(key), storageKey);
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
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(beforeJourney);
  await page.locator(home('recognition')).click();
  await expect(frame.locator('h2')).toHaveText('PUBLIC_LEGAL');
  expect(loads).toBe(1);
  await expect(page.locator('#heroModal iframe')).toHaveCount(1);
});
