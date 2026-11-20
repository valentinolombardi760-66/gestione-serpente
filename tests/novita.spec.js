import { test, expect } from '@playwright/test';
import { openApp, checkView } from './helpers.js';

const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const base = (extra = {}) => ({ version: 3, profile: { nome: 'Test', dataNascita: iso(400), dataArrivo: iso(300), intervalloAuto: true, scortaMin: 2, ...(extra.profile || {}) }, logs: { growth: [], feeding: [], shed: [], env: [], maintenance: [], handling: [], ...(extra.logs || {}) } });

test('scorte: i pasti scalano il congelatore e avvisano quando sono poche', async ({ page }) => {
  const errors = await openApp(page, { data: base({ logs: { stock: [{ data: iso(20), preda: 'Hopper', quantita: 5, costo: 10 }], feeding: [{ data: iso(14), preda: 'Hopper', esito: 'Mangiato' }] } }) });
  let s = await page.evaluate(() => Logic.stockState());
  expect(s.cur.left).toBe(4);
  expect(await page.evaluate(() => Logic.alerts().some(a => /congelatore|Restano/.test(a.title)))).toBe(false);
  await page.evaluate(d => { Store.add('feeding', { data: d[0], preda: 'Hopper', esito: 'Mangiato' }); Store.add('feeding', { data: d[1], preda: 'Hopper', esito: 'Mangiato' }); }, [iso(7), iso(1)]);
  s = await page.evaluate(() => Logic.stockState());
  expect(s.cur.left).toBe(2);
  expect(await page.evaluate(() => Logic.alerts().some(a => a.level === 'warn' && /Restano/.test(a.title)))).toBe(true);
  expect(errors).toEqual([]);
});

test('taglia consigliata dal peso', async ({ page }) => {
  await openApp(page, { data: base() });
  expect(await page.evaluate(() => [10, 40, 70, 200].map(w => Logic.preyForWeight(w)))).toEqual(['Pinky', 'Fuzzy', 'Hopper', 'Topo adulto']);
});

test('spese: totali del mese, dell anno e per categoria', async ({ page }) => {
  await openApp(page, { data: base({ logs: { expense: [{ data: iso(0), categoria: 'Substrato e arredo', importo: 12.5 }, { data: iso(0), categoria: 'Altro', importo: 7.25 }], stock: [{ data: iso(0), preda: 'Hopper', quantita: 10, costo: 15 }] } }) });
  const e = await page.evaluate(() => Logic.expenseSummary());
  expect(e.month).toBe(34.75);
  expect(e.total).toBe(34.75);
  expect(e.byCat.Prede).toBe(15);
  expect(e.months).toHaveLength(12);
});

test('sincronizzazione: vince la modifica più recente e le cancellazioni si propagano', async ({ page }) => {
  await openApp(page, { data: base() });
  const r = await page.evaluate(() => {
    const a = Store.add('expense', { data: Utils.todayISO(), categoria: 'Altro', importo: 5, descrizione: 'locale' });
    const b = Store.add('expense', { data: Utils.todayISO(), categoria: 'Altro', importo: 9, descrizione: 'da cancellare' });
    const local = Store.get().logs.expense;
    const ea = local.find(x => x.descrizione === 'locale');
    const eb = local.find(x => x.descrizione === 'da cancellare');
    const future = new Date(Date.now() + 60000).toISOString();
    const remote = JSON.parse(JSON.stringify(Store.get()));
    remote.logs.expense = [{ ...ea, descrizione: 'remota', _m: future }, { id: 'nuova1', data: Utils.todayISO(), categoria: 'Altro', importo: 1, _m: future }];
    remote.deleted = { [eb.id]: future };
    const stats = Store.syncMerge(remote);
    const out = Store.get().logs.expense.map(x => x.descrizione || x.id).sort();
    const again = Store.syncMerge(remote);
    return { stats, out, again };
  });
  expect(r.out).toEqual(['nuova1', 'remota']);
  expect(r.stats).toEqual({ added: 1, changed: 1, removed: 1 });
  expect(r.again).toEqual({ added: 0, changed: 0, removed: 0 });
});

test('nuove schermate e tema chiaro', async ({ page }) => {
  const errors = await openApp(page, { demo: true });
  for (const v of ['gestione', 'storia']) {
    await page.evaluate(h => { location.hash = h; }, v);
    await expect(page.locator('#view-' + v)).toBeVisible();
    await checkView(page);
  }
  await expect(page.locator('#view-storia .story-ev').first()).toBeVisible();
  await page.evaluate(() => { location.hash = 'impostazioni'; });
  await page.locator('[data-theme-set="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-accent="viola"]').click();
  const acc = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  expect(acc).not.toBe('#3ddc97');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('telefono: il menu porta a spese e storia', async ({ page }, info) => {
  test.skip(info.project.name !== 'telefono');
  await openApp(page, { demo: true });
  await page.locator('#topGear').click();
  await page.locator('.menu-item', { hasText: 'Storia' }).click();
  await expect(page.locator('#view-storia')).toBeVisible();
});
