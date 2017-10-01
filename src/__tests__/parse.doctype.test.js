"use strict"

const assert = require("assert")
const { parse } = require("../parse")

describe("parse doctype", () => {
  it("parses a doctype", () => {
    assert.deepEqual(parse("<!doctype html>"), {
      type: "HSML",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 15 }
      },
      body: [
        {
          type: "HSMLDoctype",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 15 }
          },
          name: "html",
          raw: "<!doctype html>"
        }
      ]
    })
  })

  it("parses case insensitively", () => {
    assert.deepEqual(parse("<!DocType html>"), {
      type: "HSML",
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 15 }
      },
      body: [
        {
          type: "HSMLDoctype",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 15 }
          },
          name: "html",
          raw: "<!DocType html>"
        }
      ]
    })
  })

  it("parses old doctypes", () => {
    assert.deepEqual(
      parse(
        `<!DOCTYPE HTML PUBLIC
      "-//W3C//DTD HTML 4.01//EN"
      "http://www.w3.org/TR/html4/strict.dtd"
    >`,
        {}
      ),
      {
        type: "HSML",
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 4, column: 5 }
        },
        body: [
          {
            type: "HSMLDoctype",
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 4, column: 5 }
            },
            name: "HTML",
            raw: `<!DOCTYPE HTML PUBLIC
      "-//W3C//DTD HTML 4.01//EN"
      "http://www.w3.org/TR/html4/strict.dtd"
    >`
          }
        ]
      }
    )
  })

  it("throws when appears as a child", () => {
    assert.throws(() => parse("<a><!doctype html></a>"))
  })
})
