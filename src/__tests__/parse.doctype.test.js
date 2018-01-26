"use strict"

const assert = require("assert")
const { parse } = require("../parse")

describe("parse doctype", () => {
  it("parses a doctype", () => {
    assert.deepEqual(parse("<!doctype html>"), {
      type: "HSMLDocument",
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
      type: "HSMLDocument",
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
        type: "HSMLDocument",
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

  it("throws when appears twice", () => {
    assert.throws(() => parse("<!doctype html><!doctype html>"))
  })

  it("throws when appears after an element", () => {
    assert.throws(() => parse("<a></a><!doctype html>"))
  })

  it("throws when appears after text", () => {
    assert.throws(() => parse("hi<!doctype html>"))
  })

  it("can appear after a comment", () => {
    assert.doesNotThrow(() => parse("<!-- --><!doctype html>"))
  })

  it("throws when unclosed before end of input", () => {
    assert.throws(() => parse("<!doctype html"))
  })

  it("throws when expected whitespace is missing", () => {
    assert.throws(() => parse("<!doctypehtml>"))
  })
})
