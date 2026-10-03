// Records a release build for the site: the compiler's wall time, the sizes of
// every delivered file, the official suite, parity with upstream on the
// CommonMark and GFM spec examples, and a throughput sample.
//
//   LILSCRIPT_COMPILER=... LILSCRIPT_CODEC=... \
//     node scripts/record-release.mjs --revision <compiler source revision>
//
// It builds `--samples` times (default 3) with a clean compile each time, checks
// that every build wrote the same bytes, and rewrites the measured fields of
// site/results.json. Fields it does not measure (the official bars, the previous
// release, the playground) are kept as they are.
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { execFileSync, spawnSync } from "node:child_process"
import { performance } from "node:perf_hooks"
import { runInNewContext } from "node:vm"
import { run } from "node:test"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const resultsPath = resolve(root, "site", "results.json")

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

const compiler = process.env.LILSCRIPT_COMPILER
const codec = process.env.LILSCRIPT_CODEC
const revision = argument("revision")
const samples = Number(argument("samples", "3"))
if (!compiler || !codec) throw new Error("set LILSCRIPT_COMPILER and LILSCRIPT_CODEC to the pinned binaries")
if (!revision) throw new Error("pass --revision: the compiler's source revision")

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex")

// Every file a consumer can load, with the export condition that selects it.
const delivered = [
  { path: "dist/remark-parse.esm.js", condition: "import", wrapper: "license banner" },
  { path: "dist/remark-parse.cjs", condition: "require", wrapper: "license banner, CommonJS `exports.default`" },
  { path: "dist/remark-parse.umd.js", condition: "browser script (unpkg, jsdelivr)", wrapper: "license banner, function scope, global `remarkParse`" },
  { path: "dist/remark-parse.closed.js", condition: "./closed", wrapper: "none" },
]

const scratch = mkdtempSync(join(tmpdir(), "remark-parselil-record-"))
const builds = []
try {
  for (let sample = 0; sample < samples; sample++) {
    const log = join(scratch, `compile-${sample}.jsonl`)
    const built = spawnSync(process.execPath, [resolve(root, "scripts", "build.mjs"), "--compile"], {
      cwd: root,
      stdio: ["ignore", "ignore", "inherit"],
      env: { ...process.env, LILSCRIPT_COMPILE_LOG: log },
    })
    if (built.status !== 0) throw new Error(`build ${sample + 1} failed`)
    const invocations = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line))
    const hashes = delivered.map(({ path }) => sha256(resolve(root, path)))
    builds.push({ invocations, hashes })
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
for (const build of builds) {
  if (build.hashes.join() !== builds[0].hashes.join()) {
    throw new Error("the builds wrote different bytes; compile output is not deterministic")
  }
}

const shippedCompile = (build) =>
  build.invocations.find((entry) => entry.source === "src/entry.lil" && entry.config === "lilscript.toml")
const round = (value) => Math.round(value * 10) / 10

const measured = JSON.parse(
  execFileSync(codec, ["--json", ...delivered.map(({ path }) => resolve(root, path))], { encoding: "utf8" }),
)
const sizes = measured.artifacts.map(({ raw, gzip9, brotli11 }) => ({ raw, gzip9, brotli11 }))

// Counts the leaf tests of a node:test run (a test whose subtests all passed is
// counted through them, not as one more). A test finishes after its subtests,
// so a finished test is a parent exactly when the test finished just before it
// is one level deeper.
async function runTests(files) {
  let pass = 0
  let total = 0
  let previousNesting = -1
  for await (const event of run({ files: files.map((file) => resolve(root, file)), cwd: root })) {
    if (event.type !== "test:pass" && event.type !== "test:fail") continue
    const { nesting } = event.data
    if (previousNesting !== nesting + 1) {
      total++
      if (event.type === "test:pass") pass++
    }
    previousNesting = nesting
  }
  if (pass !== total) throw new Error(`node --test ${files.join(" ")}: ${pass}/${total}`)
  return { total, pass }
}
const spec = {
  ...(await runTests(["test/official/index.js"])),
  label: "official suite",
  checks: await runTests(["test/api.test.mjs", "test/closed.test.mjs", "test/package.test.mjs"]),
}

