"use strict"

const assert = require("assert")
const { parse } = require("../parse")

describe("parse comment", () => {
  it("parses a comment", () => {
    assert.deepEqual(parse("<!-- comment -->"), {
      type: "HSML",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 16 }
      },
      body: [
        {
          type: "HSMLComment",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 16 }
          },
          data: " comment "
        }
      ]
    })
  })

  it("throws when unclosed before end of input", () => {
    assert.throws(() => parse("<!--"))
  })
})
