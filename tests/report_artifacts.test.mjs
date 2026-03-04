import test from "node:test";
import assert from "node:assert/strict";

import { fetchReportJsonArtifact, fetchReportPdfArtifact } from "../src/lib/report/artifacts";

test("report detail uses artifact_json_url for JSON render", async () => {
  let calledUrl = null;
  const payload = await fetchReportJsonArtifact({
    artifactJsonUrl: "/v1/reports/r1/artifact.json",
    token: "token-1",
    origin: "https://api.example.test",
    fetchImpl: async (input, init) => {
      calledUrl = String(input);
      assert.equal(init?.headers?.Authorization, "Bearer token-1");
      return new Response(JSON.stringify({ sections: [{ title: "Summary" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(calledUrl, "https://api.example.test/v1/reports/r1/artifact.json");
  assert.deepEqual(payload, { sections: [{ title: "Summary" }] });
});

test("PDF fetch uses artifact_url and expects application/pdf", async () => {
  let accept = null;
  const blob = await fetchReportPdfArtifact({
    artifactUrl: "/v1/reports/r1/artifact.pdf",
    token: "token-1",
    origin: "https://api.example.test",
    fetchImpl: async (_input, init) => {
      accept = init?.headers?.Accept;
      return new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    },
  });

  assert.equal(accept, "application/pdf");
  assert.equal(blob.type, "application/pdf");
});


test("PDF fetch rejects non-pdf content-type with friendly diagnostics", async () => {
  await assert.rejects(
    () =>
      fetchReportPdfArtifact({
        artifactUrl: "/v1/reports/r1/artifact.pdf",
        token: "token-1",
        origin: "https://api.example.test",
        fetchImpl: async () =>
          new Response("{}", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      }),
    (error) => {
      assert.equal(error.code, "UNEXPECTED_CONTENT_TYPE");
      assert.match(error.message, /Expected PDF artifact but received 200 \(application\/json\)/);
      return true;
    },
  );
});
