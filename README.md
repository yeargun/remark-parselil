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

Every delivered file is written by the LilScript compiler (revision `aa2052f0`, one
compiler); the build adds a license banner and, for CommonJS and the browser script, a
module wrapper. No minifier runs after the compiler. Measured with `lilscript-codec`
(Brotli-11 / gzip-9 / raw); the bars are the official `remark-parse@11.0.0` runtime graph
bundled by esbuild, then minified. The Node graph is the like-for-like bar: it decodes
named character references from an entity table, as this port does. Upstream's browser
graph decodes them through the DOM and ships no table; against it this port loses.

| File | Brotli-11 | gzip-9 | Raw |
| --- | ---: | ---: | ---: |
| `dist/remark-parse.esm.js` (npm) | **22,386** | 26,508 | 71,995 |
| `dist/remark-parse.closed.js` | 22,430 | 26,594 | 74,248 |
| Official Node graph, Terser (mangle on) | 23,171 | 26,914 | 84,339 |
| Official Node graph, Oxc (Rolldown 1.2.5) | 23,339 | 27,112 | 84,436 |
| Official Node graph, esbuild minify | 24,279 | 28,102 | 92,727 |
| Official browser graph (no entity table), Terser | 13,399 | 15,052 | 55,705 |
| Previous release (2026-09-02, old compiler route) | 26,205 | 30,903 | 89,641 |

The npm file carries an 87-byte license banner the bars do not; without it the compiler's
output is 22,331 B Brotli-11. Compiling `src/entry.lil` for the npm file takes about 0.6 s
of wall time (608.4 / 604.1 / 634 ms over three clean builds). `npm run record:release`
re-measures all of this into `site/results.json`.

The LilScript compiler lives next door at `../lilscript`.
