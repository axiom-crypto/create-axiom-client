import util from 'util';
import childProcess from 'child_process';
import chalk from 'chalk';
import { SCAFFOLD_VERSION } from './version';
const exec = util.promisify(childProcess.exec);

export const checkVersion = async () => {
  const { stdout } = await exec("npx create-axiom-client@latest --version");
  const versionString = stdout.trim();
  const localVersion = SCAFFOLD_VERSION.split(".");
  const remoteVersion = versionString.split(".");
  let isLessThan = false;
  for (let i = 2; i >= 0; i--) {
    if (parseInt(localVersion[i]) < parseInt(remoteVersion[i])) {
      isLessThan = true
    }
  }
  if (isLessThan) {
    // Display upgrade notice
    console.log(chalk.bold(`\nA newer version (v${stdout}) of create-axiom-client is available!`));
    console.log(`Use the latest version by re-running with ${chalk.bold("npx create-axiom-client@latest")}\n`)
  }
}