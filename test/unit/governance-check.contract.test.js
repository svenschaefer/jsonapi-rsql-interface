const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getTopSectionBeforeJobs,
  extractJobSection,
  extractWorkflowActionRefs
} = require("../../scripts/check-governance.js");

test("getTopSectionBeforeJobs handles CRLF workflow formatting", () => {
  const text = ["name: CI", "permissions:", "  contents: read", "jobs:", "  test:"].join("\r\n");
  const top = getTopSectionBeforeJobs(text);
  assert.match(top, /permissions:/);
  assert.doesNotMatch(top, /jobs:/);
});

test("extractJobSection isolates one job block without bleeding to siblings", () => {
  const text = [
    "jobs:",
    "  release-check:",
    "    runs-on: ubuntu-latest",
    "    permissions:",
    "      contents: read",
    "      id-token: write",
    "  another-job:",
    "    runs-on: ubuntu-latest"
  ].join("\n");
  const section = extractJobSection(text, "release-check");
  assert.match(section, /id-token:\s*write/);
  assert.doesNotMatch(section, /another-job/);
});

test("extractWorkflowActionRefs ignores comments and captures pinned refs", () => {
  const text = [
    "steps:",
    "  - uses: actions/checkout@v4 # pinned",
    "  - uses: actions/setup-node@v4",
    "  - run: npm test"
  ].join("\n");
  const refs = extractWorkflowActionRefs(text);
  assert.deepEqual(refs, ["actions/checkout@v4", "actions/setup-node@v4"]);
});

