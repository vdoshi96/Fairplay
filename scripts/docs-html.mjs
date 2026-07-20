import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import {
  basename,
  extname,
  isAbsolute,
  posix,
  relative,
  resolve,
  sep
} from "node:path";
import { pathToFileURL } from "node:url";

import { marked, Renderer } from "marked";

const DOCUMENTATION_EXTENSIONS = new Set([
  ".adoc",
  ".asciidoc",
  ".markdown",
  ".md",
  ".mdown",
  ".mdx",
  ".mkd",
  ".rst",
  ".txt"
]);

const EXTENSIONLESS_DOCUMENTATION = /^(?:authors|changelog|code_of_conduct|contributors|copying|license|notice|readme|security)(?:[-_.].*)?$/i;

// These paths are never documentation inputs, even if a future ignore rule changes.
const EXCLUDED_PATHS = [
  ".cache",
  ".next",
  ".superpowers",
  ".vercel",
  ".worktrees",
  "References",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results"
];

const MANAGED_MARKER = '<meta name="fairplay-document-source"';

const DOCUMENT_STYLE = `
    :root {
      color-scheme: light dark;
      --background: #fffaf2;
      --surface: #ffffff;
      --text: #302b27;
      --muted: #6f6258;
      --border: #d8cabd;
      --accent: #8f3f2f;
      --code: #f2ebe3;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #211d1a;
        --surface: #2b2521;
        --text: #f7eee5;
        --muted: #cbbcaf;
        --border: #5a4d44;
        --accent: #ffad96;
        --code: #3b332d;
      }
    }
    * { box-sizing: border-box; }
    html { background: var(--background); color: var(--text); }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 1rem;
      line-height: 1.65;
    }
    main {
      width: min(100% - 2rem, 72rem);
      margin: 2rem auto;
      padding: clamp(1rem, 3vw, 3rem);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 0.75rem 2rem rgb(48 43 39 / 8%);
    }
    .skip-link {
      position: absolute;
      left: 1rem;
      top: -5rem;
      z-index: 1;
      padding: 0.75rem 1rem;
      background: var(--surface);
      color: var(--text);
      border: 2px solid var(--accent);
      border-radius: 8px;
    }
    .skip-link:focus { top: 1rem; }
    .source-note {
      margin: 0 0 2rem;
      padding-bottom: 1rem;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; text-wrap: balance; }
    h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
    h2 { margin-top: 2.5rem; }
    a { color: var(--accent); text-underline-offset: 0.18em; }
    a:hover { text-decoration-thickness: 0.16em; }
    :focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
    img { display: block; max-width: 100%; height: auto; }
    blockquote {
      margin-inline: 0;
      padding: 0.25rem 1rem;
      color: var(--muted);
      border-inline-start: 0.3rem solid var(--border);
    }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    code { padding: 0.12rem 0.3rem; background: var(--code); border-radius: 4px; }
    pre {
      overflow-x: auto;
      padding: 1rem;
      background: var(--code);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    pre code { padding: 0; background: transparent; }
    .table-scroll { overflow-x: auto; margin-block: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.6rem 0.75rem; border: 1px solid var(--border); text-align: start; }
    th { background: var(--code); }
    li + li { margin-top: 0.25rem; }
    hr { border: 0; border-top: 1px solid var(--border); }
    article { overflow-wrap: anywhere; }
    @media print {
      :root { color-scheme: light; }
      body, main { background: white; color: black; }
      main { width: 100%; margin: 0; padding: 0; border: 0; box-shadow: none; }
      .skip-link, .source-note { display: none; }
      a { color: inherit; }
    }
`.trim().replace(/\s+/g, " ");

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isExcludedPath(filePath) {
  return EXCLUDED_PATHS.some(
    (excludedPath) =>
      filePath === excludedPath || filePath.startsWith(`${excludedPath}/`)
  );
}

