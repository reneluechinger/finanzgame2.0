// Bestenliste: online über Google Apps Script, sonst lokal
import { loadRuns, addRun } from "./storage.js";

const TIMEOUT = 25000; // Apps Script braucht beim ersten Aufruf manchmal lange

function withTimeout(promise) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("Zeitüberschreitung")), TIMEOUT))]);
}

export async function submitScore(cfg, entry) {
  addRun(entry); // addRun ignoriert denselben Durchgang ein zweites Mal
  if (!cfg.scriptUrl) return { online: false };
  try {
    // text/plain verhindert eine CORS-Vorabanfrage, die Apps Script nicht beantwortet
    const res = await withTimeout(fetch(cfg.scriptUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(entry)
    }));
    const data = await res.json();
    return { online: !!data.ok, error: data.error };
  } catch (e) {
    return { online: false, error: e.message };
  }
}

export async function fetchBoard(cfg, variant) {
  const local = loadRuns().filter(r => r.variant === variant).sort((a, b) => b.score - a.score).slice(0, 30);
  if (!cfg.scriptUrl) return { online: false, entries: local };
  try {
    const url = cfg.scriptUrl + (cfg.scriptUrl.includes("?") ? "&" : "?") + "variant=" + encodeURIComponent(variant);
    const res = await withTimeout(fetch(url));
    const data = await res.json();
    if (!Array.isArray(data.entries)) throw new Error("Unerwartete Antwort");
    return { online: true, entries: data.entries };
  } catch (e) {
    return { online: false, entries: local, error: e.message };
  }
}
