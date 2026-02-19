const { throwCompilationError } = require("../errors");

const OPERATORS = ["=in=", "=out=", "==", "!=", ">=", "<=", ">", "<"];

function splitTopLevel(expr) {
  const parts = [];
  let current = "";
  let depth = 0;
  let maxDepth = 0;

  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (ch === "(") {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
      current += ch;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth < 0) {
        throwCompilationError("invalid_filter_syntax", "Unbalanced filter parentheses.", {
          parameter: "filter"
        });
      }
      current += ch;
      continue;
    }
    if ((ch === ";" || ch === ",") && depth === 0) {
      if (current.trim().length > 0) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (depth !== 0) {
    throwCompilationError("invalid_filter_syntax", "Unbalanced filter parentheses.", {
      parameter: "filter"
    });
  }

  if (current.trim().length > 0) parts.push(current.trim());
  return { parts, maxDepth };
}

function stripOuterParens(text) {
  let value = text.trim();
  while (value.startsWith("(") && value.endsWith(")")) {
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (depth === 0 && i < value.length - 1) {
        balanced = false;
        break;
      }
    }
    if (!balanced) break;
    value = value.slice(1, -1).trim();
  }
  return value;
}

function detectOperator(clause) {
  for (const op of OPERATORS) {
    const idx = clause.indexOf(op);
    if (idx > 0) {
      return { op, idx };
    }
  }
  return null;
}

function parseList(raw) {
  const text = raw.trim();
  if (!text.startsWith("(") || !text.endsWith(")")) return null;
  const inner = text.slice(1, -1).trim();
  if (inner.length === 0) return [];
  return inner
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function parseClause(clauseText) {
  const clause = stripOuterParens(clauseText);
  const opInfo = detectOperator(clause);
  if (!opInfo) {
    throwCompilationError("invalid_filter_syntax", "Invalid filter clause.", {
      parameter: "filter"
    });
  }
  const field = clause.slice(0, opInfo.idx).trim();
  const raw = clause.slice(opInfo.idx + opInfo.op.length).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
    throwCompilationError("invalid_filter_syntax", `Invalid filter field: ${field}.`, {
      parameter: "filter"
    });
  }

  if ((opInfo.op === "=in=" || opInfo.op === "=out=") && parseList(raw) === null) {
    throwCompilationError("invalid_filter_syntax", "Membership operators require list syntax.", {
      parameter: "filter"
    });
  }

  const values = opInfo.op === "=in=" || opInfo.op === "=out=" ? parseList(raw) : [raw];
  return {
    field,
    operator: opInfo.op,
    raw_values: values
  };
}

function parseExpression(expr, depth) {
  const text = stripOuterParens(expr.trim());
  const split = splitTopLevel(text);
  if (split.parts.length === 0) return { clauses: [], maxDepth: depth, nodeCount: 0 };
  if (split.parts.length === 1) {
    const part = stripOuterParens(split.parts[0]);
    const nested = splitTopLevel(part);
    if (nested.parts.length > 1) {
      const out = parseExpression(part, depth + 1);
      return {
        clauses: out.clauses,
        maxDepth: Math.max(out.maxDepth, depth + nested.maxDepth),
        nodeCount: out.nodeCount + 1
      };
    }
    return {
      clauses: [parseClause(part)],
      maxDepth: Math.max(depth, depth + split.maxDepth),
      nodeCount: 1
    };
  }

  const clauses = [];
  let maxDepth = depth + split.maxDepth;
  let nodeCount = 1;
  for (const part of split.parts) {
    const parsed = parseExpression(part, depth + 1);
    clauses.push(...parsed.clauses);
    maxDepth = Math.max(maxDepth, parsed.maxDepth);
    nodeCount += parsed.nodeCount;
  }
  return { clauses, maxDepth, nodeCount };
}

function parseFilterExpression(filterText) {
  if (typeof filterText !== "string" || filterText.trim().length === 0) {
    return { clauses: [], complexity: { ast_depth: 0, ast_nodes: 0 } };
  }

  const parsed = parseExpression(filterText, 1);
  return {
    clauses: parsed.clauses,
    complexity: {
      ast_depth: parsed.maxDepth,
      ast_nodes: parsed.nodeCount
    }
  };
}

module.exports = {
  parseFilterExpression
};
