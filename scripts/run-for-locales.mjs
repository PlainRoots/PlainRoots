import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadSupportedLocaleIds } from "./locales.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const [scriptName, ...args] = process.argv.slice(2);
if (!scriptName || path.basename(scriptName) !== scriptName) {
  throw new Error("Expected a script filename as the first argument");
}

const requestedLocale = argumentValue(args, "--locale");
const localeIds = requestedLocale
  ? [requestedLocale]
  : await loadSupportedLocaleIds(projectRoot);
for (const localeId of localeIds) {
  const localeArgs = requestedLocale
    ? args
    : [...args, "--locale", localeId];
  await run(process.execPath, [
    path.join(projectRoot, "scripts", scriptName),
    ...localeArgs
  ]);
}

function argumentValue(cliArgs, name) {
  const index = cliArgs.indexOf(name);
  const value = index === -1 ? null : cliArgs[index + 1];
  return !value || value.startsWith("--") ? null : value;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(command)} exited with code ${code}`));
      }
    });
  });
}
