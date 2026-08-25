import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import remarkParse, { remarkParse as named } from "../dist/remark-parse.closed.js"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

describe("remark-parse closed", () => {
  it("ships a closed artifact with named exports", () => {
    assert.equal(existsSync(resolve(root, "dist/remark-parse.closed.js")), true)
    assert.equal(typeof named, "function")
    assert.equal(typeof remarkParse, "function")
    assert.equal(named, remarkParse)
  })
})
