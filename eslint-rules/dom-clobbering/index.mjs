// Minimal ESLint plugin to detect DOM clobbering risks
// Exports rules: no-var-replace, no-implicit-global-assign, no-window-document-global-assign, no-restricted-dom-names
const restrictedNames = [
  "event",
  "name",
  "status",
  "location",
  "parent",
  "top",
  "frames",
];

function isIdentifierName(node, names) {
  return node && node.type === "Identifier" && names.includes(node.name);
}

export default {
  rules: {
    // Replace `var` with `let` (auto-fix)
    "no-var-replace": {
      meta: {
        type: "suggestion",
        fixable: "code",
        docs: { description: "Disallow var; auto-fix to let" },
      },
      create(context) {
        return {
          VariableDeclaration(node) {
            if (node.kind === "var") {
              context.report({
                node,
                message: "Use let/const instead of var.",
                fix(fixer) {
                  const start = Array.isArray(node.range) ? node.range[0] : 0;
                  return fixer.replaceTextRange([start, start + 3], "let");
                },
              });
            }
          },
        };
      },
    },

    // Detect implicit globals (assignments to undeclared identifiers)
    "no-implicit-global-assign": {
      meta: {
        type: "problem",
        docs: { description: "Disallow implicit global assignments (auto-fix by adding let)" },
        fixable: "code",
      },
      create(context) {
        return {
          AssignmentExpression(node) {
            // left = ... where left is an Identifier (not a MemberExpression)
            if (node.left && node.left.type === "Identifier") {
              const name = node.left.name;
              const sourceCode = context.getSourceCode();
              const scopeManager = sourceCode && sourceCode.scopeManager;
              let declared = false;
              if (scopeManager && Array.isArray(scopeManager.scopes)) {
                for (const s of scopeManager.scopes) {
                  if (s && s.set && s.set.has(name)) {
                    declared = true;
                    break;
                  }
                }
              }
              if (!declared) {
                const parent = node.parent;
                // Only fix if assignment is the direct expression statement (e.g., `foo = 1;`)
                if (parent && parent.type === "ExpressionStatement") {
                  context.report({
                    node: node.left,
                    message: `Implicit global assignment to '{{name}}'. Add a declaration to avoid clobbering the global.`,
                    data: { name },
                    fix(fixer) {
                      // Insert `let ` at the start of the expression statement
                      return fixer.insertTextBefore(parent, `let `);
                    },
                  });
                } else {
                  context.report({ node: node.left, message: `Implicit global assignment to '{{name}}'.`, data:{name} });
                }
              }
            }
          },
        };
      },
    },

    // Disallow assignments directly to window/document/globalThis
    "no-window-document-global-assign": {
      meta: {
        type: "problem",
        docs: { description: "Disallow assignments to window/document/globalThis" },
      },
      create(context) {
        return {
          AssignmentExpression(node) {
            const left = node.left;
            if (left && left.type === "MemberExpression") {
              const obj = left.object;
              if (isIdentifierName(obj, ["window", "document", "globalThis"])) {
                context.report({
                  node: left,
                  message: "Assignment to global object '{{name}}' may clobber DOM globals.",
                  data: { name: obj.name },
                });
              }
            } else if (left && left.type === "Identifier") {
              // e.g., `window = something` - assignment to global object name
              if (["window", "document", "globalThis"].includes(left.name)) {
                context.report({
                  node: left,
                  message: "Assignment to global '{{name}}' is disallowed.",
                  data: { name: left.name },
                });
              }
            }
          },
        };
      },
    },

    // Disallow declarations (variables, params, functions) that shadow restricted DOM names
    "no-restricted-dom-names": {
      meta: {
        type: "problem",
        docs: { description: "Disallow using certain names that collide with DOM globals" },
      },
      create(context) {
        function checkId(node, id) {
          if (!id) return;
          if (id.type === "Identifier" && restrictedNames.includes(id.name)) {
            context.report({ node: id, message: `Use of '{{name}}' may clobber DOM globals. Choose a different identifier.`, data: { name: id.name } });
          }
        }

        return {
          VariableDeclarator(node) {
            checkId(node, node.id);
          },
          FunctionDeclaration(node) {
            checkId(node, node.id);
            if (node.params) node.params.forEach((p) => checkId(node, p));
          },
          FunctionExpression(node) {
            if (node.params) node.params.forEach((p) => checkId(node, p));
          },
          ArrowFunctionExpression(node) {
            if (node.params) node.params.forEach((p) => checkId(node, p));
          },
          ClassDeclaration(node) {
            checkId(node, node.id);
          },
        };
      },
    },
  },
};
