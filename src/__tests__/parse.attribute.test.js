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

describe("parse attribute", () => {
  it("parses implicit boolean attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input checked disabled />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "checked",
              value: {
                type: "Literal",
                value: true
              }
            },
            {
              type: "HSMLAttribute",
              name: "disabled",
              value: {
                type: "Literal",
                value: true
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses explicit boolean attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input disabled=false />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "disabled",
              value: {
                type: "Literal",
                value: false,
                raw: "false"
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses number attributes", () => {
    assert.deepEqual(
      removeLoc(parse(`<n b=0b01 o=0o7 h=0xaf d=123.456 p=+1 n=-2></n>`)),
      {
        type: "HSMLDocument",
        body: [
          {
            type: "HSMLElement",
            tagName: "n",
            attributes: [
              {
                type: "HSMLAttribute",
                name: "b",
                value: {
                  type: "Literal",
                  value: 1,
                  raw: "0b01"
                }
              },
              {
                type: "HSMLAttribute",
                name: "o",
                value: {
                  type: "Literal",
                  value: 7,
                  raw: "0o7"
                }
              },
              {
                type: "HSMLAttribute",
                name: "h",
                value: {
                  type: "Literal",
                  value: 175,
                  raw: "0xaf"
                }
              },
              {
                type: "HSMLAttribute",
                name: "d",
                value: {
                  type: "Literal",
                  value: 123.456,
                  raw: "123.456"
                }
              },
              {
                type: "HSMLAttribute",
                name: "p",
                value: {
                  type: "UnaryExpression",
                  operator: "+",
                  prefix: true,
                  argument: {
                    type: "Literal",
                    value: 1,
                    raw: "1"
                  }
                }
              },
              {
                type: "HSMLAttribute",
                name: "n",
                value: {
                  type: "UnaryExpression",
                  operator: "-",
                  prefix: true,
                  argument: {
                    type: "Literal",
                    value: 2,
                    raw: "2"
                  }
                }
              }
            ],
            children: []
          }
        ]
      }
    )
  })

  it("parses string attributes", () => {
    assert.deepEqual(
      removeLoc(
        parse(
          `<a
            string_double="double"
            stringSingle = 'single'
            template =\`Template \${placeholder}\`
          />`,
          {}
        )
      ),
      {
        type: "HSMLDocument",
        body: [
          {
            type: "HSMLElement",
            tagName: "a",
            attributes: [
              {
                type: "HSMLAttribute",
                name: "string_double",
                value: {
                  type: "Literal",
                  value: "double",
                  raw: '"double"'
                }
              },
              {
                type: "HSMLAttribute",
                name: "stringSingle",
                value: {
                  type: "Literal",
                  value: "single",
                  raw: "'single'"
                }
              },
              {
                type: "HSMLAttribute",
                name: "template",
                value: {
                  type: "TemplateLiteral",
                  quasis: [
                    {
                      type: "TemplateElement",
                      value: {
                        raw: "Template ",
                        cooked: "Template "
                      },
                      tail: false
                    },
                    {
                      type: "TemplateElement",
                      value: {
                        raw: "",
                        cooked: ""
                      },
                      tail: true
                    }
                  ],
                  expressions: [
                    {
                      type: "Identifier",
                      name: "placeholder"
                    }
                  ]
                }
              }
            ],
            children: null
          }
        ]
      }
    )
  })

  it("parses regular expression attributes", () => {
    assert.deepEqual(removeLoc(parse(`<reg exp=/./gi />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "reg",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "exp",
              value: {
                type: "Literal",
                value: /./gi,
                raw: "/./gi",
                regex: {
                  pattern: ".",
                  flags: "gi"
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("throws if a bare regex starts with >", () => {
    assert.throws(() => {
      parse(`<reg exp=/>/ />`)
    })
  })

  it("allows regex that looks like close inside parens", () => {
    assert.deepEqual(removeLoc(parse(`<reg exp=(/>/) />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "reg",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "exp",
              value: {
                type: "Literal",
                value: />/,
                raw: "/>/",
                regex: {
                  pattern: ">",
                  flags: ""
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("allows regex that looks like close inside function", () => {
    assert.deepEqual(removeLoc(parse(`<reg exp=() => {/>/} />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "reg",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "exp",
              value: {
                type: "ArrowFunctionExpression",
                id: null,
                params: [],
                async: false,
                generator: false,
                expression: false,
                body: {
                  type: "BlockStatement",
                  body: [
                    {
                      type: "ExpressionStatement",
                      expression: {
                        type: "Literal",
                        value: />/,
                        raw: "/>/",
                        regex: {
                          pattern: ">",
                          flags: ""
                        }
                      }
                    }
                  ]
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses identifier attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input expression=a />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "expression",
              value: {
                type: "Identifier",
                name: "a"
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses member expression attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input expression=a.b />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "expression",
              value: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "a"
                },
                property: {
                  type: "Identifier",
                  name: "b"
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses function call attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input value=fn() />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "value",
              value: {
                type: "CallExpression",
                callee: {
                  type: "Identifier",
                  name: "fn"
                },
                arguments: []
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses function expression attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input value=function*(){} />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "value",
              value: {
                type: "FunctionExpression",
                id: null,
                params: [],
                async: false,
                generator: true,
                expression: false,
                body: {
                  type: "BlockStatement",
                  body: []
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses arrow function attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input value=async () => {} />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "value",
              value: {
                type: "ArrowFunctionExpression",
                id: null,
                params: [],
                async: true,
                generator: false,
                expression: false,
                body: {
                  type: "BlockStatement",
                  body: []
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses array literal attributes", () => {
    assert.deepEqual(removeLoc(parse(`<a array=[ 'a' ] />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "a",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "array",
              value: {
                type: "ArrayExpression",
                elements: [
                  {
                    type: "Literal",
                    value: "a",
                    raw: "'a'"
                  }
                ]
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses object literal attributes", () => {
    assert.deepEqual(removeLoc(parse(`<o obj={ p } />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "o",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "obj",
              value: {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    kind: "init",
                    computed: false,
                    method: false,
                    shorthand: true,
                    key: {
                      type: "Identifier",
                      name: "p"
                    },
                    value: {
                      type: "Identifier",
                      name: "p"
                    }
                  }
                ]
              }
            }
          ],
          children: null
        }
      ]
    })
  })

  it("parses parenthetical expression attributes", () => {
    assert.deepEqual(removeLoc(parse(`<input expression=(5 / 6 > 1) />`)), {
      type: "HSMLDocument",
      body: [
        {
          type: "HSMLElement",
          tagName: "input",
          attributes: [
            {
              type: "HSMLAttribute",
              name: "expression",
              value: {
                type: "BinaryExpression",
                operator: ">",
                left: {
                  type: "BinaryExpression",
                  operator: "/",
                  left: {
                    type: "Literal",
                    value: 5,
                    raw: "5"
                  },
                  right: {
                    type: "Literal",
                    value: 6,
                    raw: "6"
                  }
                },
                right: {
                  type: "Literal",
                  value: 1,
                  raw: "1"
                }
              }
            }
          ],
          children: null
        }
      ]
    })
  })
})
