const fs = require('fs');
const path = require('path');
const { URL } = require('url'); // For file URLs with Playwright
const playwright = require('playwright');

async function generateImages() {
    // 1. Argument Parsing
    const args = process.argv.slice(2); // Remove 'node' and script name

    let avatarImagePathRaw = '';
    let inputFilePathRaw = '';

    if (args.length === 2) {
        avatarImagePathRaw = args[0];
        inputFilePathRaw = args[1];
    } else if (args.length === 1) {
        inputFilePathRaw = args[0];
    } else {
        console.error("Usage: node generate_image.js [AVATAR_IMAGE_PATH] <input_text_file>");
        console.error("  AVATAR_IMAGE_PATH (optional): Path to the avatar image (e.g., image.png)");
        console.error("  input_text_file (required): Path to the text file containing content for images");
        process.exit(1);
    }

    // 2. Resolve Absolute Paths and Check Existence
    const projectRoot = process.cwd(); // Current working directory

    let avatarImagePath = '';
    if (avatarImagePathRaw) {
        avatarImagePath = path.resolve(projectRoot, avatarImagePathRaw);
        if (!fs.existsSync(avatarImagePath)) {
            console.error(`Error: Avatar image file not found at ${avatarImagePathRaw}`);
            process.exit(1);
        }
    }

    const inputFilePath = path.resolve(projectRoot, inputFilePathRaw);
    if (!fs.existsSync(inputFilePath)) {
        console.error(`Error: Input text file not found at ${inputFilePathRaw}`);
        process.exit(1);
    }

    const templateFile = path.resolve(projectRoot, 'src/template.html');
    const tempHtmlFile = path.resolve(projectRoot, '.gemini/tmp/temp.html');
    const outputDir = path.resolve(projectRoot, 'dist');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 3. Prepare base64 DATA_URI for avatar if provided
    let dataUri = '';
    if (avatarImagePath) {
        try {
            const imageBuffer = fs.readFileSync(avatarImagePath);
            const base64Image = imageBuffer.toString('base64');
            let mimeType = 'application/octet-stream'; // Default

            const ext = path.extname(avatarImagePath).toLowerCase();
            switch (ext) {
                case '.jpeg':
                case '.jpg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                case '.heic': // Note: HEIC support in browsers can be limited
                    mimeType = 'image/heic';
                    break;
            }
            dataUri = `data:${mimeType};base64,${base64Image}`;
        } catch (error) {
            console.error(`Error: Failed to base64 encode avatar image ${avatarImagePath}: ${error.message}`);
            process.exit(1);
        }
    }

    // Read input file content
    const inputFileContent = fs.readFileSync(inputFilePath, 'utf8');
    const lines = inputFileContent.split('\n');

    // Launch browser once for all screenshots
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    let lineNumber = 0;
    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            continue; // Skip empty or whitespace-only lines
        }

        lineNumber++;

        let coverTitle = '';
        let textContent = '';
        let titleStyleClass = '';
        let pageStyleClass = '';
        let firstPageStyle = '';

        if (lineNumber === 1) {
            // On the first line, treat the entire line as the main title and leave content empty.
            coverTitle = trimmedLine;
            textContent = '';
            titleStyleClass = 'main-title';
            pageStyleClass = 'first-page';
            // Inject CSS to handle the first page layout adjustments.
            firstPageStyle = `<style>\n.first-page .cover-section { height: 100%; }\n.first-page .cover-section::before { display: none; }\n.first-page .content-section { display: none; }\n.first-page .avatar-preview { width: 300px; height: 300px; position: absolute; left: 50%; transform: translateX(-50%); top: 250px; }\n.first-page .cover-title { position: absolute; top: 770px; left: 50%; transform: translate(-50%, -50%); width: 90%; }\n</style>`;
        } else {
            // For all subsequent lines, use the detailed splitting logic.
            titleStyleClass = '';
            pageStyleClass = '';
            firstPageStyle = '';

            // Normalize Chinese punctuation to English to simplify parsing
            let processedLine = trimmedLine.replace(/：/g, ':').replace(/，/g, ',');

            // Check for separators to split title and content, avoiding duplication.
            const numberedPrefixMatch = processedLine.match(/^([0-9]+\.\s*)/);
            const firstColonIndex = processedLine.indexOf(':');
            const firstCommaIndex = processedLine.indexOf(',');

            if (numberedPrefixMatch && firstColonIndex !== -1 && firstColonIndex > numberedPrefixMatch[0].length -1) {
                // Handle "1. Title: Content" format
                const prefix = numberedPrefixMatch[0];
                const titlePart = processedLine.substring(prefix.length, firstColonIndex).trim();
                coverTitle = prefix + titlePart;
                textContent = processedLine.substring(firstColonIndex + 1).trim();
            } else if (firstCommaIndex !== -1) {
                // Handle "Title,Content" format for paragraphs
                coverTitle = processedLine.substring(0, firstCommaIndex).trim();
                textContent = processedLine.substring(firstCommaIndex + 1).trim();
            } else if (firstColonIndex !== -1) {
                // Fallback to colon for non-numbered content that still has a colon
                coverTitle = processedLine.substring(0, firstColonIndex).trim();
                textContent = processedLine.substring(firstColonIndex + 1).trim();
            } else {
                // Fallback for lines with no separator: use full text as content, no title.
                coverTitle = '';
                textContent = processedLine.trim();
            }
        }

        // Process highlighting: replace **text** with <span class="highlight">text</span>
        textContent = textContent.replace(/\*\*(.+?)\*\*/g, '<span class="highlight">$1</span>');

        const generatedImageFile = path.join(outputDir, `output_${lineNumber}.png`);

        // Copy template to temp file for manipulation
        let htmlContent = fs.readFileSync(templateFile, 'utf8');

        // Replace placeholders
        htmlContent = htmlContent.replace(/{{FIRST_PAGE_STYLE}}/g, firstPageStyle);
        htmlContent = htmlContent.replace(/{{PAGE_STYLE_CLASS}}/g, pageStyleClass);
        htmlContent = htmlContent.replace(/{{TITLE_STYLE_CLASS}}/g, titleStyleClass);
        htmlContent = htmlContent.replace(/{{COVER_TITLE}}/g, coverTitle);
        htmlContent = htmlContent.replace(/{{TEXT_CONTENT}}/g, textContent);

        // Embed avatar image if provided
        if (dataUri) {
            const replacementCover = `<img id="coverAvatarPreview" src="${dataUri}" alt="Avatar">`;
            htmlContent = htmlContent.replace(/<img id="coverAvatarPreview" src="" alt="Avatar">/g, replacementCover);
            htmlContent = htmlContent.replace(/<span id="coverAvatarPlaceholder">点击上传头像<\/span>/g, ''); // Remove placeholder text
        }

        const tempHtmlFileDir = path.dirname(tempHtmlFile);
        if (!fs.existsSync(tempHtmlFileDir)) {
            fs.mkdirSync(tempHtmlFileDir, { recursive: true });
        }
        fs.writeFileSync(tempHtmlFile, htmlContent);

        console.log(`Generating image for line ${lineNumber}: ${textContent}`);

        // Take a screenshot of the generated HTML
        await page.goto(new URL(`file://${tempHtmlFile}`).href);
        await page.setViewportSize({ width: 750, height: 1334 }); // Set viewport size as per original script
        await page.screenshot({ path: generatedImageFile });

        console.log(`Generated image: ${generatedImageFile}`);
    }

    await browser.close();
    console.log("Batch image generation complete.");
}

generateImages().catch(error => {
    console.error("An error occurred:", error);
    process.exit(1);
});