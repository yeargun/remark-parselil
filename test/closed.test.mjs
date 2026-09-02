import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import remarkParse from "../dist/remark-parse.closed.js"
import { unified } from "unified"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

describe("remark-parse closed", () => {
  it("ships a closed artifact with the upstream export", async () => {
    assert.equal(existsSync(resolve(root, "dist/remark-parse.closed.js")), true)
    assert.equal(typeof remarkParse, "function")
    assert.deepEqual(Object.keys(await import("../dist/remark-parse.closed.js")), ["default"])
  })

  it("parses through unified with unmangled parser and data keys", () => {
    const tree = unified().use(remarkParse).parse("Alfred")
    assert.equal(tree.type, "root")
    assert.equal(tree.children[0].type, "paragraph")
    assert.equal(tree.children[0].children[0].value, "Alfred")
  })
})
