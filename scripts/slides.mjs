#!/usr/bin/env node
// slides.mjs — 网页幻灯片的版面检查和 PDF 导出（Windows、macOS、Linux 通用）
//
// 用法：
//   node slides.mjs check <幻灯片.html> [--out 截图文件夹]
//   node slides.mjs pdf   <幻灯片.html> [输出.pdf] [--compact]
//
// check：逐页截图，并检查文字超出页面、文字被裁切、文字重叠、字号过小、
//        中文字体没按规则设置、引用了外网资源等问题。
// pdf：  逐页截图后合成一个 PDF（每页是图片，文字不能编辑）。
//
// 依赖：playwright-core（在技能文件夹里运行一次 npm install 即可）。
// 浏览器：优先使用电脑自带的 Microsoft Edge 或 Google Chrome，不需要另外下载。
// 检查和导出时会拦截所有外网请求，效果和在断网的会议室里放映一致。

import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname, basename, relative, isAbsolute } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN_W = 1920;
const DESIGN_H = 1080;

// ─── 命令行参数 ────────────────────────────────────────────

function usage(exitCode = 1) {
  console.log(`用法：
  node slides.mjs check <幻灯片.html> [--out 截图文件夹]
  node slides.mjs pdf   <幻灯片.html> [输出.pdf] [--compact]`);
  process.exit(exitCode);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) usage(args.length === 0 ? 1 : 0);

const command = args[0];
const positional = [];
let outDirArg = null;
let compact = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--compact') compact = true;
  else if (args[i] === '--out') outDirArg = args[++i];
  else positional.push(args[i]);
}

if (!['check', 'pdf'].includes(command) || positional.length < 1) usage();

const htmlPath = resolve(positional[0]);
if (!existsSync(htmlPath) || !statSync(htmlPath).isFile()) {
  console.error(`✗ 找不到文件：${htmlPath}`);
  process.exit(1);
}
const serveDir = dirname(htmlPath);
const htmlName = basename(htmlPath);
const deckName = basename(htmlPath, extname(htmlPath));

// ─── 加载 Playwright ──────────────────────────────────────

function tryRequire(bases) {
  for (const name of ['playwright-core', 'playwright']) {
    for (const base of bases) {
      try {
        return createRequire(join(base, 'noop.js'))(name);
      } catch { /* 继续尝试下一个位置 */ }
    }
  }
  return null;
}

function loadPlaywright() {
  // 先找技能文件夹和当前文件夹（npm install 装在这里），找不到再看全局安装
  const found = tryRequire([SKILL_DIR, process.cwd()]);
  if (found) return found;
  try {
    const globalRoot = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 })
      .toString().trim();
    if (globalRoot) return tryRequire([dirname(globalRoot)]);
  } catch { /* 没有 npm 也没关系 */ }
  return null;
}

const playwright = loadPlaywright();
if (!playwright) {
  console.error(`✗ 没有找到 playwright-core，请在技能文件夹里运行一次：
    cd "${SKILL_DIR}"
    npm install
  网络较慢或下载失败时，可以改用国内镜像：
    npm install --registry=https://registry.npmmirror.com`);
  process.exit(3);
}
const { chromium } = playwright;

async function launchBrowser() {
  const attempts = [];
  if (process.env.SLIDES_BROWSER) {
    attempts.push({ label: process.env.SLIDES_BROWSER, options: { executablePath: process.env.SLIDES_BROWSER } });
  }
  attempts.push({ label: 'Microsoft Edge', options: { channel: 'msedge' } });
  attempts.push({ label: 'Google Chrome', options: { channel: 'chrome' } });
  attempts.push({ label: 'Playwright 自带的 Chromium', options: {} });

  const failures = [];
  for (const { label, options } of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...options });
      return { browser, label };
    } catch (error) {
      failures.push(`  - ${label}：${String(error.message).split('\n')[0]}`);
    }
  }
  console.error(`✗ 没有找到可用的浏览器。已尝试：
${failures.join('\n')}
  解决办法（任选其一）：
    1. 安装 Microsoft Edge 或 Google Chrome
    2. 在技能文件夹里运行：npx playwright-core install chromium
    3. 设置环境变量 SLIDES_BROWSER，指向浏览器程序的完整路径`);
  process.exit(4);
}

// ─── 本地文件服务（只在本机 127.0.0.1 上监听） ─────────────

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.bmp': 'image/bmp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