// Parity: every delivered file against upstream remark-parse on the CommonMark
// and GFM spec examples, each parsed with and without the GFM extensions.
const requireFromRoot = createRequire(resolve(root, "package.json"))
const { unified } = await import("unified")
const { gfm } = await import("micromark-extension-gfm")
const { gfmFromMarkdown } = await import("mdast-util-gfm")
const upstream = (await import("remark-parse")).default
const upstreamVersion = JSON.parse(readFileSync(resolve(root, "node_modules", "remark-parse", "package.json"), "utf8")).version
const umdContext = { TextDecoder }
runInNewContext(readFileSync(resolve(root, "dist/remark-parse.umd.js"), "utf8"), umdContext)
const lanes = {
  "dist/remark-parse.esm.js": (await import(pathToFileURL(resolve(root, "dist/remark-parse.esm.js")).href)).default,
  "dist/remark-parse.cjs": requireFromRoot(resolve(root, "dist/remark-parse.cjs")).default,
  "dist/remark-parse.umd.js": umdContext.remarkParse,
  "dist/remark-parse.closed.js": (await import(pathToFileURL(resolve(root, "dist/remark-parse.closed.js")).href)).default,
}
const specFiles = ["test/specs/commonmark.0.31.2.json", "test/specs/gfm.0.29.json"]
const examples = specFiles.flatMap((file) => JSON.parse(readFileSync(resolve(root, file), "utf8")))
const parse = (plugin, markdown, withGfm) => {
  const processor = unified().use(plugin)
  if (withGfm) {
    processor.data("micromarkExtensions", [gfm()]).data("fromMarkdownExtensions", [gfmFromMarkdown()])
  }
  try {
    return JSON.stringify(processor.parse(markdown))
  } catch (error) {
    return `throws ${error.message}`
  }
}
let parityCases = 0
const mismatches = Object.fromEntries(Object.keys(lanes).map((path) => [path, 0]))
for (const { markdown } of examples) {
  for (const withGfm of [false, true]) {
    parityCases++
    const expected = parse(upstream, markdown, withGfm)
    for (const [path, plugin] of Object.entries(lanes)) {
      if (parse(plugin, markdown, withGfm) !== expected) mismatches[path]++
    }
  }
}
if (Object.values(mismatches).some((count) => count > 0)) {
  throw new Error(`parity with remark-parse@${upstreamVersion} failed: ${JSON.stringify(mismatches)}`)
}
const parity = {
  upstream: `remark-parse@${upstreamVersion}`,
  examples: examples.length,
  cases: parityCases,
  files: Object.keys(lanes).length,
  mismatches: 0,
  scope: `${specFiles.map((file) => file.replace("test/specs/", "")).join(" and ")} examples, each parsed with and without the GFM extensions; every delivered file's mdast (positions included) equals upstream's`,
}

// Throughput: the CommonMark spec's examples as one document, parsed to mdast
// through unified by the shipped ESM and by upstream's graph (site/official.js),
// alternating.
const commonmark = JSON.parse(readFileSync(resolve(root, specFiles[0]), "utf8"))
const documentText = commonmark.map((example) => example.markdown).join("\n")
const lilParser = unified().use(lanes["dist/remark-parse.esm.js"])
const officialParser = unified().use((await import(pathToFileURL(resolve(root, "site", "official.js")).href)).default)
const lil = () => lilParser.parse(documentText)
const official = () => officialParser.parse(documentText)
if (JSON.stringify(lil()) !== JSON.stringify(official())) {
  throw new Error("the lanes disagree on the throughput document")
}
// The order alternates every round so neither lane always runs after the other.
const warmup = 3
const rounds = 60
const timings = { lil: [], official: [] }
for (let index = 0; index < warmup + rounds; index++) {
  const order = [["lil", lil], ["official", official]]
  if (index % 2) order.reverse()
  for (const [lane, parseOnce] of order) {
    const started = performance.now()
    parseOnce()
    if (index >= warmup) timings[lane].push(performance.now() - started)
  }
}
const median = (values) => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]

const data = JSON.parse(readFileSync(resultsPath, "utf8"))
const byPath = Object.fromEntries(delivered.map(({ path }, index) => [path, sizes[index]]))
for (const lane of data.size) {
  if (lane.id === "itslil") Object.assign(lane, byPath["dist/remark-parse.esm.js"])
  if (lane.id === "itslil-closed") Object.assign(lane, byPath["dist/remark-parse.closed.js"])
}
data.delivered = delivered.map(({ path, condition, wrapper }, index) => ({
  path,
  condition,
  writtenBy: "compiler",
  wrapper,
  ...sizes[index],
}))
data.spec = spec
data.parity = parity
data.node = process.version
data.runtime = `Node ${process.version}`
data.throughput = [
  { id: "official", name: data.pin, documentMs: Math.round(median(timings.official) * 100) / 100 },
  { id: "itslil", name: data.package, documentMs: Math.round(median(timings.lil) * 100) / 100 },
]
data.throughputDocument = `the CommonMark spec's ${commonmark.length} examples as one document (${documentText.length} characters), parsed through unified`
data.warmupDiscard = warmup
data.compiler = {
  revision,
  binarySha256: sha256(compiler),
  codecSha256: sha256(codec),
  compileWallMs: builds.map((build) => round(shippedCompile(build).wallMs)),
  buildCompileWallMs: builds.map((build) => round(build.invocations.reduce((sum, entry) => sum + entry.wallMs, 0))),
  invocations: builds[0].invocations.map(({ source, config, output }) => ({ source, config, output })),
  compileScope: "wall time of the compiler process for src/entry.lil with lilscript.toml, the shipped ESM",
  buildScope: `wall time of all ${builds[0].invocations.length} compiler processes of one clean build`,
  date: new Date().toISOString().slice(0, 10),
}
writeFileSync(resultsPath, `${JSON.stringify(data, null, 2)}\n`)
console.log(
  `recorded: esm ${byPath["dist/remark-parse.esm.js"].brotli11} Brotli, compile ${data.compiler.compileWallMs.join("/")} ms, build ${data.compiler.buildCompileWallMs.join("/")} ms, official suite ${spec.pass}/${spec.total}, checks ${spec.checks.pass}/${spec.checks.total}, parity ${parity.cases} cases x ${parity.files} files, throughput ${data.throughput[1].documentMs} vs ${data.throughput[0].documentMs} ms`,
)
