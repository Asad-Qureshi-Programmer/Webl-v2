import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = traverseModule.default;

import generateModule from "@babel/generator";
const generate = generateModule.default;

import * as t from "@babel/types";

export function injectIds(code, filePath = "src/App.jsx") {
  // We scope the counter per-file so it always builds sequentially from 0
  let idCounter = 0;

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx"],
    });

    traverse(ast, {
      JSXOpeningElement(path) {
        const elementName = path.node.name.name || "element";
        
        // 🔥 Compound Key Structure: "path/to/file::element-0"
        // This gives our jump-to-element mapping full awareness of the file system context
        const id = `${filePath}::${elementName}-${idCounter++}`;

        // ✅ Prevent duplicate injection
        const alreadyHasId = path.node.attributes.some(
          (attr) => attr.name && attr.name.name === "data-webl-id"
        );
        if (alreadyHasId) return;

        // ✅ Add data-webl-id FIRST (clean ordering)
        path.node.attributes.unshift(
          t.jsxAttribute(
            t.jsxIdentifier("data-webl-id"),
            t.stringLiteral(id)
          )
        );

        // 🔥 Proper onClick with stopPropagation
        const onClickHandler = t.jsxAttribute(
          t.jsxIdentifier("onClick"),
          t.jsxExpressionContainer(
            t.arrowFunctionExpression(
              [t.identifier("e")],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("e"),
                      t.identifier("stopPropagation")
                    ),
                    []
                  )
                ),
                t.expressionStatement(
                  t.callExpression(
                    t.identifier("onElementClick"),
                    [t.stringLiteral(id)]
                  )
                )
              ])
            )
          )
        );

        // Replace or add onClick
        const existingIndex = path.node.attributes.findIndex(
          (attr) => attr.name && attr.name.name === "onClick"
        );

        if (existingIndex !== -1) {
          path.node.attributes[existingIndex] = onClickHandler;
        } else {
          path.node.attributes.push(onClickHandler);
        }

        // 🔥 FIXED COMMENT INSERTION (REAL JSX COMMENT)
        const jsxElementPath = path.parentPath; // JSXElement
        const parentPath = jsxElementPath?.parentPath;

        if (parentPath && parentPath.node && parentPath.node.children) {
          const siblings = parentPath.node.children;

          const commentNode = t.jsxExpressionContainer(
            t.jsxEmptyExpression()
          );

          commentNode.expression.innerComments = [
            {
              type: "CommentBlock",
              value: ` id:${id} `,
            },
          ];

          const index = siblings.indexOf(jsxElementPath.node);

          if (index !== -1) {
            siblings.splice(index, 0, commentNode);
          }
        }
      },
    });

    return generate(ast, {}, code).code;
  } catch (err) {
    // If parsing fails (e.g., passing package.json or non-JS configurations), 
    // we bypass instrumentation and return the raw string intact.
    console.warn(`AST Instrumentation bypassed for: ${filePath}`, err.message);
    return code;
  }
}