function startServer() {
  const server = createServer((req, res) => {
    let urlPath = '/';
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch { /* 保持默认 */ }
    const filePath = resolve(serveDir, '.' + (urlPath === '/' ? '/' + htmlName : urlPath));
    const rel = relative(serveDir, filePath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolveServer) => {
    server.listen(0, '127.0.0.1', () => resolveServer({ server, port: server.address().port }));
  });
}

// ─── 打开幻灯片，逐页切换 ─────────────────────────────────

const FREEZE_MOTION_CSS = `
  *, *::before, *::after {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
  }
  .edit-toggle, .edit-hotzone { display: none !important; }
`;

async function openDeck(browser, port, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const external = new Set();
  const localPrefix = `http://127.0.0.1:${port}/`;
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(localPrefix) || url.startsWith('data:') || url.startsWith('blob:')) {
      route.continue();
    } else {
      external.add(url);
      route.abort();
    }
  });

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message).split('\n')[0]));

  await page.goto(localPrefix, { waitUntil: 'load', timeout: 60000 });
  await page.addStyleTag({ content: FREEZE_MOTION_CSS });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(600);

  const slideCount = await page.evaluate(() => {
    const inStage = document.querySelectorAll('.deck-stage .slide');
    return (inStage.length ? inStage : document.querySelectorAll('.slide')).length;
  });

  return { page, external, pageErrors, slideCount };
}

async function showSlide(page, index) {
  await page.evaluate((i) => {
    const inStage = document.querySelectorAll('.deck-stage .slide');
    const slides = inStage.length ? inStage : document.querySelectorAll('.slide');
    const deck = window.presentation;
    try {
      if (deck && typeof deck.goToSlide === 'function') deck.goToSlide(i);
      else if (deck && typeof deck.showSlide === 'function') deck.showSlide(i);
    } catch { /* 下面会直接切换 */ }

    slides.forEach((slide, idx) => {
      const current = idx === i;
      slide.classList.toggle('active', current);
      slide.classList.toggle('visible', current);
      slide.style.visibility = current ? 'visible' : 'hidden';
      slide.style.opacity = current ? '1' : '0';
      slide.style.display = current ? '' : 'none';
      slide.style.zIndex = current ? '5' : '';
    });

    // 动画元素直接显示成最终状态
    slides[i].querySelectorAll('[class*="reveal"], [data-reveal], [data-animate]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });
  }, index);
  await page.waitForTimeout(250);
}

// ─── 单页版面分析（在浏览器里运行） ───────────────────────

async function analyzeSlide(page, index) {
  return page.evaluate(({ i, designW }) => {
    const inStage = document.querySelectorAll('.deck-stage .slide');
    const slides = inStage.length ? inStage : document.querySelectorAll('.slide');
    const slide = slides[i];
    const slideRect = slide.getBoundingClientRect();
    const scale = slideRect.width / designW || 1;
    const tol = 2 * scale;
    const CJK = /[㐀-鿿豈-﫿]/;
    const LOCAL_CN_FONTS = ['yahei', 'pingfang', 'hiragino', 'noto sans cjk', 'noto serif cjk',
      'source han', 'wenquanyi', '微软雅黑', 'heiti', 'songti', 'simhei', 'simsun', 'dengxian'];

    const snippet = (text) => {
      const t = text.replace(/\s+/g, ' ').trim();
      return t.length > 24 ? t.slice(0, 24) + '…' : t;
    };

    // 找出所有直接包含文字的可见元素，并用 Range 量出文字实际占的位置
    const items = [];
    for (const el of slide.querySelectorAll('*')) {
      const textNodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
      if (!textNodes.length) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      let hidden = false;
      for (let a = el; a && a !== slide.parentElement; a = a.parentElement) {
        if (parseFloat(getComputedStyle(a).opacity) === 0) { hidden = true; break; }
      }
      if (hidden) continue;

      // 字体的上下留白（尤其是微软雅黑）会让文字框比行高略大，上下各收进 0.2 个字高，避免误报
      const vInset = 0.2 * parseFloat(cs.fontSize) * scale;
      const boxes = [];
      for (const node of textNodes) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width > 0.5 && r.height > 0.5) {
            boxes.push({ left: r.left, right: r.right, top: r.top + vInset, bottom: r.bottom - vInset });
          }
        }
      }
      if (!boxes.length) continue;
      const text = textNodes.map((n) => n.textContent).join(' ');
      items.push({ el, cs, boxes, text });
    }

    const problems = [];
    const add = (type, detail) => problems.push({ type, detail });
    let nonLocalCnFont = 0;
    let minFont = Infinity;

    for (const item of items) {
      const { el, cs, boxes, text } = item;
      const fontPx = parseFloat(cs.fontSize);
      if (fontPx < minFont) minFont = fontPx;
      if (fontPx < 18) add('字号过小', `${Math.round(fontPx)}px：“${snippet(text)}”`);

      if (CJK.test(text)) {
        const family = cs.fontFamily.toLowerCase();
        if (!LOCAL_CN_FONTS.some((f) => family.includes(f))) nonLocalCnFont++;
      }

      // 文字超出 1920×1080 页面
      const outside = boxes.some((b) => b.left < slideRect.left - tol || b.top < slideRect.top - tol ||
        b.right > slideRect.right + tol || b.bottom > slideRect.bottom + tol);
      if (outside) {
        add('文字超出页面', `“${snippet(text)}”`);
        continue;
      }

      // 文字被外层容器裁切（容器设置了 overflow 隐藏或滚动），
      // 或者文字溢出了带底色、边框的卡片或色块
      for (let a = el; a && a !== slide; a = a.parentElement) {
        const acs = a === el ? cs : getComputedStyle(a);
        const clips = [acs.overflowX, acs.overflowY].some((v) => v !== 'visible');
        const bg = acs.backgroundColor;
        const hasBg = (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(bg)) || acs.backgroundImage !== 'none';
        const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some((side) =>
          parseFloat(acs[`border${side}Width`]) > 0 && acs[`border${side}Style`] !== 'none');
        if (!clips && !hasBg && !hasBorder) continue;
        const ar = a.getBoundingClientRect();
        const escaped = boxes.some((b) => b.left < ar.left - tol || b.top < ar.top - tol ||
          b.right > ar.right + tol || b.bottom > ar.bottom + tol);
        if (escaped) {
          add(clips ? '文字被裁切' : '文字溢出卡片',
            `“${snippet(text)}”（${clips ? '所在区域放不下，超出部分看不到' : '文字跑到了卡片或色块外面'}）`);
          break;
        }
      }
    }

    // 文字互相重叠（只比较互不包含的元素）
    let overlapCount = 0;
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const A = items[a], B = items[b];
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
        const hit = A.boxes.some((ra) => B.boxes.some((rb) => {
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          return w > 4 * scale && h > 4 * scale;
        }));
        if (hit) {
          overlapCount++;
          if (overlapCount <= 5) add('文字重叠', `“${snippet(A.text)}” 和 “${snippet(B.text)}”`);
        }
      }
    }
    if (overlapCount > 5) add('文字重叠', `另有 ${overlapCount - 5} 处，请看截图`);

    const hasMedia = slide.querySelector('img, svg, canvas, video, picture');
    if (!items.length && !hasMedia) add('疑似空白页', '这一页没有文字也没有图片');

    return {
      problems,
      nonLocalCnFont,
      minFont: Number.isFinite(minFont) ? Math.round(minFont) : null,
      textCount: items.length,
    };
  }, { i: index, designW: DESIGN_W });
}

