"use strict"

const assert = require("assert")
const { parse } = require("../parse")

describe("parse script", () => {
  it("parses children as a single literal", () => {
    assert.deepEqual(parse("<script>'</scrip' + 't/>'</script>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 34 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 34 }
          },
          tagName: "script",
          attributes: [],
          children: [
            {
              type: "Literal",
              loc: {
                start: { line: 1, column: 8 },
                end: { line: 1, column: 25 }
              },
              value: "'</scrip' + 't/>'"
            }
          ]
        }
      ]
    })
  })

  it("parses empty script children", () => {
    assert.deepEqual(parse("<script></script>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 17 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 17 }
          },
          tagName: "script",
          attributes: [],
          children: []
        }
      ]
    })
  })

  it('throws if the tag never ends', () => {
    assert.throws(() => parse('<script>no end'))
  })
})
