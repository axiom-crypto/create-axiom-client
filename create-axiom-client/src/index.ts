#!/usr/bin/env node

import { oraPromise } from 'ora';
import util from 'util';
import semver from 'semver';
import childProcess from 'child_process';
const exec = util.promisify(childProcess.exec);
const execWithSpinner = (command: string) => oraPromise(() => exec(command), 'Loading...');

async function checkPackageManager() {
  try {
    // Check if pnpm is installed
    const { stdout: pnpmInstalled } = await exec('pnpm --version');
    if (pnpmInstalled) {
      return 'pnpm';
    }

    // Check if yarn is installed
    const { stdout: yarnInstalled } = await exec('yarn --version');
    if (yarnInstalled) {
      return 'yarn';
    }

    // Check if npm is installed
    const { stdout: npmInstalled } = await exec('npm --version');
    if (npmInstalled) {
      return 'npm';
    }

    // If none of the package managers are installed, print a message
    console.log('No supported package manager (pnpm, yarn, npm) is installed. Please install one of them and try again.');
    return null;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function main() {
  try {
    const packageManager = await checkPackageManager();
    if (!packageManager) {
      return;
    }

    // Check if axiom-init is installed globally
    const { stdout: installedVersion } = await exec(`${packageManager} list -g axiom-init --depth=0`);
    
    if (installedVersion.includes('axiom-init')) {
      // Run axiom-init with the "--version" flag
      const { stdout: currentVersion } = await exec(`axiom-init --version`);
      
      // Get the latest version of axiom-init
      const { stdout: latestVersion } = await exec(`${packageManager} show axiom-init version`);
 
      // Compare the current version with the latest version
      if (semver.gt(latestVersion.trim(), currentVersion.trim())) {
        // Upgrade the global install of axiom-init to the latest version
        await execWithSpinner(`${packageManager} install -g axiom-init@latest`);
      }
    } else {
      // Install axiom-init globally if it's not installed
      await execWithSpinner(`${packageManager} install -g axiom-init`);
    }
    
    childProcess.spawn(`axiom-init`, process.argv.slice(2), { stdio: 'inherit', shell: true });
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

main();
