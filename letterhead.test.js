const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync(new URL("./index.html", `file://${__dirname}/`), "utf8");
const skill = fs.readFileSync(new URL("./SKILL.md", `file://${__dirname}/`), "utf8");

test("parses the complete inline application script", () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
  assert.equal(scripts.length,1);
  assert.doesNotThrow(() => new Function(scripts[0]));
});

test("keeps static element ids unique", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids.filter((id,index) => ids.indexOf(id) !== index),[]);
});

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

function extractBundledExample() {
  const exampleStart = html.indexOf("const example = {");
  const exampleEnd = html.indexOf("const fields = [",exampleStart);
  assert.notEqual(exampleStart,-1,"missing bundled example");
  assert.notEqual(exampleEnd,-1,"missing bundled example end");
  return new Function(`${html.slice(exampleStart,exampleEnd)}\nreturn example;`)();
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
  assert.match(html, /\.bullet-list-row \{[^}]*min-height: 22px/s);
  assert.match(html, /function autosizeQuoteTextareas\(/);
});

test("uses continuous multiline editors for native mouse selection", () => {
  assert.match(html, /id="standardsInput"[^>]*contenteditable="plaintext-only"/);
  assert.match(html, /id="notesInput"[^>]*contenteditable="plaintext-only"/);
  assert.match(html, /class="bullet-list-row" data-list-row="\$\{index\}"/);
  assert.match(html, /return rows\.map\(\(value,index\) => `<div/);
  assert.doesNotMatch(html, /<textarea[^>]*data-list-field/);
  assert.match(html, /function listEditorSelectionOffsets\(/);
  assert.match(html, /function setListEditorSelection\(/);
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
  assert.match(html, /function demandState\(taskData = data\)/);
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
  assert.match(html, /data\.days = clone\(state\.result\.data\.days\)/);
});

test("keeps all four top actions equal without decorative icons", () => {
  assert.match(html, /\.history-switcher > \.btn, \.import-switcher > \.btn, \.settings-switcher > \.btn, \.export-switcher > \.btn \{ width: 104px; \}/);
  assert.match(html, /id="undoBtn"[^>]*>撤销<\/button>/);
  assert.doesNotMatch(html, /id="undoBtn"[^>]*>[↶↺]/);
  assert.match(html, /id="exportTrigger"[^>]*>导出 <b/);
  assert.doesNotMatch(html, /id="exportTrigger"[^>]*><span[^>]*>⇩<\/span>/);
});

test("keeps the currently edited route visually fixed while hovering", () => {
  assert.match(html, /\.task-item\.active \.task-select \{[^}]*position: relative[^}]*background: var\(--primary-soft\)/s);
  assert.match(html, /\.task-item\.active \.task-select::before \{[^}]*left: 0[^}]*top: 5px[^}]*bottom: 5px[^}]*width: 3px[^}]*background: var\(--primary\)/s);
  assert.doesNotMatch(html, /\.task-item\.active \.task-select:hover/);
  assert.doesNotMatch(html, /\.task-item\.active \.task-select \{[^}]*box-shadow:/s);
});

test("prefixes recognized titles with the first departure date", () => {
  const normalizeRecognizedTitle = loadFunction("normalizeRecognizedTitle");

  assert.equal(normalizeRecognizedTitle("重庆、成都双飞6日游","2026-08-01"),"08.01 重庆、成都双飞6日游");
  assert.equal(normalizeRecognizedTitle("08.01 重庆、成都双飞6日游","2026-07-16"),"07.16 重庆、成都双飞6日游");
  assert.equal(normalizeRecognizedTitle("7月20日 重庆、成都双飞6日游","2026-08-01"),"08.01 重庆、成都双飞6日游");
  assert.equal(normalizeRecognizedTitle("07/20 重庆、成都双飞6日游","2026-08-01"),"08.01 重庆、成都双飞6日游");
  assert.equal(normalizeRecognizedTitle("重庆、成都双飞6日游",""),"重庆、成都双飞6日游");
  assert.match(html, /title:normalizeRecognizedTitle\(text\(raw\?\.title\) \|\| taskData\.title,days\[0\]\?\.date\)/);
  assert.match(html, /saved\.title = normalizeRecognizedTitle\(saved\.title,saved\.days\[0\]\?\.date\)/);
  assert.match(html, /data\.title = normalizeRecognizedTitle\(data\.title,data\.days\[0\]\?\.date\)/);
});

test("keeps the bundled example title aligned with its first day", () => {
  const example = extractBundledExample();
  const [,month,day] = example.days[0].date.split("-");

  assert.equal(example.days[0].date,"2026-08-01");
  assert.equal(example.title,`${month}.${day} 成都双飞4日游`);
});

test("uses the saved blue route as the only bundled example", () => {
  const example = extractBundledExample();

  assert.equal(example.themeId,"blue");
  assert.equal(example.title,"08.01 成都双飞4日游");
  assert.equal(example.departureNotice.visible,false);
  assert.equal(example.mapModule.visible,false);
  assert.equal(example.mapModule.baseImage,"");
  assert.equal(example.mapModule.mapImage,"");
  assert.deepEqual(example.quoteDetails.serviceFee,{enabled:true,rate:"8%"});
  assert.deepEqual(example.quoteDetails.tax,{enabled:true,rate:"6%"});
  assert.match(example.notes.join("\n"),/游客须携带有效身份证件/);
  assert.ok(example._heights);
});

test("keeps existing standards and notes while adding recognized items", () => {
  const mergeRecognitionList = loadFunction("mergeRecognitionList");

  assert.deepEqual(
    mergeRecognitionList(["航班：往返经济舱含税","交通：当地旅游巴士"],["交通：升级为当地空调旅游巴士","保险：旅行社责任险"]),
    ["航班：往返经济舱含税","交通：升级为当地空调旅游巴士","保险：旅行社责任险"]
  );
  const originalNote = "游客须携带有效身份证件（因忘带或遗失导致无法乘机或入住酒店责任自理）；";
  assert.deepEqual(
    mergeRecognitionList([originalNote],["游客须携带有效身份证件，若因忘带或遗失导致无法乘机或入住酒店，责任自理。"]),
    [originalNote]
  );
  assert.deepEqual(
    mergeRecognitionList([originalNote],["行程中禁止携带危险物品。"]),
    [originalNote,"行程中禁止携带危险物品。"]
  );
  assert.match(html, /接待标准和特别说明必须以当前已有内容为底稿/);
  assert.match(html, /standards:mergeRecognitionList\(taskData\.standards,list\(raw\?\.standards\)\)/);
  assert.match(html, /notes:mergeRecognitionList\(taskData\.notes,list\(raw\?\.notes\)\)/);
});

test("accepts only safe numeric textarea heights", () => {
  const safeTextareaHeight = loadFunction("safeTextareaHeight");

  assert.equal(safeTextareaHeight(320),320);
  assert.equal(safeTextareaHeight("320"),320);
  assert.equal(safeTextareaHeight(5000),1200);
  assert.equal(safeTextareaHeight('1px" autofocus onfocus="alert(1)'),0);
  assert.match(html, /const savedHeight = safeTextareaHeight\(data\._heights\?\.\[key\]\)/);
  assert.doesNotMatch(html, /height:\$\{data\._heights\[key\]\}px/);
});

test("limits preview startup shortcuts to startup and still requires post-change QA", () => {
  assert.match(skill, /仅在启动预览时/);
  assert.match(skill, /修改完成后/);
  assert.match(skill, /实际检查/);
  assert.doesNotMatch(skill, /修改完成后直接通知用户刷新/);
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

test("renders the route map before notice as a fixed image panel", () => {
  const example = extractBundledExample();

  assert.equal(example.mapModule.visible,false);
  assert.equal(example.mapModule.baseImage,"");
  assert.equal(example.mapModule.mapImage,"");
  assert.match(html, /mapModule:normalizeMapModule\(\)/);
  assert.match(html, /data\.mapModule = normalizeMapModule\(data\.mapModule\)/);
  assert.match(html, /function renderRouteMap\(/);
  assert.match(html, /class="route-map-canvas"/);
  assert.match(html, /class="route-map-layer route-map-base-layer"/);
  assert.match(html, /class="route-map-layer route-map-image-layer"/);
  assert.match(html, /\$\{routeMap\}[\s\S]*?\$\{departureNotice\}[\s\S]*?\$\{lines\(data\.highlights\)/);
});

test("normalizes image route map state and keeps legacy visibility", () => {
  const normalizeMapModule = loadFunction("normalizeMapModule");

  assert.deepEqual(normalizeMapModule(),{
    visible:false,
    editingLayer:"base",
    baseImage:"",
    baseOpacity:1,
    baseBrightness:1,
    baseTransform:{scale:1,x:0,y:0},
    mapImage:"",
    mapOpacity:1,
    mapBrightness:1,
    mapTransform:{scale:1,x:0,y:0}
  });
  assert.deepEqual(normalizeMapModule({visible:true}),{
    visible:true,
    editingLayer:"base",
    baseImage:"",
    baseOpacity:1,
    baseBrightness:1,
    baseTransform:{scale:1,x:0,y:0},
    mapImage:"",
    mapOpacity:1,
    mapBrightness:1,
    mapTransform:{scale:1,x:0,y:0}
  });
  assert.equal(normalizeMapModule({editingLayer:"map"}).editingLayer,"map");
  assert.equal(normalizeMapModule({editingLayer:"other"}).editingLayer,"base");
});

test("renders uploaded map images in two adjustable layers", () => {
  const source = ["normalizeMapModule","hasRouteMapImage","routeMapImageStyle","routeMapImageSrc","renderRouteMapSurface"]
    .map(extractFunction).join("\n");
  const renderRouteMapSurface = Function(`${source}\nreturn renderRouteMapSurface;`)();

  assert.equal(renderRouteMapSurface({}),"");
  const surface = renderRouteMapSurface({
    baseImage:"data:image/jpeg;base64,base",
    baseOpacity:.45,
    baseBrightness:.8,
    baseTransform:{scale:1.2,x:-8,y:6},
    mapImage:"data:image/png;base64,map",
    mapOpacity:.9,
    mapBrightness:1.1,
    mapTransform:{scale:1.05,x:4,y:-3}
  });

  assert.match(surface, /class="route-map-canvas"/);
  assert.match(surface, /src="data:image\/jpeg;base64,base"/);
  assert.match(surface, /class="route-map-layer route-map-base-layer"/);
  assert.match(surface, /opacity:0\.45/);
  assert.match(surface, /brightness\(0\.8\)/);
  assert.match(surface, /translate\(-8%,6%\) scale\(1\.2\)/);
  assert.match(surface, /src="data:image\/png;base64,map"/);
  assert.match(surface, /class="route-map-layer route-map-image-layer"/);
  assert.doesNotMatch(surface, /route-map-editor-toolbar/);
  assert.doesNotMatch(surface, /route-map-crop-box/);
});

test("uses a drag crop editor instead of upload buttons and sliders", () => {
  assert.match(html, /function renderRouteMapEditorCanvas\(/);
  assert.match(html, /data-map-dropzone/);
  assert.match(html, /data-map-file/);
  assert.match(html, /data-map-layer="base"/);
  assert.match(html, /data-map-layer="map"/);
  assert.match(html, /data-map-delete-layer/);
  assert.match(html, /class="route-map-crop-box"/);
  assert.match(html, /data-map-resize="nw"/);
  assert.match(html, /data-map-resize="se"/);
  assert.match(html, /function chooseRouteMapDropLayer\(/);
  assert.match(html, /function setRouteMapLayerImage\(/);
  assert.match(html, /function beginRouteMapPointerEdit\(/);
  assert.doesNotMatch(html, /data-map-number/);
  assert.doesNotMatch(html, /data-map-transform/);
  assert.doesNotMatch(html, /data-map-upload/);
  assert.doesNotMatch(html, /data-map-clear/);
  assert.doesNotMatch(html, /route-map-range/);
  assert.doesNotMatch(html, /type="range"[^>]*data-map/);
});

test("guards empty uploaded maps and keeps image output printable", () => {
  assert.match(html, /if \(e\.target\.checked && !hasRouteMapImage\(data\.mapModule\)\)/);
  assert.match(html, /toast\("\u8bf7\u5148\u4e0a\u4f20\u5730\u56fe\u56fe\u7247"\)/);
  assert.match(html, /\.preview-route-map \{[^}]*break-inside: avoid/s);
  assert.match(html, /\.route-map-canvas \{[^}]*aspect-ratio: 920 \/ 480/s);
});

test("removes all external map provider code and UI", () => {
  const terms = [
    "\u9ad8\u5fb7",["Map","box"].join(""),["a","map"].join(""),["map","box"].join(""),"\u5730\u56fe\u63a5\u53e3","\u0057eb \u670d\u52a1",["Public","Token"].join(" "),
    ["MAP","API","SETTINGS","KEY"].join("_"),["map","Api"].join(""),["route","Map","Provider"].join(""),["generate","Route","Map"].join(""),["retry","Route","Map"].join(""),
    ["geo","code"].join(""),["build","Static","Map","Url"].join(""),["map","Credential"].join(""),["route-map","geographic"].join("-"),["route-map","base-image"].join("-"),["route-map","provider-badge"].join("-")
  ];
  terms.forEach(term => assert.doesNotMatch(html,new RegExp(term,"i")));
});

test("removes automatic SVG route map generation", () => {
  const removedNames = [
    "extractRouteStops",
    "routeMapLayout",
    "routeMapPath",
    "routeDayLabel",
    "routeMapDisplayName",
    "renderStandaloneRouteMapSurface"
  ];
  removedNames.forEach(name => assert.doesNotMatch(html,new RegExp(`function ${name}\\(`)));
  assert.doesNotMatch(html, /data-map-provider="schematic"/);
  assert.doesNotMatch(html, /class="route-map-svg"/);
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
  assert.match(html, /<div class="bullet-list-editor" id="standardsInput" data-list-editor="standards" contenteditable="plaintext-only"/);
  assert.match(html, /<div class="bullet-list-editor" id="notesInput" data-list-editor="notes" contenteditable="plaintext-only"/);
  assert.match(html, /function listEditorRowsHtml\(field, items\)/);
  assert.match(html, /data-list-row="\$\{index\}"/);
  assert.match(html, /if \(e\.key !== "Enter"\) return;/);
  assert.match(html, /data\[field\] = items\.map\(item => item\.trim\(\)\)\.filter\(Boolean\)/);
});

test("lets continuous list rows wrap without resize bookkeeping", () => {
  assert.doesNotMatch(html, /listEditorResizeFrame/);
  assert.doesNotMatch(html, /function autosizeListEditor\(/);
  assert.match(html, /\.bullet-list-row \{[^}]*line-height: 1\.55/s);
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

test("keeps quote calculations precise to cents", () => {
  const source = ["parseMoney","parsePercent","roundMoney","quoteRowTotal"].map(extractFunction).join("\n");
  const quoteRowTotal = Function(`${source}\nreturn quoteRowTotal;`)();

  assert.equal(quoteRowTotal({unitPrice:"12.50",quantity:"1",times:"1"}),12.5);
  assert.equal(quoteRowTotal({unitPrice:"99.99",quantity:"1",times:"1"}),99.99);
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

test("defaults breakfast only for newly created itinerary days", () => {
  assert.match(html, /days:\[\{date:"",weekday:"",route:"",morning:"",afternoon:"",remark:"",lodging:"",lodgingUrl:"",breakfast:"酒店含",lunch:"",dinner:"",flight:""\}\]/);
  assert.match(html, /function blankDay\([\s\S]*?breakfast:"酒店含", lunch:"", dinner:""/);
});

test("keeps lunch and dinner inputs free of placeholder text", () => {
  assert.match(html, /\["lunch","午餐","","input"\]/);
  assert.match(html, /\["dinner","晚餐","","input"\]/);
});

test("renders empty lodging as a dash instead of pending", () => {
  assert.match(html, /const label = esc\(day\.lodging \|\| "—"\)/);
  assert.doesNotMatch(html, /day\.lodging \|\| "待定"/);
});

test("asks demand recognition for bracketed scenic names and readable descriptions", () => {
  assert.match(html, /景点名称必须使用中文方括号【】标注/);
  assert.match(html, /【青城山】/);
  assert.match(html, /【乐山大佛】/);
  assert.match(html, /禁止只罗列景点名称/);
  assert.match(html, /一至两句简短的特色、体验或景观描述/);
});

test("keeps preview naturally sized and scrolls only an overflowing desktop editor", () => {
  assert.match(html, /\.workspace \{[\s\S]*?align-items: start/s);
  assert.match(html, /\.editor-scroll \{[^}]*overflow-y: auto/s);
  assert.match(html, /function syncEditorHeightToPreview\(/);
  assert.match(html, /previewPanel\.offsetHeight/);
  assert.match(html, /editorPanel\.style\.height = `\$\{previewPanel\.offsetHeight\}px`/);
  assert.match(html, /matchMedia\("\(max-width: 900px\)"\)\.matches/);
  assert.match(html, /requestAnimationFrame\(syncEditorHeightToPreview\)/);
});

test("wraps each preview day itinerary in one visual card", () => {
  const renderPreview = extractFunction("renderPreview");

  assert.match(renderPreview, /<div class="preview-day-card">\s*\$\{day\.flight[\s\S]*?<div class="schedule">[\s\S]*?<div class="meta-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/);
});

test("uses the departure notice background for preview day cards", () => {
  assert.match(html, /\.preview-day-card \{[^}]*min-height: 170px[^}]*padding: 14px 16px[^}]*border: 1px solid var\(--primary-print-border\)[^}]*border-radius: 14px[^}]*background: var\(--primary-soft\)[^}]*box-shadow: 0 4px 14px rgba\(38,42,48,\.05\)/s);
  assert.match(html, /\.preview-day-card \.schedule \{[^}]*margin: 12px 0/s);
});

test("separates itinerary details from meal metadata after any remark", () => {
  const renderPreview = extractFunction("renderPreview");

  assert.match(renderPreview, /day\.remark[\s\S]*?<\/div>\s*<div class="meta-grid">/);
  assert.match(html, /\.preview-day-card \.schedule::after \{[^}]*content: ""[^}]*width: calc\(100% - 56px\)[^}]*height: 1px[^}]*margin: 4px 0 0 56px[^}]*justify-self: start[^}]*background: #dedede/s);
});

test("keeps preview day cards compact on mobile and intact in print", () => {
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.preview-day-card \{[^}]*min-height: 160px[^}]*padding: 12px 13px/s);
  assert.match(html, /@media print \{[\s\S]*?\.preview-day-card \{[^}]*break-inside: avoid[^}]*print-color-adjust: exact[^}]*-webkit-print-color-adjust: exact/s);
});

test("draws printable panel borders inside their right edge", () => {
  assert.match(html, /@media print \{[\s\S]*?\.preview-day-card \{[^}]*border-color: transparent[^}]*box-shadow: inset 0 0 0 \.25mm var\(--primary-print-border\)/s);
  assert.match(html, /\.preview-departure-notice, \.preview-route-map, \.preview-quote-details \{[^}]*border-color: transparent[^}]*box-shadow: inset 0 0 0 \.25mm var\(--primary-border\)/s);
});

test("preserves pink panel and quote table backgrounds in exported PDFs", () => {
  assert.match(html, /\.preview-departure-notice, \.preview-route-map, \.preview-quote-details \{[^}]*print-color-adjust: exact[^}]*-webkit-print-color-adjust: exact/s);
  assert.match(html, /\.preview-quote-table, \.preview-quote-table th, \.preview-quote-table td \{[^}]*print-color-adjust: exact[^}]*-webkit-print-color-adjust: exact/s);
});

test("removes redundant horizontal dividers between preview day cards", () => {
  const previewDayRule = html.match(/\.preview-day \{([^}]*)\}/)?.[1] || "";
  const lastPreviewDayRule = html.match(/\.preview-day:last-child \{([^}]*)\}/)?.[1] || "";

  assert.doesNotMatch(previewDayRule,/border-bottom/);
  assert.doesNotMatch(lastPreviewDayRule,/border-bottom/);
});

test("rejects impossible saved dates instead of rolling them forward", () => {
  const parseDate = Function(`const weekdays=["周日","周一","周二","周三","周四","周五","周六"];\n${extractFunction("validDateParts")}\n${extractFunction("parseDate")}\nreturn parseDate;`)();

  assert.equal(parseDate("2026-02-29"),null);
  assert.equal(parseDate("2026-02-31"),null);
  assert.equal(parseDate("2026-13-01"),null);
  assert.equal(parseDate("2028-02-29")?.getDate(),29);
});

test("restores task backups atomically", async () => {
  const library = {tasks:[]};
  const notices = [];
  const restoreTasks = Function("library","validBackup","persistLibrary","uid","normalizeSavedDates","clone","save","renderTaskMenu","toast",`
    async ${extractFunction("restoreTasks")}
    return restoreTasks;
  `)(
    library, () => true, () => {}, () => "new-id",
    value => { if (value.invalid) throw new Error("invalid task"); return value; },
    value => structuredClone(value), () => {}, () => {}, message => notices.push(message)
  );
  const file = {text:async () => JSON.stringify({tasks:[{data:{days:[{}]}},{data:{days:[{}],invalid:true}}]})};

  await restoreTasks(file);

  assert.equal(library.tasks.length,0);
  assert.deepEqual(notices,["备份文件无效，未导入任何任务"]);
});

test("validates every restored itinerary day", () => {
  const validBackup = loadFunction("validBackup");

  assert.equal(validBackup({type:"trip-plan-task-library",version:1,tasks:[{data:{days:[{}]}}]}),true);
  assert.equal(validBackup({type:"trip-plan-task-library",version:1,tasks:[{data:{days:[null]}}]}),false);
});

test("keeps reception standards and special notes separated without divider lines", () => {
  const infoSectionRule = html.match(/\.info-section \{([^}]*)\}/)?.[1] || "";

  assert.match(infoSectionRule, /margin-top: 30px/);
  assert.match(infoSectionRule, /padding-top: 22px/);
  assert.doesNotMatch(infoSectionRule, /border-top/);
});

test("routes wheel movement to the editor under the current pointer", () => {
  let prevented = false;
  const editorPanel = {contains:() => true};
  const editorScroll = {scrollTop:100,scrollHeight:1000,clientHeight:400};
  const routeEditorWheel = Function("editorPanel","editorScroll",`
    const $ = selector => selector === ".editor-panel" ? editorPanel : editorScroll;
    const matchMedia = () => ({matches:false});
    const document = {elementFromPoint:() => ({})};
    const window = {innerHeight:900};
    ${extractFunction("routeEditorWheel")}
    return routeEditorWheel;
  `)(editorPanel,editorScroll);

  routeEditorWheel({clientX:20,clientY:20,deltaY:80,deltaMode:0,ctrlKey:false,preventDefault:() => { prevented = true; }});

  assert.equal(editorScroll.scrollTop,180);
  assert.equal(prevented,true);
});

test("lets the page keep scrolling when the pointer is outside the editor", () => {
  let prevented = false;
  const editorPanel = {contains:() => false};
  const editorScroll = {scrollTop:100,scrollHeight:1000,clientHeight:400};
  const routeEditorWheel = Function("editorPanel","editorScroll",`
    const $ = selector => selector === ".editor-panel" ? editorPanel : editorScroll;
    const matchMedia = () => ({matches:false});
    const document = {elementFromPoint:() => ({})};
    const window = {innerHeight:900};
    ${extractFunction("routeEditorWheel")}
    return routeEditorWheel;
  `)(editorPanel,editorScroll);

  routeEditorWheel({clientX:900,clientY:20,deltaY:80,deltaMode:0,ctrlKey:false,preventDefault:() => { prevented = true; }});

  assert.equal(editorScroll.scrollTop,100);
  assert.equal(prevented,false);
});

test("keeps the lodging input free of placeholder text", () => {
  assert.match(html, /\["lodging","住宿","","input"\]/);
  assert.match(html, /data-field="lodging" value="\$\{esc\(day\.lodging\)\}" placeholder=""/);
  assert.doesNotMatch(html, /placeholder="例如：重庆市区酒店"/);
});

test("defines six complete route themes and theme-driven panel colors", () => {
  for (const id of ["red","blue","green","pink","purple","orange"]) {
    assert.match(html,new RegExp(`id:"${id}"`));
  }
  assert.match(html,/--primary-soft:/);
  assert.match(html,/--primary-border:/);
  assert.match(html,/--primary-print-border:/);
  assert.match(html,/\.preview-kicker \{[^}]*background: var\(--primary-soft\)/s);
  assert.match(html,/\.preview-day-card \{[^}]*border: 1px solid var\(--primary-print-border\)[^}]*background: var\(--primary-soft\)/s);
  assert.match(html,/@media print \{[\s\S]*?box-shadow: inset 0 0 0 \.25mm var\(--primary-print-border\)/s);
});

test("keeps white text readable on every route theme primary color", () => {
  const primaryColors = [...html.matchAll(/\{id:"(?:red|blue|green|pink|purple|orange)"[^}]*primary:"(#[0-9a-f]{6})"/gi)].map(match => match[1]);
  const luminance = hex => {
    const channels = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value,16) / 255)
      .map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };

  assert.equal(primaryColors.length,6);
  primaryColors.forEach(color => assert.ok(1.05 / (luminance(color) + .05) >= 4.5,`${color} has insufficient contrast`));
});

test("uses the current route theme for the preview quote table header", () => {
  assert.match(html,/\.preview-quote-table th \{[^}]*background: var\(--primary-border\)/s);
  assert.doesNotMatch(html,/\.preview-quote-table th \{[^}]*background: #f7e4ed/s);
});

test("assigns deterministic themes while avoiding the preceding route color", () => {
  const themeIds = ["red","blue","green","pink","purple","orange"];
  const nextThemeId = Function("themeIds",`${extractFunction("nextThemeId")}\nreturn nextThemeId;`)(themeIds);

  assert.equal(nextThemeId([]),"red");
  assert.equal(nextThemeId([{data:{themeId:"red"}}]),"blue");
  assert.equal(nextThemeId([{data:{themeId:"blue"}}]),"green");
  assert.notEqual(nextThemeId([{data:{themeId:"green"}},{data:{themeId:"pink"}}]),"pink");
});

test("normalizes route-specific demand state and interrupted recognition", () => {
  const normalizeDemandRecognition = loadFunction("normalizeDemandRecognition");

  assert.deepEqual(normalizeDemandRecognition(),{status:"idle",result:null,sourceName:"",message:""});
  assert.deepEqual(normalizeDemandRecognition({status:"complete",result:{data:{days:[{}]}},sourceName:"客户需求"}),{
    status:"complete",result:{data:{days:[{}]}},sourceName:"客户需求",message:""
  });
  assert.deepEqual(normalizeDemandRecognition({status:"busy",message:"处理中"}),{
    status:"error",result:null,sourceName:"",message:"上次识别未完成，请重新识别。"
  });
});

test("stores customer demand and recognition state inside each route", () => {
  assert.match(html,/customerDemand:""/);
  assert.match(html,/demandRecognition:normalizeDemandRecognition/);
  assert.doesNotMatch(html,/let demandState = \{busy:false,result:null,file:null\}/);
  assert.match(html,/\$\("#customerDemandInput"\)\.value = data\.customerDemand \|\| ""/);
  assert.match(html,/data\.customerDemand = e\.target\.value/);
  assert.match(html,/function renderDemandState\(/);
});

test("binds recognition results to the route that started the request", () => {
  const startDemandRecognition = extractFunction("startDemandRecognition");

  assert.match(startDemandRecognition,/const taskId = library\.currentId/);
  assert.match(startDemandRecognition,/const taskData = data/);
  assert.match(startDemandRecognition,/recognizeDemandText\([\s\S]*?,sourceLabel,taskData\)/);
  assert.match(startDemandRecognition,/setDemandResult\(result,[^,]+,taskId,taskData\)/);
  assert.match(html,/function demandPrompt\(text, sourceLabel = "客户需求", taskData = data\)/);
  assert.match(html,/function normalizeImportedResult\(raw, taskData = data\)/);
});

test("clears reference files and restores route demand UI on every switch", () => {
  const switchTask = extractFunction("switchTask");

  assert.match(html,/function clearReferenceFile\(/);
  assert.match(switchTask,/clearReferenceFile\(\)/);
  assert.match(switchTask,/renderAll\(\)/);
  assert.match(html,/function renderEditor\([\s\S]*?renderDemandState\(\)/);
});

test("shows route colors and a current-route theme picker in the task menu", () => {
  assert.match(html,/id="taskThemePicker"/);
  assert.match(html,/class="task-color-dot"/);
  assert.match(html,/data-theme-id="\$\{theme\.id\}"/);
  assert.match(html,/function setCurrentTheme\(/);
  assert.match(html,/applyTheme\(data\.themeId\)/);
  assert.match(html,/taskThemePicker[\s\S]*?addEventListener\("click"/);
});

test("keeps duplicate route numbering stable and refreshes the switcher immediately", () => {
  const taskDisplayNameSource = extractFunction("taskDisplayName");
  assert.doesNotMatch(taskDisplayNameSource,/sort\(\(a,b\) => a\.updatedAt - b\.updatedAt\)/);

  const switchTaskSource = extractFunction("switchTask");
  assert.match(switchTaskSource,/storeLibrary\(\)/);
  assert.match(switchTaskSource,/renderTaskMenu\(\)/);
  assert.doesNotMatch(switchTaskSource,/\bsave\(\)/);
});

test("clears reference files for every operation that changes the current route", () => {
  assert.match(extractFunction("switchTask"),/clearReferenceFile\(\)/);
  assert.match(extractFunction("createTask"),/clearReferenceFile\(\)/);
  assert.match(extractFunction("deleteTask"),/library\.currentId === id[\s\S]*?clearReferenceFile\(\)/);
});
