import path from 'path';
import chalk from 'chalk';
import prompt, { PromptObject } from 'prompts';
import { ProjectScaffoldManager } from "./projectScaffoldManager"
import { validatePackageManager } from "./dependency";
import { filterQuestions, parseAnswer } from './utils';
import { Options, Prompts } from '../constants';

export const scaffoldForge = async (
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

  // Create folder if it doesn't exist
  if (sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    throw new Error("Please select an empty directory");
  }
  sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);

  // Move to base path
  sm.setPath(sm.basePath);

  // Clone the axiom-quickstart template
  console.log("Fetching Axiom quickstart template...");
  const tempDir = `.axiom-temp-${Date.now()}`;
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, "Clone Axiom quickstart template");
  sm.cp(`${tempDir}/.`, ".", `  - Copy files to ${chalk.bold(sm.basePath)}`);

  // Delete .ts files in app folder (not recursive)
  await sm.exec(`find app -maxdepth 1 -type f -name "*.ts" -delete`, "  - Update app folder");

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
  console.log("Installing package dependencies...");
  await sm.execWithStream(sm.manager, [sm.installCmd], `Install package dependencies`);

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Create an update commit
  await sm.execWithStream("git add .", [], "  - Add updated chain data files to git");
  await sm.execWithStream("git commit -m 'Update chain data'", [], "  - Update chain data commit");

  // Move back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}