export const CSS = `
:root{--bg:#07090d;--panel:#0d1219;--panel2:#121923;--line:#2b3b4d;--glow:#46e6d0;--amber:#ffb347;--violet:#b57bff;--txt:#d7e4ee;--dim:#7d92a4;--bad:#ff6a5a;--good:#5dff8a;--p0:#3aa8ff;--p1:#ff6a3d}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--txt);font-family:"Segoe UI",system-ui,Roboto,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none}
button{font:inherit;color:inherit}
#app{position:fixed;inset:0}
.screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(1200px 700px at 70% 20%,#14222d 0%,#07090d 65%);overflow:auto}
.screen::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(70,230,208,.04) 0 2px,transparent 2px 46px);pointer-events:none}
.title{font-size:64px;letter-spacing:.42em;font-weight:200;margin:0 0 4px;color:#e6fffb;text-shadow:0 0 28px rgba(70,230,208,.45)}
.subtitle{color:var(--dim);letter-spacing:.32em;font-size:12px;text-transform:uppercase;margin-bottom:34px}
.menu{display:flex;flex-direction:column;gap:10px;min-width:300px;z-index:1}
.btn{background:linear-gradient(180deg,#151e29,#0e141c);border:1px solid var(--line);padding:12px 22px;cursor:pointer;letter-spacing:.14em;text-transform:uppercase;font-size:13px;text-align:left;border-radius:2px;position:relative;transition:border-color .12s,box-shadow .12s,transform .08s}
.btn:hover{border-color:var(--glow);box-shadow:0 0 14px rgba(70,230,208,.22) inset,0 0 10px rgba(70,230,208,.15)}
.btn:active{transform:translateY(1px)}
.btn.primary{border-color:var(--glow);color:#eafffb}
.btn.small{padding:7px 12px;font-size:11px}
.btn:disabled{opacity:.4;cursor:not-allowed}
.panelbox{background:rgba(13,18,25,.94);border:1px solid var(--line);box-shadow:0 0 0 1px #000,0 12px 40px rgba(0,0,0,.5);padding:22px 26px;z-index:1;max-width:min(1180px,94vw);max-height:92vh;overflow:auto}
.panelbox h2{margin:0 0 14px;font-weight:300;letter-spacing:.28em;font-size:18px;text-transform:uppercase;color:#dffcf8}
.row{display:flex;gap:16px;align-items:stretch;flex-wrap:wrap}
.faction-card{flex:1;min-width:290px;max-width:420px;border:1px solid var(--line);padding:16px;cursor:pointer;background:linear-gradient(180deg,#121a24,#0b1017);position:relative;transition:border-color .12s,transform .1s}
.faction-card:hover{transform:translateY(-2px)}
.faction-card.sel{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset,0 0 24px color-mix(in srgb,var(--acc) 28%,transparent)}
.faction-card h3{margin:0 0 2px;letter-spacing:.2em;font-weight:400;text-transform:uppercase;color:var(--acc)}
.faction-card .tag{color:var(--dim);font-size:12px;margin-bottom:10px;letter-spacing:.08em}
.faction-card p{font-size:13px;line-height:1.45;color:#b8c8d6;margin:6px 0}
.faction-card ul{margin:8px 0 0;padding-left:16px;font-size:12px;color:#9fb3c4;line-height:1.5}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{border:1px solid var(--line);padding:3px 8px;font-size:11px;color:#a9bccb;background:#0a0f15}
.diff{display:flex;gap:8px;margin:8px 0}
.diff .btn{flex:1;text-align:center;padding:10px 6px}
.diff .btn.sel{border-color:var(--glow);background:#102a2a;color:#eafffb}
.help{font-size:12px;color:var(--dim);line-height:1.5;margin:6px 0 10px}
.mapprev{border:1px solid var(--line);background:#0a0f15}
table.t{border-collapse:collapse;width:100%;font-size:12px}
table.t td,table.t th{padding:5px 9px;border-bottom:1px solid #1a2531;text-align:left}
table.t th{color:var(--dim);font-weight:500;letter-spacing:.1em;text-transform:uppercase;font-size:11px}
.setrow{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:6px 0;border-bottom:1px solid #16202b;font-size:13px}
.setrow input[type=range]{width:180px;accent-color:var(--glow)}
.setrow select{background:#0e141c;color:var(--txt);border:1px solid var(--line);padding:4px 8px}
.keybtn{min-width:90px;text-align:center}
.tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.tabs .btn{padding:7px 14px;font-size:11px}
.tabs .btn.sel{border-color:var(--glow);background:#102a2a}
/* ---------- in-game ---------- */
#game{position:absolute;inset:0;background:#000}
#viewport{position:absolute;inset:0;touch-action:none}
#hud{position:absolute;inset:0;pointer-events:none;z-index:5}
#hud>*{pointer-events:auto}
.hudbox{background:linear-gradient(180deg,rgba(18,25,35,.94),rgba(9,13,19,.96));border:1px solid var(--line);box-shadow:0 0 0 1px #000,0 0 18px rgba(70,230,208,.07) inset}
.topbar{position:absolute;top:8px;right:8px;display:flex;gap:2px;align-items:stretch;padding:4px 6px}
.res{display:flex;align-items:center;gap:7px;padding:3px 12px;border-right:1px solid #1c2733;min-width:92px}
.res:last-child{border-right:none}
.res .ic{width:18px;height:18px;flex:none}
.res .val{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;letter-spacing:.02em}
.res .sub{font-size:10px;color:var(--dim);letter-spacing:.06em;display:block;margin-top:2px}
.res.warn .val{color:var(--bad);animation:blink .8s infinite}
.res.click{cursor:pointer}
.res.click:hover{background:#13202b}
@keyframes blink{50%{opacity:.45}}
.bases{position:absolute;top:62px;right:8px;display:flex;gap:6px}
.basechip{padding:3px 9px;font-size:11px;border:1px solid var(--line);background:rgba(9,13,19,.9);letter-spacing:.04em;color:#b8c8d6}
.basechip b{font-variant-numeric:tabular-nums}
.basechip.ok b{color:var(--good)}.basechip.over b{color:var(--amber)}.basechip.bad b{color:var(--bad)}
.objective{position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:7px 22px;text-align:center;max-width:46vw;font-size:13px;letter-spacing:.04em}
.objective small{display:block;color:var(--dim);font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:2px}
.menubtn{position:absolute;top:8px;left:8px;padding:6px 12px;font-size:11px;letter-spacing:.16em;cursor:pointer;text-transform:uppercase}
.menubtn:hover{border-color:var(--glow)}
.alerts{position:absolute;top:44px;left:8px;display:flex;flex-direction:column;gap:4px;width:300px}
.alert{padding:5px 10px;font-size:12px;border-left:3px solid var(--glow);background:rgba(9,13,19,.9);animation:fadein .2s;cursor:pointer;letter-spacing:.03em}
.alert.attack{border-left-color:var(--bad);color:#ffd2cc}.alert.supply,.alert.invalid{border-left-color:var(--amber)}.alert.built,.alert.trained,.alert.researched{border-left-color:var(--good)}
@keyframes fadein{from{opacity:0;transform:translateX(-8px)}}
.toast{position:absolute;left:50%;bottom:216px;transform:translateX(-50%);padding:7px 16px;font-size:13px;border:1px solid var(--amber);background:rgba(20,16,8,.95);color:#ffe3b0;pointer-events:none;transition:opacity .25s}
.bottom{position:absolute;left:0;right:0;bottom:0;height:204px;display:flex;gap:6px;align-items:flex-end;padding:0 8px 8px;pointer-events:none}
.bottom>*{pointer-events:auto}
.minimap{width:204px;height:204px;padding:6px;flex:none}
.minimap canvas{width:190px;height:190px;display:block;cursor:crosshair;background:#05070a}
.selpanel{flex:1;height:190px;display:flex;gap:12px;padding:10px 14px;min-width:0;overflow:hidden}
.selpanel.empty{align-items:center;justify-content:center;color:var(--dim);font-size:12px;letter-spacing:.06em}
.portrait{width:96px;height:96px;border:1px solid var(--line);flex:none;position:relative;background:#06090d}
.portrait img{width:100%;height:100%;display:block}
.portrait .nm{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65);font-size:10px;text-align:center;padding:2px;letter-spacing:.08em;text-transform:uppercase}
.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;font-size:12px}
.info h4{margin:0;font-size:16px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.info .role{color:var(--dim);font-size:11px;letter-spacing:.06em}
.bar{height:8px;background:#05070a;border:1px solid #1c2733;position:relative;width:100%}
.bar>i{position:absolute;left:0;top:0;bottom:0;display:block}
.bar>span{position:absolute;right:4px;top:-3px;font-size:10px;font-variant-numeric:tabular-nums;color:#dfe}
.statline{display:flex;gap:14px;flex-wrap:wrap;color:#b9c9d6;font-size:12px}
.statline b{color:#fff;font-weight:600;font-variant-numeric:tabular-nums}
.grid{display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;overflow:hidden;flex:1}
.mini{width:42px;height:46px;border:1px solid var(--line);position:relative;cursor:pointer;background:#070a0f}
.mini img{width:100%;height:34px;display:block}
.mini .hp{position:absolute;left:0;right:0;bottom:0;height:5px;background:#05070a}
.mini .hp i{display:block;height:100%}
.mini.active{border-color:var(--glow);box-shadow:0 0 6px var(--glow)}
.queue{display:flex;gap:6px;margin-top:2px}
.qitem{width:46px;height:50px;border:1px solid var(--line);position:relative;cursor:pointer;background:#070a0f}
.qitem img{width:100%;height:36px;display:block}
.qitem .pg{position:absolute;left:0;bottom:0;height:5px;background:var(--glow)}
.qitem.paused{border-color:var(--amber)}
.qitem .pz{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;background:rgba(40,28,6,.75);color:#ffd9a0;text-align:center;line-height:1.1}
.qitem:hover{border-color:var(--bad)}
.card{width:236px;height:190px;padding:7px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:5px;flex:none}
.cbtn{position:relative;border:1px solid var(--line);background:#0a0f15;cursor:pointer;overflow:hidden;padding:0}
.cbtn:hover:not(.dis){border-color:var(--glow);box-shadow:0 0 10px rgba(70,230,208,.3) inset}
.cbtn img{width:100%;height:100%;display:block;object-fit:cover;opacity:.95}
.cbtn .key{position:absolute;left:3px;top:2px;font-size:10px;font-weight:700;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;letter-spacing:.04em}
.cbtn .cost{position:absolute;right:2px;bottom:1px;font-size:9px;color:#dff;text-shadow:0 0 3px #000,0 0 3px #000;text-align:right;line-height:1.1}
.cbtn.dis{opacity:.45;cursor:not-allowed}
.cbtn.act{border-color:var(--amber);box-shadow:0 0 10px rgba(255,179,71,.5) inset}
.cbtn .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65)}
.cbtn .lbl{position:absolute;left:0;right:0;bottom:11px;font-size:8.5px;text-align:center;color:#cfe;text-shadow:0 0 3px #000;letter-spacing:.03em;line-height:1}
.tip{position:fixed;z-index:50;max-width:330px;padding:9px 12px;background:rgba(8,11,16,.97);border:1px solid var(--glow);font-size:12px;line-height:1.45;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.6)}
.tip b.n{font-size:14px;letter-spacing:.08em}
.tip .k{color:var(--amber);font-weight:700}
.tip .c{color:var(--dim);font-size:11px}
.tip .bonus{color:#ffd9a0}
.tip hr{border:0;border-top:1px solid #1d2a38;margin:6px 0}
.pause{position:absolute;inset:0;background:rgba(3,5,8,.72);display:flex;align-items:center;justify-content:center;z-index:30}
.errscreen{max-width:640px;text-align:left;line-height:1.6}
.errscreen h2{color:var(--bad)}
.loadbar{width:320px;height:4px;background:#111b24;margin-top:16px}
.loadbar i{display:block;height:100%;background:var(--glow);width:0;transition:width .15s}
.graph{background:#070a0f;border:1px solid var(--line)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 24px;font-size:13px;margin:10px 0 14px}
.stat-grid b{color:#fff}
.big{font-size:54px;letter-spacing:.3em;font-weight:200;margin:0}
.tut{position:absolute;left:12px;top:150px;width:290px;padding:10px 14px;font-size:13px;line-height:1.45}
.tut h5{margin:0 0 4px;color:var(--amber);letter-spacing:.2em;font-size:10px;text-transform:uppercase}
.tut .steps{margin:8px 0 0;padding:0;list-style:none;font-size:11px;color:var(--dim)}
.tut .steps li.done{color:var(--good);text-decoration:line-through}
.tut .steps li.cur{color:#fff}
.replaybar{position:absolute;left:50%;bottom:216px;transform:translateX(-50%);padding:6px 12px;display:flex;gap:6px;align-items:center;font-size:12px}
.ctxlost{position:absolute;inset:0;background:rgba(3,5,8,.85);display:flex;align-items:center;justify-content:center;z-index:40;text-align:center;line-height:1.7}
@media (max-width:1100px){.card{width:200px}.res{min-width:70px}.res .val{font-size:18px}}
`;
