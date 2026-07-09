import "server-only";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { getInstallation, setInstallation } from "./store";

// GitHub App private keys are stored with \n escapes in env — normalize to a PEM.
function privateKey(): string {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY || "";
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export function githubAppConfigured(): boolean {
  return Boolean(process.env.GITHUB_APP_ID) && Boolean(process.env.GITHUB_APP_PRIVATE_KEY);
}

export function parseRepoFullName(
  repoFull: string
): { owner: string; repo: string } | null {
  const [owner, repo, extra] = repoFull.split("/");
  if (!owner || !repo || extra) return null;
  return { owner, repo };
}

function appAuth() {
  return { appId: process.env.GITHUB_APP_ID!, privateKey: privateKey() };
}

/** App-level client (JWT) — for discovering installations. */
export function appOctokit() {
  return new Octokit({ authStrategy: createAppAuth, auth: appAuth() });
}

/** Installation-scoped client — can act on the repos the App is installed on. */
export function installationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { ...appAuth(), installationId },
  });
}

// Resolve (and cache) the installation id covering a repo.
export async function resolveInstallationId(
  owner: string,
  repo: string
): Promise<number | null> {
  const cached = await getInstallation(owner);
  if (cached) return cached;
  try {
    const { data } = await appOctokit().apps.getRepoInstallation({ owner, repo });
    await setInstallation(owner, data.id);
    return data.id;
  } catch {
    return null;
  }
}

async function octokitForRepo(owner: string, repo: string) {
  if (!githubAppConfigured()) return null;
  const id = await resolveInstallationId(owner, repo);
  return id ? installationOctokit(id) : null;
}

function issueLabels(labels: Array<{ name?: string } | string> | null | undefined) {
  return (labels ?? [])
    .map((l) => (typeof l === "string" ? l : (l.name ?? "")))
    .filter(Boolean);
}

export interface GithubIssueSummary {
  number: number;
  title: string;
  labels: string[];
  state: string;
  url: string;
}

export interface CreatedGithubIssue extends GithubIssueSummary {
  language: string | null;
}

/** List open issues via the installation token, including private repos. */
export async function listOpenIssues(
  repoFull: string
): Promise<GithubIssueSummary[] | null> {
  const parsed = parseRepoFullName(repoFull);
  if (!parsed) return null;
  const octo = await octokitForRepo(parsed.owner, parsed.repo);
  if (!octo) return null;

  const { data } = await octo.issues.listForRepo({
    owner: parsed.owner,
    repo: parsed.repo,
    state: "open",
    per_page: 50,
    sort: "created",
    direction: "desc",
  });

  return data
    .filter((item) => !item.pull_request)
    .map((item) => ({
      number: item.number,
      title: item.title,
      labels: issueLabels(item.labels),
      state: item.state,
      url: item.html_url,
    }));
}

/** Create a GitHub issue from PullPay after caller authorization is checked. */
export async function createIssue(
  repoFull: string,
  input: { title: string; body?: string; labels?: string[] }
): Promise<CreatedGithubIssue> {
  const parsed = parseRepoFullName(repoFull);
  if (!parsed) throw new Error("Invalid repo");
  const octo = await octokitForRepo(parsed.owner, parsed.repo);
  if (!octo) throw new Error("PullPay GitHub App is not installed on this repo");

  const labels = (input.labels ?? [])
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 10);

  const issueRes = await octo.issues.create({
    owner: parsed.owner,
    repo: parsed.repo,
    title: input.title,
    body: input.body,
    labels: labels.length > 0 ? labels : undefined,
  });

  let language: string | null = null;
  try {
    const repoRes = await octo.repos.get({ owner: parsed.owner, repo: parsed.repo });
    language = repoRes.data.language ?? null;
  } catch {
    language = null;
  }

  return {
    number: issueRes.data.number,
    title: issueRes.data.title,
    labels: issueLabels(issueRes.data.labels),
    state: issueRes.data.state,
    url: issueRes.data.html_url,
    language,
  };
}

/** Post a comment on an issue or PR (same endpoint). Best-effort. */
export async function comment(
  repoFull: string,
  issueOrPr: number,
  body: string
): Promise<boolean> {
  const [owner, repo] = repoFull.split("/");
  const octo = await octokitForRepo(owner, repo);
  if (!octo) return false;
  try {
    await octo.issues.createComment({ owner, repo, issue_number: issueOrPr, body });
    return true;
  } catch {
    return false;
  }
}

/** Set a commit status / check on the PR head (best-effort). */
export async function setPrStatus(
  repoFull: string,
  sha: string,
  state: "pending" | "success" | "failure",
  description: string
): Promise<boolean> {
  const [owner, repo] = repoFull.split("/");
  const octo = await octokitForRepo(owner, repo);
  if (!octo) return false;
  try {
    await octo.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description,
      context: "PullPay",
    });
    return true;
  } catch {
    return false;
  }
}
