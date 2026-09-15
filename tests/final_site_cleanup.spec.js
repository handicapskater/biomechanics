const {test,expect}=require('@playwright/test');
const fs=require('fs');
const pages=['/','/story/','/biomechanics/','/evidence/','/access/','/case/','/evidence/strava-gps-skate-maps/','/lifelong-mobility/'];
const rgb=color=>{
  const rgbMatch=color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if(rgbMatch)return rgbMatch.slice(1,4).map(Number);
  const srgbMatch=color.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if(srgbMatch)return srgbMatch.slice(1,4).map(value=>Math.round(Number(value)*255));
  throw new Error(`Unsupported color: ${color}`);
};
const luminance=color=>rgb(color).map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
const contrast=(foreground,background)=>{
  const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
  return (values[0]+.05)/(values[1]+.05);
};
test('canonical footer, scientific section order and responsive pages',async({page},info)=>{
  await page.addInitScript(()=>localStorage.setItem('handicapskater_welcome_modal',JSON.stringify({suppressAutoOpen:true,suppressedAt:Date.now(),version:2})));
  await page.route('https://**/*',r=>r.abort());
  let canonical;
  for(const url of pages){
    await page.goto(url);
    await page.addStyleTag({content:'.home-footer-welcome,.home-footer-donate{transition:none!important}'});
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
    await guidedTour.evaluate(node=>node.addEventListener('click',event=>event.preventDefault()));
    await expect(guidedTour).toHaveAttribute('href','/?welcome=1');
    await expect(guidedTour).toHaveCSS('background-color','rgb(47, 111, 84)');
    await expect(guidedTour).toHaveCSS('min-height','44px');
    await expect(donate).toHaveCSS('min-height','44px');
    const normalColors=await Promise.all([guidedTour,donate].map(link=>link.evaluate(node=>{
      const style=getComputedStyle(node);
      return {background:style.backgroundColor,color:style.color};
    })));
    for(const colors of normalColors)expect(contrast(colors.color,colors.background),url).toBeGreaterThanOrEqual(4.5);
    expect(normalColors[0].background).not.toBe(normalColors[1].background);
    if(url==='/'){
      await expect(guidedTour).toHaveAttribute('aria-haspopup','dialog');
      await expect(guidedTour).toHaveAttribute('aria-controls','heroModal');
    }
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
    await guidedTour.focus();
    await expect(guidedTour).toBeFocused();
    await expect(guidedTour).not.toHaveCSS('outline-style','none');
    const focusColors=await guidedTour.evaluate(node=>{
      const style=getComputedStyle(node);
      return {outline:style.outlineColor,surface:getComputedStyle(node.closest('footer')).backgroundColor};
    });
    expect(contrast(focusColors.outline,focusColors.surface),url).toBeGreaterThanOrEqual(3);
    await donate.focus();
    await expect(donate).toBeFocused();
    await expect(donate).not.toHaveCSS('outline-style','none');
    await guidedTour.hover();
    const guidedHover=await guidedTour.evaluate(node=>getComputedStyle(node).backgroundColor);
    expect(contrast('rgb(255, 255, 255)',guidedHover),url).toBeGreaterThanOrEqual(4.5);
    await donate.hover();
    const donateHover=await donate.evaluate(node=>getComputedStyle(node).backgroundColor);
    expect(contrast('rgb(255, 255, 255)',donateHover),url).toBeGreaterThanOrEqual(4.5);
    await guidedTour.hover();
    await page.mouse.down();
    const guidedActive=await guidedTour.evaluate(node=>getComputedStyle(node).backgroundColor);
    expect(contrast('rgb(255, 255, 255)',guidedActive),url).toBeGreaterThanOrEqual(4.5);
    await page.mouse.move(0,0);
    await page.mouse.up();
    await footer.evaluate(node=>node.style.background='#fff');
    await expect(guidedTour).toHaveCSS('background-color','rgb(47, 111, 84)');
    expect(contrast('rgb(255, 255, 255)',await donate.evaluate(node=>getComputedStyle(node).backgroundColor)),url).toBeGreaterThanOrEqual(4.5);
    await footer.evaluate(node=>node.style.removeProperty('background'));
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
