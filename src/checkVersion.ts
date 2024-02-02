import util from 'util';
import chalk from 'chalk';
import semver from 'semver';
import childProcess from 'child_process';
import { SCAFFOLD_VERSION } from './version';
const exec = util.promisify(childProcess.exec);

export const checkVersion = async (): Promise<void> => {
  let version;
  try {
    const { stdout } = await exec(`npx create-axiom-client@latest --version`, { timeout: 20 });
    version = stdout;
  }
  catch (_e) {
    // Just pass the version check if exec fails for any reason
  }
  version = version ?? "999.0.0";
  console.log("exec finished");
  const remoteVersion = version.trim();
  const isCurrentVersion = semver.gte(SCAFFOLD_VERSION, remoteVersion);
  if (!isCurrentVersion) {
    console.log("not current version");
    console.log(chalk.bold(`\nA newer version of create-axiom-client is available!`));
    console.log(`Cleaning previous version...`);
    const { stdout: cacheOut } = await exec("npm cache ls create-axiom-client");
    if (cacheOut.length > 0) {
      const entries = cacheOut.replace(/\n/g, " ");
      await exec(`npm cache clean ${entries}`);
    }
    console.log(`Old installation cleaned. Please try running ${chalk.bold("npx create-axiom-client")} again.`);
    process.exit();
  }
}