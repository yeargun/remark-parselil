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
| **closed** | `lilscript.closed.toml` · `--target js-module` | closed LilScript world. Declared public and extern field names are preserved. ESM export names stay so the lane is testable. |

You publish the library lane. The closed artifact is `dist/remark-parse.closed.js`.

## Comparison with the original

See [COMPARISON.md](COMPARISON.md) for current raw-, gzip- and Brotli-objective builds, minified upstream comparisons, build times and validation.

[Download the checked repository package](https://yeargun.github.io/remark-parselil/downloads/package.tgz) · [Package files, hashes and validation](https://yeargun.github.io/remark-parselil/package-build.json). npm publication is independent.
