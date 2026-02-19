const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractJsonCandidate,
  parseAuditJson,
  countVulnerabilities
} = require("../../scripts/audit-runtime.js");

test("extractJsonCandidate returns direct JSON payloads", () => {
  const src = '{"metadata":{"vulnerabilities":{"low":0}}}';
  assert.equal(extractJsonCandidate(src), src);
});

test("extractJsonCandidate strips surrounding tool noise", () => {
  const src = "npm notice\n{\"metadata\":{\"vulnerabilities\":{\"critical\":0}}}\ntrailer";
  assert.equal(extractJsonCandidate(src), "{\"metadata\":{\"vulnerabilities\":{\"critical\":0}}}");
});

test("parseAuditJson parses embedded JSON output", () => {
  const payload = parseAuditJson("warning text\n{\"metadata\":{\"vulnerabilities\":{\"high\":1}}}");
  assert.equal(payload.metadata.vulnerabilities.high, 1);
});

test("countVulnerabilities sums known severity levels deterministically", () => {
  const total = countVulnerabilities({
    metadata: {
      vulnerabilities: {
        critical: 1,
        high: 2,
        moderate: 3,
        low: 4,
        info: 5
      }
    }
  });
  assert.equal(total, 15);
});

