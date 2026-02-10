function isDry() {
  return String(process.env.DRY_RUN_SERVER_COMMANDS || "") === "1";
}

function assertEnv(name) {
  if (!process.env[name]) throw new Error(`${name} is missing in .env`);
}

function basePayload(steamId) {
  assertEnv("PRIMAL_SFTP_HOST");
  assertEnv("PRIMAL_SFTP_USER");
  assertEnv("PRIMAL_SFTP_PASS");
  assertEnv("PRIMAL_SFTP_PATH");

  return {
    sftp: {
      host: process.env.PRIMAL_SFTP_HOST,
      port: Number(process.env.PRIMAL_SFTP_PORT || 22),
      username: process.env.PRIMAL_SFTP_USER,
      password: process.env.PRIMAL_SFTP_PASS,
      remote_path: process.env.PRIMAL_SFTP_PATH
    },
    steam_id: String(steamId)
  };
}

async function apiFetch(command, payload) {

  // const base = process.env.PRIMAL_API_BASE.replace(/\/$/, "");
  // const url = `${base}/commands/${command}`;   // ✅ define FIRST


  if (isDry()) return { ok: true, dryRun: true, command, payload };

  assertEnv("PRIMAL_API_BASE");
  assertEnv("PRIMAL_API_KEY");

  const base = process.env.PRIMAL_API_BASE.replace(/\/$/, "");
  const url = `${base}/commands/${command}`;
  
  console.log("🌐 Primal URL:", url);          // ✅ log AFTER

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

  try { return JSON.parse(text); } catch { return { ok: true, raw: text }; }
}

async function killDino(steamId) {
  return apiFetch("slay", basePayload(steamId));
}

async function setGrowth(steamId, growth) {
  return apiFetch("growth", { ...basePayload(steamId), growth: Number(growth) });
}

async function setVitalsFull(steamId) {
  return apiFetch("vitals", {
    ...basePayload(steamId),
    hunger: 1, thirst: 1, stamina: 1, hp: 1
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function stagedRestore(steamId) {
  const g1 = Number(process.env.RESTORE_GROWTH_1 || 0.33);
  const g2 = Number(process.env.RESTORE_GROWTH_2 || 0.54);
  const g3 = Number(process.env.RESTORE_GROWTH_3 || 0.65);
  const delayMs = Number(process.env.RESTORE_STEP_DELAY_SEC || 30) * 1000;

  await setGrowth(steamId, g1); await sleep(delayMs);
  await setGrowth(steamId, g2); await sleep(delayMs);
  await setGrowth(steamId, g3); await sleep(delayMs);
  await setVitalsFull(steamId);
}

module.exports = { killDino, setGrowth, setVitalsFull, stagedRestore };