// ─── check：截图 + 版面检查 ───────────────────────────────

async function runCheck() {
  const outDir = outDirArg ? resolve(outDirArg) : join(serveDir, '.frontend-slides', 'check', deckName);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const { server, port } = await startServer();
  const { browser, label } = await launchBrowser();
  console.log(`使用浏览器：${label}`);

  try {
    const { page, external, pageErrors, slideCount } = await openDeck(browser, port, { width: DESIGN_W, height: DESIGN_H });
    if (slideCount === 0) {
      console.error('✗ 没有找到任何页面。每一页需要写成 <section class="slide">。');
      process.exitCode = 1;
      return;
    }

    const report = { file: htmlPath, slides: slideCount, screenshotsDir: outDir, pages: [], external: [], scriptErrors: [] };
    let total = 0;
    let nonLocalCnFont = 0;

    for (let i = 0; i < slideCount; i++) {
      await showSlide(page, i);
      const shot = join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: shot });
      const result = await analyzeSlide(page, i);
      nonLocalCnFont += result.nonLocalCnFont;
      total += result.problems.length;
      report.pages.push({ page: i + 1, screenshot: shot, minFontPx: result.minFont, problems: result.problems });
    }

    report.external = [...external];
    report.scriptErrors = [...new Set(pageErrors)];
    if (nonLocalCnFont > 0) total += 1;
    total += report.external.length > 0 ? 1 : 0;
    total += report.scriptErrors.length > 0 ? 1 : 0;
    report.totalProblems = total;
    writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

    // 打印中文报告
    console.log(`\n共 ${slideCount} 页，截图保存在：${outDir}\n`);
    for (const p of report.pages) {
      if (!p.problems.length) continue;
      console.log(`第 ${p.page} 页（截图 ${basename(p.screenshot)}）：`);
      for (const prob of p.problems) console.log(`  - ${prob.type}：${prob.detail}`);
    }
    if (nonLocalCnFont > 0) {
      console.log(`\n中文字体：有 ${nonLocalCnFont} 处中文没有使用本机中文字体（微软雅黑、苹方等），请按 BUSINESS_STYLES.md 的字体规则设置 --font-sans 等变量。`);
    }
    if (report.external.length) {
      console.log('\n引用了外网资源（单位内网或断网时会加载失败，请删除或改成本地文件）：');
      for (const url of report.external.slice(0, 10)) console.log(`  - ${url}`);
      if (report.external.length > 10) console.log(`  - 另有 ${report.external.length - 10} 个`);
    }
    if (report.scriptErrors.length) {
      console.log('\n页面脚本报错（可能导致翻页或编辑功能失效）：');
      for (const e of report.scriptErrors.slice(0, 5)) console.log(`  - ${e}`);
    }

    console.log(total === 0
      ? '\n✓ 没有发现问题。仍请打开截图逐页看一遍：是否拥挤、对齐、颜色对比是否清楚。'
      : `\n共发现 ${total} 处问题。修改后请重新运行检查。`);
    console.log(`完整结果：${join(outDir, 'report.json')}`);
  } finally {
    await browser.close();
    server.close();
  }
}

