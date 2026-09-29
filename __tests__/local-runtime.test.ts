import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSessionUserId } from "@/lib/auth/session";

const projectRoot = path.resolve(__dirname, "..");
const validator = path.join(projectRoot, "scripts/validate-local-env.mjs");
const composeFile = path.join(projectRoot, "docker-compose.local.yml");
const wslStarter = path.join(projectRoot, "scripts/start-openreply-wsl.ps1");
const wslPathResolver = path.join(projectRoot, "scripts/resolve-wsl-path.ps1");
const reel3Runbook = path.join(projectRoot, "docs/REEL3_SHIFT_RUNBOOK.md");

function localEnv(
  overrides: Record<string, string | undefined> = {}
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NEXTAUTH_SECRET: "a".repeat(32),
    CRON_SECRET: "b".repeat(32),
    ENCRYPTION_KEY: "c".repeat(64),
    WEBHOOK_VERIFY_TOKEN: "d".repeat(32),
    LOCAL_ADMIN_EMAIL: "owner@example.com",
    LOCAL_ADMIN_PASSWORD: "a-password-that-is-long-enough",
    DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/openreply",
    REDIS_URL: "redis://redis:6379",
    ...overrides,
  } as NodeJS.ProcessEnv;
}

describe("local PC runtime", () => {
  it("keeps the normal local port private while allowing the deployed bind and admin settings", () => {
    const compose = readFileSync(composeFile, "utf8");

    expect(compose).toContain("- .env.local-admin");
    expect(compose).toContain(
      '"${OPENREPLY_BIND_ADDRESS:-127.0.0.1}:${OPENREPLY_HOST_PORT:-3000}:3000"'
    );
  });

  it("keeps the scheduled clean-runtime startup separate from migrations", () => {
    const starter = readFileSync(wslStarter, "utf8");
    const runbook = readFileSync(reel3Runbook, "utf8");
    const appOnlyStart =
      "up -d --build --no-deps dashboard worker cron";

    expect(starter).toContain("$PSScriptRoot");
    expect(starter).toContain("resolve-wsl-path.ps1");
    expect(starter).toContain(".env.local-admin");
    expect(starter).toContain(appOnlyStart);
    expect(starter).not.toMatch(/db:migrate|migrate deploy/);
    const resolver = readFileSync(wslPathResolver, "utf8");
    expect(resolver).toContain(
      '.Replace("\\", "/")'
    );
    expect(resolver).toContain(
      "if ($null -eq $wslPathOutput)"
    );
    expect(resolver.indexOf("if ($wslExitCode -ne 0)")).toBeLessThan(
      resolver.indexOf(".Trim()")
    );
    expect(resolver.indexOf("if ($null -eq $wslPathOutput)")).toBeLessThan(
      resolver.indexOf(".Trim()")
    );
    expect(runbook).toContain(appOnlyStart);
    expect(runbook).toContain("run --rm --no-deps --build migrate");
    expect(runbook).toContain(
      "Do **not** repoint `OpenReply WSL\nRuntime` at the old checkout or start it"
    );
    expect(runbook).toContain(
      "does not restore automatic restart after sign-in"
    );
    expect(runbook).not.toContain("$candidate = $rollback");
  });

  it.skipIf(process.platform !== "win32")(
    "converts the actual Windows project path with read-only wslpath",
    () => {
      const converted = execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          wslPathResolver,
          "-WindowsPath",
          projectRoot,
        ],
        { encoding: "utf8" }
      ).trim();

      const windowsSuffix = projectRoot.replace(/\\/g, "/").slice(2);
      expect(converted).toMatch(/^\/mnt\/[a-z]\//i);
      expect(converted).toContain(windowsSuffix);
      expect(converted).not.toContain("\\");
    }
  );

  it("keeps a JWT-session user id when the database user is absent", () => {
    expect(getSessionUserId(undefined, "jwt-user")).toBe("jwt-user");
    expect(getSessionUserId("database-user", "jwt-user")).toBe("database-user");
    expect(getSessionUserId(undefined, undefined)).toBeNull();
  });

  it("rejects placeholder local secrets before a container starts", () => {
    expect(() =>
      execFileSync(process.execPath, [validator], {
        cwd: projectRoot,
        env: localEnv({ NEXTAUTH_SECRET: "replace-with-a-long-random-secret" }),
        stdio: "pipe",
      })
    ).toThrow();
  });

  it.each(["NEXTAUTH_SECRET", "CRON_SECRET", "WEBHOOK_VERIFY_TOKEN"])(
    "rejects a short %s before a container starts",
    (name) => {
      expect(() =>
        execFileSync(process.execPath, [validator], {
          cwd: projectRoot,
          env: localEnv({ [name]: "too-short" }),
          stdio: "pipe",
        })
      ).toThrow();
    }
  );

  it("accepts generated-length local secrets in a complete runtime environment", () => {
    expect(() =>
      execFileSync(process.execPath, [validator], {
        cwd: projectRoot,
        env: localEnv(),
        stdio: "pipe",
      })
    ).not.toThrow();
  });
});
