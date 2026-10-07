# Frontend Slides 国企商务版

让 AI 帮你做**网页幻灯片**：一个 `.html` 文件，双击用浏览器打开，按方向键翻页，适合自己现场讲解。风格稳重，只用电脑自带的字体，在单位内网、断网的会议室里也能正常放映。

本版本由 Frontend Slides 原版改编，专门面向国企商务汇报场景。原版（风格更多、更有设计感）见本仓库的 `main` 分支。

---

## 和原版相比改了什么

| 项目 | 原版 | 国企商务版 |
|---|---|---|
| 说明书语言 | 英文 | 中文，方便自己阅读和修改 |
| 风格 | 46 套，鼓励大胆、个性化的设计 | 5 套稳重风格：藏青金、商务蓝、简约红、黑白蓝、素雅灰 |
| 字体 | 从 Google Fonts 在线加载 | 只用本机字体（微软雅黑、苹方等），不联网也能正常显示 |
| 工作流程 | 直接出风格预览 | 先给大纲，确认后再设计页面 |
| 数据 | 无特别要求 | 不编造数字和案例，缺资料时标出【待补充】 |
| 一键发布到网上 | 有（Vercel） | 已删除，文件只留在自己电脑上 |
| 版面检查和导出 PDF | bash 脚本，每次重新下载浏览器 | Node 脚本，Windows 也能用；直接用电脑自带的 Edge 或 Chrome |
| 个人设置 | 无 | SKILL.md 开头有「我的偏好设置」，改一行字就能固定风格、单位名称、主色 |

---

## 安装到 Codex

### 方式一：手动复制（单位网络访问 GitHub 不稳定时推荐）

1. 下载本仓库本分支的压缩包并解压。
2. 找到其中的 `plugins/frontend-slides/skills/frontend-slides` 文件夹。
3. 把整个 `frontend-slides` 文件夹复制到 Codex 的个人技能目录：
   - Windows：`C:\Users\你的用户名\.agents\skills\`
   - 苹果电脑：`~/.agents/skills/`
   - 较早版本的 Codex 使用 `.codex\skills`，如果上面的目录不生效，就放到这里
4. 重启 Codex。

### 方式二：在 Codex 里让它自己安装

在 Codex 中输入：

```text
$skill-installer install https://github.com/thu-cccm/Frontend-PowerPoint_slides/tree/guoqi-business/plugins/frontend-slides/skills/frontend-slides
```

安装完成后重启 Codex。（本分支合并进 `main` 之后，把链接里的 `guoqi-business` 换成 `main`。）

### 首次准备（只需做一次）

版面检查和导出 PDF 需要 [Node.js](https://nodejs.org)（18 或以上版本）。在技能文件夹里打开终端，运行：

```bash
npm install
```

网络较慢或下载失败时，改用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

脚本会直接使用电脑自带的 Microsoft Edge 或 Google Chrome，不需要另外下载浏览器。Codex 运行检查脚本时会在后台打开浏览器，如果弹出权限请求，选择允许。

建议装好后先让 AI 做一份三四页的测试幻灯片，确认整个流程在这台电脑上能走通。

---

## 怎么用

在 Codex 里直接说需求，例如：

```text
$frontend-slides 帮我做一份向客户介绍我们智慧园区解决方案的幻灯片，大约 10 页，资料在“方案资料”文件夹里
```

不写 `$frontend-slides` 也可以，说“帮我做一份 PPT”时 Codex 一般会自动使用这个技能。

AI 会按这个顺序工作：

1. 一次问清楚：给谁讲、讲多久、素材在哪里
2. 给出每一页的标题和要点（大纲），**等你确认**
3. 给 3 个封面预览让你选风格（偏好设置里固定了风格就跳过）
4. 生成幻灯片，自动检查版面并修正
5. 打开幻灯片，告诉你还有哪些【待补充】的资料

### 放映和修改

- 翻页：方向键或空格；全屏：F11
- 小改动：按 E 键进入编辑，直接点文字修改；按 Ctrl+S 把改好的文件下载到“下载”文件夹，用它替换原文件
- 大改动：直接告诉 AI“第 3 页改成……”

### 固定自己的习惯

用记事本打开技能文件夹里的 `SKILL.md`，修改开头的「我的偏好设置」，例如：

```text
- **默认风格**：藏青金
- **单位/部门名称**：××公司大客户部
- **单位主色**：#C00000
```

保存后，下次做幻灯片就会自动按这些设置来，不再重复询问。

### 检查版面、导出 PDF

AI 会自动运行这两个命令，也可以自己在幻灯片所在的文件夹里打开终端运行（把 `<技能文件夹>` 换成实际路径）：

```bash
# 逐页截图并检查文字溢出、重叠、字号过小、外网资源等问题
node <技能文件夹>/scripts/slides.mjs check 客户方案汇报.html

