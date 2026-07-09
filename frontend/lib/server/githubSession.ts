import "server-only";
import { Octokit } from "@octokit/rest";
import { getGithubSession, type GithubSession } from "./store";

const SESSION_COOKIE = "pullpay_gh_session";
const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

export function githubSessionIdFromRequest(req: Request): string | null {
  return parseCookie(req.headers.get("cookie"), SESSION_COOKIE);
}

export async function githubSessionFromRequest(
  req: Request
): Promise<GithubSession | null> {
  const sessionId = githubSessionIdFromRequest(req);
  if (!sessionId) return null;
  const session = await getGithubSession(sessionId);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

export async function githubUserCanWriteRepo(
  repoFull: string,
  accessToken: string,
  login: string
): Promise<boolean> {
  const [owner, repo, extra] = repoFull.split("/");
  if (!owner || !repo || extra) return false;

  const octo = new Octokit({
    auth: accessToken,
    userAgent: "PullPay",
  });

  try {
    const { data } = await octo.repos.get({ owner, repo });
    const permissions = data.permissions as
      | { admin?: boolean; maintain?: boolean; push?: boolean }
      | undefined;
    if (permissions?.admin || permissions?.maintain || permissions?.push) {
      return true;
    }
  } catch {
    // Fall through to collaborator permission endpoint below.
  }

  try {
    const { data } = await octo.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: login,
    });
    return WRITE_PERMISSIONS.has(data.permission);
  } catch {
    return false;
  }
}
