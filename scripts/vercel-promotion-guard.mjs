#!/usr/bin/env node

const owner = process.env.VERCEL_GIT_REPO_OWNER;
const repo = process.env.VERCEL_GIT_REPO_SLUG;
const ref = process.env.VERCEL_GIT_COMMIT_REF;
const pullRequestId = process.env.VERCEL_GIT_PULL_REQUEST_ID;

const fail = (message) => {
  console.error(`Promotion guard: ${message}`);
  process.exit(1);
};

const allow = (message) => {
  console.log(`Promotion guard: ${message}`);
  process.exit(0);
};

if (!owner || !repo || !ref) {
  allow("not a Vercel Git build; skipping");
}

const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "stackstream-promotion-guard",
};

const request = async (url) => {
  let response;

  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    fail(`GitHub request failed: ${error.message}`);
  }

  if (!response.ok) {
    fail(`GitHub API returned ${response.status}`);
  }

  return response.json();
};

const isSameRepoStaging = (pr) =>
  pr.head?.repo?.full_name === `${owner}/${repo}` && pr.head?.ref === "staging";

if (pullRequestId) {
  const pr = await request(`${apiUrl}/${pullRequestId}`);

  if (pr.base?.ref === "main" && !isSameRepoStaging(pr)) {
    fail(
      `PR #${pr.number} targets main from ${pr.head?.repo?.full_name}:${pr.head?.ref}; only ${owner}/${repo}:staging may target main`
    );
  }

  allow(
    pr.base?.ref === "main"
      ? `PR #${pr.number} is a staging promotion`
      : `PR #${pr.number} targets ${pr.base?.ref}, not main`
  );
}

if (ref === "main" || ref === "staging") {
  allow(`${ref} is a protected deployment branch`);
}

const url = new URL(apiUrl);
url.searchParams.set("state", "open");
url.searchParams.set("head", `${owner}:${ref}`);

const openPullRequests = await request(url);
const promotionPullRequest = openPullRequests.find(
  (pr) => pr.base?.ref === "main" && pr.head?.repo?.full_name === `${owner}/${repo}`
);

if (promotionPullRequest) {
  fail(
    `PR #${promotionPullRequest.number} targets main from ${ref}; only staging may target main`
  );
}

allow(`${ref} has no open promotion PR to main`);
