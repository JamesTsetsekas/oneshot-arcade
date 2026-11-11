// client-ui: in-match HUD panels. Reads the batched store only; per-frame elements live in hudCanvas.ts.
import type { ReactElement } from "react";
import { ITEMS, type Slot } from "../../shared/content/items";
import { AMMO_CAPS, AMMO_TYPES, RARITIES, WEAPONS, weaponStats } from "../../shared/content/weapons";
import { Mode, type LootView, type SelfView } from "../../shared/protocol/protocol";
import { game } from "../game";
import { keyLabel, settingsStore } from "../runtime/settings";
import { AMMO_COLORS, AmmoIcon, ItemIcon, RarityMark, WeaponIcon } from "./icons";
import { useHud, type HudState } from "./store";

export function fmtTime(s: number): string {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

function key(action: keyof typeof settingsStore.value.binds): string {
  return keyLabel(settingsStore.value.binds[action][0] ?? "?");
}

function Kbd({ children }: { children: string }): ReactElement {
  return <span className="kbd">{children}</span>;
}

function Vitals({ you, name }: { you: SelfView; name: string }): ReactElement {
  return (
    <div className="vitals panel">
      <div className="name">
        <span>{name}</span>
        <span>{you.kills} elims</span>
      </div>
      <div className="shields">
        <div className="meter" title="Aegis: recharges after 8 s without damage">
          <i style={{ width: `${(you.aegis / 50) * 100}%`, background: "var(--aegis)" }} />
          <em>Aegis</em>
          <span>{Math.round(you.aegis)}</span>
        </div>
        <div className="meter" title="Reserve Shield: restored with Shield Flasks">
          <i style={{ width: `${(you.reserve / 50) * 100}%`, background: "var(--reserve)" }} />
          <em>Reserve</em>
          <span>{Math.round(you.reserve)}</span>
        </div>
      </div>
      <div className="meter hp">
        <i style={{ width: `${you.health}%`, background: you.health < 35 ? "var(--coral)" : "var(--health)" }} />
        <em>Health</em>
        <span>{Math.ceil(you.health)}</span>
      </div>
      <div className="meter energy" title="Sprint energy">
        <i style={{ width: `${you.energy * 100}%`, background: "var(--saffron)" }} />
      </div>
    </div>
  );
}

function SlotBox({ slot, idx, sel }: { slot: Slot; idx: number; sel: boolean }): ReactElement {
  const rarityColor = slot && slot.kind === "weapon" ? RARITIES[slot.rarity]!.color : slot ? ITEMS[slot.item].color : "transparent";
  return (
    <div className={"slot" + (sel ? " sel" : "")}>
      <span className="key">{idx + 1}</span>
      {slot && slot.kind === "weapon" && (
        <>
          <span className="rar"><RarityMark rarity={slot.rarity} size={13} /></span>
          <WeaponIcon id={slot.weapon} size={60} />
          <span className="cnt">{slot.mag}</span>
        </>
      )}
      {slot && slot.kind === "item" && (
        <>
          <span style={{ color: ITEMS[slot.item].color }}><ItemIcon id={slot.item} size={34} /></span>
          <span className="cnt">x{slot.count}</span>
        </>
      )}
      <span className="bar2" style={{ background: rarityColor }} />
    </div>
  );
}

function InventoryBar({ you }: { you: SelfView }): ReactElement {
  const cur = you.slots[you.selected] ?? null;
  const w = cur && cur.kind === "weapon" ? WEAPONS[cur.weapon] : null;
  return (
    <div className="invbar">
      <div className="ammobox panel">
        {cur && cur.kind === "weapon" && w && (
          <>
            <div className="wname" style={{ color: RARITIES[cur.rarity]!.color }}>
              <RarityMark rarity={cur.rarity} /> {RARITIES[cur.rarity]!.name} {w.name}
            </div>
            <div className="count">
              {cur.mag} <small>/ {you.ammo[w.ammo]}</small>
            </div>
          </>
        )}
        {cur && cur.kind === "item" && (
          <>
            <div className="wname" style={{ color: ITEMS[cur.item].color }}>{ITEMS[cur.item].name}</div>
            <div className="count">
              x{cur.count} <small>{ITEMS[cur.item].kind === "throw" ? "click to throw" : "click to use"}</small>
            </div>
          </>
        )}
        {!cur && (
          <>
            <div className="wname">Unarmed</div>
            <div className="count"><small>{key("melee")} to strike</small></div>
          </>
        )}
        <div className="ammorow">
          {AMMO_TYPES.map((t) => (
            <span key={t} className={w && w.ammo === t ? "cur" : ""} style={{ color: AMMO_COLORS[t] }} title={`${t} ammo (cap ${AMMO_CAPS[t]})`}>
              <AmmoIcon type={t} size={13} /> {you.ammo[t]}
            </span>
          ))}
        </div>
      </div>
      <div className="slots">
        {you.slots.map((s, i) => (
          <SlotBox key={i} slot={s} idx={i} sel={i === you.selected} />
        ))}
      </div>
    </div>
  );
}

function Arrow({ a, b, lowerBetter = false, label }: { a: number; b: number; lowerBetter?: boolean; label: string }): ReactElement {
  const diff = a - b;
  const better = lowerBetter ? diff < -0.001 : diff > 0.001;
  const worse = lowerBetter ? diff > 0.001 : diff < -0.001;
  return (
    <span className={better ? "up" : worse ? "down" : ""}>
      {label} {better ? "▲" : worse ? "▼" : "="}
    </span>
  );
}

function Prompt({ s }: { s: HudState }): ReactElement | null {
  const f = s.focus;
  if (!f || !s.you) return null;
  const loot: LootView | null = s.focusLoot;
  const cur = s.you.slots[s.you.selected] ?? null;
  let detail: ReactElement | null = null;
  let compare: ReactElement | null = null;
  let titleColor = "var(--cream)";
  let mark: ReactElement | null = null;
  if (loot && loot.kind === "weapon" && loot.weapon) {
    const st = weaponStats(loot.weapon, loot.rarity ?? 0);
    titleColor = RARITIES[loot.rarity ?? 0]!.color;
    mark = <RarityMark rarity={loot.rarity ?? 0} />;
    detail = (
      <div className="line2">
        {RARITIES[loot.rarity ?? 0]!.name} · {st.def.ammo} ammo · {st.damage}
        {st.pellets > 1 ? `x${st.pellets}` : ""} dmg · {Math.round(st.rpm)} rpm · mag {st.mag}
        {st.perk ? ` · ${st.perk}` : ""}
      </div>
    );
    if (cur && cur.kind === "weapon") {
      const c = weaponStats(cur.weapon, cur.rarity);
      compare = (
        <div className="cmp">
          <span style={{ color: "var(--muted)" }}>vs held:</span>
          <Arrow a={st.dps} b={c.dps} label="DPS" />
          <Arrow a={st.mag} b={c.mag} label="Mag" />
          <Arrow a={st.reload} b={c.reload} lowerBetter label="Reload" />
          <Arrow a={st.falloffStart} b={c.falloffStart} label="Range" />
        </div>
      );
    }
  } else if (loot && loot.kind === "item" && loot.item) {
    titleColor = ITEMS[loot.item].color;
    detail = <div className="line2">x{loot.count} · {ITEMS[loot.item].desc}</div>;
  } else if (loot && loot.kind === "ammo") {
    detail = <div className="line2">x{loot.count}</div>;
  }
  return (
    <div className="prompt panel">
      <div className="line1">
        <Kbd>{key("interact")}</Kbd>
        {f.needsSwap ? "Hold to swap for" : f.kind === "loot" ? "Pick up" : ""}
        <span style={{ color: titleColor, display: "inline-flex", gap: 5, alignItems: "center" }}>
          {mark} {f.label}
        </span>
      </div>
      {detail}
      {compare}
    </div>
  );
}

function StormBox({ s }: { s: HudState }): ReactElement | null {
  const st = s.storm;
  if (!st || s.mode !== "solo" || s.phase === "staging") return null;
  const h = typeof window !== "undefined" ? window.innerHeight : 900;
  const ui = Math.max(0.8, Math.min(1.35, h / 900));
  const top = 96 * 2 * ui + 22 * ui + 12;
  let big: string;
  let sub: string;
  if (s.phase === "skiff") {
    big = fmtTime(s.phaseTimer);
    sub = "Skiff route remaining";
  } else if (st.state === "calm") {
    big = fmtTime(st.timer);
    sub = "Riftstorm wakes in";
  } else if (st.state === "wait") {
    big = fmtTime(st.timer);
    sub = `Phase ${st.phase} · contracts in`;
  } else if (st.state === "shrink") {
    big = fmtTime(st.timer);
    sub = st.phase >= 9 ? "Final collapse" : st.phase >= 6 ? "Field moving" : `Phase ${st.phase} · closing`;
  } else {
    big = "0:00";
    sub = "Calmfield gone";
  }
  const inStorm = !!s.you?.inStorm;
  const out = s.distToSafe > 0 && st.state !== "done";
  return (
    <div className={"stormbox panel" + (inStorm ? " danger" : "")} style={{ top }}>
      <div className="sub">{sub}</div>
      <div className="big">{big}</div>
      {s.phase !== "skiff" && (
        <div style={{ marginTop: 3 }}>
          {inStorm ? <b>In the Riftstorm · -{st.dps} HP/s</b> : out ? <span>{Math.round(s.distToSafe)} m to next Calmfield</span> : <span style={{ color: "#9ff0c0" }}>Inside next Calmfield</span>}
        </div>
      )}
      {st.dps > 0 && !inStorm && <div className="sub" style={{ marginTop: 2 }}>Storm damage {st.dps}/s</div>}
    </div>
  );
}

function Hints({ s }: { s: HudState }): ReactElement | null {
  const you = s.you;
  if (!you || s.dead || s.spectating) return null;
  if (s.phase === "staging") {
    return (
      <div className="hint panel">
        Skiff departs in <b>{fmtTime(s.phaseTimer)}</b> · try the racks and targets · <Kbd>{key("ready")}</Kbd> ready up
      </div>
    );
  }
  if (s.onSkiff) {
    return you.canJump ? (
      <div className="hint big panel">
        <Kbd>{key("jump")}</Kbd> Jump · <Kbd>{key("map")}</Kbd> Map &amp; marker · auto-drop in {fmtTime(s.phaseTimer)}
      </div>
    ) : (
      <div className="hint panel">Approaching the Highwake · <Kbd>{key("map")}</Kbd> pick a landing spot</div>
    );
  }
  if (s.actorMode === Mode.Freefall) {
    return (
      <div className="hint panel">
        <Kbd>{key("sail")}</Kbd> deploy wing-sail early · look down to dive · auto-deploys at 75 m
      </div>
    );
  }
  if (s.actorMode === Mode.Glide) {
    return (
      <div className="hint panel">
        <Kbd>{key("forward")}</Kbd> glide · look down to dive · <Kbd>{key("sail")}</Kbd> stow
      </div>
    );
  }
  if (you.canDeploy && s.actorMode === Mode.Air) {
    return (
      <div className="hint panel">
        <Kbd>{key("sail")}</Kbd> deploy wing-sail
      </div>
    );
  }
  if (s.actorMode === Mode.Zip) return <div className="hint panel"><Kbd>{key("jump")}</Kbd> let go</div>;
  if (s.actorMode === Mode.Swim) return <div className="hint panel">Swimming · only the Harbor Pistol fires in water</div>;
  if (you.hazard) return <div className="hint panel" style={{ borderColor: "var(--coral)" }}>Heat channel! Move out</div>;
  if (you.useT >= 0) return <div className="hint panel">Using… <Kbd>{key("reload")}</Kbd> cancel</div>;
  return null;
}

export function Hud(): ReactElement | null {
  const s = useHud((x) => x);
  const you = s.you;
  if (!you) return null;
  const name = s.spectating ? `Spectating ${s.spectating}` : "You";
  const airborne = s.actorMode === Mode.Freefall || s.actorMode === Mode.Glide || (s.onSkiff && s.phase === "skiff");
  return (
    <>
      <div className="hud-top">
        {s.mode === "solo" ? (
          <>
            <div className="chip">ALIVE <b>{s.alive}</b></div>
            <div className="chip">ELIMS <b>{you.kills}</b></div>
            {s.location && s.phase === "active" && <div className="chip">{s.location}</div>}
          </>
        ) : (
          <div className="chip">PRACTICE RANGE</div>
        )}
      </div>
      {s.banner && s.banner.until > s.now && (
        <div className={"banner " + s.banner.tone} key={s.banner.title + s.banner.until}>
          <h1>{s.banner.title}</h1>
          <p>{s.banner.sub}</p>
        </div>
      )}
      <div className="feed">
        {s.feed.map((f) => (
          <div key={f.id} className={f.mine ? "mine" : ""}>
            {f.killer ? (
              <>
                <b>{f.killer}</b>
                <em>{f.cause}</em>
                <b>{f.victim}</b>
              </>
            ) : (
              <>
                <b>{f.victim}</b>
                <em>lost to {f.cause}</em>
              </>
            )}
          </div>
        ))}
      </div>
      <StormBox s={s} />
      {!s.onSkiff && <Vitals you={you} name={name} />}
      {!s.onSkiff && <InventoryBar you={you} />}
      {!s.dead && <Prompt s={s} />}
      <Hints s={s} />
      {airborne && !s.onSkiff && (
        <div className="altitude">
          <b>{Math.max(0, Math.round(you.altitude))} m</b>
          <span>{s.actorMode === Mode.Glide ? "wing-sail" : "freefall"}</span>
        </div>
      )}
      <div className="toasts">
        {s.toasts.map((t) => (
          <div key={t.id} className={"toast " + t.tone}>{t.msg}</div>
        ))}
      </div>
      {s.mode === "practice" && (
        <div className="practice panel">
          <b>Practice Range</b>
          <br />
          Racks restock; each restock climbs a rarity tier. Lockers refill. Try the crates, tower ascender, zipline, air vent and the swim stairs.
          {s.practiceHit && (
            <div style={{ marginTop: 6 }}>
              Last hit: <b>{s.practiceHit.dmg}</b> {s.practiceHit.zone}
              {s.practiceHit.shield ? " (shield)" : ""} at {s.practiceHit.dist} m
            </div>
          )}
          <div className="interactive" style={{ marginTop: 8 }}>
            <button className="btn small ghost" onClick={() => game.action({ type: "practiceRefill" })}>Refill ammo &amp; health</button>
          </div>
        </div>
      )}
      {s.dead && (
        <div className="deathcard panel interactive">
          <h1>Eliminated</h1>
          <div className="place">
            #{s.dead.placement} <small>of {s.total}</small>
          </div>
          <div style={{ marginTop: 6, color: "var(--muted)" }}>by {s.dead.by}</div>
          <div className="acts">
            <button className="btn small ghost" onClick={() => game.action({ type: "spectate", dir: -1 })}>◀ Prev</button>
            <button className="btn small ghost" onClick={() => game.action({ type: "spectate", dir: 1 })}>Next ▶</button>
            <button className="btn small primary" onClick={() => game.showResults()}>View results</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>Spectating {s.spectating ?? "…"}</div>
        </div>
      )}
      {!s.locked && s.overlay === "none" && !s.dead && (
        <div className="clicktoplay interactive" onClick={() => game.input.requestLock()}>
          <div className="panel">Click to take control</div>
        </div>
      )}
      {new URLSearchParams(location.search).has("perf") && (
        <div className="perf">
          {s.fps} fps · scale {s.renderScale.toFixed(2)} · tick {s.tickMs.toFixed(2)} ms
        </div>
      )}
    </>
  );
}
