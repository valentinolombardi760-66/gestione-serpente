import { test, expect } from '@playwright/test';
import { openApp } from './helpers.js';

const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const base = (extra = {}) => ({ version: 3, profile: { nome: 'Test', dataNascita: iso(400), intervalloAuto: true, ...(extra.profile || {}) }, logs: { growth: [], feeding: [], shed: [], env: [], maintenance: [], handling: [], ...(extra.logs || {}) } });

test('brumazione: pasti sospesi e soglie invernali', async ({ page }) => {
  const errors = await openApp(page, { data: base({ profile: { brumInizio: iso(10), brumFine: iso(-40) }, logs: { feeding: [{ data: iso(30), preda: 'Topo adulto', esito: 'Mangiato' }], env: [{ datetime: iso(0) + 'T09:00', tempCalda: 14, tempFredda: 12, umidita: 50 }] } }) });
  const r = await page.evaluate(() => ({ b: Logic.brumState().active, p: Logic.feedingState().paused, t: Logic.evalParam('tempCalda', 14).status, late: Logic.alerts().some(a => /ritardo/.test(a.title)) }));
  expect(r).toEqual({ b: true, p: 'brumazione', t: 'ok', late: false });
  await expect(page.locator('#terraWrap')).toHaveAttribute('data-brum', '1');
  expect(errors).toEqual([]);
});

test('intervallo automatico per età e peso', async ({ page }) => {
  await openApp(page, { data: base({ logs: { growth: [{ data: iso(2), peso: 20 }] } }) });
  expect(await page.evaluate(() => Logic.targetInterval())).toBe(6);
  await page.evaluate(() => Store.add('growth', { data: Utils.todayISO(), peso: 300 }));
  expect(await page.evaluate(() => Logic.targetInterval())).toBe(13);
});

test('calo di peso oltre il 10% in 30 giorni dà un allarme', async ({ page }) => {
  await openApp(page, { data: base({ logs: { growth: [{ data: iso(25), peso: 300 }, { data: iso(1), peso: 260 }] } }) });
  expect(await page.evaluate(() => Logic.alerts().some(a => a.level === 'bad' && /Calo di peso/.test(a.title)))).toBe(true);
});

test('3 rifiuti di fila fuori dalla muta danno un allarme, in muta no', async ({ page }) => {
  const feeding = [9, 6, 3].map(d => ({ data: iso(d), preda: 'Hopper', esito: 'Rifiutato' }));
  await openApp(page, { data: base({ logs: { feeding } }) });
  expect(await page.evaluate(() => Logic.refusals())).toBe(3);
  await page.evaluate(d => Store.add('shed', { dataInizio: d, esito: 'In corso' }), iso(12));
  expect(await page.evaluate(() => Logic.refusals())).toBe(0);
  expect(await page.evaluate(() => Logic.feedingState().paused)).toBe('muta');
});

test('farmaco: dose segnata e promemoria', async ({ page }) => {
  await openApp(page, { data: base({ logs: { med: [{ id: 'm1', farmaco: 'Vitamine', ogniGiorni: 2, dataInizio: iso(4), dosi: [iso(4), iso(2)] }] } }), hash: 'salute' });
  await page.evaluate(() => { Views.tabs.salute = 'med'; Router.render(true); });
  await expect(page.locator('[data-dose="m1"]')).toBeEnabled();
  await page.locator('[data-dose="m1"]').click();
  await expect(page.locator('[data-dose="m1"]')).toBeDisabled();
  expect(await page.evaluate(() => Store.get().logs.med[0].dosi.length)).toBe(3);
});
