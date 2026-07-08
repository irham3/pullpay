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
