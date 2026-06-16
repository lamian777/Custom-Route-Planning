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

test("provides two explicit PDF export choices", () => {
  assert.match(html, /id="exportPdfWithBgBtn"/);
  assert.match(html, /id="exportPdfPlainBtn"/);
});

test("places import and settings controls directly before export and outside the task menu", () => {
  const taskMenuStart = html.indexOf('<div class="task-menu" id="taskMenu"');
  const topActionsStart = html.indexOf('<div class="top-actions">');
  const taskMenu = html.slice(taskMenuStart,topActionsStart);
  const topActions = html.match(/<div class="top-actions">([\s\S]*?)<\/div>\s*<\/div>\s*<\/header>/)?.[1] || "";

  assert.doesNotMatch(taskMenu, /id="newBlankTaskBtn"/);
  assert.doesNotMatch(taskMenu, /id="duplicateTaskBtn"/);
  assert.doesNotMatch(taskMenu, /id="importReferenceBtn"/);
  assert.doesNotMatch(taskMenu, /id="letterheadSettingsBtn"/);
  assert.doesNotMatch(taskMenu, /id="deepseekSettingsBtn"/);
  assert.doesNotMatch(taskMenu, /id="backupTasksBtn"/);
  assert.doesNotMatch(taskMenu, /id="restoreTasksBtn"/);
  assert.match(topActions, /id="importTrigger"[^>]*>导入[\s\S]*?id="newBlankTaskBtn"[^>]*>新建空白<\/button>[\s\S]*?id="duplicateTaskBtn"[^>]*>复制当前<\/button>[\s\S]*?id="importReferenceBtn"[^>]*>导入线路<\/button>[\s\S]*?<div class="settings-switcher">/);
  assert.match(topActions, /id="settingsTrigger"[^>]*>设置[\s\S]*?id="deepseekSettingsBtn"[^>]*>API 设置<\/button>[\s\S]*?id="letterheadSettingsBtn"[^>]*>抬头纸设置<\/button>[\s\S]*?id="backupTasksBtn"[^>]*>备份任务库<\/button>[\s\S]*?id="restoreTasksBtn"[^>]*>恢复任务库<\/button>[\s\S]*?<div class="export-switcher">/);
});

test("keeps all four action menu triggers equal without an export arrow", () => {
  assert.match(html, /\.history-switcher > \.btn, \.import-switcher > \.btn, \.settings-switcher > \.btn, \.export-switcher > \.btn \{ width: 104px; \}/);
  assert.match(html, /id="historyTrigger"[^>]*>撤销 <b/);
  assert.match(html, /id="undoBtn"[^>]*>撤销<\/button>[\s\S]*?id="resetBtn"[^>]*>恢复示例<\/button>/);
  assert.doesNotMatch(html, /id="undoBtn"[^>]*>[↶↺]/);
  assert.match(html, /id="exportTrigger"[^>]*>导出 <b/);
  assert.doesNotMatch(html, /id="exportTrigger"[^>]*><span[^>]*>⇩<\/span>/);
});

test("keeps the page preview plain and applies letterhead only during export", () => {
  assert.doesNotMatch(html, /letterhead-enabled/);
  assert.doesNotMatch(html, /function applyLetterheadToPreview\(/);
  assert.match(html, /function exportPdf\(withBackground = false\)/);
  assert.match(html, /position:\s*fixed[^}]*letterhead-page-bg|letterhead-page-bg[^}]*position:\s*fixed/s);
});

