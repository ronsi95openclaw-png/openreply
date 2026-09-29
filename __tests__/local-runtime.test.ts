import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSessionUserId } from "@/lib/auth/session";

const projectRoot = path.resolve(__dirname, "..");
const validator = path.join(projectRoot, "scripts/validate-local-env.mjs");
const composeFile = path.join(projectRoot, "docker-compose.local.yml");

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
