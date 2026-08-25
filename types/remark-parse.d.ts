export interface Options {
  gfm?: boolean
  breaks?: boolean
  math?: boolean
  allowDangerousHtml?: boolean
  singleTilde?: boolean
}

export interface ProcessorLike {
  parser?: (doc: unknown, file?: unknown) => unknown
  data?: (key?: string, value?: unknown) => unknown
}

export function remarkParse(this: ProcessorLike, options?: Options): void
export default remarkParse
