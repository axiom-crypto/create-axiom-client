import path from 'path';
import chalk from 'chalk';
import { ProjectScaffoldManager } from './projectScaffoldManager';

export const scaffoldProject = async (sm: ProjectScaffoldManager, appScaffold: string) => {
  const startingDir = process.cwd();

  // Create folder if it doesn't exist
  if (sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    throw new Error("Please select an empty directory");
  }
  sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);

  // Move to base path
  process.chdir(sm.basePath);

  // Clone quickstart template
  const tempDir = `.axiom-temp-${Date.now()}`;
  console.log("Fetching Axiom quickstart template...");
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, "Clone Axiom quickstart template");
  if (sm.exists(`${path.join(tempDir, ".git")}`, `  - Clone quickstart's ${chalk.bold(".git")} folder exists?`)) {
    await sm.rm(`${path.join(tempDir, ".git")}`, `    - Remove cloned quickstart scaffold's ${chalk.bold(".git")} folder`);
  }
  sm.cp(`${tempDir}/.`, ".", `  - Copy axiom-quickstart files to ${chalk.bold(sm.basePath)}`);

  if (appScaffold === "nextjs") {
    const appPath = "app";

    // Delete app folder
    await sm.rm("app", `  - Remove cloned quickstart scaffold's ${chalk.bold("app")} folder`);

    // Update root package.json to remove start script
    const rootPackageJson = sm.readFile("package.json");
    if (rootPackageJson) {
      const packageJsonObj = JSON.parse(rootPackageJson);
      if (packageJsonObj.scripts && packageJsonObj.scripts.start) {
        delete packageJsonObj.scripts.start;
        sm.writeFile("package.json", JSON.stringify(packageJsonObj, null, 2));
      }
    }

    // Clone next.js scaffold to app folder
    console.log("Fetching Axiom Next.js scaffold...");
    const nextjsTempDir = `.axiom-temp-nextjs-${Date.now()}`; 
    await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${nextjsTempDir}`, "Clone Axiom Next.js scaffold");
    if (sm.exists(`${path.join(nextjsTempDir, ".git")}`, `  - Clone next.js scaffold's ${chalk.bold(".git")} folder exists?`)) {
      await sm.rm(`${path.join(nextjsTempDir, ".git")}`, `    - Remove cloned Next.js scaffold's ${chalk.bold(".git")} folder`);
    }
    sm.cp(`${nextjsTempDir}`, appPath, `  - Copy Next.js scaffold files to ${chalk.bold(sm.basePath)}`);

    await sm.exec(`rm -rf ${nextjsTempDir}`, "Clean up next.js temp files");
  }

  // Remove cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Move back to starting directory
  process.chdir(startingDir);
}