// Grava o loop da tinta para o celular.
// Uso (com o servidor local rodando na 8781):
//   node tools/gravar_video.mjs pasta tipo largura altura   (tipo: abertura | final | agendar)
// Depois: ffmpeg -framerate 30 -i quadros/%04d.jpg ... (ver README)
import { spawn } from "node:child_process";
import fs from "node:fs";
const pasta = process.argv[2] || "quadros";
const tipo = process.argv[3] || "abertura";
const W = +(process.argv[4] || 540), H = +(process.argv[5] || 960), DPR = 2, FPS = 30, SEG = 24;
fs.mkdirSync(pasta, { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9400 + Math.floor(Math.random() * 400);
const perfil = fs.mkdtempSync((process.env.TEMP || ".") + "/edge-gravar-");
const p = spawn(edge, ["--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=" + perfil, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const dormir = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); ws = (l.find(x => x.type === "page") || {}).webSocketDebuggerUrl; } catch {} await dormir(200); }
const s = new WebSocket(ws); await new Promise(r => s.onopen = r);
let id = 0; const pend = {};
s.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; s.send(JSON.stringify({ id: i, method, params })); });
await cmd("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
await cmd("Page.enable");
await cmd("Page.navigate", { url: "http://localhost:8781/tools/video.html?tipo=" + tipo });
await dormir(2000);
const total = FPS * SEG;
for (let f = 0; f < total; f++) {
  await cmd("Runtime.evaluate", { expression: `window.__tintaQuadro(${(f / FPS).toFixed(5)})` });
  const shot = await cmd("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${pasta}/${String(f).padStart(4, "0")}.png`, Buffer.from(shot.result.data, "base64"));
  if (f % 120 === 0) console.log(`quadro ${f}/${total}`);
}
s.close(); p.kill();
console.log("pronto");
process.exit(0);