test("allows typing letterhead margins before validating them", () => {
  assert.match(html, /function renderLetterheadSafeArea\(/);
  assert.match(html, /input\.addEventListener\("input",[\s\S]*?if \(e\.target\.value === ""\) return;[\s\S]*?renderLetterheadSafeArea\(\)/);
  assert.match(html, /input\.addEventListener\("blur",[\s\S]*?clampMargin/);
  assert.doesNotMatch(html, /input\.addEventListener\("input",[\s\S]*?renderLetterheadModal\(\)/);
});

test("provides an expandable departure notice with six editable fields", () => {
  assert.match(html, /id="departureNoticeEditor"/);
  assert.match(html, /id="departureNoticeVisible"/);
  for (const field of ["guide","vehicle","meeting","flight","weather","notes"]) {
    assert.match(html, new RegExp(`data-notice-field="${field}"`));
  }
});

test("keeps departure notice hidden by default and renders it before highlights", () => {
  assert.match(html, /departureNotice:\{visible:false/);
  assert.match(html, /notice\.visible[\s\S]*?class="preview-departure-notice"/);
  assert.match(html, /\$\{departureNotice\}[\s\S]*?\$\{lines\(data\.highlights\)/);
});

test("labels the preview as departure notice only when it is visible", () => {
  assert.match(html, /<div class="preview-kicker">\$\{notice\.visible \? "出团通知" : "参考行程"\}<\/div>/);
});

test("marks three departure notice fields as required", () => {
  for (const field of ["guide","vehicle","meeting"]) {
    assert.match(html, new RegExp(`required-mark[^\\n]+data-notice-field="${field}"[^>]*required`));
  }
  assert.match(html, /if \(e\.target\.checked && missing\.length\)/);
});

test("hides optional departure notice fields until they have content", () => {
  assert.match(html, /const requiredNoticeFields = new Set\(noticeFields\.filter/);
  assert.match(html, /noticeFields\.filter\(\(\[field\]\) => requiredNoticeFields\.has\(field\) \|\| notice\[field\]\)/);
});

test("shows bullets in standards and notes editors without changing list data", () => {
  assert.match(html, /\.bullet-list-row::before \{[\s\S]*?background: var\(--primary\)/);
  assert.match(html, /<div class="bullet-list-editor" id="standardsInput" data-list-editor="standards"><\/div>/);
  assert.match(html, /<div class="bullet-list-editor" id="notesInput" data-list-editor="notes"><\/div>/);
  assert.match(html, /function listEditorRowsHtml\(field, items\)/);
  assert.match(html, /data-list-field="\$\{field\}"/);
  assert.match(html, /if \(e\.key === "Enter"\)/);
  assert.match(html, /syncListEditorData\(field\)/);
});

test("styles lodging link button with Ctrip blue and white text", () => {
  assert.match(html, /\.lodging-link-toggle \{[\s\S]*?border: 1px solid #2577e3[\s\S]*?color: #fff; background: #2577e3/s);
  assert.match(html, /\.lodging-link-toggle:hover, \.lodging-link-toggle\.active \{[\s\S]*?color: #fff; border-color: #1f63bd; background: #1f63bd/s);
});

test("marks lodging text and preview link blue when a Ctrip URL exists", () => {
  assert.match(html, /\.lodging-linked-text \{ color: #2577e3; \}/);
  assert.match(html, /\.lodging-row a \{ color: #2577e3; text-decoration: none;[^}]*overflow-wrap: anywhere; \}/);
  assert.match(html, /<input class="\$\{expanded \? "lodging-linked-text" : ""\}" type="text" data-index="\$\{index\}" data-field="lodging"/);
  assert.match(html, /class="lodging-preview-link"/);
  assert.match(html, /querySelector\('\[data-field="lodging"\]'\)\?\.classList\.toggle\("lodging-linked-text",Boolean\(e\.target\.value\.trim\(\)\)\)/);
});

test("provides editable quote table controls and automatic totals", () => {
  assert.match(html, /id="quoteTableEditor"/);
  assert.match(html, /id="addQuoteRowBtn"/);
  assert.match(html, /id="quoteServiceFeeEnabled"/);
  assert.match(html, /id="quoteTaxEnabled"/);
  assert.match(html, /function quoteRowTotal\(/);
  assert.match(html, /function calculateQuoteTotals\(/);
  assert.match(html, /serviceFee:\{enabled:false,rate:"8%"\}/);
  assert.match(html, /tax:\{enabled:false,rate:"6%"\}/);
});

test("calculates service fee before tax and renders quote details as a table", () => {
  assert.match(html, /const serviceFee = serviceEnabled \? roundMoney\(subtotal \* parsePercent\(serviceRate\)\) : 0/);
  assert.match(html, /const tax = taxEnabled \? roundMoney\(\(subtotal \+ serviceFee\) \* parsePercent\(taxRate\)\) : 0/);
  assert.match(html, /class="quote-table"/);
  assert.match(html, /class="preview-quote-table"/);
});

test("allows quote text cells to wrap at cell width and manual line breaks", () => {
  assert.match(html, /function quoteTextCellHtml\(/);
  assert.match(html, /<textarea class="quote-cell-text"[^>]*data-quote-field="\$\{field\}">/);
  assert.doesNotMatch(html, /placeholder="项目"/);
  assert.doesNotMatch(html, /placeholder="费用内容"/);
  assert.doesNotMatch(html, /data-quote-field="unitPrice"[^>]*placeholder=/);
  assert.match(html, /function autosizeQuoteTextareas\(/);
  assert.match(html, /\.preview-quote-table td \{[^}]*white-space: pre-wrap/s);
});

test("centers quote cells and gives content columns more room", () => {
  assert.match(html, /\.quote-table th, \.quote-table td, \.preview-quote-table th, \.preview-quote-table td \{[^}]*text-align: center/s);
  assert.match(html, /\.quote-table input, \.quote-table textarea, \.quote-note \{[^}]*text-align: center/s);
  assert.doesNotMatch(html, /\.quote-project-cell \.quote-cell-text \{[^}]*padding-right/s);
  assert.match(html, /<col style="width:14%"><col style="width:40%"><col style="width:12%"><col style="width:12%"><col style="width:10%"><col style="width:12%">/);
});

test("removes the remark column from quote tables", () => {
  assert.doesNotMatch(html, /<th>备注<\/th>/);
  assert.doesNotMatch(html, /quoteTextCellHtml\(row,index,"remark","备注"\)/);
});

test("labels quote amount headers with yuan", () => {
  assert.match(html, /<th>单价（元）<\/th>/);
  assert.match(html, /<th>总价（元）<\/th>/);
});

test("does not duplicate quote add button id", () => {
  const matches = html.match(/id="addQuoteRowBtn"/g) || [];
  assert.equal(matches.length, 1);
});

test("keeps mobile header as two rows instead of squeezing task name away", () => {
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.topbar \{[^}]*flex-wrap: wrap/s);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.top-actions \{[^}]*flex: 0 0 100%/s);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.top-actions \{[^}]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/s);
});

test("keeps header save state label fixed as Kevin-SZ", () => {
  assert.match(html, /<div class="save-state" id="saveState">Kevin-SZ<\/div>/);
  assert.doesNotMatch(html, /\$\("#saveState"\)\.textContent\s*=/);
});

test("shows the compact brand title in the header", () => {
  assert.match(html, /<h1>线路定制<\/h1>/);
  assert.doesNotMatch(html, /<h1>旅行线路定制<\/h1>/);
});
