import { spawnSync } from "node:child_process";

const defaultShadowDatabaseUrl =
  "postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay_shadow?schema=public";

const shadowDatabaseUrl =
  process.env.SHADOW_DATABASE_URL || defaultShadowDatabaseUrl;
const shadowUrl = new URL(shadowDatabaseUrl);
const shadowDatabaseName = databaseNameFromUrl(shadowUrl);
const ownerName = decodeURIComponent(shadowUrl.username || "fairplay");
const maintenanceUrl = connectionUrlForDatabase(shadowDatabaseUrl, "postgres");

if (!shadowDatabaseName) {
  fail("SHADOW_DATABASE_URL must include a database name.");
}

if (awaitShadowDatabaseExists()) {
  console.log(`Shadow database ${shadowDatabaseName} is ready.`);
  process.exit(0);
}

const createWithAppUser = run("psql", [
  maintenanceUrl,
  "-v",
  "ON_ERROR_STOP=1",
  "-c",
  `CREATE DATABASE ${sqlIdentifier(shadowDatabaseName)} OWNER ${sqlIdentifier(
    ownerName
  )};`
]);

if (createWithAppUser.status === 0) {
  console.log(`Created shadow database ${shadowDatabaseName}.`);
  process.exit(0);
}

if (isLocalhost(shadowUrl.hostname)) {
  const createWithLocalAdmin = run("psql", [
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `CREATE DATABASE ${sqlIdentifier(shadowDatabaseName)} OWNER ${sqlIdentifier(
      ownerName
    )};`
  ]);

  if (createWithLocalAdmin.status === 0) {
    console.log(`Created shadow database ${shadowDatabaseName} with local admin.`);
    process.exit(0);
  }
}

fail(
  [
    `Could not create Prisma shadow database ${shadowDatabaseName}.`,
    "Create it once with a database admin, or set SHADOW_DATABASE_URL to an existing empty database.",
    `Suggested SQL: CREATE DATABASE ${sqlIdentifier(
      shadowDatabaseName
    )} OWNER ${sqlIdentifier(ownerName)};`,
    "App-user attempt:",
    createWithAppUser.stderr || createWithAppUser.stdout || "no output"
  ].join("\n")
);

function awaitShadowDatabaseExists() {
  const result = run("psql", [
    maintenanceUrl,
    "-Atc",
    `SELECT 1 FROM pg_database WHERE datname = ${sqlLiteral(shadowDatabaseName)};`
  ]);

  return result.status === 0 && result.stdout.trim() === "1";
}

function connectionUrlForDatabase(input, databaseName) {
  const url = new URL(input);

  url.pathname = `/${databaseName}`;
  url.searchParams.delete("schema");

  return url.toString();
}

function databaseNameFromUrl(url) {
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(shadowUrl.password)
    }
  });

  if (result.error?.code === "ENOENT") {
    fail(`${command} is required for local database setup but was not found.`);
  }

  return {
    status: result.status ?? 1,
    stderr: result.stderr.trim(),
    stdout: result.stdout.trim()
  };
}

function sqlIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
