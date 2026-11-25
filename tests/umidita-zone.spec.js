import { test, expect } from '@playwright/test';
import { openApp, checkView } from './helpers.js';

const iso = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };
const base = (extra = {}) => ({ version: 3, profile: { nome: 'Test', umiditaMin: 40, umiditaMax: 60, ...(extra.profile || {}) }, logs: { ...(extra.logs || {}) } });

test('umidità per zona: vecchie letture restano valide, le nuove hanno calda e fredda', async ({ page }) => {
  const errors = await openApp(page, { hash: 'clima', data: base({ logs: { env: [
    { datetime: iso(2) + 'T09:00', tempCalda: 30, tempFredda: 24, umidita: 52 },
    { datetime: iso(0) + 'T09:00', tempCalda: 31, tempFredda: 24, umiditaCalda: 45, umiditaFredda: 62 }
  ] } }) });
  const st = await page.evaluate(() => Store.get());
  const [nuova, vecchia] = st.logs.env;
  expect(nuova).toMatchObject({ umiditaCalda: 45, umiditaFredda: 62, umidita: null });
  expect(vecchia).toMatchObject({ umiditaCalda: null, umiditaFredda: null, umidita: 52 });

  const r = await page.evaluate(() => {
    const n = Logic.envNow();
    return { c: n.umiditaCalda.v, f: n.umiditaFredda.v, legacy: n.umiditaFredda.legacy, fOld: Logic.envVal(Store.get().logs.env[1], 'umiditaFredda'), ev: Logic.evalParam('umiditaFredda', 62).status, mean: Logic.humOf(Store.get().logs.env[0]) };
  });
  expect(r).toEqual({ c: 45, f: 62, legacy: false, fOld: 52, ev: 'bad', mean: 54 });

  // Indicatori e storico mostrano entrambe le zone
  await expect(page.locator('#view-clima .gauge-name', { hasText: 'Umidità zona calda' })).toBeVisible();
  await expect(page.locator('#view-clima .gauge-name', { hasText: 'Umidità zona fredda' })).toBeVisible();
  await expect(page.locator('#view-clima')).toContainText('unica');
  await checkView(page);
  expect(errors).toEqual([]);
});

test('il modulo lettura salva umidità calda e fredda', async ({ page }) => {
  const errors = await openApp(page, { hash: 'clima', data: base() });
  await page.locator('#view-clima [data-add="env"]').first().click();
  const form = page.locator('form[data-type="env"]');
  await form.locator('[name="tempCalda"]').fill('31');
  await form.locator('[name="umiditaCalda"]').fill('48');
  await form.locator('[name="umiditaFredda"]').fill('58');
  await page.locator('[data-submit-form]').click();
  await expect.poll(async () => (await page.evaluate(() => Store.get())).logs.env.length).toBe(1);
  expect((await page.evaluate(() => Store.get())).logs.env[0]).toMatchObject({ tempCalda: 31, umiditaCalda: 48, umiditaFredda: 58, umidita: null });
  expect(errors).toEqual([]);
});

test('comando rapido e import CSV riconoscono le due zone', async ({ page }) => {
  await openApp(page, { data: base() });
  const r = await page.evaluate(() => ({
    a: Cmd.parse('calda 31 fredda 24 umidità calda 50 fredda 60').data,
    b: Cmd.parse('ur fredda 58%').data,
    c: Cmd.parse('calda 31 umidità 55%').data
  }));
  expect(r.a).toMatchObject({ tempCalda: 31, tempFredda: 24, umiditaCalda: 50, umiditaFredda: 60, umidita: null });
  expect(r.b).toMatchObject({ umiditaFredda: 58, umiditaCalda: null });
  expect(r.c).toMatchObject({ tempCalda: 31, umidita: 55, umiditaCalda: null });
});
