// Step 3: giro di controllo, agenda, previsioni, comando rapido, macchina del tempo
import { test, expect } from '@playwright/test';
import { openApp, state, checkView } from './helpers.js';

test('giro di controllo: più voci insieme, un solo Annulla', async ({ page }) => {
  const errors = await openApp(page, { demo: true });
  const before = await state(page);
  await page.locator('.quick-btn[data-round]').click();
  const form = page.locator('#roundForm');
  await expect(form).toBeVisible();
  await form.locator('input[name="tempCalda"]').fill('31.5');
  await form.locator('label.rd-row', { hasText: 'Acqua' }).locator('.switch').click({ force: true });
  await page.evaluate(() => { const f = document.getElementById('roundForm'); f.elements.water.checked = true; f.elements.growth.checked = true; f.dispatchEvent(new Event('change')); });
  await expect(form.locator('[data-rd-more="growth"]')).toBeVisible();
  await form.locator('input[name="peso"]').fill('62');
  await page.locator('[data-rd-save]').click();
  const t = page.locator('.toast', { hasText: 'Giro salvato' });
  await expect(t).toBeVisible();
  const after = await state(page);
  expect(after.logs.env.length).toBe(before.logs.env.length + 1);
  expect(after.logs.env[0].tempCalda).toBe(31.5);
  expect(after.logs.growth.length).toBe(before.logs.growth.length + 1);
  await t.locator('.t-action').click();
  await expect.poll(async () => (await state(page)).logs.env.length).toBe(before.logs.env.length);
  expect((await state(page)).logs.growth.length).toBe(before.logs.growth.length);
  expect(errors).toEqual([]);
});

test('comando rapido: le frasi diventano registrazioni', async ({ page }) => {
  await openApp(page, { demo: true });
  const r = await page.evaluate(() => {
    const P = s => Cmd.parse(s);
    return {
      meal: P('ha mangiato hopper 6 g ieri'), refuse: P('ha rifiutato il topo'),
      env: P('calda 31 fredda 24 umidità 55%'), env2: P('30,5 gradi 55%'),
      water: P('acqua'), weight: P('peso 58 g'), waste: P('feci molli'),
      shed: P('inizio muta'), nav: P('vai a clima'), search: P('cerca rifiutato'),
      hand: P('handling 15 minuti soffia'), none: P('xyz qwerty'), yesterday: Utils.toISODate(Utils.addDays(Utils.parse(Utils.todayISO()), -1))
    };
  });
  expect(r.meal).toMatchObject({ kind: 'add', type: 'feeding', data: { preda: 'Hopper', pesoPreda: 6, esito: 'Mangiato', data: r.yesterday } });
  expect(r.refuse.data.esito).toBe('Rifiutato');
  expect(r.env.data).toMatchObject({ tempCalda: 31, tempFredda: 24, umidita: 55 });
  expect(r.env2.data).toMatchObject({ tempCalda: 30.5, umidita: 55 });
  expect(r.water).toMatchObject({ type: 'maintenance', data: { tipo: 'Cambio acqua' } });
  expect(r.weight).toMatchObject({ type: 'growth', data: { peso: 58 } });
  expect(r.waste.data.aspetto).toBe('Molli / liquide');
  expect(r.shed.data.esito).toBe('In corso');
  expect(r.nav).toMatchObject({ kind: 'nav', to: 'clima' });
  expect(r.search).toMatchObject({ kind: 'search', q: 'rifiutato' });
  expect(r.hand.data).toMatchObject({ durata: 15, comportamento: 'Difensivo / Soffia' });
  expect(r.none).toBeNull();
});

test('comando rapido: Ctrl+K, anteprima, Invio salva', async ({ page, isMobile }) => {
  test.skip(isMobile, 'scorciatoia da tastiera');
  await openApp(page, { demo: true });
  const n = (await state(page)).logs.growth.length;
  await page.keyboard.press('Control+k');
  const inp = page.locator('#cmdInput');
  await expect(inp).toBeFocused();
  await inp.fill('peso 63,2 g');
  await expect(page.locator('.cmd-prev')).toContainText('63,2');
  await inp.press('Enter');
  await expect(page.locator('.toast', { hasText: 'registrata' })).toBeVisible();
  expect((await state(page)).logs.growth.length).toBe(n + 1);
});

