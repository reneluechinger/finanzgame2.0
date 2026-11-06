// SVG-Diagramme: Fünfeck (Radar) für beliebig viele Werte und Verlaufslinien

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function radar(valuesCfg, current, preview = null) {
  const n = valuesCfg.length, cx = 200, cy = 175, R = 120;
  const pt = (i, f) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
  };
  const poly = vals => valuesCfg.map((v, i) => pt(i, Math.max(0.02, (vals[v.id] ?? 0) / 100)).join(",")).join(" ");
  let s = "";
  for (const f of [0.25, 0.5, 0.75, 1]) {
    s += `<polygon points="${valuesCfg.map((_, i) => pt(i, f).join(",")).join(" ")}" fill="none" stroke="var(--grid)"/>`;
  }
  valuesCfg.forEach((v, i) => {
    const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.2);
    const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
    const low = (current[v.id] ?? 0) < 20;
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--grid)"/>`;
    s += `<text x="${lx}" y="${ly - 4}" text-anchor="${anchor}" class="rl${low ? " low" : ""}">${esc(v.icon)} ${esc(v.name)}</text>`;
    s += `<text x="${lx}" y="${ly + 13}" text-anchor="${anchor}" class="rv${low ? " low" : ""}">${current[v.id] ?? 0}</text>`;
  });
  if (preview) s += `<polygon points="${poly(preview)}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  s += `<polygon points="${poly(current)}" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>`;
  valuesCfg.forEach((v, i) => {
    const [x, y] = pt(i, Math.max(0.02, (current[v.id] ?? 0) / 100));
    s += `<circle cx="${x}" cy="${y}" r="5" fill="${v.color}" stroke="var(--card)" stroke-width="1.5"/>`;
  });
  return `<svg viewBox="-60 0 520 350" role="img" aria-label="Gleichgewicht deiner Werte">${s}</svg>`;
}

// Verlauf aller Werte über die Tage, history = [{day, values}]
export function lines(valuesCfg, history, { from = 1, to = 28, startValues = null, label = null } = {}) {
  const W = 640, H = 240, L = 34, B = 26, T = 10, Rr = 10;
  const x = d => L + (d - from) / Math.max(1, to - from) * (W - L - Rr);
  const y = v => T + (1 - v / 100) * (H - T - B);
  let s = "";
  for (const v of [0, 25, 50, 75, 100]) {
    s += `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>`;
    s += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${v}</text>`;
  }
  for (let d = from; d <= to; d++) {
    const t = label ? label(d) : ((d - 1) % 7 === 0 || d === from ? `Tag ${d}` : null);
    if (t) s += `<text x="${x(d)}" y="${H - 6}" text-anchor="${d === to && d !== from ? "end" : d === from ? "start" : "middle"}" class="ax">${esc(t)}</text>`;
  }
  const pts = startValues ? [{ day: from - 0.0001, values: startValues }, ...history] : history;
  for (const v of valuesCfg) {
    const p = pts.filter(h => h.day >= from - 1 && h.day <= to)
      .map(h => `${x(Math.max(from, h.day))},${y(h.values[v.id] ?? 0)}`).join(" ");
    if (p) s += `<polyline points="${p}" fill="none" stroke="${v.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const legend = valuesCfg.map(v => `<span><i style="background:${v.color}"></i>${esc(v.name)}</span>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="linechart" role="img" aria-label="Verlauf der Werte">${s}</svg><div class="legend-row">${legend}</div>`;
}
