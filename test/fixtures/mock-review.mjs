const scenario = process.env.REVIEW_SCENARIO;
const pr = {
  node_id: "PR_mock",
  number: 7,
  draft: false,
  title: "Small change",
  body: "A small change",
  user: { login: "contributor" },
  head: { sha: "abc123", ref: "change", repo: { full_name: "example/repo" } },
  base: { sha: "base123", ref: "main", repo: { full_name: "example/repo" } },
  changed_files: 1,
  additions: 1,
  deletions: 0,
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

globalThis.fetch = async (url, options = {}) => {
  const address = String(url);
  if (address.includes("generativelanguage.googleapis.com")) {
    const dimensions = Object.fromEntries(
      ["blastRadius", "reversibility", "dataSecurity", "operationalImpact", "verificationGap", "changeSurface"]
        .map((name) => [name, { score: scenario === "human" && name === "changeSurface" ? 2 : 0, evidence: ["fixture"] }]),
    );
    return json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: "Fixture assessment", findings: [], dimensions }) }] } }] });
  }
  if (address.endsWith("/check-runs?per_page=100")) {
    return json({ check_runs: [{ name: "ci", status: "completed", conclusion: "success" }] });
  }
  if (address.endsWith("/files?per_page=100")) {
    return json([{ filename: "README.md", status: "modified", additions: 1, deletions: 0 }]);
  }
  if (address.endsWith("/reviews")) {
    const event = JSON.parse(options.body).event;
    if (event === "APPROVE" && scenario === "approval-denied") {
      return json({ message: "not permitted to approve" }, 403);
    }
    console.log(`MOCK_REVIEW=${event}`);
    return json({ id: 1 });
  }
  if (address.endsWith("/graphql")) {
    console.log("MOCK_AUTO_MERGE=enabled");
    return json({ data: { enablePullRequestAutoMerge: { pullRequest: { number: 7 } } } });
  }
  if (address.endsWith("/pulls/7") && options.headers.accept === "application/vnd.github.v3.diff") {
    return new Response("diff --git a/README.md b/README.md\n+small change\n");
  }
  if (address.endsWith("/pulls/7")) return json(pr);
  throw new Error(`Unexpected request: ${address}`);
};
