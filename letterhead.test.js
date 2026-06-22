const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync(new URL("./index.html", `file://${__dirname}/`), "utf8");

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start,-1,`missing function ${name}`);
  const bodyStart = html.indexOf("{",start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = bodyStart; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return html.slice(start,index + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

function loadFunction(name) {
  return Function(`${extractFunction(name)}\nreturn ${name};`)();
}

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
  assert.match(topActions, /id="importTrigger"[^>]*>线路[\s\S]*?id="newBlankTaskBtn"[^>]*>新建线路<\/button>[\s\S]*?id="duplicateTaskBtn"[^>]*>复制线路<\/button>[\s\S]*?id="resetBtn"[^>]*>示例线路<\/button>[\s\S]*?<div class="settings-switcher">/);
  assert.doesNotMatch(topActions, /id="importReferenceBtn"/);
  assert.match(topActions, /id="settingsTrigger"[^>]*>设置[\s\S]*?id="deepseekSettingsBtn"[^>]*>API 设置<\/button>[\s\S]*?id="letterheadSettingsBtn"[^>]*>抬头纸设置<\/button>[\s\S]*?id="backupTasksBtn"[^>]*>备份任务库<\/button>[\s\S]*?id="restoreTasksBtn"[^>]*>恢复任务库<\/button>[\s\S]*?<div class="export-switcher">/);
});

test("adds customer demand section before title", () => {
  const titleIndex = html.indexOf('<h3 class="section-title">线路标题</h3>');
  const demandIndex = html.indexOf('id="customerDemandSection"');

  assert.notEqual(demandIndex, -1);
  assert.ok(demandIndex < titleIndex);
  assert.match(html, /id="customerDemandInput"/);
  assert.match(html, /id="customerReferenceFileInput"/);
  assert.match(html, /id="recognizeDemandBtn"/);
  assert.match(html, /id="applyDemandResultBtn"/);
  assert.match(html, /id="retryDemandRecognitionBtn"/);
  assert.doesNotMatch(html, /<h3 class="section-title">客户需求<\/h3>/);
  assert.doesNotMatch(html, /class="demand-card"/);
  assert.match(html, /<section class="section demand-section" id="customerDemandSection">\s*<label class="field">/);
});

test("groups the editor sidebar into three lightweight sections", () => {
  const demandGroupIndex = html.indexOf('data-editor-group="demand"');
  const baseGroupIndex = html.indexOf('data-editor-group="base"');
  const extraGroupIndex = html.indexOf('data-editor-group="extra"');

  assert.notEqual(demandGroupIndex, -1);
  assert.notEqual(baseGroupIndex, -1);
  assert.notEqual(extraGroupIndex, -1);
  assert.ok(demandGroupIndex < baseGroupIndex);
  assert.ok(baseGroupIndex < extraGroupIndex);
  assert.match(html, /<span class="editor-group-index">01<\/span>[\s\S]*?<h2 class="editor-group-title">需求信息<\/h2>/);
  assert.match(html, /<span class="editor-group-index">02<\/span>[\s\S]*?<h2 class="editor-group-title">基础内容<\/h2>/);
  assert.match(html, /<span class="editor-group-index">03<\/span>[\s\S]*?<h2 class="editor-group-title">附加板块<\/h2>/);
  assert.match(html, /\.editor-group \+ \.editor-group \{/);
  assert.doesNotMatch(html, /\.editor-group \+ \.editor-group \{[^}]*border-top:/s);
  assert.match(html, /\.editor-group-head \{[^}]*justify-content: flex-end/s);
  assert.match(html, /\.editor-group-head::before \{[^}]*flex: 1/s);
  assert.match(html, /\.editor-group-head::before \{[^}]*height: 1px/s);
  assert.match(html, /\.editor-group-head::before \{[^}]*background: var\(--line\)/s);
  assert.match(html, /\.editor-group-head::after \{[^}]*width: 3px/s);
  assert.match(html, /\.editor-group-head::after \{[^}]*background: var\(--primary\)/s);
  assert.match(html, /\.editor-group-index \{[^}]*font-size: 18px/s);
  assert.match(html, /\.editor-group-title \{/);
  assert.doesNotMatch(html, /<p>先整理客户输入和参考材料。<\/p>/);
  assert.doesNotMatch(html, /<p>编辑客户版行程的主体信息。<\/p>/);
  assert.doesNotMatch(html, /<p>按需要补充展示项和报价信息。<\/p>/);
  assert.doesNotMatch(html, /\.editor-group \{[^}]*background:/s);
  assert.doesNotMatch(html, /\.editor-group \{[^}]*box-shadow:/s);
});

test("keeps customer demand controls compact without inline hints", () => {
  assert.match(html, /class="demand-inline"/);
  assert.match(html, /id="recognizeDemandBtn"[^>]*>识别<\/button>/);
  assert.doesNotMatch(html, /id="recognizeDemandBtn"[^>]*>识别需求<\/button>/);
  assert.doesNotMatch(html, /id="demandProviderHint"/);
  assert.doesNotMatch(html, /尚未绑定 DeepSeek API，请先打开顶部的/);
});

test("matches editor subsection labels to customer demand label styling without changing preview headings", () => {
  assert.match(html, /\.editor-panel \.section-title \{[^}]*color: var\(--muted\)[^}]*font-size: 12px[^}]*font-weight: 600/s);
  assert.match(html, /\.editor-panel \.field span\.section-title \{[^}]*color: var\(--muted\)[^}]*font-size: 12px[^}]*font-weight: 600/s);
  assert.doesNotMatch(html, /\.preview-highlights h3 \{[^}]*font-size: 12px/s);
  assert.doesNotMatch(html, /\.preview-quote-details h3 \{[^}]*font-size: 12px/s);
  assert.doesNotMatch(html, /\.info-section h3 \{[^}]*font-size: 12px/s);
});

