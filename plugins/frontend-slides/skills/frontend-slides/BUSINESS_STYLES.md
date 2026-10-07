# 稳重商务风格清单

本文件是国企商务版能使用的**全部风格**。生成风格预览和正式幻灯片时，只能从这里挑选，不要使用 `STYLE_PRESETS.md` 或 `bold-template-pack/selection-index.json` 里的其他风格。

如果想把模板库里的其他风格加进来，按文末「如何新增一套风格」操作。

---

## 一、字体规则（所有风格通用，必须遵守）

演示现场和单位内网经常无法访问外网，所以**幻灯片不能从网上加载任何字体**。

- 不写任何指向 `fonts.googleapis.com`、`fonts.gstatic.com`、`api.fontshare.com` 或其他网站的 `<link>`、`@import`、`@font-face`。
- 即使 `design.md` 里写了 Google Fonts 链接、要求“never substitute”某个字体，也一律忽略，改用下面的本机字体栈。
- 在每份幻灯片的 `:root` 里原样写入下面三个变量，其他地方只引用变量，不再单独写字体名：

```css
:root {
    /* 无衬线：英文和数字用系统自带字体，中文依次落到微软雅黑（Windows）、苹方（苹果电脑）等 */
    --font-sans: "Segoe UI", "Helvetica Neue", Arial,
                 "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB",
                 "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif;

    /* 衬线：只给英文标题和大号数字增加质感，中文仍然显示为黑体 */
    --font-serif: Georgia, "Times New Roman",
                  "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB",
                  "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", serif;

    /* 等宽：只用于页码、日期、编号等短小标注 */
    --font-mono: Consolas, "SF Mono", Menlo,
                 "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB",
                 "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", monospace;
}
```

### 中文排版细则

- 中文字重只用 `400`（常规）和 `700`（加粗）。微软雅黑没有其他字重，写 200、300、500、600 会显示异常。
- 中文**不用斜体**。设计稿里用斜体强调的地方（如 Signal 的金色斜体），中文一律改成“加粗 + 强调色”。
- 中文不用 `text-transform: uppercase`，不加字距（`letter-spacing: 0`）。英文小标签可以保留原设计的大写和字距。
- 行高：正文 1.5–1.7，标题 1.25–1.35。
- 中英文、中文和数字之间加一个半角空格，例如“提升 30% 的效率”“使用 AI 工具”。
- 标题末尾不加句号。

### 投屏字号下限（按 1920×1080 画布计算）

| 用途 | 最小字号 |
|---|---|
| 封面主标题 | 88px |
| 页面标题 | 56px |
| 正文要点 | 30px |
| 说明、图注 | 24px |
| 页码、页脚 | 18px |

会议室投影看不清小字。内容放不下时拆成两页，不要缩小字号。

---

## 二、可选风格

| 编号 | 中文名 | 来源 | 适合场景 |
|---|---|---|---|
| 1 | 藏青金 | 模板库 `signal` | 向领导汇报、正式提案、董事会风格 |
| 2 | 商务蓝 | 模板库 `blue-professional` | 方案介绍、数据较多的汇报 |
| 3 | 简约红 | 内置 Swiss Modern | 国企常用红色强调，简洁有力 |
| 4 | 黑白蓝 | 内置 Electric Studio | 高对比度，投影仪效果差时最清晰 |
| 5 | 素雅灰 | 模板库 `cartesian` | 低调克制，咨询报告、研究汇报 |

向用户介绍风格时使用中文名，不要把英文名或编号写到幻灯片上。

---

### 1. 藏青金（signal）

- **完整设计稿**：`bold-template-pack/templates/signal/design.md`（用户选定后再读）
- **气质**：沉稳、可信、有分量
- **配色**：深藏青 `#1C2644`、米白纸色 `#F0ECE3`、唯一强调色古金 `#C8A870`
- **字体映射**：英文标题 → `--font-serif`；正文 → `--font-sans`；标注 → `--font-mono`；中文会自动显示为微软雅黑等本机中文字体
- **中文调整**：原设计标题中“金色斜体”改为“金色加粗”；深色页和浅色页可以交替使用

### 2. 商务蓝（blue-professional）

- **完整设计稿**：`bold-template-pack/templates/blue-professional/design.md`（用户选定后再读）
- **气质**：现代、专业、清爽，类似咨询公司季度汇报
- **配色**：暖米白底 `#FDFAE7`、唯一强调色钴蓝 `#1E2BFA`、正文黑 `#111111`、辅助灰 `#6B6B6B`；涨跌用绿 `#059669` / 红 `#DC2626`
- **字体映射**：标题和数字 → `--font-sans`（700）；正文 → `--font-sans`（400）
- **中文调整**：设计稿说“不得替换 Space Grotesk 和 Inter”，本版本忽略这条，统一用本机字体

### 3. 简约红（Swiss Modern）

- **完整设计稿**：无独立文件，按下面的描述设计
- **气质**：简洁、精确、有力，包豪斯式网格
- **配色**：纯白底 `#FFFFFF`、纯黑文字 `#111111`、红色强调 `#C8102E`（原版为偏橙的 `#FF3300`，这里换成更庄重的正红）
- **版式要点**：可见的网格线或分栏、左对齐的非对称布局、粗大的页码或章节编号、少量几何色块（红色矩形、细线）
- **字体映射**：标题 → `--font-sans`（700）；正文 → `--font-sans`（400）

### 4. 黑白蓝（Electric Studio）

- **完整设计稿**：无独立文件，按下面的描述设计
- **气质**：干净、高对比、自信
- **配色**：近黑 `#0A0A0A`、纯白 `#FFFFFF`、强调蓝 `#2B4BEE`
- **版式要点**：上下或左右分屏（白色区 + 深色或蓝色区）、面板边缘一条强调色竖条、四角放简短标注（单位名、日期、页码）、大号引言作为视觉焦点
- **字体映射**：标题 → `--font-sans`（700）；正文 → `--font-sans`（400）

### 5. 素雅灰（cartesian）

- **完整设计稿**：`bold-template-pack/templates/cartesian/design.md`（用户选定后再读）
- **气质**：安静、克制、有书卷气
- **配色**：砂岩底 `#EDE8E0`、次级底 `#E2DBD1`、正文 `#1A1A1A`、辅助灰 `#5A5A5A`、点缀 `#8A8178`、线条 `#B8B0A4`
- **字体映射**：英文标题和大号数字 → `--font-serif`；正文 → `--font-sans`
- **中文调整**：原设计的小标签“全大写 + 宽字距”只对英文生效，中文标签正常书写；装饰圆环保持低透明度，不能压住文字

---

## 三、单位主色

如果 `SKILL.md` 的「我的偏好设置」里填写了单位主色，用它替换所选风格的**强调色**（如藏青金的古金、商务蓝的钴蓝、简约红的正红），底色和文字颜色保持不变。替换后检查强调色上的文字是否清晰；对比度不足时，把强调色只用在线条、色块和大号数字上，不用作小字颜色。

---

## 四、如何新增一套风格

1. 在 `bold-template-pack/selection-index.json` 中找到想加入的模板，确认它的 `formality` 是 `high` 或 `medium-high`。
2. 在本文件「二、可选风格」的表格里加一行，并仿照上面的格式写一个小节：设计稿路径、气质、配色、字体映射、中文调整。
3. 新风格同样遵守本文件第一部分的字体规则。
