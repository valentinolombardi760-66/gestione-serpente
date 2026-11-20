import { test, expect } from '@playwright/test';
import { openApp, checkView } from './helpers.js';

const VIEWS = ['dashboard', 'clima', 'alimentazione', 'cura', 'salute', 'impostazioni'];

test('app vuota: tutte le viste si aprono senza errori', async ({ page }) => {
  const errors = await openApp(page);
  for (const v of VIEWS) { await page.evaluate(v => Router.go(v), v); await checkView(page); }
  expect(errors).toEqual([]);
});

test('dati demo: viste, schede e grafici senza errori', async ({ page }) => {
  const errors = await openApp(page, { demo: true });
  for (const v of VIEWS) {
    await page.evaluate(v => Router.go(v), v);
    await checkView(page);
  }
  for (const [view, tabs] of [['alimentazione', ['feeding', 'growth']], ['cura', ['shed', 'maintenance', 'handling']], ['salute', ['waste', 'symptom', 'vet', 'med', 'foto']]]) {
    for (const t of tabs) { await page.evaluate(([v, t]) => { Views.tabs[v] = t; Router.go(v); }, [view, t]); await checkView(page); }
  }
  await page.evaluate(() => Router.go('dashboard'));
  await expect(page.locator('#todayCard')).toBeVisible();
  await expect(page.locator('.hs-btn')).toHaveCount(3);
  const box = await page.locator('.hs-btn').first().boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});

test('nessuna emoji rimasta nell\'interfaccia', async ({ page }) => {
  await openApp(page, { demo: true });
  for (const v of VIEWS) {
    await page.evaluate(v => Router.go(v), v);
    const emoji = await page.evaluate(() => (document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{263F}\u{2643}-\u{27BF}]/gu) || []));
    expect(emoji, v).toEqual([]);
  }
});

test('ricerca globale trova un pasto e lo apre', async ({ page }) => {
  await openApp(page, { demo: true });
  await page.keyboard.press('/');
  await page.locator('#gSearch').fill('hopper');
  await expect(page.locator('.g-hit').first()).toBeVisible();
  await page.locator('.g-hit').first().click();
  await expect(page.locator('form .field-label', { hasText: 'Preda' }).first()).toBeVisible();
});

test('scheda veterinaria si apre', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'salute' });
  await page.locator('[data-vetsheet]').click();
  await expect(page.locator('.vs-preview')).toContainText('Pepe');
});

test('collegamento rapido ?azione=acqua registra il cambio acqua', async ({ page }) => {
  await openApp(page, { demo: true });
  const before = await page.evaluate(() => Store.get().logs.maintenance.filter(m => m.tipo === 'Cambio acqua').length);
  await page.goto('/index.html?azione=acqua#dashboard');
  await expect.poll(() => page.evaluate(() => Store.get().logs.maintenance.filter(m => m.tipo === 'Cambio acqua').length)).toBe(before + 1);
});