test("minimizes empty resizable textareas until they contain content", () => {
  assert.match(html, /textarea:placeholder-shown:not\(\[data-list-field\]\):not\(\.quote-cell-text\) \{[^}]*height: 44px[^}]*min-height: 44px/s);
  assert.match(html, /textarea:not\(:placeholder-shown\):not\(\[data-list-field\]\):not\(\.quote-cell-text\) \{[^}]*min-height: 76px/s);
  assert.match(html, /function minimizeEmptyTextarea\(/);
  assert.match(html, /textarea\.style\.height = "44px"/);
  assert.match(html, /textarea\.style\.height === "44px"[\s\S]*?textarea\.style\.height = ""/);
  assert.match(html, /function minimizeEmptyTextareas\(/);
  assert.match(html, /renderEditor\(openIndex\); minimizeEmptyTextareas\(\$\("\.editor-panel"\)\); renderPreview\(\)/);
  assert.match(html, /delete data\._heights\[key\]/);
  assert.match(html, /\.editor-panel"\)\.addEventListener\("input",[\s\S]*?minimizeEmptyTextarea/);
  assert.match(html, /<textarea id="customerDemandInput" rows="5"/);
  assert.match(html, /\.bullet-list-row textarea \{[^}]*resize: none/s);
  assert.match(html, /function autosizeQuoteTextareas\(/);
});

test("supports dragging reference itinerary files into a tidy aligned control", () => {
  assert.match(html, /class="field demand-drop"/);
  assert.match(html, /<span>参考行程<\/span>/);
  assert.doesNotMatch(html, /<span>参考行程文件<\/span>/);
  assert.match(html, /\.demand-inline \{[^}]*grid-template-columns: minmax\(0,1fr\) auto/s);
  assert.match(html, /\.demand-file-zone, \.demand-inline \.btn-primary \{[^}]*height: 50px/s);
  assert.match(html, /function handleDemandFileDrop\(/);
  assert.match(html, /addEventListener\("dragover",handleDemandDragOver\)/);
  assert.match(html, /addEventListener\("drop",handleDemandFileDrop\)/);
});

test("customer demand recognition previews before applying to current task", () => {
  assert.match(html, /let demandState = \{busy:false,result:null,file:null\}/);
  assert.match(html, /function demandPrompt\(/);
  assert.match(html, /function recognizeDemandText\(/);
  assert.match(html, /function renderDemandReview\(/);
  assert.match(html, /function startDemandRecognition\(/);
  assert.match(html, /function applyDemandResult\(/);
  assert.match(html, /await askConfirmation\("应用后会替换当前每日行程/);
  assert.match(html, /识别范围仅限 02 基础内容/);
  assert.doesNotMatch(html, /"highlights":\[\]/);
  assert.doesNotMatch(html, /recognized\.highlights/);
  assert.doesNotMatch(html, /data\.highlights = recognized\.highlights/);
  assert.doesNotMatch(html, /标题、亮点、标准和说明/);
  assert.match(html, /data\.days = clone\(demandState\.result\.data\.days\)/);
});

test("keeps all four top actions equal without decorative icons", () => {
  assert.match(html, /\.history-switcher > \.btn, \.import-switcher > \.btn, \.settings-switcher > \.btn, \.export-switcher > \.btn \{ width: 104px; \}/);
  assert.match(html, /id="undoBtn"[^>]*>撤销<\/button>/);
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

test("places highlights directly above departure notice and quote details", () => {
  const titleIndex = html.indexOf('<h3 class="section-title">线路标题</h3>');
  const highlightsIndex = html.indexOf('class="field highlights-field"');
  const departureIndex = html.indexOf('id="departureNoticeEditor"');
  const quoteIndex = html.indexOf('id="quoteDetailsEditor"');

  assert.notEqual(highlightsIndex, -1);
  assert.notEqual(departureIndex, -1);
  assert.notEqual(quoteIndex, -1);
  assert.ok(departureIndex > highlightsIndex);
  assert.ok(departureIndex > titleIndex);
  assert.ok(departureIndex < quoteIndex);
  assert.match(html.slice(highlightsIndex), /id="highlightsInput"[\s\S]*?id="departureNoticeEditor"[\s\S]*?id="quoteDetailsEditor"/);
});

test("places an independently toggleable route map above departure notice", () => {
  const highlightsIndex = html.indexOf('class="field highlights-field"');
  const mapIndex = html.indexOf('id="routeMapEditor"');
  const departureIndex = html.indexOf('id="departureNoticeEditor"');

  assert.ok(highlightsIndex < mapIndex);
  assert.ok(mapIndex < departureIndex);
  assert.match(html, /id="routeMapVisible"/);
  assert.match(html, /id="routeMapEditorPreview"/);
});

test("extracts route stops, merges adjacent repeats, and preserves return visits", () => {
  const extractRouteStops = loadFunction("extractRouteStops");
  const stops = extractRouteStops([
    {route:"\u5927\u8fde \u2014 \u91cd\u5e86"},
    {route:"\u91cd\u5e86 \u2192 \u6210\u90fd"},
    {route:"\u6210\u90fd / \u4e50\u5c71"},
    {route:"\u4e50\u5c71-\u5ce8\u7709\u5c71"},
    {route:"\u5ce8\u7709\u5c71\n\u6210\u90fd"},
    {route:"\u6210\u90fd > \u5927\u8fde"}
  ]);

  assert.deepEqual(stops,[
    {name:"\u5927\u8fde",startDay:1,endDay:1},
    {name:"\u91cd\u5e86",startDay:1,endDay:2},
    {name:"\u6210\u90fd",startDay:2,endDay:3},
    {name:"\u4e50\u5c71",startDay:3,endDay:4},
    {name:"\u5ce8\u7709\u5c71",startDay:4,endDay:5},
    {name:"\u6210\u90fd",startDay:5,endDay:6},
    {name:"\u5927\u8fde",startDay:6,endDay:6}
  ]);
});

test("lays out route map stops in rows of at most five", () => {
  const routeMapLayout = loadFunction("routeMapLayout");
  const points = routeMapLayout(Array.from({length:11},(_,index) => ({name:String(index)})));
  assert.deepEqual(points.map(point => point.row),[0,0,0,0,0,1,1,1,1,1,2]);
  assert.ok(points[5].x > points[6].x);
});

test("renders the route map before notice with safe defaults and future provider seam", () => {
  assert.match(html, /"mapModule": \{\s*"visible": true\s*\}/);
  assert.match(html, /mapModule:\{visible:false\}/);
  assert.match(html, /data\.mapModule = \{visible:Boolean\(data\.mapModule\?\.visible\)\}/);
  assert.match(html, /function renderRouteMap\(/);
  assert.match(html, /data-map-provider="schematic"/);
  assert.match(html, /class="route-map-svg"/);
  assert.match(html, /\$\{routeMap\}[\s\S]*?\$\{departureNotice\}[\s\S]*?\$\{lines\(data\.highlights\)/);
});

test("builds escaped SVG route map output and omits empty routes", () => {
  const source = ["extractRouteStops","routeMapLayout","routeMapPath","routeDayLabel","routeMapDisplayName","renderRouteMapSurface"]
    .map(extractFunction).join("\n");
  const renderRouteMapSurface = Function(`const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));\n${source}\nreturn renderRouteMapSurface;`)();

  assert.equal(renderRouteMapSurface([{route:""}]),"");
  const svg = renderRouteMapSurface([{route:"\u5927\u8fde—<\u91cd\u5e86&\u9152\u5e97"},{route:"<\u91cd\u5e86&\u9152\u5e97—\u6210\u90fd"}]);
  assert.match(svg, /data-map-provider="schematic"/);
  assert.equal((svg.match(/class="route-map-node"/g) || []).length,3);
  assert.match(svg, /&lt;\u91cd\u5e86&amp;\u9152\u5e97/);
  assert.doesNotMatch(svg, /<\u91cd\u5e86&\u9152\u5e97/);
});

test("guards empty route maps and keeps map output printable", () => {
  assert.match(html, /if \(e\.target\.checked && !extractRouteStops\(data\.days\)\.length\)/);
  assert.match(html, /toast\("\u8bf7\u5148\u586b\u5199\u5f53\u5929\u8def\u7ebf"\)/);
  assert.match(html, /\.preview-route-map \{[^}]*break-inside: avoid/s);
  assert.match(html, /\.route-map-svg \{[^}]*width: 100%[^}]*height: auto/s);
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

test("recalculates list row heights once per frame after viewport width changes", () => {
  assert.match(html, /let listEditorResizeFrame = 0;/);
  assert.match(html, /window\.addEventListener\("resize",\(\) => \{[\s\S]*?if \(listEditorResizeFrame\) return;[\s\S]*?listEditorResizeFrame = requestAnimationFrame\(\(\) => \{[\s\S]*?listEditorResizeFrame = 0;[\s\S]*?autosizeListEditor\(\);[\s\S]*?\}\);[\s\S]*?\},\{passive:true\}\);/);
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
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.top-actions \{[^}]*grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/s);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.top-actions \.btn \{[^}]*min-width: 0/s);
});

test("escapes API status details before inserting them into the page", () => {
  assert.match(html, /const detail = message \|\| \(bound \?/);
  assert.match(html, /<span>\$\{esc\(detail\)\}<\/span>/);
});

test("pins remote document parsers with integrity metadata", () => {
  assert.match(html, /function loadScriptOnce\(src,globalName,integrity\)/);
  assert.match(html, /script\.integrity = integrity/);
  assert.match(html, /script\.crossOrigin = "anonymous"/);
  assert.match(html, /mammoth\.browser\.min\.js","mammoth","sha384-/);
  assert.match(html, /pdf\.min\.js","pdfjsLib","sha384-/);
});

test("uses the current settings path in the missing letterhead message", () => {
  assert.match(html, /toast\("请先在“设置 → 抬头纸设置”中上传抬头纸"\)/);
});

test("does not duplicate the action menu hover selector", () => {
  const selector = ".import-menu .btn:hover, .settings-menu .btn:hover, .export-menu .btn:hover";
  assert.equal(html.split(selector).length - 1,1);
});

test("keeps header save state label fixed as Kevin-SZ", () => {
  assert.match(html, /<div class="save-state" id="saveState">Kevin-SZ<\/div>/);
  assert.doesNotMatch(html, /\$\("#saveState"\)\.textContent\s*=/);
});

test("shows the compact brand title in the header", () => {
  assert.match(html, /<h1>线路定制<\/h1>/);
  assert.doesNotMatch(html, /<h1>旅行线路定制<\/h1>/);
});