export function isDocumentationSource(filePath) {
  if (isExcludedPath(filePath)) return false;

  const extension = extname(filePath).toLowerCase();
  if (DOCUMENTATION_EXTENSIONS.has(extension)) return true;

  return extension === "" && EXTENSIONLESS_DOCUMENTATION.test(basename(filePath));
}

export function outputPathForSource(sourcePath) {
  const extension = extname(sourcePath);
  return extension
    ? `${sourcePath.slice(0, -extension.length)}.html`
    : `${sourcePath}.html`;
}

export function absoluteOutputPathForSource(
  root,
  outputPath,
  resolvePath = resolve
) {
  return resolvePath(root, ...outputPath.split("/"));
}

export function assertUniqueTargets(records) {
  const targetOwners = new Map();

  for (const record of records) {
    const collisionKey = record.outputPath.toLowerCase();
    const existingOwner = targetOwners.get(collisionKey);
    if (existingOwner) {
      throw new Error(
        `Documentation target collision: ${existingOwner.sourcePath} and ${record.sourcePath} both map to ${record.outputPath}`
      );
    }
    targetOwners.set(collisionKey, record);
  }
}

export function assertAvailableTargetPaths(records, visibleFiles) {
  const visibleByCaseFoldedPath = new Map();
  for (const filePath of visibleFiles) {
    const collisionKey = filePath.toLowerCase();
    const paths = visibleByCaseFoldedPath.get(collisionKey) ?? [];
    paths.push(filePath);
    visibleByCaseFoldedPath.set(collisionKey, paths);
  }

  const conflicts = [];
  for (const record of records) {
    const collisionKey = record.outputPath.toLowerCase();
    for (const occupiedPath of visibleByCaseFoldedPath.get(collisionKey) ?? []) {
      if (occupiedPath !== record.outputPath) {
        conflicts.push(
          `${record.sourcePath} maps to ${record.outputPath}, which conflicts with ${occupiedPath}`
        );
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`Documentation target path conflict:\n${conflicts.join("\n")}`);
  }
}

export function rewriteDocumentationHref(href, sourcePath, sourcePaths) {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(href)
  ) {
    return href;
  }

  const suffixIndex = href.search(/[?#]/);
  const encodedPath = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);
  if (!encodedPath) return href;

  let decodedPath;
  try {
    decodedPath = decodeURI(encodedPath);
  } catch {
    return href;
  }

  const rootRelative = decodedPath.startsWith("/");
  const sourceDirectory = posix.dirname(sourcePath);
  const candidateSource = rootRelative
    ? posix.normalize(decodedPath.slice(1))
    : posix.normalize(posix.join(sourceDirectory, decodedPath));

  if (!sourcePaths.has(candidateSource)) return href;

  const candidateOutput = outputPathForSource(candidateSource);
  let rewrittenPath = rootRelative
    ? `/${candidateOutput}`
    : posix.relative(sourceDirectory, candidateOutput);

  if (!rootRelative && decodedPath.startsWith("./") && !rewrittenPath.startsWith(".")) {
    rewrittenPath = `./${rewrittenPath}`;
  }

  const encodedOutput = encodeURI(rewrittenPath)
    .replaceAll("#", "%23")
    .replaceAll("?", "%3F");
  return `${encodedOutput}${suffix}`;
}

function enhanceRenderedMarkdown(html) {
  return html
    .replaceAll(
      "<table>",
      '<div class="table-scroll" role="region" aria-label="Documentation table" tabindex="0"><table>'
    )
    .replaceAll("</table>", "</table></div>")
    .replace(
      /<th(?=[\s>])(?![^>]*\bscope=)([^>]*)>/g,
      '<th scope="col"$1>'
    )
    .replace(
      /<pre(?=[\s>])(?![^>]*\btabindex=)([^>]*)>/g,
      '<pre tabindex="0"$1>'
    );
}

function tableCells(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/);
}

function isTableDelimiter(line) {
  const cells = tableCells(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell))
  );
}

