"use strict"
const acorn = require("acorn")
const { Parser, tokContexts: tc, tokTypes: tt } = acorn

tt.hsmlSelfClose = new acorn.TokenType("/>", { beforeExpr: true })
tt.hsmlEndTag = new acorn.TokenType(">", { beforeExpr: true })
tc.hsmlAttribute = new acorn.TokContext("hsmlAttribute")

acorn.plugins.hsml = function(instance, opts) {
  if (!opts) {
    return
  }

  instance.options.plugins.hsml = {}

  instance.extend("readToken", function(inner) {
    return function(code) {
      if (this.curContext() === tc.hsmlAttribute) {
        if (code === 47 && this.input.charCodeAt(this.pos + 1) === 62) {
          this.pos += 2
          return this.finishToken(tt.hsmlSelfClose)
        }
        if (code === 62) {
          this.pos += 1
          return this.finishToken(tt.hsmlEndTag)
        }
      }
      return inner.call(this, code)
    }
  })
}

exports.parse = function parse(input, options) {
  const ctx = {
    offset: 0,
    line: 1,
    column: 0,
    input,
    options: {
      ...options
    }
  }
  return HSML(ctx)
}

function advance(ctx, count = 1) {
  while (count > 0) {
    count -= 1
    if (ctx.input[ctx.offset] === "\n") {
      ctx.line += 1
      ctx.column = 0
    } else {
      ctx.column += 1
    }
    ctx.offset += 1
  }
}

function isValidNameChar(char) {
  return (
    (char >= "A" && char <= "Z") ||
    (char >= "a" && char <= "z") ||
    char === "-" ||
    char === "_" ||
    char === "$"
  )
}

function isWhitespace(char) {
  const code = char && char.charCodeAt(0)
  return (
    (code >= 0x09 && code <= 0x0d) ||
    code === 0x20 ||
    code === 0x85 ||
    code === 0xa0 ||
    code === 0x180e ||
    (code >= 0x2000 && code <= 0x200d) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x2060 ||
    code === 0x3000 ||
    code === 0xfeff
  )
}

function skipWhitespace(ctx) {
  while (isWhitespace(ctx.input[ctx.offset])) {
    advance(ctx)
  }
}

function getPosition({ line, column }) {
  return { line, column }
}

function Whitespace(ctx) {
  const start = ctx.offset
  skipWhitespace(ctx)
  return ctx.offset !== start
}

function OptWhitespace(ctx) {
  skipWhitespace(ctx)
  return true
}

function HSML(ctx) {
  const start = getPosition(ctx)
  skipWhitespace(ctx)
  const body = List(Element, OptWhitespace, ctx)
  skipWhitespace(ctx)
  const end = getPosition(ctx)
  return {
    type: "HSML",
    loc: { start, end },
    body
  }
}

function List(Type, Separator, ctx) {
  const list = []
  let node
  while ((node = Type(ctx))) {
    list.push(node)
    if (Separator) {
      if (!Separator(ctx)) {
        return list
      }
    }
  }
  return list
}

function Element(ctx) {
  const start = getPosition(ctx)
  const { input } = ctx
  if (input[ctx.offset] !== "<") return
  advance(ctx)
  const tagName = Name(ctx)
  skipWhitespace(ctx)
  const attributes = List(Attribute, Whitespace, ctx)
  skipWhitespace(ctx)
  let children = null
  if (input.slice(ctx.offset, ctx.offset + 2) === "/>") {
    advance(ctx)
    advance(ctx)
  } else {
    if (input[ctx.offset] !== ">") {
      throw new Error("Expected tag end '>'")
    }
    advance(ctx)

    skipWhitespace(ctx)
    children = List(Child, OptWhitespace, ctx)
    skipWhitespace(ctx)

    if (input.slice(ctx.offset, ctx.offset + 2) !== "</") {
      throw new Error(`Expected closing tag '</${tagName}>'`)
    }
    advance(ctx)
    advance(ctx)
    if (input.slice(ctx.offset, ctx.offset + tagName.length) !== tagName) {
      throw new Error(`Expected closing tag '</${tagName}>'`)
    }
    advance(ctx, tagName.length)
    if (input[ctx.offset] !== ">") throw new Error()
    advance(ctx)
  }
  const end = getPosition(ctx)
  return {
    type: "HSMLElement",
    loc: { start, end },
    tagName,
    attributes,
    children
  }
}

function Name(ctx) {
  const start = ctx.offset
  while (isValidNameChar(ctx.input[ctx.offset])) {
    advance(ctx)
  }
  return ctx.input.slice(start, ctx.offset)
}

function Attribute(ctx) {
  const start = getPosition(ctx)
  const name = Name(ctx)
  if (!name) return
  const { offset, line, column } = ctx
  skipWhitespace(ctx)
  let value = { type: "Literal", value: true }
  if (ctx.input[ctx.offset] === "=") {
    advance(ctx)
    skipWhitespace(ctx)
    value = Value(ctx)
  } else {
    ctx.offset = offset
    ctx.line = line
    ctx.column = column
  }
  const end = getPosition(ctx)
  return {
    type: "HSMLAttribute",
    loc: { start, end },
    name,
    value
  }
}

function Value(ctx) {
  const parser = new Parser({
    ecmaVersion: 2017,
    sourceType: "module",
    locations: true,
    plugins: { hsml: true }
  }, ctx.input, ctx.offset)
  parser.context.push(tc.hsmlAttribute)
  parser.nextToken()
  const value = parser.parseExpression()
  const advanceTo = parser.start - 1
  while (ctx.offset < advanceTo) {
    advance(ctx)
  }
  return value
}

function Child(ctx) {
  if (ctx.input.slice(ctx.offset, ctx.offset + 2) === "</") return
  return (
    Element(ctx) ||
    Placeholder(ctx) ||
    Text(ctx)
  )
}

function Placeholder(ctx) {
  if (ctx.input.slice(ctx.offset, ctx.offset + 2) !== '${') return
  advance(ctx)
  advance(ctx)
  const parser = new Parser({
    ecmaVersion: 2017,
    sourceType: "module",
    locations: true
  }, ctx.input, ctx.offset)
  parser.nextToken()
  const expression = parser.parseExpression()
  const advanceTo = parser.start
  while (ctx.offset < advanceTo) {
    advance(ctx)
  }
  if (ctx.input[ctx.offset] !== '}') {
    throw new Error("Expected placeholder end '}'")
  }
  advance(ctx)
  return expression
}

function Text(ctx) {
  const start = getPosition(ctx)
  const s = ctx.offset
  while (
    ctx.input[ctx.offset] !== '<' &&
    ctx.input[ctx.offset] !== '\n' &&
    ctx.input.slice(ctx.offset, ctx.offset + 2) !== '${'
  ) {
    advance(ctx)
  }
  const end = getPosition(ctx)
  const e = ctx.offset
  if (s === e) return
  return {
    type: "Literal",
    loc: { start, end },
    value: ctx.input.slice(s, e)
  }
}
