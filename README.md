# @itslil/remark-parse

Official [`remark-parse@11.0.0`](https://github.com/remarkjs/remark) algorithms rewritten in LilScript. Official remark-parse subtests 3/3. On the CommonMark 0.31.2 and GFM 0.29 spec examples (680, each parsed with and without GFM), every delivered file produces the same mdast as upstream, positions included: 1,360/1,360. Not affiliated with upstream.

**Site:** [yeargun.github.io/remark-parselil/](https://yeargun.github.io/remark-parselil/)

```sh
npm install @itslil/remark-parse
```

Two compiles ship from the same `.lil` source:

| Lane | Config | Meaning |
| --- | --- | --- |
| **library** (npm) | `lilscript.toml` · `--target js-module` | reusable ESM. Export names and `extern class` keys stay. |
| **closed** | `lilscript.closed.toml` · `--target js-module` | closed LilScript world. This compiler renames no properties, so `extern class` keys stay here too; the lane differs in its optimizer settings. ESM export names stay so the lane is testable. |

You publish the library lane. The closed artifact is `dist/remark-parse.closed.js`.

## Size and compile time

Every delivered file is written by the LilScript compiler (revision `24968659`, one
compiler); the build adds a license banner and, for CommonJS and the browser script, a
module wrapper. No minifier runs after the compiler. Measured with `lilscript-codec`
(Brotli-11 / gzip-9 / raw); the bars are the official `remark-parse@11.0.0` runtime graph
bundled by esbuild, then minified, with the dependencies Node resolves today (micromark
4.0.3 and micromark-core-commonmark 2.0.4, released 2026-09-26, which this port mirrors).
The Node graph is the like-for-like bar: it decodes named character references from an
entity table, as this port does. Upstream's browser graph decodes them through the DOM and
ships no table; against it this port loses.

| File | Brotli-11 | gzip-9 | Raw |
| --- | ---: | ---: | ---: |
| `dist/remark-parse.esm.js` (npm) | **22,697** | 26,807 | 72,309 |
| `dist/remark-parse.closed.js` | 22,705 | 26,913 | 74,649 |
| Official Node graph, Terser (mangle on) | 23,499 | 27,233 | 84,959 |
| Official Node graph, Oxc | 23,643 | 27,408 | 85,025 |
| Official Node graph, esbuild minify | 24,586 | 28,463 | 93,338 |
| Official browser graph (no entity table), Terser | 13,727 | 15,393 | 56,328 |

The npm file carries an 87-byte license banner the bars do not; without it the compiler's
output is 22,607 B Brotli-11. Compiling `src/entry.lil` for the npm file takes about
2.4 s of wall time (2452.3 / 2388.1 / 2438.2 ms over three clean builds). `npm run record:release`
re-measures all of this into `site/results.json`.

The LilScript compiler lives next door at `../lilscript`.
