# 用户操作手册 (User Manual)

## 概述 (Overview)
本项目提供一个自动化脚本，用于根据输入文本批量生成符合特定视觉风格的宣传图片。

## 依赖 (Dependencies)
- **Node.js**: 项目运行所需的主要环境，用于执行脚本和管理依赖。
- **Homebrew (macOS)**: 如果您是 macOS 用户，Homebrew 可能需要用于安装 `realpath` 等系统工具。

## 配置与安装 (Setup and Installation)

1.  **克隆仓库 (Clone Repository)**
    ```bash
    git clone <your-github-repo-link>
    cd <your-project-directory>
    ```

2.  **运行安装脚本 (Run Setup Script)**
    在项目根目录下运行以下命令，脚本将自动检查并安装所有必需的依赖项：
    ```bash
    ./setup.sh
    ```
    **重要提示：请务必在一个已经打开的 Git Bash (Windows)、WSL 或其他 Bash 兼容终端中执行此脚本。直接双击脚本文件可能导致终端窗口在脚本执行完毕后立即关闭，从而错过重要的提示信息。**

    -   **Windows 用户注意**: 请在 Git Bash、WSL (Windows Subsystem for Linux) 或其他提供 Bash 环境的终端中运行此脚本。推荐在配置好git环境的前提下在程序目录按住shift+右键开启gitbash并执行setup脚本。
    -   **Node.js**: 脚本会检查 Node.js 和 npm 是否已安装。如果未安装，脚本会提示您安装 Node.js 并提供官方下载链接。
    -   **realpath (macOS)**: 如果您是 macOS 用户且缺少 `realpath` 命令，脚本会尝试通过 Homebrew 安装 `coreutils`。
    -   **Node.js 依赖**: 脚本会自动安装 `package.json` 中定义的所有 Node.js 模块（如 `playwright`, `http-server`）。

## 使用方法 (Usage)

### 0. 启动本地服务器 (Start Local Server) (可选)
如果您需要通过浏览器访问 `template.html` 或进行调试，可以在项目根目录下运行本地服务器：
```bash
npm start
```
服务器默认运行在 `http://localhost:8080`。

### 1. 准备输入文件 (Prepare Input File)
创建一个文本文件（例如 `input.txt`），每行包含您希望生成图片的内容。脚本将把每一行文本作为图片的主体内容。**脚本会自动跳过空行和只包含空格的行，避免生成空白图片。**

**`input.txt` 编写规则:**

*   **第一行**: 必须是该文章的总标题。
*   **论点/论据支持**: 
    *   **有序列表**: 使用数字加点 `1. `、`2. ` 等来表示。
    *   **无序列表**: 使用星号 `* ` 或连字符 `- ` 来表示。
*   **强调部分**: 想要在正文中强调的部分，请使用双星号 `**` 将其括起来（例如：`**这是强调的内容**`）。
*   **内容切割**: 脚本会根据冒号 (`:`) 或逗号 (`,`, `，`) 来切割文本，冒号/逗号前的内容可能作为标题，之后的内容作为正文。请注意标点符号的使用。
*   **中英文标点**: 脚本会自动处理中英文标点符号的转换，但建议在输入时保持一致性。

**`input.txt` 示例:**
```
哈喽，我是大康。在我给老板们的SOP培训中，“如何确定哪些流程需要SOP？”这个议题频频出现。
有效的SOP可以提高工作效率、确保一致性，并降低风险。

复杂性：复杂的流程通常更容易出错，需要更多的协调和管理。
```

### 2. 运行生成脚本 (V2 - 推荐) (Run Generation Script - V2 - Recommended)
使用 `npm run generate:v2` 命令来批量生成图片。此版本基于排版生成长图文，样式更美观，推荐使用。

**核心功能:**
- **自动排版**: 将 `input.txt` 中的文本自动排版成适合阅读的页面。
- **首图定制**: 第一张图片为封面页，包含渐变背景、用户头像和主标题。
- **长图文生成**: 后续图片为内容页，按 9:16 的手机屏幕黄金比例进行分页截图。
- **自动高亮**: 脚本会自动分析每个论点，并高亮其中的核心短语（最多3个）。
- **手动高亮**: 同时支持 `**文字**` 语法来手动高亮重点内容。

