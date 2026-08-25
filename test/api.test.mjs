import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import remarkParse, { remarkParse as named } from "../dist/remark-parse.esm.js"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function parse(doc, options = {}, settings = {}) {
  const proc = {
    data() {
      return { settings }
    },
  }
  named.call(proc, options)
  return proc.parser(doc)
}

describe("remark-parse", () => {
  it("exports the plugin as default and named", () => {
    assert.equal(typeof remarkParse, "function")
    assert.equal(named, remarkParse)
  })

  it("installs a parser that turns a heading into mdast", () => {
    const tree = parse("# hi")
    assert.equal(tree.type, "root")
    assert.equal(tree.children[0].type, "heading")
    assert.equal(tree.children[0].depth, 1)
    assert.equal(tree.children[0].children[0].value, "hi")
  })

  it("parses paragraphs, emphasis, strong, code, and lists", () => {
    const tree = parse("Hello **bold** and *em* and `code`.\n\n- one\n- two\n")
    const types = tree.children.map((node) => node.type)
    assert.ok(types.includes("paragraph"))
    assert.ok(types.includes("list"))
    const para = tree.children.find((node) => node.type === "paragraph")
    const kinds = para.children.map((node) => node.type)
    assert.ok(kinds.includes("strong"))
    assert.ok(kinds.includes("emphasis"))
    assert.ok(kinds.includes("inlineCode"))
  })

  it("reads gfm from options and settings", () => {
    const table = parse("| a | b |\n| --- | --- |\n| 1 | 2 |\n", { gfm: true })
    assert.equal(table.children[0].type, "table")
    const viaSettings = parse("- [x] done", {}, { gfm: true })
    assert.equal(viaSettings.children[0].children[0].checked, true)
  })

  it("reads settings at parse time, not install time", () => {
    const settings = {}
    const proc = {
      data() {
        return { settings }
      },
    }
    named.call(proc, {})
    settings.gfm = true
    const tree = proc.parser("| a | b |\n| --- | --- |\n| 1 | 2 |")
    assert.equal(tree.children[0].type, "table")
  })

  it("keeps paragraph newlines so breaks plugins can see them", () => {
    const tree = parse("line\nwith a break")
    const para = tree.children[0]
    assert.equal(para.type, "paragraph")
    const text = para.children.map((node) => node.value ?? "").join("")
    assert.match(text, /\n/)
  })

  it("keeps pinned option keys in the library artifact", () => {
    const src = readFileSync(resolve(root, "dist/remark-parse.esm.js"), "utf8")
    assert.match(src, /gfm/)
    assert.match(src, /breaks/)
    assert.match(src, /allowDangerousHtml/)
    assert.match(src, /parser/)
    assert.match(src, /type/)
  })
})
