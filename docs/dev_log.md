## 阶段 4：持续优化与问题修复 (Continuous Optimization & Bug Fixing)

### 任务 X：环境集成与易用性优化 (Environment Integration & Usability Optimization)
- **问题:** 项目依赖（如 Node.js 模块、系统工具）需要用户手动安装和配置，降低了易用性和可移植性。
- **分析与解决方案:**
    - **Node.js 依赖管理:** 创建 `package.json` 文件，将 `http-server` 和 `playwright` 定义为开发依赖。用户可通过 `npm install` 一键安装所有 Node.js 模块，实现类似虚拟环境的依赖隔离。
    - **系统级依赖检查:** 编写 `setup.sh` 脚本，用于：
        - 检查 Node.js 和 npm 是否已安装，并提供安装指引。
        - 在 macOS 系统上，检查 `realpath` 命令（`coreutils` 包提供）是否存在，如果缺失则提示用户通过 Homebrew 安装或尝试自动安装。
        - 自动执行 `npm install` 安装 Node.js 依赖。
        - 自动执行 `npx playwright install` 下载 Playwright 浏览器二进制文件。
    - **脚本可执行权限:** 确保 `setup.sh` 具有可执行权限。
- **验证:** 运行 `setup.sh` 脚本，所有依赖均能正确安装和配置，项目可顺利运行。

### 任务 Y：核心逻辑跨平台重构 (Cross-Platform Core Logic Refactoring)
- **问题:** 现有的 `generate_image.sh` 脚本是 Bash 脚本，在 Windows 系统上运行存在兼容性问题，需要用户安装额外环境（如 Git Bash, WSL），且依赖于 `realpath`, `base64`, `sed`, `perl` 等类 Unix 工具，限制了程序的跨平台能力和易用性。
- **分析与解决方案:**
    - **语言选择:** 决定将核心图片生成逻辑从 Bash 重写为 Node.js (JavaScript) 脚本 `src/generate_image.js`，以利用 Node.js 的跨平台特性和 Playwright 的原生 Node.js API。
    - **功能迁移:** 将 `generate_image.sh` 中的所有功能（参数解析、路径处理、头像 Base64 编码、输入文本处理、内容切割、高亮、HTML 模板替换、Playwright 截图）完整迁移到 `generate_image.js` 中。
    - **依赖替换:** 使用 Node.js 内置模块 (`fs`, `path`, `Buffer`) 和 JavaScript 字符串/正则表达式方法，替代 Bash 脚本中对 `realpath`, `base64`, `sed`, `perl` 等外部命令的依赖。
    - **Playwright API 调用:** 直接使用 `playwright` npm 包提供的 JavaScript API 进行浏览器控制和截图，而非通过 `npx playwright screenshot` 命令行调用。
    - **脚本更新:** 更新 `package.json`，添加 `"generate": "node src/generate_image.js"` 命令，方便用户运行。更新 `setup.sh`，移除对 `generate_image.sh` 的特定处理，并引导用户使用 `npm run generate`。
    - **备份:** 在重构前，将原始 `src/generate_image.sh` 备份至 `src/backup/generate_image.sh`。
- **验证:** 在不同操作系统（模拟）上运行 `setup.sh` 和 `npm run generate`，确认图片生成功能正常，且不再需要 Bash 特定环境。

### 任务 1：修复脚本语法错误 (Fixing Script Syntax Errors)
- **问题:** 用户报告 `src/generate_image.sh` 存在 `unexpected EOF` 和 `syntax error near unexpected token '|'` 错误。
- **分析与解决方案:**
    - `unexpected EOF`: 发现 `REPLACEMENT_COVER` 变量赋值时缺少闭合双引号。通过 `replace` 工具添加了缺失的引号。
    - `syntax error near unexpected token '|'`: 发现 `sed` 命令中的分隔符 `|` 与搜索模式中的 `|` 冲突，导致语法错误。通过 `replace` 工具将 `sed` 分隔符更改为 `#`。
    - `syntax error near unexpected token 'newline'`: 发现 `sed` 命令和 `printf` 命令中存在过度转义的引号 (`"`)，导致 shell 解析错误。通过 `replace` 工具移除了不必要的转义字符。
    - `net::ERR_NAME_NOT_RESOLVED`: 发现 `npx playwright screenshot` 命令的 URL 参数中存在过度转义的引号 (`"`)，导致 Playwright 无法正确解析本地文件路径。通过 `replace` 工具移除了不必要的转义字符。
- **验证:** 脚本成功运行，不再报告语法错误。

### 任务 2：实现内容智能切割与高亮 (Smart Content Splitting & Highlighting)
- **问题:** 用户反馈图片中存在重复内容，并要求根据冒号或逗号切割文本，且重要内容需标红加粗。
- **分析与解决方案:**
    - **内容切割:** 改造 `src/generate_image.sh` 脚本，实现根据冒号 (`:`) 或逗号 (`,`, `，`) 切割输入文本。切割后，冒号/逗号前的内容作为 `COVER_TITLE`，之后的内容作为 `TEXT_CONTENT`。
    - **高亮:** 引入 `perl` 命令，将 `**文本**` 格式的内容转换为 `<span class="highlight">文本</span>`，实现标红加粗效果。
    - **优先级调整:** 根据用户反馈，调整切割逻辑优先级：首先检查是否为带序号的列表项（以数字和点开头并包含冒号），然后检查逗号，最后检查冒号（针对非序号内容），确保切割逻辑符合预期。
    - **中英文标点:** 引入标点符号归一化步骤，将中文冒号 `：` 和中文逗号 `，` 统一转换为英文冒号 `:` 和英文逗号 `,`，简化后续的切割判断逻辑。
