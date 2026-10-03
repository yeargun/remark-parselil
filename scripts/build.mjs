import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {buildPackage} from './compiler-package.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
await buildPackage({root,
  profiles: [{name:'public', config:'lilscript.toml'}, {name:'closed', config:'lilscript.closed.toml'}],
  aliases: {'remark-parse.raw.js':'remark-parse.esm.js'},
  assets: [{source:'types/remark-parse.d.ts', destination:'remark-parse.d.ts'}],
})
