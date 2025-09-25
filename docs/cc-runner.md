# 任务总纲 (Master Prompt)

## 核心理念 (Core Philosophy)
本次任务不仅是完成一个技术需求，更是一次 `Vibe Coding` 的实践。我们将遵循以下原则：
1.  **AI 协同 (AI-First)**: 你 (Gemini CLI) 是本次任务的主导者和核心执行者。我将专注于定义目标、提供高阶思路和进行最终决策，而你负责具体的实现、探索和迭代。
2.  **抽象与自动化 (Abstraction & Automation)**: 我们需要将模糊的需求（“做个图”）转化为清晰、可重复、自动化的流程。关键在于定义好网页模板、输入输出和迭代规则。
3.  **工程化交付 (Engineering Excellence)**: 过程即产物。我们追求的不仅是最终的图片，更是一套优雅、可复用、文档清晰的解决方案。所有关键步骤都应被记录，形成一个完整的、自解释的项目。

## 最终目标 (Final Goal)
创建一个能够根据输入文本批量生成符合特定视觉风格（参考小红书链接）的宣传图的自动化脚本，并以一个结构清晰、文档完备的 GitHub 仓库作为最终交付物。

## 关键交付物 (Key Deliverables)
- **代码**:
  - `src/template.html`: 核心视觉模板。
  - `src/generate_image.sh`: 核心自动化脚本。
- **文档**:
  - `docs/manual.md`: 最终用户的操作手册。
  - `docs/dev_log.md`: 开发过程的全程记录，作为我们的“外部记忆”。
  - `docs/experience.md`: 复盘总结与思考。
- **辅助执行**:
  - `cc-runner.md`: (可选) 用于指导你执行复杂或多步操作的指令清单。
- **产物**:
  - `dist/`: 存放所有最终生成的图片。
  - `reference.png`: TDD 流程的“目标”图片。

---

# 行动计划 (Action Plan)

## 阶段一：项目初始化与环境搭建 (Setup)

1.  **创建项目结构**:
    - 初始化 Git 仓库。
    - 创建目录：`src`, `dist`, `docs`。
    - 创建文件：`docs/manual.md`, `docs/dev_log.md`, `docs/experience.md`, `cc-runner.md`, `.gitignore`。
2.  **分析参考样式**:
    - 访问并分析参考链接: `http://xhslink.com/m/8xp6MN1zvPe`。
    - 提取核心视觉元素（字体、字号、颜色、布局、间距、背景等），并记录下来。这是我们后续 TDD 的“真理之源”。
3.  **创建网页模板 (`src/template.html`)**:
    - 基于分析结果，编写一个包含占位符（如 `{{TEXT_CONTENT}}`）的 HTML 文件。
    - **要求**: CSS 样式需内联或作为内部样式表，以确保截图的便捷性。


 > 我们暂停一下 回到第一阶段                                                                                                                                  
  我尝试手动打开了template.html以及你的截图文件，发现样式存在以下问题：
  1）封面：封面存在用户头像图片，并伴随下层渐变装饰空间；请参照源站由蓝绿到橘红的温     
  和渐变，在每次打开时随机生成新的渐变样式，要求颜色搭配要合理，不可以出现黑色。                                                                             
  封面的用户图片在模板页中加入上传入口；
  2）文字内容：每段论点小标题均用了加粗显示，后续论据和说明使用了普通文字样式；请注意；每段论据说明中，重要的内容      
  使用了标红加粗的处理方式；请注意使用。                                                                                                                     
  3）封底：请参照源站，将主标题与用户头像进行结合展示，使用低饱和度的背景颜色；标题请使用具有突出强调功能的颜色。重复一下样式参考链接：https://www.xiaohongshu.com/explore/652bd214000000001e033803?app_platform=ios&app_version=8.95.1&share_from_user_hidden=true&xsec_source=app_share&type=normal&xsec_token=CB4JfKDRA_06oTyuUftr07ixLd83_4ScD0z0Dj-X7hWnQ=&author_share=1&xhsshare=CopyLink&shareRedId=N0g6N0U4PEJKOEg6PD8wNjY0QD1FPT5O&apptime=1758147846&share_id=9abf24758bee4ed4847b9457804745d4


## 阶段二：核心功能开发 (TDD Cycle)

1.  **定义“目标” (Red)**:
    - 手动在 `src/template.html` 中填入一段样例文本。
    - 使用 Playwright MCP 打开该页面，手动截取一张视觉上最完美的“参考图片” (`reference.png`)。这张图是本阶段唯一的验收标准。
2.  **编写自动化脚本 (`src/generate_image.sh`)**:
    - **功能**: 接受一个文本字符串作为输入参数。
    - **处理**: 读取 `src/template.html`，将占位符替换为输入文本，生成一个临时的 `temp.html` 文件。
3.  **实现截图与对比 (Green)**:
    - **截图**: 扩展 `generate_image.sh`，调用 Playwright MCP 指令打开 `temp.html` 并截图，保存为 `generated_image.png`。
    - **对比**: **请你 (Gemini CLI) 直接对比 `generated_image.png` 和 `reference.png` 的视觉差异**。告诉我它们在哪些方面（如文字位置、大小、颜色）不一致。
4.  **迭代优化 (Refactor)**:
    - 根据你发现的差异，循环修改 `src/template.html` 的 CSS 样式和 `src/generate_image.sh` 的截图参数，直到你判断生成的图片与参考图片在视觉上完全一致。每一次循环都是一次“红-绿-重构”。

## 阶段三：批量处理与文档完善 (Scaling & Documentation)

1.  **实现批量生成**:
    - 改造 `src/generate_image.sh`，使其能接受一个包含多行文本的文件作为输入。
    - 循环读取文件中的每一行文本，调用核心截图功能，并将生成的图片以唯一的名称（如 `output_1.png`, `output_2.png`）保存在 `dist/` 目录下。
2.  **记录开发日志 (`docs/dev_log.md`)**:
    - **这是一个“日志驱动开发”的过程**。在执行每个关键步骤（特别是你的思考、执行的命令、遇到的问题和解决方案）后，请将相关信息追加到此文件中。这个文件是我们的“第二大脑”。
3.  **撰写操作手册 (`docs/manual.md`)**:
    - 在任务接近完成时，撰写此文档，详细说明项目的配置方法、依赖安装和脚本的最终运行命令。

## 阶段四：复盘与交付 (Review & Delivery)

1.  **AI 辅助复盘 (`docs/experience.md`)**:
    - **请你 (Gemini CLI) 通读 `docs/dev_log.md`**，然后为本次任务撰写一份复盘报告，存入 `docs/experience.md`。
    - **报告需包含**: 1. 整体流程总结； 2. 遇到的主要困难及解决方案； 3. 三条可以提升未来效率的建议。
2.  **提交到 GitHub**:
    - 将所有代码和文档提交到 Git 仓库，确保提交历史清晰、规范。
    - 提供最终的 GitHub 仓库链接。

