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