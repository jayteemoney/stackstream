#!/usr/bin/env node

const owner = process.env.VERCEL_GIT_REPO_OWNER;
const repo = process.env.VERCEL_GIT_REPO_SLUG;
const ref = process.env.VERCEL_GIT_COMMIT_REF;
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
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

if (!commitSha) {
  fail("missing VERCEL_GIT_COMMIT_SHA");
}

const url = new URL(apiUrl);
url.searchParams.set("state", "open");
url.searchParams.set("base", "main");
url.searchParams.set("per_page", "100");

const openPullRequests = await request(url);
const matchingPullRequests = openPullRequests.filter(
  (pr) => pr.head?.sha === commitSha
);
const blockedPullRequest = matchingPullRequests.find(
  (pr) => !isSameRepoStaging(pr)
);

if (blockedPullRequest) {
  fail(
    `PR #${blockedPullRequest.number} targets main from ${blockedPullRequest.head?.repo?.full_name}:${blockedPullRequest.head?.ref}; only ${owner}/${repo}:staging may target main`
  );
}

if (matchingPullRequests.length > 0) {
  allow("commit is part of a staging promotion");
}

allow(`${ref} has no open promotion PR to main`);