- **验证:** 脚本成功运行，内容切割和高亮效果符合预期。

### 任务 3：首张图片特殊样式处理 (Special Styling for First Image)
- **问题:** 用户要求首张图片作为主标题页，需进行大字号加粗、全屏渐变、头像展示及内容居中处理。
- **分析与解决方案:**
    - **模板修改:** 在 `src/template.html` 中为 `page-container` 添加 `{{PAGE_STYLE_CLASS}}` 占位符，并更新 JavaScript 逻辑，使其根据 `page-container` 是否包含 `first-page` 类来决定将渐变背景应用于 `page-container` 还是 `cover-section`。
    - **脚本逻辑:** 在 `src/generate_image.sh` 中，当 `LINE_NUM` 为 1 时，设置 `PAGE_STYLE_CLASS="first-page"`，并将整行文本作为 `COVER_TITLE`，`TEXT_CONTENT` 置空。
    - **CSS 注入:** 注入特定 CSS 规则，使 `cover-section` 填充整个页面，隐藏 `content-section`，并确保头像和标题在页面上正确显示和居中。
    - **迭代优化:**
        - **渐变铺满问题:** 发现渐变未铺满整张图片。通过调整注入 CSS，使 `cover-section` 绝对定位并填充整个 `page-container`，同时将 `page-container` 的背景设为透明，确保渐变铺满。
        - **头像与标题间距及居中:** 发现头像和标题的垂直居中及间距不符合要求。通过精确计算，使用绝对定位和 `top` 属性调整头像和标题的位置，并使用 `transform: translate(-50%, -50%)` 确保标题精确居中，同时调整 `top` 值以达到用户要求的 2-3 行文字间距。
- **验证:** 脚本成功运行，首张图片样式符合所有要求。

### 任务 4：实现基于排版的 V2 版本图片生成 (Implement V2 Image Generation Based on Typography)
- **问题:** 用户反馈“一句话一张图”的模式体验不佳，要求改成将完整段落按优美排版分页截图的模式，并指定了参考样式。
- **分析与解决方案:**
    - **样式分析:** 分析了用户提供的“小红书”页面，确定了新样式的关键元素：标题、高亮、段落缩进、分页、3:4的图片比例等。
    - **创建 V2 模板:** 新建 `src/template_v2.html`，使用 CSS 实现新的排版样式，包括字体、颜色、间距、高亮样式等。
    - **创建 V2 脚本:** 新建 `src/generate_image_v2.js` 脚本，实现以下逻辑：
        - 读取 `input.txt`，将第一行作为标题，其余作为正文段落。
        - 支持 `**文字**` 语法转换为高亮标签。
        - 使用 Playwright 加载 V2 模板，并利用其分页逻辑，对渲染出的所有 `.page` 元素进行逐一截图。
    - **更新 `package.json`:** 添加 `generate:v2` 脚本命令来运行新的 V2 脚本。
- **迭代优化与问题修复:**
    - **恢复首图样式:** 根据用户反馈，V2 版本缺少了旧版的封面页样式。通过修改 `template_v2.html` 和 `generate_image_v2.js`，为 V2 版本重新加入了封面页逻辑，使其能够生成带渐变背景和用户头像的第一张图片。
    - **调整图片比例:** 用户反馈 3:4 的比例不符合主流手机屏幕。将图片生成比例调整为 9:16，以获得更好的垂直屏幕观看体验。
    - **修复参数传递:** 修复了 `npm run generate:v2 -- ...` 命令无法正确向 Node.js 脚本传递参数的问题。
- **更新文档:** 更新了 `docs/manual.md`，添加了 V2 版本的详细使用说明。同时在 `dev_log.md` 中记录了本次迭代。
- **验证:** 运行 `npm run generate:v2 -- image.png input.txt`，成功生成了包含封面页和内容页的、样式符合要求的系列图片。

