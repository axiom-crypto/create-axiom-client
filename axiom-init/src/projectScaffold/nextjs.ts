import chalk from 'chalk';
import prompt, { PromptObject } from 'prompts';
import { ProjectScaffoldManager } from "./projectScaffoldManager";
import { validatePackageManager } from './dependency';
import { Options, Prompts } from '../constants';
import { filterQuestions, parseAnswer } from './utils';
import { scaffoldScript } from './script';

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

    // List of questions
    let setupQuestions: PromptObject[] = [
      Prompts.path,
      Prompts.manager,
      Prompts.chainId,
    ];

    // Remove prompt for path if it's already passed in
    if (options.path !== undefined) {
      setupQuestions = filterQuestions("path", setupQuestions);
    }
  
    // Validate package manager answers in options
    if (parseAnswer("manager", options, Options.manager)) {
      setupQuestions = filterQuestions("manager", setupQuestions);
    }
  
    // Validate chainId answers in options
    if (parseAnswer("chainId", options, Options.chainId)) {
      setupQuestions = filterQuestions("chainId", setupQuestions);
    }

    let answers = await prompt(setupQuestions)
    
    if (answers.path === "") {
      answers.path = "axiom-quickstart";
    }

    options = {
      ...answers,
      ...options,
    }

    // Validate that the package manager the user has selected is installed
    validatePackageManager(options.manager);

    sm = new ProjectScaffoldManager(options.path, options.manager, options.chainId);
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
  console.log("Fetching Axiom Next.js scaffold...");
  const tempDir = `.axiom-temp-nextjs-${Date.now()}`; 
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${tempDir}`, "Clone Axiom Next.js scaffold");
  sm.cp(`${tempDir}/.`, appPath, `  - Copy Next.js scaffold files to ${chalk.bold(appPath)}`);

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up next.js build files");

  // Move to base path
  sm.setPath(appPath);

  // Remove .git folder from scaffold repo
  await sm.rm(".git", `  - Remove .git folder from Next.js scaffold`);

  // Find and replace all
  sm.findAndReplaceAll("Update chain data");

  // Install package dependencies
  console.log("Installing Next.js scaffold dependencies...");
  await sm.execWithStream(sm.manager, [sm.installCmd], `Install Next.js scaffold dependencies`);

  // cd back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}