const {test,expect}=require('@playwright/test');
const fs=require('fs');
const pages=['/','/story/','/biomechanics/','/evidence/','/access/','/case/','/evidence/strava-gps-skate-maps/','/lifelong-mobility/'];
test('canonical footer, scientific section order and responsive pages',async({page},info)=>{
  await page.addInitScript(()=>localStorage.setItem('handicapskater_welcome_modal',JSON.stringify({suppressAutoOpen:true,suppressedAt:Date.now(),version:2})));
  await page.route('https://**/*',r=>r.abort());
  let canonical;
  for(const url of pages){
    await page.goto(url);
    const footer=page.locator('#site-footer footer');
    await expect(footer).toHaveCount(1);
    const html=await footer.evaluate(node=>{
      const clone=node.cloneNode(true);
      clone.querySelector('[data-welcome-modal]')?.removeAttribute('aria-haspopup');
      clone.querySelector('[data-welcome-modal]')?.removeAttribute('aria-controls');
      return clone.innerHTML;
    });
    if(!canonical)canonical=html;else expect(html).toBe(canonical);
    await expect(footer.locator('a')).toHaveCount(9);
    await expect(footer.getByRole('link',{name:'Facebook',exact:true})).toHaveAttribute('href','https://www.facebook.com/RollerGracie/');
    const guidedTour=footer.getByRole('link',{name:'Guided Tour',exact:true});
    const social=footer.locator('.home-footer-social');
    const donate=footer.getByRole('link',{name:'Donate / Support',exact:true});
    await expect(guidedTour).toHaveAttribute('href','/?welcome=1');
    await expect(guidedTour).toHaveCSS('background-color','rgb(246, 199, 107)');
    await expect(donate).not.toHaveCSS('background-color','rgba(0, 0, 0, 0)');
    await expect(guidedTour).toHaveCSS('min-height','44px');
    await expect(donate).toHaveCSS('min-height','44px');
    if(url==='/'){
      await expect(guidedTour).toHaveAttribute('aria-haspopup','dialog');
      await expect(guidedTour).toHaveAttribute('aria-controls','heroModal');
    }
    await guidedTour.focus();
    await expect(guidedTour).toBeFocused();
    await expect(guidedTour).not.toHaveCSS('outline-style','none');
    await donate.focus();
    await expect(donate).toBeFocused();
    await expect(donate).not.toHaveCSS('outline-style','none');
    const guidedBox=await guidedTour.boundingBox();
    const socialBox=await social.boundingBox();
    const donateBox=await donate.boundingBox();
    if(page.viewportSize().width>600){
      expect(guidedBox.x+guidedBox.width).toBeLessThanOrEqual(socialBox.x);
      expect(socialBox.x+socialBox.width).toBeLessThanOrEqual(donateBox.x);
    }else{
      expect(guidedBox.x+guidedBox.width/2).toBeCloseTo(page.viewportSize().width/2,-1);
      expect(socialBox.x+socialBox.width/2).toBeCloseTo(page.viewportSize().width/2,-1);
      expect(donateBox.x+donateBox.width/2).toBeCloseTo(page.viewportSize().width/2,-1);
    }
    expect(await footer.evaluate(node=>node.scrollWidth<=node.clientWidth),url).toBe(true);
    for(const box of [guidedBox,socialBox,donateBox]){
      expect(box.x,url).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width,url).toBeLessThanOrEqual(page.viewportSize().width);
    }
    if(['/','/story/','/biomechanics/','/lifelong-mobility/'].includes(url))
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBe(true);
    if(url==='/biomechanics/'){
      const text=await page.locator('main').innerText();
      expect(text.indexOf('Observation, theory, testing'.toUpperCase())).toBeLessThan(text.indexOf('From contact to the spine'.toUpperCase()));
      await expect(page.locator('#scientific-method')).toHaveCount(1);
      await expect(page.locator('#record-types-title')).toHaveCount(1);
      await expect(page.locator('#pelvic-structure')).toBeVisible();
    }
    if(url==='/story/')await expect(page.locator('#scientific-method,#record-types-title')).toHaveCount(0);
    if(['/','/story/','/biomechanics/','/lifelong-mobility/'].includes(url)){
      fs.mkdirSync('test-results/final-cleanup',{recursive:true});
      await page.screenshot({path:`test-results/final-cleanup/${info.project.name}-${url.replaceAll('/','')||'home'}.png`,fullPage:true});
    }
  }
});
