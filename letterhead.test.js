const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync(new URL("./index.html", `file://${__dirname}/`), "utf8");

test("provides global letterhead settings and image storage", () => {
  assert.match(html, /id="letterheadSettingsBtn"/);
  assert.match(html, /id="letterheadModal"/);
  assert.match(html, /indexedDB\.open\("trip-plan-assets"/);
});

test("provides automatic and adjustable margins", () => {
  assert.match(html, /function detectLetterheadMargins\(/);
  assert.match(html, /data-letterhead-margin="top"/);
  assert.match(html, /data-letterhead-margin="right"/);
  assert.match(html, /data-letterhead-margin="bottom"/);
  assert.match(html, /data-letterhead-margin="left"/);
});

test("provides four explicit export choices", () => {
  assert.match(html, /id="exportWordWithBgBtn"/);
  assert.match(html, /id="exportWordPlainBtn"/);
  assert.match(html, /id="exportPdfWithBgBtn"/);
  assert.match(html, /id="exportPdfPlainBtn"/);
});

test("places API settings directly before export and outside the task menu", () => {
  const taskActions = html.match(/<div class="task-menu-actions">([\s\S]*?)<\/div>/)?.[1] || "";
  const topActions = html.match(/<div class="top-actions">([\s\S]*?)<\/div>\s*<\/div>\s*<\/header>/)?.[1] || "";

  assert.doesNotMatch(taskActions, /id="deepseekSettingsBtn"/);
  assert.match(topActions, /id="deepseekSettingsBtn"[^>]*>API 设置<\/button>[\s\S]*?<div class="export-switcher">/);
});

test("keeps the page preview plain and applies letterhead only during export", () => {
  assert.doesNotMatch(html, /letterhead-enabled/);
  assert.doesNotMatch(html, /function applyLetterheadToPreview\(/);
  assert.match(html, /function exportWord\(withBackground = false\)/);
  assert.match(html, /function exportPdf\(withBackground = false\)/);
  assert.match(html, /position:\s*fixed[^}]*letterhead-page-bg|letterhead-page-bg[^}]*position:\s*fixed/s);
});

test("allows typing letterhead margins before validating them", () => {
  assert.match(html, /function renderLetterheadSafeArea\(/);
  assert.match(html, /input\.addEventListener\("input",[\s\S]*?if \(e\.target\.value === ""\) return;[\s\S]*?renderLetterheadSafeArea\(\)/);
  assert.match(html, /input\.addEventListener\("blur",[\s\S]*?clampMargin/);
  assert.doesNotMatch(html, /input\.addEventListener\("input",[\s\S]*?renderLetterheadModal\(\)/);
});