**`input.txt` 编写规则 (V2):**
- **第一行**: 文章的总标题，将显示在封面页和内容页上。
- **后续行**: 文章的正文段落，每一行将作为一个段落 `<p>`。
- **自动高亮**: 脚本会智能分析论据内容，自动高亮核心短语。您无需手动操作。
- **手动高亮 (可选)**: 如果您想强制高亮特定词语，依然可以使用双星号 `**` 将其括起来（例如：`**这是强调的内容**`）。

**运行命令:**

**不带头像图片:**
```bash
npm run generate:v2 -- input.txt
```

**带头像图片:**
```bash
npm run generate:v2 -- path/to/your/avatar.png input.txt
```

### 3. 运行生成脚本 (V1 - 旧版) (Run Generation Script - V1 - Legacy)
使用 `npm run generate` 命令来批量生成图片。此版本为每一行输入文本生成一张独立的图片。

**不带头像图片:**
```bash
npm run generate input.txt
```

**带头像图片:**
```bash
npm run generate_image.js path/to/your/avatar.png input.txt
```
支持常见的图片格式，如 `jpeg`, `png`, `jpg`, `gif`。**请注意，`HEIC` 格式图片在浏览器中的支持可能有限，建议您将其转换为 `JPEG` 或 `PNG` 格式后再使用。**

### 3. 查看生成图片 (View Generated Images)
所有生成的图片将保存在 `dist/` 目录下，命名格式为 `output_1.png`, `output_2.png` 等。

## 自定义 (Customization)

### 1. 修改图片模板 (Modify Image Template)
您可以编辑 `src/template.html` 文件来修改图片的视觉样式。
- **CSS 样式**: 修改 `<style>` 标签内的 CSS 规则来调整字体、颜色、布局等。
- **占位符**:
    - `{{COVER_TITLE}}`: 封面标题。
    - `{{TEXT_CONTENT}}`: 图片主体内容。
    - `{{BACK_COVER_TITLE}}`: 封底主标题。
    - `{{BACK_COVER_SUBTITLE}}`: 封底副标题。
- **头像上传**: 模板支持用户头像上传功能。在浏览器中打开 `src/template.html`，点击头像区域即可上传图片。
- **随机渐变**: 封面背景的渐变颜色是随机生成的。您可以在 `src/template.html` 的 `<script>` 标签中修改 `getRandomHslColor` 和 `generateRandomGradient` 函数来调整渐变颜色生成逻辑。

### 2. 修改脚本逻辑 (Modify Script Logic)
您可以编辑 `src/generate_image.js` 文件来修改图片内容的提取和图片生成逻辑。
- **标题提取**: 脚本目前从 `TEXT_CONTENT` 的前 20 个字符派生 `COVER_TITLE` 和 `BACK_COVER_TITLE`。您可以修改此逻辑以适应更复杂的标题生成规则。
- **输出目录/文件名**: 您可以修改 `OUTPUT_DIR` 和 `GENERATED_IMAGE_FILE` 变量来更改输出目录和文件名格式。

## 故障排除 (Troubleshooting)
- **Node.js 未安装**: `setup.sh` 脚本会在启动时自动检查 Node.js 和 npm 是否已安装。如果未找到，脚本会输出错误信息并终止执行。请根据脚本的提示，从 [Node.js 官方网站](https://nodejs.org/) 下载并安装 Node.js，然后重新运行 `setup.sh` 脚本。
- **`realpath` 命令未找到 (macOS)**: 如果在 macOS 上运行 `./setup.sh` 提示 `realpath` 未找到，脚本会尝试通过 Homebrew 安装 `coreutils`。如果自动安装失败，请手动运行 `brew install coreutils`。
- **脚本权限问题**: 如果 `setup.sh` 无法执行，请确保它具有执行权限：`chmod +x ./setup.sh`。
- **图片生成失败**: 检查 `temp.html` 文件是否正确生成，以及 Playwright 是否能够访问该文件。