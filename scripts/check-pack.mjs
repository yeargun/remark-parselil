import { execFileSync } from "node:child_process"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const json = execFileSync("npm", ["pack", "--dry-run", "--json"], { encoding: "utf8" })
const result = JSON.parse(json)[0]
const file = "remark-parse"
const required = new Set([
  `dist/${file}.esm.js`,
  `dist/${file}.cjs`,
  `dist/${file}.umd.js`,
  `dist/${file}.closed.js`,
  `dist/${file}.d.ts`,
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "UPSTREAM.md",
])
const files = new Set(result.files.map(({ path }) => path))
for (const path of required) {
  if (!files.has(path)) throw new Error(`npm tarball is missing ${path}`)
}
const manifest = JSON.parse(readFileSync("package.json", "utf8"))
if (manifest.name !== "@itslil/remark-parse") throw new Error("unexpected package name")
assert.deepEqual(Object.keys(await import("@itslil/remark-parse")), ["default"])
assert.deepEqual(Object.keys(manifest.dependencies).sort(), [
  "@itslil/mdast-util-from-markdown",
  "@types/mdast",
  "micromark-util-types",
  "unified",
])
console.log(`npm pack: ${result.entryCount} files, ${result.size} bytes packed, ${result.unpackedSize} bytes unpacked`)
