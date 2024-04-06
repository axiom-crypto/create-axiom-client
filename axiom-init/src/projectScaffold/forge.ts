import path from 'path';
import chalk from 'chalk';
import { ProjectScaffoldManager } from "./projectScaffoldManager";

export const scaffoldForge = async (options: { path: string, packageMgr?: string }, _commands: any, sm?: ProjectScaffoldManager) => {
  let shouldPrint = false;
  if (sm === undefined) {
    sm = new ProjectScaffoldManager(options.path, options.packageMgr || 'npm');
    shouldPrint = true;
  }

  const startingPath = process.cwd();

  // Create folder if it doesn't exist
  if (sm.exists(options.path, `Directory ${chalk.bold(options.path)} exists?`)) {
    throw new Error("Please select an empty directory");
  }
  sm.mkdir(options.path, `  - Create directory ${chalk.bold(options.path)}`);

  // Move to base path
  process.chdir(options.path);

  // Clone the axiom-quickstart repository
  console.log("Fetching Axiom quickstart template...");
  const tempDir = `.axiom-temp-${Date.now()}`; 
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, "Clone Axiom quickstart template");

  // Delete the 'app' folder
  await sm.exec(`rm -rf ${tempDir}/app`, "Remove the 'app' folder");

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Move back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
};
