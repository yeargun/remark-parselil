import type {
  Extension as FromMarkdownExtension,
  Options as FromMarkdownOptions
} from '@itslil/mdast-util-from-markdown'
import type {Root} from 'mdast'
import type {Extension as MicromarkExtension} from 'micromark-util-types'
import type {Plugin} from 'unified'

export type Options = Omit<
  FromMarkdownOptions,
  'extensions' | 'mdastExtensions'
>

declare const remarkParse: Plugin<
  [(Readonly<Options> | null | undefined)?],
  string,
  Root
>

export default remarkParse

declare module 'unified' {
  interface Settings extends Options {}

  interface Data {
    micromarkExtensions?: Array<MicromarkExtension>
    fromMarkdownExtensions?: Array<
      FromMarkdownExtension | Array<FromMarkdownExtension>
    >
  }
}
