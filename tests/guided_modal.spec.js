const {test, expect} = require('@playwright/test');
const portal = 'https://hs-portal-324477223314.us-central1.run.app';
const keys = ['walking', 'rolling', 'evidence', 'lifelong', 'recognition'];
const home = key => `main [data-home-journey="${key}"]`;

test('motorcycle landing, canonical choices, video, focus trap and restoration', async ({page, browserName}, info) => {
  await page.route(portal + '/**', route => route.abort());
  await page.goto('/');
  const trigger = page.locator('.home-guided-open');
  await trigger.click();
  const modal = page.locator('#heroModal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#guided-modal-title')).toBeFocused();
  const source = await page.locator('main .home-journey-grid a').evaluateAll(a => a.map(x => [x.textContent, x.href]));
  expect(await modal.locator('[data-modal-choices] a').evaluateAll(a => a.map(x => [x.textContent, x.href]))).toEqual(source);
  const video = await page.locator('.home-motorcycle-hook figure a').getAttribute('href');
  await expect(modal.locator('[data-modal-video] a')).toHaveAttribute('href', video);
  await expect(modal.locator('[data-modal-video] a')).toHaveAccessibleName(/Watch Troy ride/);
  await expect(modal.locator('[data-modal-video-text]')).toHaveAttribute('href', video);
  await expect(modal.locator('img')).toBeVisible();
  expect(await modal.locator('img').evaluate(x => x.naturalWidth)).toBeGreaterThan(0);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await page.evaluate(() => document.activeElement.closest('#heroModal') !== null)).toBe(true);
  }
  await modal.locator('[data-modal-choices] a').last().scrollIntoViewIfNeeded();
  const close = modal.locator('[data-modal-close]');
  const box = await close.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await modal.evaluate(x => x.scrollWidth <= x.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.guided-modal-scroll').evaluate(x => x.scrollTop = 0);
  await page.screenshot({path: info.outputPath('modal-landing.png')});
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.locator('body').evaluate(x => x.style.overflow)).not.toBe('hidden');
  await trigger.click(); await close.click(); await expect(trigger).toBeFocused();
});

test('five direct journeys, all questions, offline fallback, return URL and .org', async ({page}, info) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.route(portal + '/**', route => route.abort());
  await page.goto('/');
  for (const key of keys) {
    const trigger = page.locator(home(key));
    const title = await trigger.locator('strong').textContent();
    await trigger.click();
    await expect(page.locator('#home-journey-title')).toHaveText(title);
    await expect(page.locator('#home-journey-title')).toBeFocused();
    await expect(page.locator('[data-journey-context]')).toBeVisible();
    expect(await page.locator('[data-journey-links] a').count()).toBeGreaterThan(1);
    const login = new URL(await page.locator('[data-demo-signin]').getAttribute('href'));
    expect(login.searchParams.get('return_to')).toContain(`journey=${key}`);
    await page.locator('[data-all-questions]').click();
    await expect(page.locator('#guided-modal-title')).toBeFocused();
    await page.locator('[data-modal-choices] [data-home-journey="evidence"]').click();
    await expect(page.locator('#home-journey-title')).toHaveText('Is there actual evidence?');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  await page.goto('/?journey=lifelong&route=MEASURED#audience-routing');
  await expect(page.locator('#heroModal')).toBeVisible();
  await expect(page.locator('#home-journey-title')).toHaveText('What does this mean for lifelong mobility?');
  await page.screenshot({path: info.outputPath('modal-journey.png')});
  await page.locator('[data-all-questions]').click();
  const accommodation=page.locator('[data-modal-choices] .home-journey-accommodation');
  await expect(accommodation).not.toHaveAttribute('role','button');
  await expect(accommodation).toHaveAttribute('href','https://handicapskater.org/review-tools/');
  await page.route('https://handicapskater.org/review-tools/', r=>r.fulfill({contentType:'text/html',body:'<h1>NSMAEP entry</h1>'}));
  await accommodation.click();
  await expect(page).toHaveURL('https://handicapskater.org/review-tools/');
  expect(errors).toEqual([]);
});

test('one trusted broker frame survives perspective changes and rejects forged messages', async ({page}) => {
  let loads=0;
  await page.route(portal + '/embed/cx**', route => {
    loads++;
    return route.fulfill({contentType:'text/html',body:`<!doctype html><h2 tabindex="-1">Guided fixture</h2><button id="child">Measured boundaries</button><button id="main">All questions</button><script>
      const p=new URL(location.href).searchParams.get('parent_origin');
      parent.postMessage({type:'hs-ready'},p);
      parent.postMessage({type:'hs-size',height:250},p);
      onmessage=e=>{if(e.origin===p&&e.data.type==='hs-journey') document.querySelector('h2').textContent=e.data.entry;};
      document.querySelector('#child').onclick=()=>document.querySelector('h2').textContent='Internal joint forces are not directly measured.';
      document.querySelector('#main').onclick=()=>parent.postMessage({type:'hs-close'},p);
      document.addEventListener('keydown',e=>{if(e.key==='Escape')parent.postMessage({type:'hs-escape'},p);});
    </script>`});
  });
  await page.goto('/');
  await page.locator(home('walking')).click();
  const frame=page.frameLocator('#heroModal iframe');
  await expect(frame.locator('h2')).toBeVisible();
  await frame.locator('#child').click();
  await expect(frame.locator('h2')).toContainText('not directly measured');
  await frame.locator('#main').click();
  await expect(page.locator('[data-modal-landing]')).toBeVisible();
  await page.locator('[data-modal-choices] [data-home-journey="evidence"]').click();
  await expect(frame.locator('h2')).toHaveText('PUBLIC_EVIDENCE');
  await page.evaluate(()=>window.postMessage({type:'hs-close'},location.origin));
  await expect(page.locator('#home-journey-panel')).toBeVisible();
  await frame.locator('#child').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#heroModal')).not.toBeVisible();
  await page.locator(home('recognition')).click();
  await expect(frame.locator('h2')).toHaveText('PUBLIC_LEGAL');
  expect(loads).toBe(1);
  await expect(page.locator('#heroModal iframe')).toHaveCount(1);
});
