// Step 4: rifinitura — schermi stretti, tastiera, offline, vecchi backup
import { test, expect } from '@playwright/test';
import { openApp, state, checkView } from './helpers.js';

test.describe('schermo da 320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test('tutte le viste e i nuovi pannelli stanno nello schermo', async ({ page }) => {
    const errors = await openApp(page, { demo: true });
    for (const v of ['dashboard', 'agenda', 'clima', 'alimentazione', 'cura', 'salute', 'gestione', 'storia', 'impostazioni']) {
      await page.evaluate(v => Router.go(v), v);
      await checkView(page);
    }
    for (const open of [() => Round.open(), () => Cmd.open('calda 31 fredda 24 55%'), () => Actions.openAddSheet()]) {
      await page.evaluate(open);
      const r = await page.evaluate(() => { const m = document.querySelector('.overlay.open .modal') || document.querySelector('.modal'); return { w: m.scrollWidth - m.clientWidth, page: document.documentElement.scrollWidth - innerWidth }; });
      expect(r.w).toBeLessThanOrEqual(1);
      expect(r.page).toBeLessThanOrEqual(1);
      await page.evaluate(() => Overlay.close(true));
      await expect(page.locator('.overlay')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
});

test('tastiera: agenda e macchina del tempo senza mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'tastiera fisica');
  await openApp(page, { demo: true });
  // Il cursore della macchina del tempo risponde alle frecce
  await page.locator('#ttRange').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => Views.ttOffset)).toBe(2);
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => Views.ttOffset)).toBe(0);
  // "Sposta" del pasto: si apre con Invio e si sceglie un giorno con Invio
  await page.evaluate(() => Router.go('agenda'));
  await page.locator('[data-ag-move]').focus();
  await page.keyboard.press('Enter');
  const day = page.locator('[data-move-to]:not(.cur)').nth(4);
  const target = await day.getAttribute('data-move-to');
  await day.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => Logic.feedingState().next)).toBe(target);
  // Esc chiude il comando rapido
  await page.keyboard.press('Control+k');
  await expect(page.locator('#cmdInput')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay')).toHaveCount(0);
});

test('il pasto spostato resta dopo il riavvio e si azzera col pasto nuovo', async ({ page }) => {
  await openApp(page, { demo: true });
  const target = await page.evaluate(() => { const d = Utils.toISODate(Utils.addDays(Utils.parse(Utils.todayISO()), 6)); Actions.moveMeal(d); return d; });
  await page.reload();
  expect(await page.evaluate(() => Logic.feedingState().next)).toBe(target);
  await page.evaluate(() => Actions.quickMeal('Mangiato', true));
  const fs = await page.evaluate(() => Logic.feedingState());
  expect(fs.moved).toBeFalsy();
});

test('un backup della versione precedente si importa e mostra agenda e previsioni', async ({ page }) => {
  // Backup "vecchio": senza i campi nuovi del profilo
  const old = await (async () => {
    await openApp(page, { demo: true });
    return page.evaluate(() => { const s = JSON.parse(Store.exportJSON()); delete s.profile.pastoSpostato; return JSON.stringify(s); });
  })();
  await page.evaluate(() => localStorage.clear());
  const errors = await openApp(page, { data: old, hash: 'agenda' });
  await checkView(page);
  await expect(page.locator('.fc-tile')).toHaveCount(4);
  expect(await page.evaluate(() => Store.get().profile.pastoSpostato)).toBe('');
  expect(errors).toEqual([]);
});

test('offline: le nuove funzioni restano disponibili', async ({ page, context }) => {
  await openApp(page, { demo: true });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.goto('/index.html#agenda');
  await expect(page.locator('#view-agenda .ag-day').first()).toBeVisible();
  await page.evaluate(() => Round.open());
  await expect(page.locator('#roundForm')).toBeVisible();
  await context.setOffline(false);
});