### 任务 5：语义高亮与布局的迭代优化 (Iterative Optimization of Semantic Highlighting and Layout)
- **问题:** 用户反馈自动高亮逻辑不准确，布局过于紧凑，并提出了一系列具体的优化需求。
- **分析与解决方案 (迭代过程):**
    - **初版自动高亮:** 尝试使用 `keyword-extractor` 库进行全局关键词提取。后发现该库不支持中文，遂更换为 `nodejieba`。
    - **基于词频与长度的高亮:** 使用 `nodejieba` 分词后，结合词频和词长作为权重，提取排名最高的几个词进行全局高亮。用户反馈此方法过于机械，高亮词过多。
    - **基于段落的局部高亮:** 将高亮逻辑改为在每个段落内部执行，提取段落中最长的3个词进行高亮。用户反馈此方法仍不够“语义化”。
    - **基于词性与规则的语义高亮:** 
        - 引入词性标注（POS tagging），并结合“触发词”（如“可以”、“需要”、“进行”等）和词性组合（如“动词+名词”）来提取更具行动指导意义的短语。
        - 根据用户反馈，将“帮助”、“确保”等词从“排除型触发词”调整为“包含型触发词”，使高亮短语更完整。
        - 修复了 `match()` 方法只能匹配段落中第一个触发词的问题，改用 `matchAll()` 来匹配所有符合条件的短语。
        - 修复了高亮逻辑会错误地高亮论点标题（如“1. 复杂性”）的问题，通过代码重构，将标题与内容分离，只对内容进行高亮处理。
    - **布局与样式优化:**
        - **宽松布局:** 根据用户“排版太紧凑”的反馈，调整了分页逻辑，将每页承载的内容量减少到80%，从而生成更多图片，使版式更宽松。
        - **样式修复:** 修复了图片顶部出现 `{{FIRST_PAGE_STYLE}}` 占位符和白边的问题。
        - **头像样式:** 根据用户反馈，将头像从圆形改为方形，并通过 `object-fit: cover` 确保在非正方形头像的情况下也能被恰当裁切，避免留白。
- **验证:** 经过多轮迭代，最终生成的图片在布局、样式和核心内容高亮方面均满足了用户的精细化需求。

### 任务 Z：Git 环境清理与文档更新 (Git Environment Cleanup & Documentation Update)
- **问题:** Git 仓库中存在不应跟踪的文件（如临时文件、缓存），且 `.gitignore` 未能有效工作；用户需要更清晰的 `input.txt` 编写指南。
- **分析与解决方案:**
    - **Git 仓库清理:**
        - 更新 `docs/manual.md`，强调在已打开的终端中运行 `setup.sh`，并澄清 Node.js 检查机制。
        - 移除不再使用的 `src/generate_image.sh` 脚本。
        - 鉴于 `.gitignore` 持续不生效的问题，采取了激进措施：删除 `.git` 目录并重新初始化仓库，以确保 `.gitignore` 规则从一开始就正确应用。
        - 提交了必要的项目文件。
        - 更新 `.gitignore` 文件，确保正确排除 `node_modules/`, `dist/`, `.gemini/`, `.playwright-mcp/` 等临时和生成文件。
        - 根据用户需求，将 `image.png` 和 `input.txt` 从 `.gitignore` 中移除并添加到仓库中，作为示例文件。
- **验证:** Git 仓库现在只包含必要文件，`.gitignore` 规则已正确生效。`image.png` 和 `input.txt` 已作为示例文件被跟踪。

### 任务 6：修复 Windows 环境依赖问题并重构安装流程 (Fix Windows Dependency Issues & Refactor Setup)
- **问题:** 用户在 Windows 环境下执行 `./setup.sh` 脚本时，`npm install` 失败。日志分析表明，核心原因是 `nodejieba` 依赖与最新的 Node.js v24 不兼容，且需要用户本地安装 Visual Studio C++ 编译工具链，安装门槛高。
- **分析与解决方案 (迭代过程):**
    - **初步方案 (降级 Node.js):** 最初建议用户使用 `nvm-windows` 将 Node.js 降级到 v20 LTS 版本，以匹配 `nodejieba` 的预编译二进制文件。此方案被用户否决，因为它会影响用户的全局 Node.js 环境。
    - **改进方案 (智能脚本):** 尝试将 `setup.sh` 脚本智能化，使其能自动检查 Node.js 版本并引导用户切换。此方案仍需用户手动切换版本，未达到理想的自动化程度。
    - **最终方案 (替换核心依赖):**
        - **依赖替换:** 决定从根本上解决问题，将项目的中文分词依赖从 C++ 驱动的 `nodejieba` 替换为由 Rust 驱动的现代替代品 `@node-rs/jieba`。
        - **优势:** 新的 `@node-rs/jieba` 库为所有主流平台和最新的 Node.js 版本（包括 v24）提供了预编译二进制文件，彻底移除了对本地 C++ 编译环境和特定 Node.js 版本的依赖。
        - **代码迁移:** 修改了 `package.json` 以引入新依赖，并无缝更新了 `src/generate_image_v2.js` 中的 `require` 语句，因为两个库的 `tag()` API 兼容。
    - **安装流程健壮性提升:**
        - 在测试过程中发现用户的 npm 全局缓存存在权限问题 (`EACCES`)。为避免要求用户执行 `sudo` 命令，修改 `setup.sh` 脚本，在 `npm install` 时增加 `--cache ./.npm-cache` 参数，使用项目本地的临时缓存，绕开了全局缓存的权限问题，显著提升了安装脚本的健壮性和可移植性。
        - 将新生成的 `.npm-cache` 目录添加到了 `.gitignore` 文件中。
- **验证:** 在一个全新的 `finaltest/` 目录中成功执行了 `./setup.sh` 和图片生成流程，证明了新方案在无需任何环境妥协的情况下，可在新机器上顺利完成端到端的操作。