// ─── pdf：截图后合成 PDF ──────────────────────────────────

async function runPdf() {
  const outputPdf = resolve(positional[1] || join(serveDir, `${deckName}.pdf`));
  mkdirSync(dirname(outputPdf), { recursive: true });
  const viewport = compact ? { width: 1280, height: 720 } : { width: DESIGN_W, height: DESIGN_H };
  const shotDir = mkdtempSync(join(tmpdir(), 'slides-pdf-'));

  const { server, port } = await startServer();
  const { browser, label } = await launchBrowser();
  console.log(`使用浏览器：${label}`);

  try {
    const { page, external, slideCount } = await openDeck(browser, port, viewport);
    if (slideCount === 0) {
      console.error('✗ 没有找到任何页面。每一页需要写成 <section class="slide">。');
      process.exitCode = 1;
      return;
    }

    const shots = [];
    for (let i = 0; i < slideCount; i++) {
      await showSlide(page, i);
      const shot = join(shotDir, `slide-${String(i + 1).padStart(3, '0')}.png`);
      await page.screenshot({ path: shot });
      shots.push(shot);
      console.log(`  已截取第 ${i + 1}/${slideCount} 页`);
    }
    await page.close();

    const pages = shots.map((p) =>
      `<div class="page"><img src="data:image/png;base64,${readFileSync(p).toString('base64')}"></div>`).join('\n');
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(`<!DOCTYPE html><html><head><style>
      * { margin: 0; padding: 0; }
      @page { size: ${viewport.width}px ${viewport.height}px; margin: 0; }
      .page { width: ${viewport.width}px; height: ${viewport.height}px; overflow: hidden; break-after: page; }
      .page:last-child { break-after: auto; }
      img { width: 100%; height: 100%; display: block; object-fit: contain; }
    </style></head><body>${pages}</body></html>`, { waitUntil: 'load' });

    try {
      await pdfPage.pdf({
        path: outputPdf,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } catch (error) {
      console.error(`✗ 写入 PDF 失败：${String(error.message).split('\n')[0]}`);
      console.error('  如果这个 PDF 正在被打开，请先关闭再重试。');
      process.exitCode = 1;
      return;
    }

    const sizeMb = statSync(outputPdf).size / 1024 / 1024;
    console.log(`\n✓ PDF 已保存：${outputPdf}（${sizeMb.toFixed(1)} MB，共 ${slideCount} 页）`);
    console.log('  PDF 每页是截图，文字不能编辑，动画不保留。');
    if (sizeMb > 10 && !compact) console.log('  文件较大，可以加上 --compact 重新导出，体积会小很多。');
    if (external.size) console.log(`  注意：幻灯片引用了 ${external.size} 个外网资源，导出时已被拦截，相关内容可能缺失。`);
  } finally {
    await browser.close();
    server.close();
    rmSync(shotDir, { recursive: true, force: true });
  }
}

try {
  if (command === 'check') await runCheck();
  else await runPdf();
} catch (error) {
  console.error(`✗ 运行出错：${error && error.message ? error.message : error}`);
  process.exitCode = 1;
}
