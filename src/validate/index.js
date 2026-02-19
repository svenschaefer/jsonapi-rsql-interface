const { CompilationError } = require("../errors");

function validatePlan(plan) {
  if (!plan || typeof plan !== "object") {
    throw new CompilationError(
      "invalid_query_string",
      400,
      "Invalid plan",
      "Plan must be an object."
    );
  }
  if (plan.kind !== "query_plan") {
    throw new CompilationError(
      "invalid_query_string",
      400,
      "Invalid plan",
      "Plan kind must be query_plan."
    );
  }
  if (!plan.meta || typeof plan.meta !== "object") {
    throw new CompilationError(
      "invalid_query_string",
      400,
      "Invalid plan",
      "Plan meta object is required."
    );
  }

  return { ok: true };
}

module.exports = {
  validatePlan
};
