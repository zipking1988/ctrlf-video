import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await build({
  entryPoints: ["frontend/workbench.jsx"],
  bundle: true,
  minify: true,
  legalComments: "external",
  outfile: "src/ctrlf_video/static/workbench.js",
  define: { "process.env.NODE_ENV": '"production"' },
  target: ["es2022"],
});
const base = "src/ctrlf_video/static/";
let html = await readFile(base + "index.html", "utf8");
for (const file of [
  "app.js",
  "workspace.js",
  "demo-conversation.js",
  "investigation-canvas.js",
  "workbench-model.js",
  "investigation-report.js",
  "workbench.js",
  "styles.css",
  "workbench.css",
  "fieldnotes.css",
]) {
  const hash = createHash("sha256")
    .update(await readFile(base + file))
    .digest("hex")
    .slice(0, 12);
  html = html.replace(
    new RegExp(
      "/static/" + file.replaceAll(".", "\\.") + "(?:\\?v=[a-f0-9]+)?",
      "g",
    ),
    `/static/${file}?v=${hash}`,
  );
}
await writeFile(base + "index.html", html);
let judgeHtml = await readFile(base + "judge/index.html", "utf8");
for (const file of ["investigation-report.js", "judge/model.js", "judge/app.js", "judge/styles.css"]) {
  const hash = createHash("sha256").update(await readFile(base + file)).digest("hex").slice(0, 12);
  judgeHtml = judgeHtml.replace(
    new RegExp("/static/" + file.replaceAll(".", "\\.") + "(?:\\?v=[a-f0-9]+)?", "g"),
    `/static/${file}?v=${hash}`,
  );
}
await writeFile(base + "judge/index.html", judgeHtml);
