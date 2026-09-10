# @itslil/remark-parse

<!-- current-build-audit -->
**Build audit, 2026-09-10:** [blocked; compiler, machine, build times, version gaps and behavior checks](https://yeargun.github.io/remark-parselil/#build-audit). The [JSON receipt](site/build-audit.json) records the current comparison; older benchmark prose retains its original scope.


Official [`remark-parse@11.0.0`](https://github.com/remarkjs/remark) algorithms rewritten in LilScript. Official remark-parse subtests 3/3. Not affiliated with upstream.

**Site:** [yeargun.github.io/remark-parselil/](https://yeargun.github.io/remark-parselil/)

```sh
npm install @itslil/remark-parse
```

Two compiles ship from the same `.lil` source:

| Lane | Config | Meaning |
| --- | --- | --- |
| **library** (npm) | `lilscript.toml` · `--target js-module` | reusable ESM. Export names and `extern class` keys stay. |
| **closed** | `lilscript.closed.toml` · `--target js-module` | closed LilScript world. `extern class` keys may mangle. ESM export names stay so the lane is testable. |

You publish the library lane. The closed artifact is `dist/remark-parse.closed.js`.

The LilScript compiler lives next door at `../lilscript`.
