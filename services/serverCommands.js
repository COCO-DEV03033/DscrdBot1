function isDry() {
  return String(process.env.DRY_RUN_SERVER_COMMANDS || "") === "1";
}

function assertEnv(name) {
  if (!process.env[name]) throw new Error(`${name} is missing in .env`);
}

function sanitizeSteamId(id) {
  const s = String(id || "").replace(/\D/g, "");
//  if (s.length !== 17) {
//    throw new Error(`Steam ID must be exactly 17 digits (got "${id}")`);
//  }
  return s;
}

function sftpBlock() {
  assertEnv("PRIMAL_SFTP_HOST");
  assertEnv("PRIMAL_SFTP_USER");
  assertEnv("PRIMAL_SFTP_PASS");
  assertEnv("PRIMAL_SFTP_PATH");

  return {
    host: process.env.PRIMAL_SFTP_HOST,
    port: Number(process.env.PRIMAL_SFTP_PORT || 22),
    username: process.env.PRIMAL_SFTP_USER,
    password: process.env.PRIMAL_SFTP_PASS,
    remote_path: process.env.PRIMAL_SFTP_PATH
  };
}

function basePayload(steamId) {
  return {
    sftp: sftpBlock(),
    steam_id: sanitizeSteamId(steamId)
  };
}

async function apiFetch(command, payload) {
  if (isDry()) return { ok: true, dryRun: true, command, payload };

  assertEnv("PRIMAL_API_BASE");
  assertEnv("PRIMAL_API_KEY");

  const base = process.env.PRIMAL_API_BASE.replace(/\/$/, "");
  const url = `${base}/commands/${command}`;

  console.log("🌐 Primal URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.PRIMAL_API_KEY
    },
    body: JSON.stringify(payload || {})
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PrimalHeaven ${command} failed (${res.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, raw: text };
  }
}

async function killDino(steamId) {
  return apiFetch("slay", basePayload(steamId));
}

async function setGrowth(steamId, growth) {
  return apiFetch("grow", { ...basePayload(steamId), growth: Number(growth), elder: true });
}

async function setVitalsFull(steamId) {
  return apiFetch("vitals", {
    ...basePayload(steamId),
    hunger: 1,
    thirst: 1,
    stamina: 1,
    hp: 1
  });
}

// ✅ NEW: raw command endpoint helper
async function runRaw(commandString) {
  return apiFetch("raw", {
    sftp: sftpBlock(),
    command: String(commandString || "")
  });
}

// ✅ NEW: diet command (client provided)
async function runDietFull(steamId) {
  const sid = sanitizeSteamId(steamId);
  const cmd = `diet -id=${sid} -steamid -c=1000 -l=1000 -p=1000`;
  return runRaw(cmd);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function stagedRestore(steamId) {
  const g1 = Number(process.env.RESTORE_GROWTH_1 || 0.33);
  const g2 = Number(process.env.RESTORE_GROWTH_2 || 0.54);
  const g3 = Number(process.env.RESTORE_GROWTH_3 || 0.65);

  const delayMs = Number(process.env.RESTORE_STEP_DELAY_SEC || 30) * 1000;
  const vitalDelayMs = Number(process.env.RESTORE_VITAL_DELAY_SEC || 5) * 1000;

  await setGrowth(steamId, g1); await sleep(delayMs);
  await setGrowth(steamId, g2); await sleep(delayMs);
  await setGrowth(steamId, g3); await sleep(delayMs);

  await setVitalsFull(steamId);
  await sleep(vitalDelayMs);          // ✅ client: 5 sec after vitals
  await runDietFull(steamId);         // ✅ client: diet raw command
}

module.exports = {
  killDino,
  setGrowth,
  setVitalsFull,
  stagedRestore,
  runRaw,
  runDietFull
};


