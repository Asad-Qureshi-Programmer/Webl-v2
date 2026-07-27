import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = traverseModule.default;
import generateModule from "@babel/generator";
const generate = generateModule.default;

export function stripIds(instrumentedCode) {
  if (!instrumentedCode || typeof instrumentedCode !== 'string') return "";

const trimmed = instrumentedCode.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    // If it looks like raw JSON data (e.g., package.json), return it cleanly out of the box
    if (trimmed.includes('"name":') || trimmed.includes('"dependencies":')) return instrumentedCode;
  }
  if (trimmed.startsWith('@tailwind') || trimmed.startsWith('body')) {
    return instrumentedCode; // Skip pure styling components
  }

  try {
    const ast = parser.parse(instrumentedCode, {
      sourceType: "module",
      plugins: ["jsx"],
    });

    traverse(ast, {
      // 1. Strip the onElementClick parameter from function declarations
      FunctionDeclaration(path) {
        if (path.node.params && path.node.params.length > 0) {
          const firstParam = path.node.params[0];
          if (firstParam.type === "ObjectPattern") {
            firstParam.properties = firstParam.properties.filter(prop => {
              return prop.key?.name !== "onElementClick" && prop.value?.name !== "onElementClick";
            });
            if (firstParam.properties.length === 0) {
              path.node.params.shift();
            }
          }
        }
      },

      // 2. Locate and delete the internal handleClick helper function blocks
      VariableDeclarator(path) {
        if (path.node.id?.name === "handleClick") {
          const init = path.node.init;
          if (init && init.type === "ArrowFunctionExpression" && generate(init).code.includes("onElementClick")) {
            const parentStatement = path.parentPath;
            if (parentStatement && parentStatement.isVariableDeclaration()) {
              parentStatement.remove();
            }
          }
        }
      },

      // 3. Clean out telemetry attributes and sub-component props completely
      JSXOpeningElement(path) {
        path.node.attributes = path.node.attributes.filter((attr) => {
          if (attr.type === "JSXSpreadAttribute") return true;
          
          const attrName = attr.name?.name;
          
          // Drop data telemetry IDs
          if (attrName === "data-webl-id") return false;

          // 🔥 THE PROP FIX: Drop plain component attributes referencing our tracking tokens
          if (attrName === "onElementClick") return false;

          // Target the multi-line onClick block listener injections
          if (attrName === "onClick") {
            const attrStr = generate(attr).code;
            if (attrStr.includes("onElementClick")) {
              return false; 
            }
          }

          return true;
        });
      },

      // 4. Remove tracking comment metadata flags {/* id:X */}
      JSXExpressionContainer(path) {
        if (
          path.node.expression.type === "JSXEmptyExpression" &&
          path.node.expression.innerComments?.some(c => c.value.includes("id:"))
        ) {
          path.remove();
        }
      }
    });

    // Generate output code
    let cleanCode = generate(ast, { retainLines: false }, instrumentedCode).code;

    // 🔥 THE WHITESPACE FIX: Collapse massive stacks of empty lines (3 or more) 
    // left behind by deleted blocks down to standard formatting spacing
    cleanCode = cleanCode.replace(/\n\s*\n\s*\n+/g, '\n\n');

    return cleanCode;

  } catch (err) {
    console.warn("AST parser hit a mid-edit syntax error, using string replacement cleanup:", err.message);
    
    // Fallback Regex sweep to keep clipboard actions error-free
    return instrumentedCode
      .replace(/onElementClick=\{onElementClick\}/g, '')
      .replace(/\{?\s*onElementClick\s*\}?/g, '')
      .replace(/const\s+handleClick\s*=\s*[\s\S]*?;\s*/g, '')
      .replace(/\s*data-webl-id="[^"]*"/g, '')
      .replace(/\s*onClick=\{\([\s\S]*?onElementClick[\s\S]*?\}\}/g, '')
      .replace(/\{\/\*\s*id:.*?\s*\*\/\}/g, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n');
  }
}