// Step 1: correzioni dei bug dell'audit e aggiornamento mirato delle viste
import { test, expect } from '@playwright/test';
import { openApp, state } from './helpers.js';

/** n letture orarie a partire da adesso all'indietro */
const readings = (page, n) => page.evaluate(n => {
  const list = [], now = Date.now();
  for (let i = 0; i < n; i++) list.push({ datetime: Utils.toLocalDT(new Date(now - (i + 1) * 3600e3)), tempCalda: 30 + Math.sin(i / 5), tempFredda: 24, umidita: 55 });
  return Store.addMany('env', list);
}, n);

test('B1: "Azzera filtri" toglie ricerca e filtri', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'alimentazione' });
  const search = page.locator('[data-search="feeding"]');
  await search.fill('zzzz');
  await expect(page.locator('[data-reset-filters="feeding"]')).toBeVisible();
  await page.locator('[data-reset-filters="feeding"]').click();
  await expect(search).toHaveValue('');
  await expect(page.locator('[data-rows="feeding"] tbody tr').first()).toBeVisible();
});

test('B2: "Annulla" annulla l\'azione della sua notifica', async ({ page }) => {
  await openApp(page, { demo: true });
  const before = await state(page);
  await page.evaluate(() => { Actions.quickWater(true); Actions.quickMeal('Mangiato', true); });
  // La prima notifica è quella dell'acqua
  await page.locator('.toast', { hasText: 'Cambio acqua' }).locator('.t-action').click();
  await expect.poll(async () => (await state(page)).logs.maintenance.length).toBe(before.logs.maintenance.length);
  expect((await state(page)).logs.feeding.length).toBe(before.logs.feeding.length + 1);
});

test('B3: un form compilato chiede prima di scartare', async ({ page }) => {
  await openApp(page, { demo: true });
  await page.evaluate(() => Forms.open('growth'));
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);   // form intatto: si chiude subito

  await page.evaluate(() => Forms.open('growth'));
  await page.locator('.modal input[name="peso"]').fill('61');
  await page.keyboard.press('Escape');
  await expect(page.locator('.discard-bar')).toBeVisible();
  await page.locator('[data-keep-edit]').click();
  await expect(page.locator('.discard-bar')).toHaveCount(0);
  await expect(page.locator('.modal input[name="peso"]')).toHaveValue('61');
  await page.locator('.modal [data-close]').click();
  await page.locator('[data-discard]').click();
  await expect(page.locator('.overlay')).toHaveCount(0);
});

test('B4: il doppio tocco non registra due pasti', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'alimentazione' });
  const n = (await state(page)).logs.feeding.length;
  await page.locator('.interval-card [data-meal]').dblclick();
  await expect.poll(async () => (await state(page)).logs.feeding.length).toBe(n + 1);
  await page.waitForTimeout(1600);
  await page.locator('.interval-card [data-meal]').click();
  const t = page.locator('.toast', { hasText: 'già registrato' });
  await expect(t).toBeVisible();
  expect((await state(page)).logs.feeding.length).toBe(n + 1);
  await t.locator('.t-action').click();
  await expect.poll(async () => (await state(page)).logs.feeding.length).toBe(n + 2);
});

test('B5: le modifiche in corso nelle impostazioni restano se i dati cambiano', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'impostazioni' });
  await page.locator('#s-nome').fill('Nome nuovo');
  await page.locator('#s-nome').blur();
  await page.evaluate(() => Actions.quickWater(true));   // come una sincronizzazione arrivata ora
  await expect(page.locator('#s-nome')).toHaveValue('Nome nuovo');
});

test('B6 e B7: svuota lascia le cancellazioni per la sincronizzazione', async ({ page }) => {
  await openApp(page, { demo: true });
  const n = await page.evaluate(() => Store.count());
  await page.evaluate(() => Store.reset());
  const s = await state(page);
  expect(Object.keys(s.deleted).length).toBeGreaterThanOrEqual(n);
  expect(s.profileAt).not.toBe('');
  expect(s.logs.feeding.length).toBe(0);
});

test('aggiornamento mirato: terrario e grafico non vengono ricreati', async ({ page }) => {
  await openApp(page, { demo: true });
  await page.evaluate(() => { window.__terra = document.getElementById('terraWrap'); Actions.quickWater(true); });
  expect(await page.evaluate(() => document.getElementById('terraWrap') === window.__terra)).toBe(true);

  await page.evaluate(() => Router.go('clima'));
  await expect(page.locator('#chart-env canvas')).toBeVisible();
  await page.evaluate(() => { window.__cv = document.querySelector('#chart-env canvas'); Store.add('env', { datetime: Utils.nowLocal(), tempCalda: 31, tempFredda: 24, umiditaCalda: 50, umiditaFredda: 58 }); });
  expect(await page.evaluate(() => document.querySelector('#chart-env canvas') === window.__cv)).toBe(true);
  const rows = await page.locator('[data-rows="env"] tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});

test('carico: 3.000 letture restano fluide', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'clima' });
  await readings(page, 3000);
  const ms = await page.evaluate(() => {
    Charts.ranges.env = 0; Router.render(true);
    const t = [];
    for (let i = 0; i < 5; i++) { const s = performance.now(); Actions.quickWater(true); t.push(performance.now() - s); Store.undo(); }
    return t.sort((a, b) => a - b)[2];
  });
  console.log(`tocco su Acqua con 3.000 letture: ${ms.toFixed(1)} ms`);
  expect(ms).toBeLessThan(150);
  expect(await page.evaluate(() => Charts.ranges.env)).toBe(0);
});

test('B10: compattazione delle letture vecchie con annulla', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'clima' });
  await readings(page, 125 * 24);
  const r = await page.evaluate(() => {
    const before = Store.get().logs.env.length;
    const removed = Store.compactEnv(90);
    const old = Store.get().logs.env.filter(e => Utils.daysSince(e.datetime) > 91);
    const perDay = {};
    old.forEach(e => { perDay[e.datetime.slice(0, 10)] = (perDay[e.datetime.slice(0, 10)] || 0) + 1; });
    return { before, removed, after: Store.get().logs.env.length, maxPerDay: Math.max(...Object.values(perDay)) };
  });
  expect(r.removed).toBeGreaterThan(500);
  expect(r.after).toBe(r.before - r.removed);
  expect(r.maxPerDay).toBeLessThanOrEqual(4);
  await page.evaluate(() => Store.undo());
  expect(await page.evaluate(() => Store.get().logs.env.length)).toBe(r.before);
});

test('B10: spazio esaurito avvisa e propone di liberare spazio', async ({ page }) => {
  await openApp(page, { demo: true });
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === 'cornSnakeManager.v1') { const e = new Error('pieno'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); };
    Actions.quickWater(true);
  });
  await expect(page.locator('.toast', { hasText: 'Spazio del browser esaurito' })).toBeVisible();
  expect(await page.evaluate(() => Store.unsaved)).toBe(true);
});
