// Run against the local frontend with an isolated Chrome profile and mocked API.
// No signed-in user session or real backend record is accessed.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "profile-photo-test-"));
const executable = process.env.BROWSER_EXE || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = spawn(executable, ["--headless=new", "--disable-gpu", "--in-process-gpu", ...(process.env.BROWSER_NO_SANDBOX === "1" ? ["--no-sandbox"] : []), "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${directory}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
let diagnostics = "";
browser.stderr.on("data", data => { diagnostics = (diagnostics + data).slice(-3000); });
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function until(callback, label) {
  for (let attempt = 0; attempt < 100; attempt++) { const result = await callback(); if (result) return result; await pause(100); }
  throw new Error(`Timed out: ${label}`);
}
let socket;
try {
  const port = await until(async () => { try { return (await fs.readFile(path.join(directory, "DevToolsActivePort"), "utf8")).split("\n")[0]; } catch { return null; } }, "browser startup");
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let serial = 0; const pending = new Map(); const events = new Map();
  socket.onclose = () => { for (const request of pending.values()) request.reject(new Error(`Browser connection closed: ${diagnostics}`)); pending.clear(); };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  let apiReady = false; let savedPhoto = "";
  const user = { id: "507f1f77bcf86cd799439011", email: "fixture@example.com", role: "employee" };
  const details = { photo: "", bio: "", skills: [], links: [], careerInterests: "", careerVisibility: "private" };
  const profile = { ...user, employee: null, capabilities: { extendedProfile: false, editableProfileFields: [], corrections: false, correctionReview: false } };
  const prefs = { language: "en", timezone: "UTC", theme: "system", landingPage: "/employee/dashboard", notifications: { email: true, goals: true, reviews: true, feedback: true, development: true } };
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request?.reject(new Error(message.error.message)); else request?.resolve(message.result); return; }
    events.get(message.method)?.(message.params);
    if (message.method === "Fetch.requestPaused") {
      const { requestId, request } = message.params;
      let body = {};
      if (request.url.includes("/settings/preferences")) body = { preferences: prefs };
      else if (request.url.includes("/settings/profile")) {
        if (request.method === "PATCH") { savedPhoto = JSON.parse(request.postData).details.photo; details.photo = savedPhoto; }
        body = { profile: { ...profile, ...(apiReady ? { details, capabilities: { ...profile.capabilities, extendedProfile: true } } : {}) } };
      }
      await send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Access-Control-Allow-Headers", value: "*" }, { name: "Access-Control-Allow-Methods", value: "GET,PATCH,OPTIONS" }], body: Buffer.from(JSON.stringify(body)).toString("base64") });
    }
  };
  await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `sessionStorage.setItem('performance_platform_token','fixture-only');sessionStorage.setItem('performance_platform_user',${JSON.stringify(JSON.stringify(user))});` });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true })).result.value;
  await send("Page.navigate", { url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/settings` });
  await until(() => evaluate("Array.from(document.querySelectorAll('nav button')).some(b=>b.textContent==='Profile')"), "settings navigation");
  await evaluate("Array.from(document.querySelectorAll('nav button')).find(b=>b.textContent==='Profile').click()");
  await until(() => evaluate("!!document.querySelector('#profile-photo-upload')"), "profile upload");
  assert.equal(await evaluate("document.querySelector('#profile-photo-upload').matches(':disabled')"), false, "Photo selection must work even when the API capability is absent");
  assert.equal(await evaluate("document.querySelector('#profile-bio').matches(':disabled')"), true, "Other unsupported fields stay disabled");
  await send("Page.setInterceptFileChooserDialog", { enabled: true });
  let chooser;
  events.set("Page.fileChooserOpened", event => { chooser = event; });
  await evaluate("document.querySelector('#profile-photo-upload').click()");
  await until(() => chooser, "native file chooser event");
  const filename = path.join(directory, "photo.png");
  await fs.writeFile(filename, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOx8AAAAASUVORK5CYII=", "base64"));
  await send("DOM.setFileInputFiles", { backendNodeId: chooser.backendNodeId, files: [filename] });
  await until(() => evaluate("!!document.querySelector('canvas[aria-label=\"Square photo crop preview\"]')"), "photo crop preview");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Use this crop').click()");
  assert.equal(await evaluate("!!document.querySelector('img[src^=\"data:image/jpeg\"]')"), true);
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save profile').click()");
  await until(() => evaluate("document.body.textContent.includes('Your server does not support saving profile photos yet')"), "unsupported save error");
  assert.equal(savedPhoto, "", "Unsupported APIs must not receive a save");
  apiReady = true;
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save profile').click()");
  await until(() => evaluate("document.body.textContent.includes('Your profile has been saved to your account.')"), "save after capability refresh");
  assert.ok(savedPhoto.startsWith("data:image/jpeg;base64,/9j/"));
  process.stdout.write("PASS: file chooser opens without API support; crop works; unsupported saves preserve edits; saving works after API availability refresh.\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 999999, method: "Browser.close" }));
  socket?.close();
  if (browser.exitCode === null && browser.signalCode === null) { browser.kill(); await new Promise(resolve => browser.once("exit", resolve)); }
  await fs.rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
