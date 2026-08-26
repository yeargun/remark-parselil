import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import remarkParse, { remarkParse as named } from "../dist/remark-parse.esm.js"
import { unified } from "unified"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

describe("remark-parse", () => {
  it("exports the plugin as default and named", () => {
    assert.equal(typeof remarkParse, "function")
    assert.equal(named, remarkParse)
  })

  it("installs a parser that turns a heading into mdast", () => {
    const tree = unified().use(named).parse("# hi")
    assert.equal(tree.type, "root")
    assert.equal(tree.children[0].type, "heading")
    assert.equal(tree.children[0].depth, 1)
    assert.equal(tree.children[0].children[0].value, "hi")
  })

  it("parses paragraphs, emphasis, strong, code, and lists", () => {
    const tree = unified().use(named).parse("Hello **bold** and *em* and `code`.\n\n- one\n- two\n")
    const types = tree.children.map((node) => node.type)
    assert.ok(types.includes("paragraph"))
    assert.ok(types.includes("list"))
    const para = tree.children.find((node) => node.type === "paragraph")
    const kinds = para.children.map((node) => node.type)
    assert.ok(kinds.includes("strong"))
    assert.ok(kinds.includes("emphasis"))
    assert.ok(kinds.includes("inlineCode"))
  })

  it("reads data keys at parse time", () => {
    const proc = unified().use(named)
    proc.data("settings", {})
    const tree = proc.parse("Alfred")
    assert.equal(tree.type, "root")
    assert.equal(tree.children[0].type, "paragraph")
  })

  it("keeps host-visible plugin keys in the library artifact", () => {
    const src = readFileSync(resolve(root, "dist/remark-parse.esm.js"), "utf8")
    assert.match(src, /parser/)
    assert.match(src, /settings/)
    assert.match(src, /micromarkExtensions/)
    assert.match(src, /fromMarkdownExtensions/)
    assert.match(src, /extensions/)
    assert.match(src, /mdastExtensions/)
    assert.match(src, /type/)
  })
})