function escapeCodeSpanPipes(line) {
  return line.replace(/(`+)([^`\n]*?)\1/g, (match, ticks, contents) => {
    const escapedContents = contents.replace(/(?<!\\)\|/g, "\\|");
    return `${ticks}${escapedContents}${ticks}`;
  });
}

export function preserveTableCodeSpans(markdown) {
  const lines = markdown.split("\n");

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].includes("|") || !isTableDelimiter(lines[index + 1])) {
      continue;
    }

    lines[index] = escapeCodeSpanPipes(lines[index]);
    let rowIndex = index + 2;
    while (
      rowIndex < lines.length &&
      lines[rowIndex].trim() !== "" &&
      lines[rowIndex].includes("|")
    ) {
      lines[rowIndex] = escapeCodeSpanPipes(lines[rowIndex]);
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }

  return lines.join("\n");
}

function headingSlug(headingText, occurrences) {
  const baseSlug =
    headingText
      .normalize("NFKD")
      .toLowerCase()
      .replace(/\p{Mark}/gu, "")
      .replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
  const occurrence = occurrences.get(baseSlug) ?? 0;
  occurrences.set(baseSlug, occurrence + 1);
  return occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence}`;
}

function isUnsafeUrl(url) {
  const compactUrl = url
    .trim()
    .replace(/[\u0000-\u0020\u007f]+/g, "")
    .toLowerCase();
  return /^(?:data|javascript|vbscript):/.test(compactUrl);
}

function renderSourceBody(sourceText, sourcePath, sourcePaths) {
  const extension = extname(sourcePath).toLowerCase();
  const isMarkdown = [".markdown", ".md", ".mdown", ".mdx", ".mkd"].includes(
    extension
  );

  if (!isMarkdown) {
    return `<pre tabindex="0"><code>${escapeHtml(sourceText)}</code></pre>\n`;
  }

  const headingOccurrences = new Map();
  const headingLevels = new Set();
  const renderer = new Renderer();
  const defaultImageRenderer = renderer.image;
  const defaultLinkRenderer = renderer.link;
  renderer.heading = function renderHeading({ depth, tokens }) {
    const headingText = this.parser.parseInline(tokens, this.parser.textRenderer);
    const slug = headingSlug(headingText, headingOccurrences);
    const accessibleDepth = [...headingLevels]
      .sort((left, right) => left - right)
      .indexOf(depth) + 1;
    const sourceDepthAttribute =
      accessibleDepth === depth ? "" : ` data-source-heading-level="${depth}"`;
    return `<h${accessibleDepth}${sourceDepthAttribute} id="${escapeHtml(slug)}">${this.parser.parseInline(tokens)}</h${accessibleDepth}>\n`;
  };
  renderer.checkbox = function renderCheckbox({ checked }) {
    const state = checked ? "Completed task" : "Incomplete task";
    const checkedAttribute = checked ? ' checked=""' : "";
    return `<input${checkedAttribute} disabled="" type="checkbox" aria-label="${state}">`;
  };
  renderer.html = function renderLiteralHtml({ block, text }) {
    const escaped = escapeHtml(text);
    return block
      ? `<pre class="source-html" tabindex="0"><code>${escaped}</code></pre>\n`
      : `<code class="source-html-inline">${escaped}</code>`;
  };
  renderer.link = function renderSafeLink(token) {
    if (!isUnsafeUrl(token.href)) {
      return defaultLinkRenderer.call(this, token);
    }
    const label = this.parser.parseInline(token.tokens);
    return `<span class="blocked-link">${label} <code>${escapeHtml(token.href)}</code></span>`;
  };
  renderer.image = function renderSafeImage(token) {
    if (!isUnsafeUrl(token.href)) {
      return defaultImageRenderer.call(this, token);
    }
    return `<span class="blocked-image">${escapeHtml(token.text)} <code>${escapeHtml(token.href)}</code></span>`;
  };

  const rendered = marked.parse(preserveTableCodeSpans(sourceText), {
    async: false,
    breaks: false,
    gfm: true,
    pedantic: false,
    renderer,
    walkTokens(token) {
      if (token.type === "heading") headingLevels.add(token.depth);
      if (token.type === "link") {
        token.href = rewriteDocumentationHref(
          token.href,
          sourcePath,
          sourcePaths
        );
      }
    }
  });

  return enhanceRenderedMarkdown(rendered);
}

export function renderDocumentationHtml({
  sourceBuffer,
  sourcePath,
  sourcePaths
}) {
  const sourceText = sourceBuffer.toString("utf8").replace(/\r\n?/g, "\n");
  const canonicalSourceBuffer = Buffer.from(sourceText, "utf8");
  const sourceHash = createHash("sha256")
    .update(canonicalSourceBuffer)
    .digest("hex");
  const escapedSourcePath = escapeHtml(sourcePath);
  const sourceHref = encodeURI(basename(sourcePath))
    .replaceAll("#", "%23")
    .replaceAll("?", "%3F");
  const body = renderSourceBody(sourceText, sourcePath, sourcePaths);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <meta name="fairplay-document-source" content="${escapedSourcePath}">
  <meta name="fairplay-document-source-sha256" content="${sourceHash}">
  <title>${escapedSourcePath} | Fairplay Documentation</title>
  <style>${DOCUMENT_STYLE}</style>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <main id="content" tabindex="-1">
    <p class="source-note">Canonical source: <a href="${sourceHref}"><code>${escapedSourcePath}</code></a></p>
    <article>
${body}    </article>
  </main>
</body>
</html>
`;
}

