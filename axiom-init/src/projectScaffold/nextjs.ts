import chalk from 'chalk';
import { ProjectScaffoldManager } from "./projectScaffoldManager";
import { scaffoldScript } from './script';
import { setup } from '../setup';

export const scaffoldNext = async (
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
    const { scaffoldManager } = await setup(options, {scaffold: "nextjs"});
    sm = scaffoldManager;
  }
  
  const startingPath = process.cwd();

  await scaffoldScript({ path: sm.basePath, manager: sm.manager, chainId: sm.chainId }, undefined, sm);

  sm.setPath(sm.basePath);

  // Delete app folder
  const appPath = "app";
  await sm.rm(appPath, `  - Remove cloned quickstart scaffold's ${chalk.bold(appPath)} folder`);

  // Update root package.json to remove start script
  const rootPackageJson = sm.readFile("package.json");
  if (rootPackageJson) {
    const packageJsonObj = JSON.parse(rootPackageJson);
    if (packageJsonObj.scripts && packageJsonObj.scripts.start) {
      delete packageJsonObj.scripts.start;
      sm.writeFile("package.json", JSON.stringify(packageJsonObj, null, 2));
    }
  }

  // Clone the Next.js scaffold
  console.log("\nFetching Axiom Next.js scaffold...");
  const tempDir = `.axiom-temp-nextjs-${Date.now()}`; 
  await sm.execWithStream(`git clone -b feat/crosschain --depth 1 https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${tempDir}`, [], "Clone Axiom Next.js scaffold");
  sm.cp(`${tempDir}/.`, appPath, `  - Copy Next.js scaffold files to ${chalk.bold(appPath)}`);

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up next.js build files");

  // Move to base path
  sm.setPath(appPath);

  // Remove .git folder from scaffold repo
  await sm.rm(".git", `  - Remove .git folder from Next.js scaffold`);

  // Handle crosschain files and folders
  sm.handleCrosschainFilesAndFolders("Rename folders for query type");

  // Find and replace all
  sm.findAndReplaceAll("Update chain data");

  // Install package dependencies
  console.log("\nInstalling Next.js scaffold dependencies...");
  await sm.execWithStream(sm.manager, [sm.installCmd], `Install Next.js scaffold dependencies`);

  // Add Next.js files to git
  sm.setPath("..");
  await sm.exec("git add .", "  - Add Next.js files to git");
  await sm.exec("git commit -m 'Add Next.js files'", "  - Add Next.js files commit");

  // cd back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}