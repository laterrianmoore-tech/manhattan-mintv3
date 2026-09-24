// Node wrapper for sync-b2b-tracker.py. The scheduled outbound run's shell has no
// `python` on PATH (2026-09-24: "python: command not found" hung the run), so
// the task calls this instead and it finds a Python itself.
//   node C:/Users/lmoore/manhattan-mint/scripts/sync-b2b-tracker.mjs [--apply]
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "sync-b2b-tracker.py");
const args = process.argv.slice(2);

const candidates = [
  process.env.MM_PYTHON,
  "C:/Users/lmoore/AppData/Local/Python/pythoncore-3.14-64/python.exe",
  "C:/Users/lmoore/AppData/Local/Programs/Python/Python313/python.exe",
  "C:/Users/lmoore/AppData/Local/Programs/Python/Python312/python.exe",
  "python", "python3", "py",
].filter(Boolean);

let ran = false;
for (const py of candidates) {
  if (py.includes("/") && !existsSync(py)) continue;
  const r = spawnSync(py, py === "py" ? ["-3", script, ...args] : [script, ...args], {
    stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (r.error && r.error.code === "ENOENT") continue; // not installed, try the next one
  ran = true;
  process.exit(r.status ?? 1);
}
if (!ran) { console.error("No Python found. Set MM_PYTHON to the python.exe path."); process.exit(1); }
