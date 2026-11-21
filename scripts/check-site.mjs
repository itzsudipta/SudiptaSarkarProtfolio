import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "vite";
import { portfolio } from "../src/data/data.js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiSupabase, SiVite } from "react-icons/si";

// Runs against local source. Contact requests and external-window actions are
// intercepted in the isolated browser; no messages are sent to the live service.
const output = path.resolve("test-results/site-check");
const results = [];
const filter = !process.argv.includes('--all') && process.env.SITE_CHECK_FILTER ? new RegExp(process.env.SITE_CHECK_FILTER) : null;
const responsiveViewports = [
  [320,568,true],[326,726,true],[360,640,true],[375,812,true],[390,844,true],[414,896,true],[536,726,true],
  [568,320,true],[812,375,true],[599,800,true],[600,800,true],[601,800,true],
  [768,1024,true],[800,900,true],[801,900,false],[1024,768,false],
  [1280,800,false],[1440,900,false],[1920,1080,false],
];
let retainedChecks = 0;
if (filter) {
  try {
    const previous = JSON.parse(await fs.readFile(path.join(output, "report.json"), "utf8"));
    results.push(...previous.results.filter(({ name }) => !filter.test(name)));
    retainedChecks = results.length;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
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
  if (filter && !filter.test(name)) return;
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

async function viewport(width, height = 900, mobile = false) {
  await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
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
      if (String(url).startsWith('https://formsubmit.co/') || (options?.method === 'POST' && String(url).endsWith('/contact'))) {
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
    await evaluate("window.__cvAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__cvDownloaded={href:this.href,name:this.download};};");
    await click('[aria-label="Download CV"]');
    const downloaded = await evaluate("window.__cvDownloaded");
    await evaluate("void (HTMLAnchorElement.prototype.click=window.__cvAnchorClick)");
    assert.equal(downloaded.href, origin + portfolio.cvUrl);
    assert.equal(downloaded.name, portfolio.name.replace(/\s+/g, "-") + "-CV.pdf");
    const response = await fetch(origin + portfolio.cvUrl);
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  });

  await test("Header logo, browser favicons, touch icon and manifest assets", async () => {
    assert.equal(await evaluate("document.title"), portfolio.name);
    await until("document.querySelector('.brand-logo')?.naturalWidth > 0", "header logo");
    assert.equal(await evaluate("document.querySelector('.brand-logo').getBoundingClientRect().width"), 32);
    const links = await evaluate("Array.from(document.querySelectorAll('head link[rel=icon],head link[rel=apple-touch-icon],head link[rel=manifest]')).map(link=>link.href)");
    assert.equal(links.length, 5);
    for (const url of links) {
      const response = await fetch(url);
      assert.equal(response.status, 200, url);
      assert.ok(!response.headers.get('content-type')?.includes('text/html'), url);
    }
    const manifestURL = await evaluate("document.querySelector('link[rel=manifest]').href");
    const manifest = await (await fetch(manifestURL)).json();
    for (const icon of manifest.icons) {
      const response = await fetch(new URL(icon.src, manifestURL));
      assert.equal(response.status, 200, icon.src);
      assert.ok(response.headers.get('content-type')?.includes('image/png'), icon.src);
    }
    const tileConfig = await evaluate("document.querySelector('meta[name=msapplication-config]').content");
    const xml = await (await fetch(origin + tileConfig)).text();
    const tileURL = xml.match(/square150x150logo src="([^"]+)"/)[1];
    assert.equal((await fetch(origin + tileURL)).status, 200);
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

  await test("All projects are visible with WebP galleries, GitHub and live links", async () => {
    await open("projects");
    await until("document.querySelectorAll('.projects-table tbody tr').length === 3", "project rows");
    const projects = await (await fetch(origin + "/data/projects.json")).json();
    assert.equal(await evaluate("document.querySelectorAll('.projects-page .filters').length"), 0);
    assert.deepEqual(
      await evaluate("Array.from(document.querySelectorAll('.projects-table-name'), button => button.textContent)"),
      projects.map(({ name }) => name),
    );
    for (const project of projects) {
      assert.match(project.image, /\.webp$/i);
      project.tableImages.forEach(({ src }) => assert.match(src, /\.webp$/i));
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
  });

  await test("Projects tech icons are larger and Vite/Supabase logos render in both themes", async () => {
    const expected = new Map([
      ['Vite',renderToStaticMarkup(React.createElement(SiVite)).match(/<path d="([^"]+)"/)[1]],
      ['Supabase',renderToStaticMarkup(React.createElement(SiSupabase)).match(/<path d="([^"]+)"/)[1]],
    ]);
    for(const theme of ['light','dark']) {
      if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('[aria-label="Switch theme"]');
      for(const width of [320,375,600,768,1440]) {
        await viewport(width,900,width<=600);
        await open('projects');
        for(const [name,shape] of expected) {
          const selector=`.projects-table-stack .tech-mark[title="${name}"]`;
          const icon=await evaluate(`(() => {
            const mark=document.querySelector(${JSON.stringify(selector)});
            const svg=mark?.querySelector('svg');
            if(!svg)return null;
            const box=svg.getBoundingClientRect();
            const page=document.querySelector('.fileview:not([hidden])');
            return {path:svg.querySelector('path')?.getAttribute('d'),width:box.width,height:box.height,color:getComputedStyle(svg).color,inheritedColor:getComputedStyle(mark).color,overflow:page.scrollWidth>page.clientWidth+1};
          })()`);
          assert.ok(icon,`${name} logo exists`);
          assert.equal(icon.path,shape,`${name} uses its brand logo rather than a generic symbol`);
          assert.equal(icon.width,22);assert.equal(icon.height,22);
          assert.equal(icon.overflow,false);
          assert.equal(icon.color,name==='Supabase'?'rgb(63, 207, 142)':'rgb(139, 92, 246)');
        }
        if(width===375) {
          await evaluate("document.querySelector('#fabricanova').scrollIntoView({block:'start'})");
          const screenshot=await call('Page.captureScreenshot',{format:'webp',quality:95});
          await fs.writeFile(path.join(output,`project-icons-${width}-${theme}.webp`),Buffer.from(screenshot.data,'base64'));
        }
      }
    }
    await viewport(1440);
  });

  await test("Projects highlights, cells and screenshots fit the editor width", async () => {
    const projects = await (await fetch(origin + "/data/projects.json")).json();
    const fileStacker = projects.find(({ id }) => id === "filestacker");
    assert.equal(fileStacker.tableImages.length, 2);
    assert.equal(fileStacker.image, fileStacker.tableImages[0].src);
    assert.ok(fileStacker.tableImages.every(({ src }) => !src.endsWith("/image.webp")));

    await open("projects");
    await until("document.querySelectorAll('.projects-table tbody tr').length === 3", "project rows");
    assert.deepEqual(
      await evaluate("Array.from(document.querySelectorAll('.projects-table-highlights strong'), heading => heading.textContent)"),
      projects.flatMap(({ highlights }) => highlights.map(({ label }) => label)),
    );

    for (const width of [320, 375, 600, 800, 1024, 1440]) {
      await viewport(width, 900, width <= 600);
      const layout = await evaluate(`(() => {
        const page = document.querySelector('.projects-page');
        const table = page.querySelector('table');
        const rows = [...table.tBodies[0].rows];
        const inside = (item, parent) => {
          const child = item.getBoundingClientRect();
          const outer = parent.getBoundingClientRect();
          return child.left >= outer.left - 1 && child.right <= outer.right + 1;
        };
        const compact = page.clientWidth <= 672;
        const cellsFit = rows.every(row => {
          const [heading, details] = row.cells;
          const title = heading.getBoundingClientRect();
          const content = details.getBoundingClientRect();
          const positioned = compact ? content.top >= title.bottom - 1 : content.left >= title.right - 1;
          return positioned && [heading, details].every(cell =>
            inside(cell, row) && cell.scrollWidth <= cell.clientWidth + 1
          );
        });
        const imagesFit = [...table.querySelectorAll('.image-gallery-items img')].every(image =>
          inside(image, image.parentElement.closest('td'))
        );
        return { tableFits: inside(table, page), cellsFit, imagesFit };
      })()`);
      assert.deepEqual(layout, { tableFits: true, cellsFit: true, imagesFit: true }, `Projects at ${width}px`);
    }
  });

  await test("Experience image galleries, independent expansion and responsive sizing", async () => {
    await open('experience');
    assert.equal(await evaluate("document.querySelectorAll('.fileview:not([hidden]) .image-gallery').length"), 0, 'Empty image lists do not show placeholder galleries');
    const projects = await (await fetch(origin + '/data/projects.json')).json();
    const images = projects[0].tableImages.slice(0,4).map(({src},index) => ({src,alt:index ? `Experience test image ${index+1}` : ''}));
    await evaluate(`(async () => {
      const {portfolio} = await import('/src/data/data.js');
      window.__experienceImages = portfolio.experience.map(entry => entry[3]);
      portfolio.experience[0][3] = ${JSON.stringify(images)};
      portfolio.experience[1][3] = ${JSON.stringify(images)};
      portfolio.experience[2][3] = ${JSON.stringify(images.slice(0,1))};
    })()`);
    const first = '.fileview:not([hidden]) .records-list > li:first-child';
    const second = '.fileview:not([hidden]) .records-list > li:nth-child(2)';
    try {
      await open('experience');
      assert.equal(await evaluate("document.querySelectorAll('.fileview:not([hidden]) .image-gallery').length"),3);
      const ids=await evaluate("Array.from(document.querySelectorAll('.fileview:not([hidden]) .image-gallery-items')).map(g=>g.id)");
      assert.equal(new Set(ids).size,3,'Each gallery has a unique control target');
      assert.equal(await evaluate(`document.querySelectorAll('${first} img').length`),3);
      assert.match(await evaluate(`document.querySelector('${first} img').alt`),/College Project Team Lead image 1/);
      await click(`${first} .image-gallery-toggle`);
      assert.equal(await evaluate(`document.querySelectorAll('${first} img').length`),4);
      assert.equal(await evaluate(`document.querySelectorAll('${second} img').length`),3,'Expanding one gallery does not expand another');
      assert.equal(await evaluate(`document.querySelector('${first} .image-gallery-toggle').getAttribute('aria-expanded')`),'true');
      await evaluate(`document.querySelector('${first} .image-gallery-toggle').focus()`);
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
      await pause(100);
      assert.equal(await evaluate(`document.querySelectorAll('${first} img').length`),3,'Keyboard activates the gallery toggle');
      for(const theme of ['light','dark']) {
        if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('[aria-label="Switch theme"]');
        for(const width of [320,375,600,768,1024,1440]) {
          await viewport(width,900,width<=600);
          await open('experience');
          await evaluate("document.querySelector('.editor').scrollTo(0,0)");
          if(width<=600) assert.equal(await evaluate("!!document.querySelector('.sidebar')"),false,'Gallery is visible without the phone drawer covering it');
          const layout=await evaluate(`(() => {
            const page=document.querySelector('.fileview:not([hidden])');
            const gallery=document.querySelector('${first} .image-gallery-items');
            const images=Array.from(gallery.querySelectorAll('img'));
            const rect=gallery.getBoundingClientRect();
            return {overflow:page.scrollWidth>page.clientWidth+1,ratio:images[0].getBoundingClientRect().width/rect.width,contained:images.every(img=>{const r=img.getBoundingClientRect();return r.left>=rect.left-1&&r.right<=rect.right+1;}),fit:getComputedStyle(images[0]).objectFit};
          })()`);
          assert.ok(!layout.overflow&&layout.contained,`Experience gallery at ${width}/${theme}: ${JSON.stringify(layout)}`);
          assert.ok(Math.abs(layout.ratio-(width<=600?1:0.3))<0.01, 'Image sizes use percentages');
          assert.equal(layout.fit,'contain','Images are not cropped');
          if([375,1440].includes(width)) {
            const screenshot=await call('Page.captureScreenshot',{format:'webp',quality:95});
            await fs.writeFile(path.join(output,`experience-gallery-fixture-${width}-${theme}.webp`),Buffer.from(screenshot.data,'base64'));
          }
        }
      }
    } finally {
      await evaluate(`(async () => {const {portfolio}=await import('/src/data/data.js');portfolio.experience.forEach((entry,index)=>{entry[3]=window.__experienceImages[index];});})()`);
      await viewport(1440);
      await open('experience');
    }
    assert.equal(await evaluate("document.querySelectorAll('.fileview:not([hidden]) .image-gallery').length"),0,'Temporary gallery images are removed after the test');
    await open('academics');
    assert.equal(await evaluate("document.querySelectorAll('.fileview:not([hidden]) .image-gallery').length"),0,'Academic records are unchanged');
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

  await test("Phone footer, status notices and large text stay readable without overlap", async () => {
    const inspect = async () => evaluate(`(() => {
      const footer=document.querySelector('.statusbar');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      const items=Array.from(footer.children).filter(el=>getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0).map(el=>({name:el.className,...rect(el)}));
      return {footer:rect(footer),items,display:getComputedStyle(footer).display,overflow:footer.scrollWidth>footer.clientWidth+1,viewport:innerWidth,height:innerHeight,encoding:getComputedStyle(document.querySelector('.status-encoding')).display};
    })()`);
    const fits = (layout) => {
      assert.ok(!layout.overflow, JSON.stringify(layout));
      assert.ok(Math.abs(layout.footer.bottom-layout.height)<=1, 'Footer stays at the viewport bottom');
      for(const item of layout.items) {
        assert.ok(item.left>=layout.footer.left-1&&item.right<=layout.footer.right+1&&item.top>=layout.footer.top-1&&item.bottom<=layout.footer.bottom+1, `Clipped footer item: ${JSON.stringify(item)}`);
      }
      for(let i=0;i<layout.items.length;i++) for(let j=i+1;j<layout.items.length;j++) {
        const a=layout.items[i],b=layout.items[j];
        const intersects=Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
        assert.ok(!intersects, `Overlapping footer items: ${a.name} / ${b.name}`);
      }
    };
    for (const theme of ['light','dark']) {
      if(await evaluate('document.documentElement.dataset.theme')!==theme) await click('[aria-label="Switch theme"]');
      for (const [width,height] of [[320,568],[360,640],[375,812],[390,844],[414,896],[600,360],[768,1024],[1440,900]]) {
        await viewport(width,height,width<=600);
        await open('profile');
        const layout=await inspect();
        fits(layout);
        assert.equal(layout.display,width<=600?'grid':'flex');
        assert.equal(layout.encoding,width<=600?'none':'flex');
        if(width<=600) {
          const branch=layout.items.find(i=>i.name==='status-branch');
          const credit=layout.items.find(i=>i.name==='developer-credit');
          const themeItem=layout.items.find(i=>i.name==='footTheme');
          assert.ok(credit.left>branch.left&&themeItem.top>=Math.max(branch.bottom,credit.bottom), 'Phone footer has intentional rows');
          await evaluate("document.querySelector('.status-notice').textContent='Copied a very long file path successfully for the current research record.'");
          fits(await inspect());
          await evaluate("document.querySelector('.status-notice').textContent=''");
        }
        if([360,390].includes(width)) {
          const screenshot=await call('Page.captureScreenshot',{format:'webp',quality:95});
          await fs.writeFile(path.join(output,`footer-${width}-${theme}.webp`),Buffer.from(screenshot.data,'base64'));
        }
      }
      await viewport(320,568,true);
      await evaluate("document.documentElement.style.fontSize='200%'");
      fits(await inspect());
      await evaluate("document.documentElement.style.fontSize=''");
    }
    await viewport(1440);
  });

  await test("Editor line numbers stop at content and line/column tracking adapts to phone widths", async () => {
    const inspect = () => evaluate(`(() => {
      const editor=document.querySelector('.editor'), view=editor.querySelector('.fileview:not([hidden])');
      const gutter=editor.querySelector('.gutter');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};};
      const spans=Array.from(gutter.children), lh=parseFloat(getComputedStyle(gutter).lineHeight);
      const glyphs=spans.map(el=>{const r=document.createRange();r.selectNodeContents(el);return rect(r);});
      return {numbers:spans.map(s=>Number(s.textContent)),expected:1+Math.floor(view.getBoundingClientRect().height/lh),lineHeight:lh,
        gutter:rect(gutter),view:rect(view),glyphs,editor:rect(editor),footer:rect(document.querySelector('.statusbar')),
        scrollTop:editor.scrollTop,firstComment:rect(view.querySelector('.comment')),
        scrollWidth:editor.scrollWidth,clientWidth:editor.clientWidth,viewport:innerWidth,viewportHeight:innerHeight,
        position:document.querySelector('.status-position').textContent};
    })()`);
    const assertGutter = (layout, context) => {
      assert.equal(layout.numbers.length, layout.expected, `Content-dependent count: ${context}`);
      assert.deepEqual(layout.numbers, Array.from({length:layout.expected}, (_,i)=>i+1), `Continuous numbering: ${context}`);
      assert.ok(Math.abs(layout.view.top-layout.gutter.top-layout.lineHeight)<1, `Content begins on line 2: ${context}`);
      assert.ok(Math.abs(layout.firstComment.top-layout.view.top)<1, `First page row aligns with line 2: ${context}`);
      if(layout.scrollTop===0) assert.ok(Math.abs(layout.gutter.top-layout.editor.top)<1, `Line 1 stays directly below tabs: ${context}`);
      assert.ok(layout.gutter.bottom<=layout.view.bottom+1, `Gutter stops at content: ${context}`);
      for(const glyph of layout.glyphs) {
        assert.ok(glyph.left>=layout.gutter.left-0.5&&glyph.right<=layout.gutter.right+0.5, `Number fits the gutter: ${context}`);
        assert.ok(glyph.bottom<=layout.view.bottom+1, `Number stays above content end: ${context}`);
      }
      assert.ok(layout.scrollWidth<=layout.clientWidth+1, `No horizontal editor overflow: ${context}`);
      const [,line,column]=layout.position.match(/Ln (\d+), Col (\d+)/);
      assert.ok(Number(line)>=1&&Number(line)<=layout.expected&&Number(column)>=1, `Bounded position: ${context}`);
      assert.ok(layout.footer.bottom<=layout.viewportHeight+1, `Footer remains in viewport: ${context}`);
    };
    for(const theme of ['light','dark']) {
      if(await evaluate('document.documentElement.dataset.theme')!==theme) await click('[aria-label="Switch theme"]');
      for(const width of [536,326,320,375,768,1440]) {
        await viewport(width,726,width<=768);
        await open('contact');
        for(const id of Object.keys(portfolio.files)) {
          await open(id);
          await pause(150);
          assertGutter(await inspect(), `${id}, ${width}, ${theme}, top`);
          assert.equal(await evaluate("document.querySelector('.status-position').textContent"), 'Ln 1, Col 1', 'Changing files resets the position');
          await evaluate("document.querySelector('.editor').scrollTo(0,document.querySelector('.editor').scrollHeight)");
          await pause(50);
          const bottom=await inspect();
          assertGutter(bottom, `${id}, ${width}, ${theme}, bottom`);
        }
        await open('profile');
        await pause(150);
        await evaluate(`(() => {
          const node=document.querySelector('.fileview:not([hidden]) .comment').firstChild;
          window.getSelection().setPosition(node,5);
        })()`);
        await until("document.querySelector('.status-position').textContent==='Ln 2, Col 6'", 'selection updates the actual line and column');
        assertGutter(await inspect(), `selected column, ${width}, ${theme}`);
        const wrappedPosition=await evaluate(`(() => {
          const view=document.querySelector('.fileview:not([hidden])'), node=view.querySelector('.identity p').firstChild;
          const range=document.createRange();range.setStart(node,0);range.setEnd(node,1);
          const firstTop=range.getBoundingClientRect().top;
          for(let i=1;i<node.length-1;i++) {
            range.setStart(node,i);range.setEnd(node,i+1);
            const rect=range.getBoundingClientRect();
            if(rect.width>0&&rect.top>firstTop+1) {
              window.getSelection().setPosition(node,i+1);
              range.setStart(node,i+1);range.collapse(true);
              const caret=range.getBoundingClientRect(), gutter=document.querySelector('.gutter');
              return 'Ln '+(1+Math.floor(((caret.top+caret.bottom)/2-gutter.getBoundingClientRect().top)/parseFloat(getComputedStyle(gutter).lineHeight)))+', Col 2';
            }
          }
          throw new Error('The profile paragraph should wrap at this width');
        })()`);
        await until(`document.querySelector('.status-position').textContent===${JSON.stringify(wrappedPosition)}`, 'wrapped text column starts at the rendered row');
        if([536,326].includes(width)) {
          const screenshot=await call('Page.captureScreenshot',{format:'webp',quality:95});
          await fs.writeFile(path.join(output,`editor-lines-${width}-${theme}.webp`),Buffer.from(screenshot.data,'base64'));
        }
      }
    }
    await viewport(326,726,true);
    await open('projects');
    const toggle='.fileview:not([hidden]) .image-gallery-toggle';
    await until(`document.querySelector(${JSON.stringify(toggle)})`, 'gallery ready');
    const original=(await inspect()).expected;
    await click(toggle);
    await until(`document.querySelectorAll('.gutter span').length>${original}`, 'gutter grows when gallery expands');
    assertGutter(await inspect(), 'expanded gallery');
    await click(toggle);
    await until(`document.querySelectorAll('.gutter span').length===${original}`, 'gutter shrinks when gallery collapses');

    await open('contact');
    await fill('input[name=name]', 'Sudipta Sarkar');
    await evaluate(`(() => {const field=document.querySelector('input[name=name]');field.focus();field.setSelectionRange(4,4);field.dispatchEvent(new Event('select',{bubbles:true}));})()`);
    await until("document.querySelector('.status-position').textContent.endsWith('Col 5')", 'input caret updates column');
    await fill('textarea[name=message]', 'First line\nSecond line');
    await evaluate(`(() => {const field=document.querySelector('textarea[name=message]');field.focus();field.setSelectionRange(14,14);field.dispatchEvent(new Event('select',{bubbles:true}));})()`);
    await until("document.querySelector('.status-position').textContent.endsWith('Col 4')", 'multiline input column resets after newline');
    assertGutter(await inspect(), 'contact input caret');
    await evaluate("document.activeElement.blur();window.getSelection().removeAllRanges()");
    await open('profile');
    await viewport(1440);
  });

  await test("Every page across 19 phone/tablet/desktop viewports and both themes", async () => {
    for (const theme of ["light", "dark"]) {
      if (await evaluate("document.documentElement.dataset.theme") !== theme) await click('[aria-label="Switch theme"]');
      for (const [width,height,mobile] of responsiveViewports) {
        await viewport(width,height,mobile);
        for (const id of Object.keys(portfolio.files)) {
          await open(id);
          const measurements = await evaluate(`(() => {
            const page=document.querySelector('.fileview:not([hidden])');
            return {body:document.documentElement.scrollWidth,viewport:innerWidth,page:page.scrollWidth,available:page.clientWidth,editor:document.querySelector('.editor').scrollWidth,editorWidth:document.querySelector('.editor').clientWidth};
          })()`);
          assert.ok(measurements.body <= width + 1 && measurements.page <= measurements.available + 1 && measurements.editor <= measurements.editorWidth + 1, `${id} at ${width}/${theme}: ${JSON.stringify(measurements)}`);
        }
        const chrome=await evaluate(`(() => {
          const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
          const visible=el=>getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0;
          return {title:rect(document.querySelector('.titlebar')),toolbar:rect(document.querySelector('.toolbar')),footer:rect(document.querySelector('.statusbar')),width:innerWidth,height:innerHeight,controls:Array.from(document.querySelectorAll('.brand-name,.title-actions,.titlebar .mobilemenu,.titlebar nav:not(.show),.toolbar .run,.toolbar .gh')).filter(visible).map(el=>({name:el.className,...rect(el)}))};
        })()`);
        for(const control of chrome.controls) assert.ok(control.left>=-1&&control.right<=chrome.width+1,`Header control outside viewport at ${width}/${theme}: ${JSON.stringify(control)}`);
        for(const key of ['title','toolbar','footer'])assert.ok(chrome[key].top>=-1&&chrome[key].bottom<=chrome.height+1,`${key} outside viewport at ${width}x${height}/${theme}`);
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
          const screenshot = await call("Page.captureScreenshot", { format: "webp", quality: 95 });
          await fs.writeFile(path.join(output, `research-${width}-${theme}.webp`), Buffer.from(screenshot.data, "base64"));
        }
      }
    }
  });

  await test("Header controls do not overlap at navigation breakpoints", async () => {
    for(const theme of ['light','dark']) {
      if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('[aria-label="Switch theme"]');
      for(const width of [320,599,600,601,640,680,768,800,801,1024,1440]) {
        await viewport(width,800,width<=800);
        await open('profile');
        const controls=await evaluate(`Array.from(document.querySelectorAll('.brand-logo,.brand-name,.title-actions,.titlebar .mobilemenu,.titlebar nav:not(.show)')).filter(el=>getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {name:el.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom};})`);
        for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++) {
          const a=controls[i],b=controls[j];
          assert.ok(!(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1),`Header collision at ${width}/${theme}: ${a.name} and ${b.name}`);
        }
      }
    }
    await viewport(1440);
  });

  await test("Dialogs, menus, contact fields and terminal fit phone and landscape viewports", async () => {
    const assertBounds = async (selector, description) => {
      const box=await evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:el.scrollWidth>el.clientWidth+1};})()`);
      assert.ok(box,description);
      assert.ok(box.left>=-1&&box.right<=box.width+1&&box.top>=-1&&box.bottom<=box.height+1&&!box.overflow,`${description}: ${JSON.stringify(box)}`);
    };
    for(const [width,height,mobile] of [[320,568,true],[390,400,true],[568,320,true],[812,375,true],[768,1024,true],[1440,900,false]]) {
      await viewport(width,height,mobile);
      await open('profile');
      await click('[aria-label="Search Everywhere"]');
      await fill('[aria-label="Search files"]','UAV');
      await assertBounds('dialog[open]',`Search dialog at ${width}x${height}`);
      await click('[aria-label="Close dialog"]');
      await menu('Navigate');
      await assertBounds(width<=600?'.titlebar nav.show':'.dropdown',`Navigation menu at ${width}x${height}`);
      await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
      await open('certificates');
      await until("document.querySelector('.cert-photo')",'Certificate preview ready');
      await click('.certificate-card .cert-photo');
      await assertBounds('.cert-viewer[open]',`Certificate viewer at ${width}x${height}`);
      await click('.cert-viewer[open] [aria-label="Close certificate"]');
      await open('contact');
      const fields=await evaluate("Array.from(document.querySelectorAll('.contact input,.contact textarea,.contact button')).map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth};})");
      for(const field of fields)assert.ok(field.left>=0&&field.right<=field.width+1,`Contact field overflow at ${width}`);
      await click('[aria-label="Terminal"]');
      await assertBounds('.terminal',`Terminal at ${width}x${height}`);
      const terminal=await evaluate("({bottom:document.querySelector('.terminal').getBoundingClientRect().bottom,rail:document.querySelector('.rail').getBoundingClientRect().top,footer:document.querySelector('.statusbar').getBoundingClientRect().top})");
      assert.ok(terminal.bottom<=(width<=600?terminal.rail:terminal.footer)+1,`Terminal overlaps bottom controls at ${width}x${height}: ${JSON.stringify(terminal)}`);
      await evaluate("document.querySelector('[aria-label=\"Terminal command\"]').focus();document.querySelector('.terminal form').scrollIntoView({block:'nearest'})");
      await fill('[aria-label="Terminal command"]','help');
      await evaluate("document.querySelector('.terminal form').requestSubmit()");
      await until("document.querySelector('.terminal .history').textContent.includes('open <file>')",'Terminal command works at short heights');
      if(width===568) {
        const screenshot=await call('Page.captureScreenshot',{format:'webp',quality:95});
        await fs.writeFile(path.join(output,'landscape-terminal-568.webp'),Buffer.from(screenshot.data,'base64'));
      }
      await click('[title="Close terminal"]');
    }
    await viewport(1440);
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
    await evaluate("window.__reloadMarker = true");
    await call("Page.reload", {});
    await until("!window.__reloadMarker && document.readyState === 'complete' && document.querySelector('#tab-profile')", "reloaded app");
    await open("projects");
    await until("document.querySelector('[role=alert]')", "catalog error state");
    await click('[role=alert] button');
    await until("document.querySelectorAll('.projects-table tbody tr').length === 3", "retry recovery");
  });

  await test("No uncaught browser exceptions", async () => assert.deepEqual(errors, []));

  await test("All configured local project, certificate, portrait and CV assets load", async () => {
    await until("document.querySelector('.brand-logo')", "header available for asset checks");
    const projects = await (await fetch(origin + "/data/projects.json")).json();
    const certificates = await (await fetch(origin + "/data/certificates.json")).json();
    const urls = new Set([portfolio.photoUrl, portfolio.cvUrl]);
    urls.add(await evaluate("document.querySelector('.brand-logo').getAttribute('src')"));
    for (const p of projects) for (const url of [p.image,p.tableImage,...(p.tableImages || []).map(i=>i.src)].filter(Boolean)) urls.add(url);
    for (const [, , , images = []] of portfolio.experience) for (const image of images) urls.add(image.src);
    for (const c of certificates) for (const url of [c.image,c.demoImage,c.url].filter(Boolean)) if(url.startsWith('/')) urls.add(url);
    const checks = await Promise.all([...urls].map(async url => ({url,response:await fetch(origin+url)})));
    for(const {url,response} of checks) {
      assert.equal(response.status,200,url);
      assert.ok(!response.headers.get('content-type')?.includes('text/html'),`Asset returned SPA HTML: ${url}`);
    }
    const webps = [...urls].filter(url => /\.webp$/i.test(url));
    assert.ok(webps.length > 0, 'WebP assets are configured');
    assert.ok(![...urls].some(url => url.startsWith('/images/') && /\.(png|jpe?g)$/i.test(url)), 'Site photos use WebP paths');
    for(const {url,response} of checks.filter(({url}) => /\.webp$/i.test(url))) {
      assert.ok(response.headers.get('content-type')?.includes('image/webp'), url);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.subarray(0,4).toString(), 'RIFF', url);
      assert.equal(bytes.subarray(8,12).toString(), 'WEBP', url);
    }
    const decoded = await evaluate(`(async () => {
      const urls = ${JSON.stringify(webps)};
      for (const url of urls) {
        const bitmap = await createImageBitmap(await (await fetch(url)).blob());
        if (!bitmap.width || !bitmap.height) throw new Error('Invalid image: ' + url);
        bitmap.close();
      }
      return urls.length;
    })()`);
    assert.equal(decoded, webps.length, 'All WebP images decode in the browser');
  });
} catch (error) {
  results.push({ name: "Browser setup", status: "failed", error: error.stack || error.message });
  console.error(error);
} finally {
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ checkedAt: new Date().toISOString(), responsiveViewports, ...(filter ? { rerunFilter: filter.source, retainedChecks } : {}), results }, null, 2));
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
