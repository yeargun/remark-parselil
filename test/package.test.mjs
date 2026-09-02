import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { describe, it } from "node:test"
import remarkParse from "@itslil/remark-parse"
import { unified } from "unified"

const require = createRequire(import.meta.url)

describe("package artifacts", () => {
  it("loads the ESM and CommonJS exports", async () => {
    const commonjs = require("@itslil/remark-parse")

    assert.deepEqual(Object.keys(await import("@itslil/remark-parse")), ["default"])
    assert.deepEqual(Object.keys(commonjs), ["default"])
    assert.equal(unified().use(commonjs.default).parse("# cjs").children[0].type, "heading")
  })

  it("loads the closed export", async () => {
    const closed = await import("@itslil/remark-parse/closed")

    assert.deepEqual(Object.keys(closed), ["default"])
    assert.equal(unified().use(closed.default).parse("# closed").children[0].type, "heading")
  })

  it("exposes a callable UMD global", () => {
    const context = { TextDecoder }
    const source = readFileSync(new URL("../dist/remark-parse.umd.js", import.meta.url), "utf8")

    runInNewContext(source, context)
    assert.equal(typeof context.remarkParse, "function")
    assert.equal(unified().use(context.remarkParse).parse("# umd").children[0].type, "heading")
  })
})
