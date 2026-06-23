# Recognition And Active Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 固定当前线路视觉状态，并让识别结果稳定生成日期开头的标题，同时保留并扩充现有接待标准和特别说明。

**Architecture:** 保持单文件页面结构，在现有识别结果规范化阶段增加纯函数兜底。样式只调整当前线路选择器；数据行为通过可独立测试的标题和列表合并函数完成。

**Tech Stack:** 原生 HTML、CSS、JavaScript；Node.js 内置测试运行器。

---

### Task 1: 当前线路固定样式

**Files:**
- Modify: `index.html`
- Test: `letterhead.test.js`

- [ ] **Step 1: Write the failing test**

更新样式测试，要求选中项使用固定背景、短竖线伪元素，并且不存在单独改变选中项悬停背景的规则。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test letterhead.test.js`
Expected: FAIL，当前样式仍使用贯穿高度的内阴影，并在悬停时改变颜色。

- [ ] **Step 3: Write minimal implementation**

让 `.task-item.active .task-select` 使用固定背景和相对定位；使用 `::before` 绘制 `left: 0; top: 5px; bottom: 5px; width: 3px` 的红色短竖线；删除选中项专用悬停色。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test letterhead.test.js`
Expected: PASS。

### Task 2: 日期开头的识别标题

**Files:**
- Modify: `index.html`
- Test: `letterhead.test.js`

- [ ] **Step 1: Write the failing test**

新增纯函数测试：首日为 `2026-08-01` 且模型标题为 `重庆、成都双飞6日游` 时返回 `08.01 重庆、成都双飞6日游`；已有日期前缀时替换而非叠加。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test letterhead.test.js`
Expected: FAIL，标题规范化函数尚不存在。

- [ ] **Step 3: Write minimal implementation**

新增 `normalizeRecognizedTitle(title, firstDate)`，移除开头的 `MM.DD`、`MM/DD` 或 `M月D日`，再用首日日期生成两位数 `MM.DD` 前缀；在识别结果规范化时调用。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test letterhead.test.js`
Expected: PASS。

### Task 3: 保留并扩充标准和说明

**Files:**
- Modify: `index.html`
- Test: `letterhead.test.js`

- [ ] **Step 1: Write the failing test**

新增列表合并测试，要求现有示例条目保留、新识别条目追加、完全相同条目去重；同时检查识别提示明确要求以现有标准和说明为底稿。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test letterhead.test.js`
Expected: FAIL，当前应用逻辑会整组替换。

- [ ] **Step 3: Write minimal implementation**

新增 `mergeRecognitionList(existing, recognized)`，合并两组非空字符串并去重；识别开始时保存当前标准和说明，规范化结果和应用结果均使用合并值；在提示中附上现有标准与说明及保留要求。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test letterhead.test.js`
Expected: PASS。

### Task 4: 完整验证

**Files:**
- Verify: `index.html`
- Verify: `letterhead.test.js`

- [ ] **Step 1: Run the full automated suite**

Run: `node --test letterhead.test.js`
Expected: 所有测试通过且没有警告。

- [ ] **Step 2: Verify in the browser**

重新加载 `http://127.0.0.1:8010/index.html`，确认页面标题、主要内容、当前线路固定样式、悬停不变和控制台无相关错误。