# 导出 PDF（每页是图片，文字不能编辑；加 --compact 体积更小）
node <技能文件夹>/scripts/slides.mjs pdf 客户方案汇报.html
```

---

## 五套风格

| 风格 | 适合场景 |
|---|---|
| 藏青金 | 向领导汇报、正式提案 |
| 商务蓝 | 方案介绍、数据较多的汇报 |
| 简约红 | 国企常用红色强调，简洁有力 |
| 黑白蓝 | 对比度最高，投影仪效果差时最清晰 |
| 素雅灰 | 低调克制，咨询报告、研究汇报 |

藏青金、商务蓝、素雅灰改编自模板库中的 Signal、Blue Professional、Cartesian（下图为原版效果，国企商务版换成了本机字体）：

**藏青金（Signal）**

<p>
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/signal-1.png" width="32.5%" alt="Signal — slide 1" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/signal-18.png" width="32.5%" alt="Signal — slide 18" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/signal-8.png" width="32.5%" alt="Signal — slide 8" />
</p>

**商务蓝（Blue Professional）**

<p>
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/blue-professional-1.png" width="32.5%" alt="Blue Professional — slide 1" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/blue-professional-6.png" width="32.5%" alt="Blue Professional — slide 6" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/blue-professional-8.png" width="32.5%" alt="Blue Professional — slide 8" />
</p>

**素雅灰（Cartesian）**

<p>
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/cartesian-1.png" width="32.5%" alt="Cartesian — slide 1" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/cartesian-4.png" width="32.5%" alt="Cartesian — slide 4" />
  <img src="https://raw.githubusercontent.com/zarazhangrui/beautiful-html-templates/main/screenshots/cartesian-8.png" width="32.5%" alt="Cartesian — slide 8" />
</p>

想加入模板库里的其他风格，按 `BUSINESS_STYLES.md` 末尾的「如何新增一套风格」操作。

---

## 文件说明

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 技能说明书：工作流程、规则、偏好设置 |
| `BUSINESS_STYLES.md` | 五套稳重风格、字体规则、投屏字号下限 |
| `html-template.md` | 网页幻灯片的结构、翻页和编辑功能 |
| `viewport-base.css` | 固定 16:9 画布的基础样式 |
| `animation-patterns.md` | 动画参考（只用克制的效果） |
| `bold-template-pack/` | 模板库（只用其中三套） |
| `scripts/slides.mjs` | 版面检查、导出 PDF |
| `scripts/extract-pptx.py` | 把已有 PPT 的内容提取出来，用于转换 |

## 环境要求

- Codex（或其他能读写文件、运行命令的 AI 编程助手）
- 版面检查和导出 PDF：Node.js 18+，以及 Microsoft Edge 或 Google Chrome
- PPT 转换：Python 和 python-pptx（`python -m pip install python-pptx`）

## 致谢与许可

- 原版 Frontend Slides，Created by [@zqf](https://github.com/thu-cccm)
- 模板库来自 [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates)
- MIT 许可，可自由使用、修改和分享
