const placeholders = new Set([
  "replace-with-a-long-random-secret",
  "replace-with-64-hex-characters",
  "your-email@example.com",
  "choose-a-long-unique-password",
]);

const required = [
  "NEXTAUTH_SECRET",
  "CRON_SECRET",
  "ENCRYPTION_KEY",
  "WEBHOOK_VERIFY_TOKEN",
  "LOCAL_ADMIN_EMAIL",
  "LOCAL_ADMIN_PASSWORD",
  "DATABASE_URL",
  "REDIS_URL",
];

const missingOrPlaceholder = required.filter((name) => {
  const value = process.env[name]?.trim();
  return !value || placeholders.has(value);
});

if (missingOrPlaceholder.length > 0) {
  console.error(
    `[local setup] Fill in .env.local before starting. Missing or placeholder: ${missingOrPlaceholder.join(", ")}`
  );
  process.exit(1);
}

if (!/^[a-f0-9]{64}$/i.test(process.env.ENCRYPTION_KEY)) {
  console.error("[local setup] ENCRYPTION_KEY must be exactly 64 hexadecimal characters.");
  process.exit(1);
}

if (process.env.LOCAL_ADMIN_PASSWORD.length < 16) {
  console.error("[local setup] LOCAL_ADMIN_PASSWORD must be at least 16 characters.");
  process.exit(1);
}

if (!/^\S+@\S+\.\S+$/.test(process.env.LOCAL_ADMIN_EMAIL)) {
  console.error("[local setup] LOCAL_ADMIN_EMAIL must be a valid email address.");
  process.exit(1);
}

console.log("[local setup] Environment validated.");
