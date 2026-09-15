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
    await expect(footer.getByRole('link',{name:'Welcome',exact:true})).toHaveAttribute('href','/?welcome=1');
    if(url==='/'){
      await expect(footer.getByRole('link',{name:'Welcome',exact:true})).toHaveAttribute('aria-haspopup','dialog');
      await expect(footer.getByRole('link',{name:'Welcome',exact:true})).toHaveAttribute('aria-controls','heroModal');
    }
    await footer.getByRole('link',{name:'Donation',exact:true}).focus();
    await expect(footer.getByRole('link',{name:'Donation',exact:true})).toBeFocused();
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
