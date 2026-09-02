import type {Root} from 'mdast'
import {unified, type Data, type Plugin, type Settings} from 'unified'
import remarkParse, {type Options} from '@itslil/remark-parse'
import closedRemarkParse from '@itslil/remark-parse/closed'

const options: Options = {}
const plugin: Plugin<[Options?], string, Root> = remarkParse
const closedPlugin: typeof remarkParse = closedRemarkParse
const data: Data = {
  micromarkExtensions: [],
  fromMarkdownExtensions: []
}
const settings: Settings = options
const tree: Root = unified().use(remarkParse, options).parse('# heading')

void plugin
void closedPlugin
void data
void settings
void tree
