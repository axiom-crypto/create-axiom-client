import util from 'util';
// import chalk from 'chalk';
import semver from 'semver';
import childProcess from 'child_process';
const exec = util.promisify(childProcess.exec);

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

    // Check if @axiom-crypto/init is installed globally
    const { stdout: installedVersion } = await exec(`${packageManager} list -g @axiom-crypto/init --depth=0`);
    
    if (installedVersion.includes('@axiom-crypto/init')) {
      // Run @axiom-crypto/init with the "--version" flag
      const { stdout: currentVersion } = await exec(`${packageManager} run @axiom-crypto/init --version`);
      
      // Get the latest version of @axiom-crypto/init
      const { stdout: latestVersion } = await exec(`${packageManager} show @axiom-crypto/init version`);
      
      // Compare the current version with the latest version
      if (semver.gt(latestVersion.trim(), currentVersion.trim())) {
        // Upgrade the global install of @axiom-crypto/init to the latest version
        await exec(`${packageManager} install -g @axiom-crypto/init@latest`);
      }
    } else {
      // Install @axiom-crypto/init globally if it's not installed
      await exec(`${packageManager} install -g @axiom-crypto/init`);
    }
    
    // Run @axiom-crypto/init
    await exec(`${packageManager} run @axiom-crypto/init`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

main();
