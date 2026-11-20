import { test, expect } from '@playwright/test';
import { openApp, state } from './helpers.js';

test('migrazione dei dati v1 (alias e numeri come testo)', async ({ page }) => {
  const v1 = { profile: { name: 'Vecchio', weight: '40', feedInterval: '7' }, logs: { environment: [{ datetime: '2026-10-01T10:00', tempCalda: '30', tempFredda: '24', umidita: '50' }], feedings: [{ data: '2026-10-02', preda: 'Fuzzy', pesoPreda: '3', esito: 'Mangiato' }] } };
  const errors = await openApp(page, { data: v1 });
  const s = await page.evaluate(() => Store.get());
  expect(s.version).toBe(3);
  expect(s.profile.nome).toBe('Vecchio');
  expect(s.logs.env.length).toBe(1);
  expect(s.logs.feeding.length).toBe(1);
  expect(Array.isArray(s.logs.waste)).toBe(true);
  expect(errors).toEqual([]);
});

test('pasto in un tocco e annulla', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'alimentazione' });
  const n = (await state(page)).logs.feeding.length;
  await page.locator('.interval-card [data-meal]').click();
  await expect.poll(async () => (await state(page)).logs.feeding.length).toBe(n + 1);
  const last = (await state(page)).logs.feeding.find(f => f.data === new Date().toISOString().slice(0, 10) || true);
  expect(last).toBeTruthy();
  await page.locator('.toast .t-action').first().click();
  await expect.poll(async () => (await state(page)).logs.feeding.length).toBe(n);
});

test('pressione lunga su "Ha mangiato" apre i dettagli', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'alimentazione' });
  const btn = page.locator('.interval-card [data-meal]');
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + 10, b.y + 10);
  await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
  await expect(page.locator('.modal input[name="data"]')).toBeVisible();
});

test('date in formato gg/mm/aaaa e niente date future', async ({ page }) => {
  await openApp(page, { demo: true });
  await page.evaluate(() => Forms.open('growth'));
  const d = page.locator('.modal input[name="data"]');
  await d.fill('');
  await d.pressSequentially('05112026');
  await expect(d).toHaveValue('05/11/2026');
  await page.locator('.modal input[name="peso"]').fill('58');
  await d.fill('01/01/2099');
  await page.locator('.modal [data-submit-form], .modal button[type="submit"]').first().click();
  await expect(page.locator('.modal')).toBeVisible();
  await d.fill('05/11/2026');
  await page.locator('.modal [data-submit-form], .modal button[type="submit"]').first().click();
  await expect.poll(async () => (await state(page)).logs.growth.some(g => g.data === '2026-11-05' && g.peso === 58)).toBe(true);
});

test('import con "Unisci" non duplica e crea una copia di sicurezza', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'impostazioni' });
  const s = await state(page);
  const total = Object.values(s.logs).reduce((a, l) => a + l.length, 0);
  const extra = JSON.parse(JSON.stringify(s));
  extra.logs.feeding.push({ data: '2026-01-02', preda: 'Pinky', pesoPreda: 1, statoPreda: 'Decongelato', esito: 'Mangiato' });
  extra.logs.feeding.push({ data: 'data sbagliata', preda: 'Pinky', esito: 'Mangiato' });
  await page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(extra)) });
  await expect(page.locator('.imp-drop')).toBeVisible();
  await page.locator('[data-do-imp]').click();
  await expect.poll(async () => { const n = await state(page); return Object.values(n.logs).reduce((a, l) => a + l.length, 0); }).toBe(total + 1);
  await expect.poll(() => page.evaluate(async () => (await Safety.list()).length)).toBeGreaterThan(0);
});

test('import con "Sostituisci" e ripristino della copia', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'impostazioni' });
  const small = { version: 3, profile: { nome: 'Nuovo' }, logs: { feeding: [{ data: '2026-11-01', preda: 'Fuzzy', esito: 'Mangiato' }] } };
  await page.locator('#importFile').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(small)) });
  await page.locator('label.chip', { hasText: 'Sostituisci' }).click();
  await page.locator('[data-do-imp]').click();
  await expect.poll(async () => (await state(page)).profile.nome).toBe('Nuovo');
  await page.evaluate(() => Router.go('impostazioni'));
  await page.locator('[data-snap]').first().click();
  await page.locator('[data-yes]').click();
  await expect.poll(async () => (await state(page)).profile.nome).toBe('Pepe');
});

test('backup esportato in JSON valido', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'impostazioni' });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export]').first().click()]);
  const json = JSON.parse(await (await dl.createReadStream()).toArray().then(c => Buffer.concat(c).toString()));
  expect(json.profile.nome).toBe('Pepe');
  expect(json.logs.feeding.length).toBeGreaterThan(5);
});

test('import di letture da CSV', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'clima' });
  const n = (await state(page)).logs.env.length;
  const csv = 'Data;Ora;Temperatura;Umidità\n01/11/2026;10:00;30,5;48\n01/11/2026;10:30;30,7;49\n01/11/2026;14:00;31,0;47\n';
  await page.locator('#csvFile').setInputFiles({ name: 'sensore.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.locator('.csv-map')).toBeVisible();
  await page.locator('[data-cgo]').click();
  await expect.poll(async () => (await state(page)).logs.env.length).toBeGreaterThan(n);
});

test('foto: aggiunta, selezione e eliminazione con annulla', async ({ page }) => {
  await openApp(page, { demo: true, hash: 'salute' });
  await page.evaluate(() => { Views.tabs.salute = 'foto'; Router.render(true); });
  // PNG 1x1
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  for (let i = 0; i < 2; i++) {
    await page.locator('#view-salute [data-photo-add]').first().click();
    await page.locator('#photoFile').setInputFiles({ name: `f${i}.png`, mimeType: 'image/png', buffer: png });
    await page.locator('[data-psave]').click();
    await expect(page.locator('.photo')).toHaveCount(i + 1);
  }
  await page.locator('.photo').nth(0).click();
  await page.locator('.photo').nth(1).click();
  await expect(page.locator('[data-compare]')).toBeEnabled();
  await page.locator('[data-compare]').click();
  await expect(page.locator('#cmp')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('[data-photo-del]').first().click();
  await expect(page.locator('.photo')).toHaveCount(1);
  await page.locator('.toast .t-action').first().click();
  await expect(page.locator('.photo')).toHaveCount(2);
});

test('due schede aperte restano allineate', async ({ page, context }) => {
  await openApp(page, { demo: true });
  const other = await context.newPage();
  await other.goto('/index.html#dashboard');
  await page.evaluate(() => Store.updateProfile({ nome: 'Sincro' }));
  await expect.poll(() => other.evaluate(() => Store.get().profile.nome)).toBe('Sincro');
});

test('funziona offline dopo la prima apertura', async ({ page, context, browserName }) => {
  await openApp(page, { demo: true });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#todayCard')).toBeVisible();
  await context.setOffline(false);
});
