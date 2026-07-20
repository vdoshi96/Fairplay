import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, win32 } from "node:path";
import { test } from "node:test";

import {
  absoluteOutputPathForSource,
  assertAvailableTargetPaths,
  assertUniqueTargets,
  isDocumentationSource,
  outputPathForSource,
  preserveTableCodeSpans,
  removeManagedOrphans,
  renderDocumentationHtml,
  rewriteDocumentationHref
} from "./docs-html.mjs";

test("recognizes supported project documentation without entering excluded paths", () => {
  assert.equal(isDocumentationSource("README.md"), true);
  assert.equal(isDocumentationSource("docs/guide.mdx"), true);
  assert.equal(isDocumentationSource("LICENSE"), true);
  assert.equal(isDocumentationSource("docs/notes.rst"), true);
  assert.equal(isDocumentationSource("References/private.md"), false);
  assert.equal(isDocumentationSource(".superpowers/mockup.md"), false);
  assert.equal(isDocumentationSource("src/component.tsx"), false);
});

test("maps every supported source to a same-directory HTML basename", () => {
  assert.equal(outputPathForSource("README.md"), "README.html");
  assert.equal(outputPathForSource("docs/guide.mdx"), "docs/guide.html");
  assert.equal(outputPathForSource("LICENSE"), "LICENSE.html");
  assert.equal(
    absoluteOutputPathForSource(
      "C:\\repo",
      "docs/nested/guide.html",
      win32.resolve
    ),
    "C:\\repo\\docs\\nested\\guide.html"
  );
});

test("rejects exact and case-insensitive output collisions", () => {
  assert.throws(
    () =>
      assertUniqueTargets([
        { sourcePath: "docs/guide.md", outputPath: "docs/guide.html" },
        { sourcePath: "docs/guide.txt", outputPath: "docs/guide.html" }
      ]),
    /target collision/
  );

  assert.throws(
    () =>
      assertUniqueTargets([
        { sourcePath: "docs/Guide.md", outputPath: "docs/Guide.html" },
        { sourcePath: "docs/guide.md", outputPath: "docs/guide.html" }
      ]),
    /target collision/
  );

  assert.throws(
    () =>
      assertAvailableTargetPaths(
        [{ sourcePath: "docs/guide.md", outputPath: "docs/guide.html" }],
        ["docs/GUIDE.HTML"]
      ),
    /target path conflict/
  );
});

test("rewrites only links to canonical local documentation sources", () => {
  const sources = new Set([
    "README.md",
    "docs/guide.md",
    "docs/nested/details.md"
  ]);

  assert.equal(
    rewriteDocumentationHref("../guide.md#setup", "docs/nested/details.md", sources),
    "../guide.html#setup"
  );
  assert.equal(
    rewriteDocumentationHref("/docs/guide.md?plain=1", "README.md", sources),
    "/docs/guide.html?plain=1"
  );
  assert.equal(
    rewriteDocumentationHref("https://example.com/guide.md", "README.md", sources),
    "https://example.com/guide.md"
  );
  assert.equal(
    rewriteDocumentationHref("missing.md", "README.md", sources),
    "missing.md"
  );
});

test("renders deterministic, accessible GFM with source-content parity metadata", () => {
  const source = `# Heading

# Heading

### Skipped source level

- Item
- [x] Complete
- [ ] Pending

| Name | Value |
| --- | ---: |
| Alpha | 1 |

\`\`\`js
const value = "<safe>";
\`\`\`

[Guide](guide.md)

[Jump to the first heading](#heading)

![Descriptive alt](image.png)
`;
  const sourceBuffer = Buffer.from(source);
  const sourcePaths = new Set(["docs/example.md", "docs/guide.md"]);
  const first = renderDocumentationHtml({
    sourceBuffer,
    sourcePath: "docs/example.md",
    sourcePaths
  });
  const second = renderDocumentationHtml({
    sourceBuffer,
    sourcePath: "docs/example.md",
    sourcePaths
  });

  assert.equal(first, second);
  assert.match(first, /<html lang="en">/);
  assert.match(first, /href="#content">Skip to content<\/a>/);
  assert.match(first, /<h1 id="heading">Heading<\/h1>/);
  assert.match(first, /<h1 id="heading-1">Heading<\/h1>/);
  assert.match(
    first,
    /<h2 data-source-heading-level="3" id="skipped-source-level">Skipped source level<\/h2>/
  );
  assert.match(
    first,
    /<input[^>]*checked[^>]*type="checkbox"[^>]*aria-label="Completed task"/
  );
  assert.match(
    first,
    /<input[^>]*type="checkbox"[^>]*aria-label="Incomplete task"/
  );
  assert.match(first, /role="region" aria-label="Documentation table"/);
  assert.match(first, /<thead>/);
  assert.doesNotMatch(first, /scope="col"ead/);
  assert.match(first, /<th scope="col">Name<\/th>/);
  assert.match(first, /<th scope="col" align="right">Value<\/th>/);
  assert.match(first, /<pre tabindex="0"><code class="language-js">/);
  assert.match(first, /href="guide.html"/);
  assert.match(first, /href="#heading"/);
  assert.match(first, /<img src="image.png" alt="Descriptive alt">/);
  assert.match(first, /fairplay-document-source-sha256/);
  assert.doesNotMatch(first, /<safe>/);
});