function repositoryRoot(cwd = process.cwd()) {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8"
  }).trim();
}

function gitVisibleFiles(root) {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" }
  );

  return [...new Set(output.split("\0").filter(Boolean))].sort(comparePaths);
}

function collectDocumentation(root, files) {
  const records = [];

  for (const sourcePath of files) {
    if (!isDocumentationSource(sourcePath)) continue;

    const absoluteSourcePath = resolve(root, sourcePath);
    if (!existsSync(absoluteSourcePath)) continue;

    const sourceStat = lstatSync(absoluteSourcePath);
    if (!sourceStat.isFile()) {
      throw new Error(
        `Documentation sources must be regular files: ${sourcePath}`
      );
    }

    records.push({
      absoluteSourcePath,
      outputPath: outputPathForSource(sourcePath),
      sourcePath
    });
  }

  assertUniqueTargets(records);
  return records;
}

function isManagedHtml(absolutePath) {
  return (
    existsSync(absolutePath) &&
    lstatSync(absolutePath).isFile() &&
    readFileSync(absolutePath, "utf8").includes(MANAGED_MARKER)
  );
}

export function removeManagedOrphans(root, orphanPaths) {
  for (const orphanPath of orphanPaths) {
    const absolutePath = resolve(root, orphanPath);
    const pathFromRoot = relative(root, absolutePath);
    if (
      pathFromRoot === "" ||
      pathFromRoot === ".." ||
      pathFromRoot.startsWith(`..${sep}`) ||
      isAbsolute(pathFromRoot)
    ) {
      throw new Error(`Refusing to remove an output outside the repository: ${orphanPath}`);
    }
    if (!isManagedHtml(absolutePath)) {
      throw new Error(`Refusing to remove non-generated HTML: ${orphanPath}`);
    }
    unlinkSync(absolutePath);
  }

  return orphanPaths.length;
}

function findManagedOrphans(root, files, expectedOutputs) {
  const orphans = [];

  for (const filePath of files) {
    if (isExcludedPath(filePath) || extname(filePath).toLowerCase() !== ".html") {
      continue;
    }
    if (expectedOutputs.has(filePath)) continue;

    const absolutePath = resolve(root, filePath);
    if (isManagedHtml(absolutePath)) orphans.push(filePath);
  }

  return orphans.sort(comparePaths);
}

