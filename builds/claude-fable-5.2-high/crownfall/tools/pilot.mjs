// A tiny scripted "player" for the browser tools. It runs inside the page and only issues ordinary
// player commands through the public command path (window.__crownfall.send) - no privileged access.
export function installPilot(page) {
  return page.evaluate(() => {
    const g = window.__crownfall;
    let lastTarget = 0;
    let lastOrder = 0;
    let bought = 0;
    let ranked = 0;
    const PLAN = [0, 2, 1, 0, 0, 3, 2, 0, 2, 2, 3, 1];
    const next = [0, 0, 0, 0]; // local cooldown guesses so the pilot does not spam rejected casts
    clearInterval(window.__pilot);
    window.__pilot = setInterval(() => {
      const st = g.debugState();
      const me = st.self;
      if (!me) {
        // dead: spend gold on a simple marksman build
        if (performance.now() - bought > 3000) {
          bought = performance.now();
          for (const it of ['trail_boots', 'sunspoke_bow', 'rivenwright_maul', 'cinderfang', 'tidecaller_glaive', 'riverglass_boots']) g.send({ t: 'buy', item: it });
        }
        return;
      }
      // one skill point per level, in an order that is always legal (Q E W Q Q R E Q E E R W)
      while (ranked < me.lvl) g.send({ t: 'rank', slot: PLAN[ranked++] });
      const all = g.debugUnits();
      const dist = (u) => Math.hypot(u.x - me.x, u.y - me.y);
      const foes = all.filter((u) => u.t === 1 && !u.dead && u.k !== 'ward');
      const hero = foes.filter((u) => u.k === 'hero').sort((a, b) => dist(a) - dist(b))[0];
      const soft = foes
        .filter((u) => (u.k === 'minion' || u.k === 'hero') && dist(u) < 9)
        .sort((a, b) => a.hp - b.hp || dist(a) - dist(b))[0];
      const structs = foes.filter((u) => (u.k === 'tower' || u.k === 'core' || u.k === 'seal' || u.k === 'engine') && !(u.st & 64));
      const tower = structs.sort((a, b) => dist(a) - dist(b))[0];
      const tanking = tower ? all.filter((u) => u.t === 0 && u.k === 'minion' && Math.hypot(u.x - tower.x, u.y - tower.y) < 8.5).length : 0;
      const now = performance.now();
      const retreat = me.hp / me.mhp < 0.3 || (tower && tower.k !== 'seal' && tower.k !== 'engine' && dist(tower) < 9.6 && tanking < 2);
      if (retreat) {
        if (now - lastOrder > 900) {
          lastOrder = now;
          lastTarget = 0;
          if (me.hp / me.mhp < 0.3 && !(foes.some((u) => u.k === 'hero' && dist(u) < 12))) g.send({ t: 'recall' });
          else g.send({ t: 'move', x: Math.max(12, me.x - 10), y: me.x > 60 ? 24.5 : me.x > 34 ? 32 : 52 });
        }
        return;
      }
      if (hero && dist(hero) < 10.5) {
        const t = st.time;
        if (me.lvl >= 2 && t >= next[2] && dist(hero) < 7.2) {
          next[2] = t + 11.5;
          g.send({ t: 'cast', slot: 2, x: hero.x, y: hero.y, id: hero.id });
        }
        if (t >= next[0] && me.mp >= 60) {
          next[0] = t + 7.5;
          g.send({ t: 'cast', slot: 0, x: hero.x, y: hero.y });
        }
        if (me.lvl >= 6 && t >= next[3] && hero.hp / hero.mhp < 0.5 && me.mp >= 100) {
          next[3] = t + 82;
          g.send({ t: 'cast', slot: 3, x: hero.x, y: hero.y });
        }
      }
      const target = soft ?? (tower && dist(tower) < 9 && (tanking >= 2 || tower.k === 'seal' || tower.k === 'engine') ? tower : null);
      if (target) {
        if (target.id !== lastTarget) {
          lastTarget = target.id;
          g.send({ t: 'attack', id: target.id });
        }
      } else if (now - lastOrder > 1500) {
        lastOrder = now;
        lastTarget = 0;
        g.send({ t: 'amove', x: tower ? tower.x - 6 : 72, y: tower ? tower.y - 2 : 23.5 });
      }
    }, 300);
  });
}
