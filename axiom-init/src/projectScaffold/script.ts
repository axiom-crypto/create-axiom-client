import chalk from 'chalk';
import { ProjectScaffoldManager } from "./projectScaffoldManager"
import { setup } from '../setup';

export const scaffoldScript = async (
  options: {
    path: string,
    manager: string,
    chainId: string,
  },
  _commands: any, // unused commands from commander.js
  sm?: ProjectScaffoldManager,
) => {
  let shouldPrint = false;
  if (sm === undefined) {
    shouldPrint = true;
    const { scaffoldManager } = await setup(options, {scaffold: "script"});
    sm = scaffoldManager;
  }

  const startingPath = process.cwd();

  // Create folder if it doesn't exist
  if (sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    throw new Error("Please select an empty directory");
  }
  sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);

  // Move to base path
  sm.setPath(sm.basePath);

  // Clone the axiom-quickstart template
  console.log("\nFetching Axiom quickstart template...");
  const tempDir = `.axiom-temp-${Date.now()}`; 
  await sm.execWithStream(`git clone -b feat/crosschain --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, [], "Clone Axiom quickstart template");
  sm.cp(`${tempDir}/.`, ".", `  - Copy files to ${chalk.bold(sm.basePath)}`);

  // Remove .git folder from cloned quickstart scaffold
  await sm.rm(".git", `  - Remove .git folder from cloned quickstart scaffold`);

  // Remove lib folder from cloned quickstart scaffold
  await sm.rm("lib", `  - Remove lib folder from cloned quickstart scaffold`);

  // Initialize git repo
  await sm.exec("git init", "Initialize git repository");

  // Create an inital commit
  await sm.execWithStream("git add .", [], "  - Add all files to git");
  await sm.execWithStream("git commit -m 'Initial commit'", [], "  - Create initial commit");

  // Install axiom-std
  await sm.execWithStream("forge install axiom-crypto/axiom-std", [], "Install axiom-std");

  // Find and replace all
  sm.findAndReplaceAll("Update chain data");

  // Install package dependencies
  console.log("\nInstalling package dependencies...");
  await sm.execWithStream(sm.manager, [sm.installCmd], `Install package dependencies`);

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  await sm.execWithStream("git add .", [], "  - Add updated chain data files to git");
  await sm.execWithStream("git commit -m 'Update chain data'", [], "  - Update chain data commit");

  // cd back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}
