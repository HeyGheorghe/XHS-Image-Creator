const fs = require('fs');
const path = require('path');
const playwright = require('playwright');
const jieba = require('@node-rs/jieba');

async function generateImages() {
    // 1. Argument Parsing
    const args = process.argv.slice(2).filter(arg => arg !== '--');
    let avatarImagePathRaw = '';
    let inputFilePathRaw = '';

    if (args.length === 2) {
        avatarImagePathRaw = args[0];
        inputFilePathRaw = args[1];
    } else if (args.length === 1) {
        inputFilePathRaw = args[0];
    } else {
        console.error("Usage: node src/generate_image_v2.js [AVATAR_IMAGE_PATH] <input_text_file>");
        process.exit(1);
    }

    // 2. Resolve Paths and Check Existence
    const projectRoot = process.cwd();
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

    const templatePath = path.resolve(projectRoot, 'src/template_v2.html');
    const outputDir = path.resolve(projectRoot, 'dist');
    const tempDir = path.resolve(projectRoot, '.gemini/tmp');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 3. Prepare Avatar Data URI
    let avatarDataUri = '';
    if (avatarImagePath) {
        const imageBuffer = fs.readFileSync(avatarImagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = `image/${path.extname(avatarImagePath).slice(1)}`;
        avatarDataUri = `data:${mimeType};base64,${base64Image}`;
    }

    // 4. Read and Prepare Content
    const inputFileContent = fs.readFileSync(inputFilePath, 'utf8');
    const lines = inputFileContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.log('Input file is empty.');
        return;
    }

    const coverTitle = lines[0];
    const content = lines.slice(1).join('\n');

    const stopWords = new Set([
        '的', '是', '在', '我', '你', '他', '她', '它', '我们', '你们', '他们', '她们', '它们',
        '这', '那', '一个', '一些', '什么', '哪个', '谁', '哪里', '时候', '怎么', '为什么',
        '了', '着', '过', '也', '都', '就', '和', '与', '或', '但', '因', '所以', '如果', '虽然'
    ]);

    const paragraphs = lines.slice(1).map(line => {
        let titlePart = '';
        let contentPart = line;

        const match = line.match(/^(\d+\.\s*.*?)(：|:)/);
        if (match) {
            titlePart = `<strong>${match[1]}</strong>${match[2]}`;
            contentPart = line.substring(match[0].length);
        }

        let processedContent = contentPart.replace(/\*\*(.+?)\*\*/g, '<span class="highlight">$1</span>');

        // Use POS tagging and keyword triggers to find key phrases
        const taggedWords = jieba.tag(contentPart);
        const keyPhrases = [];

        // Keyword-triggered phrases
        const excludingTriggers = ['可以', '需要'];
        const includingTriggers = ['帮助', '确保', '进行', '分析', '识别', '编写'];

        for (const trigger of excludingTriggers) {
            const regex = new RegExp(`${trigger}([^，。；？！]+)`, 'g');
            const matches = contentPart.matchAll(regex);
            for (const match of matches) {
                if (match[1]) keyPhrases.push(match[1]);
            }
        }

        for (const trigger of includingTriggers) {
            const regex = new RegExp(`${trigger}([^，。；？！]+)`, 'g');
            const matches = contentPart.matchAll(regex);
            for (const match of matches) {
                if (match[1]) keyPhrases.push(trigger + match[1]);
            }
        }

        // Simple verb-object phrases
        for (let i = 0; i < taggedWords.length - 1; i++) {
            if (taggedWords[i].tag === 'v' && taggedWords[i+1].tag === 'n') {
                keyPhrases.push(taggedWords[i].word + taggedWords[i+1].word);
            }
        }

        // Add user-specific phrases
        const userPhrases = ['不是一成不变的', '更新和改进'];
        for (const phrase of userPhrases) {
            if (contentPart.includes(phrase)) {
                keyPhrases.push(phrase);
            }
        }

        // Get unique, longer phrases, up to 3
        const uniquePhrases = [...new Set(keyPhrases)];
        const sortedPhrases = uniquePhrases.sort((a, b) => b.length - a.length);
        const topPhrases = sortedPhrases.slice(0, 3);

        for (const phrase of topPhrases) {
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedPhrase, 'g');
            processedContent = processedContent.replace(regex, `<span class="highlight">${phrase}</span>`);
        }

        return `<p>${titlePart}${processedContent}</p>`;
    });

    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 825, height: 1467 });

    let templateContent = fs.readFileSync(templatePath, 'utf8').replace('{{FIRST_PAGE_STYLE}}', '');

    // --- Create pages ---
    const pagesHtml = [];
    let currentPageContent = '';
    let pageIndex = 1;

    function getRandomHslColor(sMin, sMax, lMin, lMax) {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * (sMax - sMin + 1)) + sMin;
        const l = Math.floor(Math.random() * (lMax - lMin + 1)) + lMin;
        return `hsl(${h}, ${s}%, ${l}%)`;
    }
    const color1 = getRandomHslColor(50, 90, 50, 80);
    const color2 = getRandomHslColor(50, 90, 50, 80);
    const randomGradient = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;

    // First page
    let avatarHtml = '';
    if (avatarDataUri) {
        avatarHtml = `
            <div class="avatar-preview">
                <img src="${avatarDataUri}" alt="Avatar">
            </div>`;
    }

    const headerHtml = `
        <div class="cover-section" style="background: ${randomGradient};">
            ${avatarHtml}
            <div class="cover-title">${coverTitle}</div>
        </div>`;

    let remainingParagraphs = [...paragraphs];
    let firstPageContent = '';

    await page.setContent(`<html><head>${templateContent}</head><body><div class="page"><div class="content"></div></div></body></html>`);
    const contentElement = await page.$('.content');
    const pageHeight = await page.$eval('.page', el => el.clientHeight) - 400; // 400 for header

    for (const p of paragraphs) {
        const currentHtml = firstPageContent + p;
        await contentElement.evaluate((el, html) => el.innerHTML = html, currentHtml);
        const contentHeight = await contentElement.evaluate(el => el.offsetHeight);

        if (contentHeight < pageHeight * 0.8) {
            firstPageContent += p;
            remainingParagraphs.shift();
        } else {
            break;
        }
    }

    pagesHtml.push(`
        <div class="page first-page">
            ${headerHtml}
            <div class="content">${firstPageContent}</div>
        </div>
    `);

    // Subsequent pages
    currentPageContent = '';
    for (const p of remainingParagraphs) {
        const currentHtml = currentPageContent + p;
        await contentElement.evaluate((el, html) => el.innerHTML = html, currentHtml);
        const contentHeight = await contentElement.evaluate(el => el.offsetHeight);

        if (contentHeight < (1467 - 100) * 0.8) { // 1467 page height, 100 padding
            currentPageContent += p;
        } else {
            pagesHtml.push(`<div class="page"><div class="content">${currentPageContent}</div></div>`);
            currentPageContent = p;
        }
    }
    if (currentPageContent) {
        pagesHtml.push(`<div class="page"><div class="content">${currentPageContent}</div></div>`);
    }

    // --- Generate images ---
    for (let i = 0; i < pagesHtml.length; i++) {
        const pageHtml = `<html><head>${templateContent}</head><body>${pagesHtml[i]}</body></html>`;
        const tempPagePath = path.join(tempDir, `temp_page_${i}.html`);
        fs.writeFileSync(tempPagePath, pageHtml);

        await page.goto(`file://${tempPagePath}`);
        const screenshotPath = path.join(outputDir, `output_${i + 1}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`Generated image: ${screenshotPath}`);
    }

    await browser.close();
    console.log('Image generation complete.');
}

generateImages().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});