test("preserves inline-code pipes inside GFM table cells", () => {
  const source = `| Command | Result | Evidence |
| --- | --- | --- |
| \`rg -n "localStorage|sessionStorage|indexedDB|document\\.cookie" src\` | Pass | No matches. |
`;
  const preprocessed = preserveTableCodeSpans(source);
  assert.match(
    preprocessed,
    /localStorage\\\|sessionStorage\\\|indexedDB\\\|document/
  );

  const html = renderDocumentationHtml({
    sourceBuffer: Buffer.from(source),
    sourcePath: "docs/work-log.md",
    sourcePaths: new Set(["docs/work-log.md"])
  });
  assert.match(
    html,
    /<code>rg -n &quot;localStorage\|sessionStorage\|indexedDB\|document\\\.cookie&quot; src<\/code>/
  );
  assert.match(html, /<td>Pass<\/td>/);
  assert.match(html, /<td>No matches\.<\/td>/);
});

test("escapes raw HTML and blocks active URL schemes without losing their text", () => {
  const source = `<meta http-equiv="refresh" content="0;url=https://example.com">

<style>body { display: none; }</style>

[Unsafe](javascript:alert(1))
`;
  const html = renderDocumentationHtml({
    sourceBuffer: Buffer.from(source),
    sourcePath: "docs/unsafe.md",
    sourcePaths: new Set(["docs/unsafe.md"])
  });

  assert.doesNotMatch(html, /<meta http-equiv="refresh"/);
  assert.doesNotMatch(html, /<style>body/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /&lt;meta http-equiv=&quot;refresh&quot;/);
  assert.match(html, /&lt;style&gt;body \{ display: none; \}&lt;\/style&gt;/);
  assert.match(html, /class="blocked-link"/);
  assert.match(html, /javascript:alert\(1\)/);
});

test("normalizes source line endings for deterministic hashes and output", () => {
  const sourcePaths = new Set(["docs/line-endings.md"]);
  const lf = renderDocumentationHtml({
    sourceBuffer: Buffer.from("# Heading\n\nBody\n"),
    sourcePath: "docs/line-endings.md",
    sourcePaths
  });
  const crlf = renderDocumentationHtml({
    sourceBuffer: Buffer.from("# Heading\r\n\r\nBody\r\n"),
    sourcePath: "docs/line-endings.md",
    sourcePaths
  });
  assert.equal(crlf, lf);
});

test("plain-text documentation remains complete and escaped", () => {
  const html = renderDocumentationHtml({
    sourceBuffer: Buffer.from("Title\n=====\n\n<literal> & complete\n"),
    sourcePath: "docs/notes.rst",
    sourcePaths: new Set(["docs/notes.rst"])
  });

  assert.match(html, /Title\n=====\n\n&lt;literal&gt; &amp; complete/);
  assert.doesNotMatch(html, /<literal>/);
});

test("removes only marker-owned orphan counterparts within the repository", () => {
  const root = mkdtempSync(join(tmpdir(), "fairplay-docs-html-"));

  try {
    const managedPath = join(root, "managed.html");
    writeFileSync(
      managedPath,
      '<!doctype html><meta name="fairplay-document-source" content="removed.md">',
      "utf8"
    );

    assert.equal(removeManagedOrphans(root, ["managed.html"]), 1);
    assert.equal(existsSync(managedPath), false);

    const unmanagedPath = join(root, "unmanaged.html");
    writeFileSync(unmanagedPath, "<!doctype html><p>Keep me</p>", "utf8");
    assert.throws(
      () => removeManagedOrphans(root, ["unmanaged.html"]),
      /Refusing to remove non-generated HTML/
    );
    assert.equal(existsSync(unmanagedPath), true);
    assert.throws(
      () => removeManagedOrphans(root, ["../outside.html"]),
      /outside the repository/
    );

    const symlinkTarget = join(root, "symlink-target.html");
    const symlinkPath = join(root, "symlink.html");
    writeFileSync(
      symlinkTarget,
      '<meta name="fairplay-document-source" content="removed.md">',
      "utf8"
    );
    try {
      symlinkSync(symlinkTarget, symlinkPath, "file");
      assert.throws(
        () => removeManagedOrphans(root, ["symlink.html"]),
        /Refusing to remove non-generated HTML/
      );
      assert.equal(existsSync(symlinkPath), true);
      assert.equal(existsSync(symlinkTarget), true);
    } catch (error) {
      if (!(error instanceof Error) || !/EPERM|operation not permitted/i.test(error.message)) {
        throw error;
      }
    }
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
