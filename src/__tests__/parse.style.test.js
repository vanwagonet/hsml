"use strict"

const assert = require("assert")
const { parse } = require("../parse")

describe("parse style", () => {
  it("parses children as a single literal", () => {
    assert.deepEqual(parse("<style>.a{content: '</style'}</style>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 37 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 37 }
          },
          tagName: "style",
          attributes: [],
          children: [
            {
              type: "Literal",
              loc: {
                start: { line: 1, column: 7 },
                end: { line: 1, column: 29 }
              },
              value: ".a{content: '</style'}"
            }
          ]
        }
      ]
    })
  })

  it("parses empty style children", () => {
    assert.deepEqual(parse("<style></style>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 15 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 15 }
          },
          tagName: "style",
          attributes: [],
          children: []
        }
      ]
    })
  })

  it('throws if the tag never ends', () => {
    assert.throws(() => parse('<style>no end'))
  })
})
