"use strict"

const assert = require("assert")
const { parse } = require("../parse")

function removeLoc(obj) {
  if (!obj || typeof obj !== "object") return obj
  delete obj.loc
  delete obj.start
  delete obj.end
  Object.values(obj).forEach(removeLoc)
  return obj
}

describe("parse", () => {
  it("parses a self-closing element", () => {
    assert.deepEqual(parse("<tag-name />"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 12 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 12 }
          },
          tagName: "tag-name",
          attributes: [],
          children: null
        }
      ]
    })
  })

  it("parses an empty element", () => {
    assert.deepEqual(parse("<tag-name></tag-name>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 21 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 21 }
          },
          tagName: "tag-name",
          attributes: [],
          children: []
        }
      ]
    })
  })

  it("parses sibling elements", () => {
    assert.deepEqual(parse("<a/>\n<b/>"), {
      type: "HSMLDocument",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 2, column: 4 }
      },
      body: [
        {
          type: "HSMLElement",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 4 }
          },
          tagName: "a",
          attributes: [],
          children: null
        },
        {
          type: "HSMLElement",
          loc: {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 4 }
          },
          tagName: "b",
          attributes: [],
          children: null
        }
      ]
    })
  })

  it("parses children elements", () => {
    assert.deepEqual(parse("<a><b/><c/></a>"), {
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
          tagName: "a",
          attributes: [],
          children: [
            {
              type: "HSMLElement",
              loc: {
                start: { line: 1, column: 3 },
                end: { line: 1, column: 7 }
              },
              tagName: "b",
              attributes: [],
              children: null
            },
            {
              type: "HSMLElement",
              loc: {
                start: { line: 1, column: 7 },
                end: { line: 1, column: 11 }
              },
              tagName: "c",
              attributes: [],
              children: null
            }
          ]
        }
      ]
    })
  })

  it("allows void elements to close with > instead of />", () => {
    assert.deepEqual(
      removeLoc(
        parse(
          "<area><base><br><col><embed><hr><img><input><keygen><link><meta><param><source><track><wbr>"
        )
      ),
      {
        type: "HSMLDocument",
        body: "area base br col embed hr img input keygen link meta param source track wbr"
          .split(" ")
          .map(tagName => ({
            type: "HSMLElement",
            tagName,
            attributes: [],
            children: null
          }))
      }
    )
  })

  it("parses child text", () => {
    assert.deepEqual(removeLoc(parse("<a>hello<b/>world</a>")), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "a",
          attributes: [],
          children: [
            {
              type: "Literal",
              value: "hello"
            },
            {
              type: "HSMLElement",
              tagName: "b",
              attributes: [],
              children: null
            },
            {
              type: "Literal",
              value: "world"
            }
          ]
        }
      ]
    })
  })

  it("parses top level text", () => {
    assert.deepEqual(removeLoc(parse("hello\n${place}")), {
      type: "HSMLDocument",
      body: [
        {
          type: "Literal",
          value: "hello"
        },
        {
          type: "Identifier",
          name: "place"
        }
      ]
    })
  })

  it("parses each line of child text individually", () => {
    assert.deepEqual(removeLoc(parse("<a>\nhello\nworld\n</a>")), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "a",
          attributes: [],
          children: [
            {
              type: "Literal",
              value: "hello"
            },
            {
              type: "Literal",
              value: "world"
            }
          ]
        }
      ]
    })
  })

  it("parses child text placeholder expressions", () => {
    assert.deepEqual(removeLoc(parse("<a>hello ${ place }</a>")), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "a",
          attributes: [],
          children: [
            {
              type: "Literal",
              value: "hello "
            },
            {
              type: "Identifier",
              name: "place"
            }
          ]
        }
      ]
    })
  })

  it("parses many kinds of whitespace", () => {
    assert.deepEqual(
      parse(
        `\ufeff<a
        \t\v\r\n\f
        \u0085
        \u00A0
        \u180e
        \u2000\u2005\u200d
        \u2028\u2029
        \u202f\u205f
        \u2060
        \u3000
      />`
      ),
      {
        type: "HSMLDocument",
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 12, column: 8 }
        },
        body: [
          {
            type: "HSMLElement",
            loc: {
              start: { line: 1, column: 1 },
              end: { line: 12, column: 8 }
            },
            tagName: "a",
            attributes: [],
            children: null
          }
        ]
      }
    )
  })
})