test('agenda: previsioni, spostare il pasto e annullare', async ({ page }) => {
  const errors = await openApp(page, { demo: true, hash: 'agenda' });
  await checkView(page);
  await expect(page.locator('.fc-tile')).toHaveCount(4);
  await expect(page.locator('.ag-day')).toHaveCount(14);
  const meal = page.locator('.ag-item[data-movable]');
  await expect(meal).toHaveCount(1);
  const from = await meal.evaluate(el => el.closest('.ag-day').dataset.day);
  await meal.locator('[data-ag-move]').click();
  const target = await page.evaluate(f => Utils.toISODate(Utils.addDays(Utils.parse(f > Utils.todayISO() ? f : Utils.todayISO()), 2)), from);
  await page.locator(`[data-move-to="${target}"]`).click();
  await expect(page.locator(`.ag-day[data-day="${target}"] .ag-item[data-movable]`)).toBeVisible();
  expect(await page.evaluate(() => Logic.feedingState().next)).toBe(target);
  await page.locator('.toast', { hasText: 'Pasto spostato' }).locator('.t-action').click();
  await expect.poll(() => page.evaluate(() => Logic.feedingState().moved)).toBeNull();
  expect(errors).toEqual([]);
});

test('agenda: trascinare il pasto su un altro giorno', async ({ page, isMobile }) => {
  test.skip(isMobile, 'trascinamento con il mouse');
  await openApp(page, { demo: true, hash: 'agenda' });
  const days = page.locator('.ag-day');
  const target = await days.nth(5).getAttribute('data-day');
  await page.locator('.ag-item[data-movable]').dragTo(days.nth(5));
  await expect.poll(() => page.evaluate(() => Logic.feedingState().next)).toBe(target);
});

test('agenda: "Fatto" su una voce di oggi la registra', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'agenda' });
  await page.evaluate(() => { const s = JSON.parse(JSON.stringify(Store.get())); s.logs.maintenance = s.logs.maintenance.filter(m => m.tipo !== 'Cambio acqua'); Store.replace(s); });
  const btn = page.locator('.ag-day.today [data-ag-do^="water"]');
  await expect(btn).toBeVisible();
  const n = (await state(page)).logs.maintenance.length;
  await btn.click();
  await expect.poll(async () => (await state(page)).logs.maintenance.length).toBe(n + 1);
  await expect(page.locator('.ag-day.today .ag-item.done', { hasText: 'acqua' })).toBeVisible();
});

test('agenda: scorrere a destra segna fatta la voce', async ({ page, isMobile }) => {
  await openApp(page, { demo: true, hash: 'agenda' });
  await page.evaluate(() => { const s = JSON.parse(JSON.stringify(Store.get())); s.logs.maintenance = s.logs.maintenance.filter(m => m.tipo !== 'Cambio acqua'); Store.replace(s); });
  const it = page.locator('.ag-day.today .ag-item[data-swipe][data-ag^="water"]');
  await expect(it).toBeVisible();
  const n = (await state(page)).logs.maintenance.length;
  await it.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const b = await it.locator('.ag-txt').boundingBox();
  const y = b.y + b.height / 2;
  if (isMobile) {
    // Tocco vero (CDP): come un dito che scorre
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', b.x + 5);
    for (let i = 1; i <= 8; i++) await touch('touchMove', b.x + 5 + i * 18);
    await touch('touchEnd');
  } else {
    await page.mouse.move(b.x + 5, y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + 5 + i * 18, y);
    await page.mouse.up();
  }
  await expect.poll(async () => (await state(page)).logs.maintenance.length).toBe(n + 1);
});

test('previsioni: muta, peso, taglia e scorte con i dati demo', async ({ page }) => {
  await openApp(page, { demo: true });
  const p = await page.evaluate(() => Logic.predictions());
  expect(p.shed.ok).toBe(true);
  expect(p.shed.from <= p.shed.date && p.shed.date <= p.shed.to).toBe(true);
  expect(p.weight.ok).toBe(true);
  expect(p.weight.w90).toBeGreaterThan(p.weight.w30 - 1);
  expect(p.weight.b90).toBeGreaterThanOrEqual(p.weight.b30);
  expect(p.stock.ok).toBe(true);
});

test('macchina del tempo: il terrario mostra i giorni passati senza toccare i dati', async ({ page }) => {
  const errors = await openApp(page, { demo: true });
  const before = JSON.stringify((await state(page)).logs);
  const range = page.locator('#ttRange');
  await expect(range).toBeVisible();
  await page.evaluate(() => { window.__w = document.getElementById('terraWrap'); });
  await range.evaluate(el => { el.value = -30; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#ttBar')).toHaveClass(/on/);
  await expect(page.locator('#ttLabel b')).not.toHaveText('Oggi');
  expect(await page.evaluate(() => Views.ttOffset)).toBe(30);
  expect(await page.evaluate(() => document.getElementById('terraWrap') === window.__w)).toBe(true);
  expect(JSON.stringify((await state(page)).logs)).toBe(before);
  await page.locator('[data-tt-now]').click();
  await expect(page.locator('#ttBar')).not.toHaveClass(/ on/);
  expect(errors).toEqual([]);
});

test('le nuove viste non sbordano e non mostrano valori rotti', async ({ page }) => {
  await openApp(page, { hash: 'agenda' });
  await checkView(page);
  await page.evaluate(() => Router.go('dashboard'));
  await checkView(page);
});
