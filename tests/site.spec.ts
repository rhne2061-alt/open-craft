import { test, expect } from '@playwright/test';
test('search, category, empty state and reset work together', async ({page}) => {
  await page.goto('./');
  const total = await page.locator('[data-card]').count();
  expect(total).toBeGreaterThanOrEqual(3);
  await expect(page.locator('[data-card]:visible')).toHaveCount(total);
  const sections = await page.locator('[data-card][data-category="section"]').count();
  await page.getByRole('button',{name:'页面区块',exact:true}).click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(sections);
  await page.getByRole('searchbox').fill('not-a-real-resource');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button',{name:'清除筛选'}).click();
  await page.getByRole('searchbox').fill('Quiet Accordion');
  await expect(page.locator('[data-card]:visible').filter({hasText:'Quiet Accordion'}).first()).toBeVisible();
  await expect(page.locator('[data-card]:visible').filter({hasText:'Paper Studio'})).toHaveCount(0);
});
test('resource has sandbox preview, download and clipboard fallback',async({page})=>{
  await page.goto('resources/paper-studio/');
  await expect(page.locator('iframe')).toHaveAttribute('sandbox','');
  await expect(page.frameLocator('iframe').getByRole('heading',{name:'Small studio. Open world.'})).toBeVisible();
  await page.getByRole('button',{name:'手机',exact:true}).click();
  await expect(page.locator('iframe')).toHaveClass('mobile-preview');
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('Denied'))},configurable:true});});
  await page.getByRole('button',{name:'复制提示词'}).click();
  await expect(page.getByRole('status')).toContainText('手动复制');
  const download = page.waitForEvent('download');
  await page.getByRole('link',{name:'下载 HTML 源码'}).click();
  expect((await download).suggestedFilename()).toBe('paper-studio.html');
});
test('clipboard success is reported only after copy succeeds',async({page})=>{
  await page.goto('resources/orbit-field/');
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{document.documentElement.dataset.copied=text;}},configurable:true});});
  await page.getByRole('button',{name:'复制提示词'}).click();
  await expect(page.getByRole('status')).toContainText('已复制');
  expect(await page.locator('html').getAttribute('data-copied')).toContain('深蓝色');
});
test('native FAQ preview supports keyboard',async({page})=>{
  await page.goto('resources/quiet-accordion/');
  const summary=page.frameLocator('iframe').locator('summary').nth(1);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.frameLocator('iframe').locator('details').nth(1)).toHaveAttribute('open','');
});
test('static API matches the catalog and source files exist',async({request})=>{
  const response=await request.get('api/resources.json');
  expect(response.ok()).toBeTruthy();
  const catalog=await response.json();
  expect(catalog.schemaVersion).toBe(1);
  expect(catalog.resources.length).toBeGreaterThanOrEqual(3);
  for(const item of catalog.resources){const source=await request.get(item.download);expect(source.ok()).toBeTruthy();expect(await source.text()).toContain(`SPDX-License-Identifier: ${item.license}`);}
});
for(const width of [390,768,1440])test(`all pages fit viewport at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:950});
  const errors:string[]=[];page.on('pageerror',err=>errors.push(err.message));
  for(const path of ['./','contribute/','resources/paper-studio/','resources/orbit-field/','resources/quiet-accordion/']){
    await page.goto(path);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.getByRole('main')).toBeVisible();
  }
  expect(errors).toEqual([]);
  await page.goto('./');
  await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
});
