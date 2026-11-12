import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "vite";
import { portfolio } from "../src/data/data.js";

// Runs against local source. Contact requests and external-window actions are
// intercepted in the isolated browser; no messages are sent to the live service.
const output = path.resolve("test-results/site-check");
const results = [];
let browser, server, socket, profile, session;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pending = new Map();
const errors = [];
let sequence = 0;

async function call(method, params = {}, sessionId = session) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Protocol timeout: ${method}`));
    }, 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function evaluate(expression) {
  const reply = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || reply.exceptionDetails.text);
  return reply.result.value;
}

async function until(expression, message, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await pause(80);
  }
  throw new Error(`Timed out: ${message}`);
}

async function click(selector) {
  assert.ok(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), `Element exists: ${selector}`);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await pause(100);
}

async function fill(selector, value) {
  await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await pause(70);
}

async function open(id) {
  await click('[aria-label="Search Everywhere"]');
  await fill('[aria-label="Search files"]', id);
  await click('dialog[open] .results button');
  await until(`document.querySelector('#tab-${id}')?.getAttribute('aria-selected') === 'true'`, `open ${id}`);
}

async function test(name, work) {
  try {
    await work();
    results.push({ name, status: "passed" });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: "failed", error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
    try { await evaluate("document.querySelectorAll('dialog[open]').forEach(d => d.dispatchEvent(new Event('cancel')))"); } catch {}
  }
}

async function menu(name, item) {
  const mobile = await evaluate("getComputedStyle(document.querySelector('.mobilemenu')).display !== 'none'");
  if (mobile && !await evaluate("document.querySelector('.titlebar nav').classList.contains('show')")) await click('.mobilemenu');
  await evaluate(`Array.from(document.querySelectorAll('.menu > button')).find(b => b.textContent === ${JSON.stringify(name)}).click()`);
  await pause(60);
  if (item) {
    assert.ok(await evaluate(`!!Array.from(document.querySelectorAll('.dropdown button')).find(b => b.textContent === ${JSON.stringify(item)} && !b.disabled)`), `Menu item enabled: ${item}`);
    await evaluate(`Array.from(document.querySelectorAll('.dropdown button')).find(b => b.textContent === ${JSON.stringify(item)}).click()`);
    await pause(100);
  }
}

async function viewport(width, height = 900) {
  await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await pause(100);
}

try {
  await fs.mkdir(output, { recursive: true });
  server = await createServer({ server: { host: "127.0.0.1", port: 4175, strictPort: false, open: false } });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  const candidates = [process.env.SITE_TEST_BROWSER, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean);
  let executable;
  for (const candidate of candidates) { try { await fs.access(candidate); executable = candidate; break; } catch {} }
  assert.ok(executable, "Set SITE_TEST_BROWSER to a Chromium browser executable.");
  profile = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-site-check-"));
  browser = spawn(executable, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let port;
  for (let i = 0; i < 150; i++) {
    try { port = Number((await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]); break; } catch { await pause(100); }
  }
  assert.ok(port, "Headless browser started.");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id); pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__opened = [];
    window.open = (url) => { window.__opened.push(url); return null; };
    window.__realFetch = window.fetch.bind(window);
    window.__contactMode = 'success'; window.__contactCalls = 0;
    window.fetch = (url, options) => {
      if (String(url).startsWith('https://formsubmit.co/')) {
        window.__contactCalls++;
        window.__contactPayload = JSON.parse(options.body);
        if (window.__contactMode === 'error') return Promise.reject(new TypeError('Failed to fetch'));
        if (window.__contactMode === 'timeout') return Promise.reject(new DOMException('Timed out', 'TimeoutError'));
        if (window.__contactMode === 'pending') return new Promise(resolve => { window.__finishContact = () => resolve(new Response(JSON.stringify({success:true,message:'Test accepted'}))); });
        return Promise.resolve(new Response(JSON.stringify({ success:true, message:'Test accepted' })));
      }
      if (window.__failCatalog && String(url).includes('/data/' + window.__failCatalog + '.json')) {
        window.__failCatalog = ''; return Promise.resolve(new Response('{}', {status:500}));
      }
      return window.__realFetch(url, options);
    };
  ` });
  await viewport(1440);
  await call("Page.navigate", { url: origin });
  await until("document.querySelector('#tab-profile') && !document.querySelector('.toolbar .run').disabled", "initial app and catalog");

  await test("Initial Profile, portrait, AI platform logos, and PDF CV", async () => {
    assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').id"), "tab-profile");
    await until("document.querySelector('.portrait img')?.naturalWidth > 0", "portrait image");
    for (const name of portfolio.techGroups.find(([group]) => group === "AI Platforms")[1]) {
      const selector = `.tech-mark[title="${name}"] img`;
      await until(`document.querySelector(${JSON.stringify(selector)})?.naturalWidth > 0`, name);
    }
    await click('[aria-label="Download CV"]');
    assert.equal(await evaluate("window.__opened.at(-1)"), portfolio.cvUrl);
    const response = await fetch(origin + portfolio.cvUrl);
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  });

  await test("All seven editor pages open through Search Everywhere", async () => {
    for (const id of Object.keys(portfolio.files)) await open(id);
    assert.equal(await evaluate("document.querySelectorAll('[role=tab]').length"), 7);
  });

  await test("Research shares the Projects table and keeps titles, links and search focus", async () => {
    await open("research");
    assert.equal(await evaluate("document.querySelector('.research-details-table').classList.contains('details-table')"), true);
    assert.equal(await evaluate("document.querySelectorAll('.research-details-table tbody tr').length"), portfolio.research.length);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.research-details-table a')).map(a=>a.href)"), portfolio.research.map((record) => record.url));
    await click('[aria-label="Search Everywhere"]');
    await fill('[aria-label="Search files"]', "Victim Detection");
    await click('dialog[open] .results button');
    await until("document.activeElement.id === 'patent-tof'", "research search focus");
  });

  await test("Project filters, galleries, GitHub and live links", async () => {
    await open("projects");
    await until("document.querySelectorAll('.projects-table tbody tr').length === 3", "project rows");
    const projects = await (await fetch(origin + "/data/projects.json")).json();
    for (const project of projects) {
      const gallery = `#project-gallery-${project.id}`;
      assert.equal(await evaluate(`document.querySelectorAll('${gallery} img').length`), Math.min(3, project.tableImages.length));
      if (project.tableImages.length > 3) {
        await click(`[aria-controls="project-gallery-${project.id}"]`);
        assert.equal(await evaluate(`document.querySelectorAll('${gallery} img').length`), project.tableImages.length);
        await click(`[aria-controls="project-gallery-${project.id}"]`);
      }
      if (project.live) assert.match(project.live, /^https?:\/\//);
      if (project.github || project.live) {
        await click(`#${project.id} .projects-table-name`);
        assert.equal(await evaluate("window.__opened.at(-1)"), project.github || project.live);
      }
    }
    await click('#niriksha .projects-table-name');
    assert.equal(await evaluate("window.__opened.at(-1)"), projects[0].github);
    await evaluate("Array.from(document.querySelectorAll('.filters button')).find(b=>b.textContent==='Supabase').click()");
    await pause(100);
    assert.equal(await evaluate("document.querySelectorAll('.projects-table tbody tr').length"), 1);
    await evaluate("Array.from(document.querySelectorAll('.filters button')).find(b=>b.textContent==='All').click()");
  });

  await test("Achievements previews, modal close and credential PDFs", async () => {
    await open("certificates");
    await until("document.querySelectorAll('.certificate-card').length === 5", "certificates");
    await click('.certificate-card .cert-photo');
    assert.equal(await evaluate("document.querySelectorAll('.cert-viewer[open]').length"), 1);
    await click('.cert-viewer[open] [aria-label="Close certificate"]');
    assert.equal(await evaluate("document.activeElement.className"), "cert-photo");
    const records = await (await fetch(origin + "/data/certificates.json")).json();
    for (const record of records) {
      for (const url of [record.image, record.url].filter(Boolean)) assert.equal((await fetch(origin + url)).status, 200, url);
    }
  });

  await test("Contact validation, success, failure, timeout and duplicate prevention (mocked)", async () => {
    await open("contact");
    assert.equal(await evaluate("document.querySelector('form.contact').checkValidity()"), false);
    for (const mode of ["success", "error", "timeout", "pending"]) {
      await evaluate(`window.__contactMode=${JSON.stringify(mode)}`);
      await fill('.contact [name=name]', "Site test"); await fill('.contact [name=email]', "test@example.com"); await fill('.contact [name=message]', "Local automated test");
      await click('.contact button[type=submit]');
      if (mode === "pending") {
        const count = await evaluate("window.__contactCalls");
        await evaluate("document.querySelector('form.contact').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
        assert.equal(await evaluate("window.__contactCalls"), count);
        assert.equal(await evaluate("document.querySelector('.contact button').disabled"), true);
        await evaluate("window.__finishContact()");
      }
      await until("!document.querySelector('.contact button').disabled && !!document.querySelector('.contact output').textContent", "contact response");
      const note = await evaluate("document.querySelector('.contact output').textContent");
      if (["success", "pending"].includes(mode)) assert.equal(note, "Test accepted");
      else { assert.match(note, mode === "error" ? /Could not reach/ : /timed out/); assert.equal(await evaluate("document.querySelector('.contact [name=message]').value"), "Local automated test"); }
    }
  });

  await test("Theme switching, persistence, menus and tab keyboard controls", async () => {
    await click('[aria-label="Switch theme"]');
    assert.equal(await evaluate("localStorage.getItem('ide-theme') === document.documentElement.dataset.theme"), true);
    await menu("Navigate", "academics.ts");
    assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').id"), "tab-academics");
    await evaluate("document.querySelector('#tab-academics').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}))");
    assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').id"), "tab-contact");
    await menu("File", "Close tab"); await menu("File", "Reopen closed tab");
    assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').id"), "tab-contact");
    await menu("Help", "About"); assert.equal(await evaluate("document.querySelector('dialog[open]').getAttribute('aria-label')"), "About this workspace");
    await click('[aria-label="Close dialog"]');
  });

  await test("Search shortcuts, no-result state, tab reordering and menu keyboard focus", async () => {
    await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',ctrlKey:true,shiftKey:true,bubbles:true}))");
    await until("document.querySelector('dialog[open]')", "search shortcut");
    await fill('[aria-label="Search files"]', "no-such-file-123");
    assert.equal(await evaluate("document.querySelector('dialog[open] .results').textContent"), "No matches.");
    await click('[aria-label="Close dialog"]');
    await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Shift'}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Shift'}));");
    await until("document.querySelector('dialog[open]')", "double shift search");
    await click('[aria-label="Close dialog"]');
    const initial = await evaluate("Array.from(document.querySelectorAll('[role=tab]')).map(t=>t.id)");
    await evaluate("const tabs=document.querySelectorAll('.tab');tabs[0].dispatchEvent(new Event('dragstart',{bubbles:true}));tabs[1].dispatchEvent(new Event('drop',{bubbles:true,cancelable:true}));");
    await pause(100);
    const reordered = await evaluate("Array.from(document.querySelectorAll('[role=tab]')).map(t=>t.id)");
    assert.equal(reordered[1], initial[0]);
    await menu("File");
    await evaluate("const first=document.querySelector('.dropdown button:not(:disabled)');first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));");
    assert.equal(await evaluate("document.activeElement.textContent"), "Download CV");
    await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
  });

  await test("Copy, selection, file-path and current-page download actions", async () => {
    await open("profile");
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}});");
    await menu("Edit", "Copy file path");
    assert.equal(await evaluate("window.__copied"), "portfolio/src/profile.ts");
    await menu("Edit", "Copy page text");
    assert.match(await evaluate("window.__copied"), /Sudipta Sarkar/);
    await menu("Edit", "Select page text");
    assert.match(await evaluate("window.getSelection().toString()"), /Sudipta Sarkar/);
    await evaluate("window.getSelection().removeAllRanges();window.__anchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__download={name:this.download,href:this.href};};const original=URL.createObjectURL;URL.createObjectURL=blob=>{window.__downloadBlob=blob;return original(blob);};");
    await menu("File", "Download current page");
    assert.equal(await evaluate("window.__download.name"), "profile.txt");
    assert.match(await evaluate("window.__downloadBlob.text()"), /Sudipta Sarkar/);
    await evaluate("HTMLAnchorElement.prototype.click=window.__anchorClick");
  });

  await test("Sidebar Structure, bookmarks and terminal commands", async () => {
    await click('[aria-label="Structure"]');
    assert.equal(await evaluate("document.querySelectorAll('.sidebar .file').length"), 7);
    await click('[aria-label="Bookmarks"]');
    await evaluate("Array.from(document.querySelectorAll('.sidebar button')).find(b=>b.textContent.includes('Bookmark current')).click()");
    await pause(100);
    assert.equal(await evaluate("document.querySelectorAll('.sidebar .file').length"), 1);
    await click('[aria-label="Terminal"]');
    for (const command of ["help", "ls", "about", "open research", "theme", "not-a-command", "clear"]) {
      await fill('[aria-label="Terminal command"]', command);
      await evaluate("document.querySelector('.terminal form').requestSubmit()"); await pause(100);
      if (command === "open research") assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').id"), "tab-research");
    }
    assert.equal(await evaluate("document.querySelector('.terminal .history').textContent"), "");
    await click('[title="Close terminal"]');
    await click('[aria-label="Bookmarks"]');
  });

  await test("Empty-editor picker and tab reopening", async () => {
    await evaluate("Array.from(document.querySelectorAll('.tabclose')).forEach((b,i)=>setTimeout(()=>b.click(),i*80))");
    await until("document.querySelectorAll('[role=tab]').length === 0", "close tabs");
    assert.equal(await evaluate("document.querySelectorAll('.file-picker-list button').length"), 7);
    await evaluate("document.querySelector('.file-picker-list button').click()");
    await until("document.querySelector('#tab-profile')", "file picker opens profile");
  });

  await test("Every page at 320, 375, 600, 768, 1024 and 1440 widths in both themes", async () => {
    for (const theme of ["light", "dark"]) {
      if (await evaluate("document.documentElement.dataset.theme") !== theme) await click('[aria-label="Switch theme"]');
      for (const width of [320, 375, 600, 768, 1024, 1440]) {
        await viewport(width);
        for (const id of Object.keys(portfolio.files)) {
          await open(id);
          const measurements = await evaluate(`(() => {
            const page=document.querySelector('.fileview:not([hidden])');
            return {body:document.documentElement.scrollWidth,viewport:innerWidth,page:page.scrollWidth,available:page.clientWidth,editor:document.querySelector('.editor').scrollWidth,editorWidth:document.querySelector('.editor').clientWidth};
          })()`);
          assert.ok(measurements.body <= width + 1 && measurements.page <= measurements.available + 1 && measurements.editor <= measurements.editorWidth + 1, `${id} at ${width}/${theme}: ${JSON.stringify(measurements)}`);
        }
        if (width >= 1024) {
          await click('[aria-label="Toggle project panel"]');
          for (const id of ["projects", "research", "academics"]) {
            await open(id);
            assert.equal(await evaluate("(() => {const p=document.querySelector('.fileview:not([hidden])');return p.scrollWidth<=p.clientWidth+1;})()"), true, `${id} with sidebar at ${width}/${theme}`);
          }
          await click('[aria-label="Toggle project panel"]');
        }
        if ([375, 1440].includes(width)) {
          await open("research");
          const screenshot = await call("Page.captureScreenshot", { format: "png" });
          await fs.writeFile(path.join(output, `research-${width}-${theme}.png`), Buffer.from(screenshot.data, "base64"));
        }
      }
    }
  });

  await test("Mobile application menus and dismissible project drawer", async () => {
    await viewport(375);
    await menu("Navigate", "academics.ts");
    await click('[aria-label="Toggle project panel"]');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.sidebar')).position"), "absolute");
    await click('[aria-label="Dismiss drawer"]');
    assert.equal(await evaluate("document.querySelector('.sidebar')"), null);
  });

  await test("Academic dates adapt to editor width and reduced motion is respected", async () => {
    for (const width of [375, 1440]) {
      await viewport(width); await open("academics");
      const result = await evaluate("(() => {const block=document.querySelector('.record-entry-title').getBoundingClientRect(),period=document.querySelector('.record-period').getBoundingClientRect();return {below:period.top>=block.bottom-1,right:period.left>=block.right-1};})()");
      assert.ok(width === 375 ? result.below : result.right, JSON.stringify(result));
    }
    await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.fileview:not([hidden])')).animationName"), "none");
  });

  await test("Catalog failure and Retry recovery", async () => {
    await call("Page.addScriptToEvaluateOnNewDocument", { source: "window.__failCatalog='projects';" });
    await call("Page.reload", {});
    await until("document.querySelector('#tab-profile')", "reloaded app");
    await open("projects");
    await until("document.querySelector('[role=alert]')", "catalog error state");
    await click('[role=alert] button');
    await until("document.querySelectorAll('.projects-table tbody tr').length === 3", "retry recovery");
  });

  await test("No uncaught browser exceptions", async () => assert.deepEqual(errors, []));

  await test("All configured local project, certificate, portrait and CV assets load", async () => {
    const projects = await (await fetch(origin + "/data/projects.json")).json();
    const certificates = await (await fetch(origin + "/data/certificates.json")).json();
    const urls = new Set([portfolio.photoUrl, portfolio.cvUrl]);
    for (const p of projects) for (const url of [p.image,p.tableImage,...(p.tableImages || []).map(i=>i.src)].filter(Boolean)) urls.add(url);
    for (const c of certificates) for (const url of [c.image,c.demoImage,c.url].filter(Boolean)) if(url.startsWith('/')) urls.add(url);
    const checks = await Promise.all([...urls].map(async url => ({url,response:await fetch(origin+url)})));
    for(const {url,response} of checks) {
      assert.equal(response.status,200,url);
      assert.ok(!response.headers.get('content-type')?.includes('text/html'),`Asset returned SPA HTML: ${url}`);
    }
  });
} catch (error) {
  results.push({ name: "Browser setup", status: "failed", error: error.stack || error.message });
  console.error(error);
} finally {
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  if (socket?.readyState === WebSocket.OPEN) { try { await call("Browser.close", {}, undefined); } catch {} socket.close(); }
  browser?.kill();
  await server?.close();
  if (profile && path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith("portfolio-site-check-")) {
    await pause(300);
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {});
  }
  const failed = results.filter(({ status }) => status === "failed");
  console.log(`${results.length - failed.length}/${results.length} checks passed. Report: ${path.join(output, "report.json")}`);
  process.exitCode = failed.length ? 1 : 0;
}