function expectedDocuments(root, records) {
  const sourcePaths = new Set(records.map((record) => record.sourcePath));

  return records.map((record) => ({
    ...record,
    absoluteOutputPath: absoluteOutputPathForSource(root, record.outputPath),
    expectedHtml: renderDocumentationHtml({
      sourceBuffer: readFileSync(record.absoluteSourcePath),
      sourcePath: record.sourcePath,
      sourcePaths
    })
  }));
}

function preflightOutputOwnership(documents) {
  const conflicts = [];
  for (const document of documents) {
    if (!existsSync(document.absoluteOutputPath)) continue;
    if (!lstatSync(document.absoluteOutputPath).isFile()) {
      conflicts.push(`${document.outputPath} is not a regular file`);
    } else if (!isManagedHtml(document.absoluteOutputPath)) {
      conflicts.push(`${document.outputPath} is not generator-owned`);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Refusing to overwrite non-generated HTML:\n${conflicts
        .map((filePath) => `- ${filePath}`)
        .join("\n")}`
    );
  }
}

function generate(root, records, files) {
  const documents = expectedDocuments(root, records);
  const expectedOutputs = new Set(records.map((record) => record.outputPath));
  const orphans = findManagedOrphans(root, files, expectedOutputs);
  preflightOutputOwnership(documents);
  const removed = removeManagedOrphans(root, orphans);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const document of documents) {
    if (!existsSync(document.absoluteOutputPath)) {
      writeFileSync(document.absoluteOutputPath, document.expectedHtml, "utf8");
      created += 1;
      continue;
    }

    const currentHtml = readFileSync(document.absoluteOutputPath, "utf8");
    if (currentHtml === document.expectedHtml) {
      unchanged += 1;
      continue;
    }

    writeFileSync(document.absoluteOutputPath, document.expectedHtml, "utf8");
    updated += 1;
  }

  console.log(
    `Generated HTML documentation for ${records.length} sources (${created} created, ${updated} updated, ${unchanged} unchanged, ${removed} orphaned outputs removed).`
  );
}

function check(root, records, files) {
  const documents = expectedDocuments(root, records);
  const expectedOutputs = new Set(records.map((record) => record.outputPath));
  const issues = [];

  for (const document of documents) {
    if (!existsSync(document.absoluteOutputPath)) {
      issues.push(`missing: ${document.outputPath}`);
      continue;
    }

    const outputStat = lstatSync(document.absoluteOutputPath);
    if (!outputStat.isFile()) {
      issues.push(`not a regular file: ${document.outputPath}`);
      continue;
    }

    const currentHtml = readFileSync(document.absoluteOutputPath, "utf8");
    if (!currentHtml.includes(MANAGED_MARKER)) {
      issues.push(`not generator-owned: ${document.outputPath}`);
    } else if (currentHtml !== document.expectedHtml) {
      issues.push(`stale or content-mismatched: ${document.outputPath}`);
    }
  }

  for (const orphan of findManagedOrphans(root, files, expectedOutputs)) {
    issues.push(`orphaned generated output: ${orphan}`);
  }

  if (issues.length > 0) {
    console.error(`HTML documentation parity failed (${issues.length} issues):`);
    for (const issue of issues) console.error(`- ${issue}`);
    console.error("Run `npm run docs:html` to regenerate counterparts.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `HTML documentation parity verified for ${records.length} sources and ${documents.length} counterparts.`
  );
}

function main() {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((argument) => argument !== "--check");
  if (unknownArgs.length > 0) {
    throw new Error(`Unknown argument(s): ${unknownArgs.join(", ")}`);
  }

  const root = repositoryRoot();
  const files = gitVisibleFiles(root);
  const records = collectDocumentation(root, files);
  assertAvailableTargetPaths(records, files);

  if (args.includes("--check")) {
    check(root, records, files);
  } else {
    generate(root, records, files);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
