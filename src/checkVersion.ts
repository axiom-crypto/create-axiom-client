import util from 'util';
import childProcess from 'child_process';
import chalk from 'chalk';
import { SCAFFOLD_VERSION } from './version';
const exec = util.promisify(childProcess.exec);

export const checkVersion = async () => {
  const { stdout } = await exec("npx create-axiom-client@latest --version");
  const localVersion = SCAFFOLD_VERSION.split(".");
  const remoteVersion = stdout.split(" v")[1].split(".");
  let isLessThan = false;
  for (let i = 2; i >= 0; i--) {
    if (parseInt(localVersion[i]) < parseInt(remoteVersion[i])) {
      isLessThan = true
    }
  }
  if (isLessThan) {
    // Display upgrade notice
    console.log(chalk.bold("New version of create-axiom-client is available"));
  }
}