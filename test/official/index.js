import assert from 'node:assert/strict'
import test from 'node:test'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {gfm} from 'micromark-extension-gfm'
import remarkParse from '../../dist/remark-parse.esm.js'
import {unified} from 'unified'
import {removePosition} from 'unist-util-remove-position'

test('remark-parse', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../../dist/remark-parse.esm.js')), [
      'default'
    ])
  })

  await t.test('should parse', async function () {
    assert.deepEqual(unified().use(remarkParse).parse('Alfred'), {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Alfred',
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 7, offset: 6}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 7, offset: 6}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 7, offset: 6}
      }
    })
  })

  await t.test('should support extensions', function () {
    const tree = unified()
      .data('micromarkExtensions', [gfm()])
      .data('fromMarkdownExtensions', [gfmFromMarkdown()])
      .use(remarkParse)
      .parse('* [x] contact@example.com ~~strikethrough~~')

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          start: null,
          spread: false,
          children: [
            {
              type: 'listItem',
              spread: false,
              checked: true,
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'link',
                      title: null,
                      url: 'mailto:contact@example.com',
                      children: [{type: 'text', value: 'contact@example.com'}]
                    },
                    {type: 'text', value: ' '},
                    {
                      type: 'delete',
                      children: [{type: 'text', value: 'strikethrough'}]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  })
})
