export interface Options {
  [key: string]: unknown
}

export interface ProcessorLike {
  parser?: (document: string) => unknown
  data?: (key?: string, value?: unknown) => unknown
}

export function remarkParse(this: ProcessorLike, options?: Options | null): void
export default remarkParse
