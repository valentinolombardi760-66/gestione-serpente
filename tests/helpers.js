import { expect } from '@playwright/test';

/** Apre l'app raccogliendo gli errori; opzionalmente con dati già salvati */
export async function openApp(page, { data = null, demo = false, hash = 'dashboard', query = '' } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|service worker|sw\.js/i.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(([d]) => {
    // Nei test i file si scaricano: niente finestra di scelta cartella
    try { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; } catch (e) { /* */ }
    if (d && !sessionStorage.getItem('seeded')) { localStorage.setItem('cornSnakeManager.v1', d); sessionStorage.setItem('seeded', '1'); }
  }, [data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null]);
  await page.goto(`/index.html${query}#${hash}`);
  if (demo) {
    await page.evaluate(() => { localStorage.setItem('cornSnakeManager.v1', JSON.stringify(Demo.build())); });
    await page.reload();
  }
  await expect(page.locator('#view-' + hash)).toBeVisible();
  return errors;
}

/** Controlla che la vista attiva non mostri valori rotti e non sbordi in orizzontale */
export async function checkView(page) {
  const r = await page.evaluate(() => {
    const t = document.querySelector('.view.active').innerText;
    return { broken: (t.match(/NaN|undefined|\[object Object\]|Invalid Date/g) || []), overflow: document.documentElement.scrollWidth - window.innerWidth };
  });
  expect(r.broken).toEqual([]);
  expect(r.overflow).toBeLessThanOrEqual(1);
}

export const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('cornSnakeManager.v1')));
