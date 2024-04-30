import chalk from 'chalk';
import prompt, { PromptObject } from 'prompts';
import { ProjectScaffoldManager } from "./projectScaffoldManager";
import { validatePackageManager } from './dependency';
import { Options, Prompts } from '../constants';
import { filterQuestions, parseAnswer } from './utils';

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
      answers.path = "./app";
    }

    options = {
      ...answers,
      ...options,
    }

    // Validate that the package manager the user has selected is installed
    validatePackageManager(options.manager);

    sm = new ProjectScaffoldManager(options.path, options.manager, options.chainId);
  } else {
    // Set the ProjectScaffoldManager's path to the new path
    sm.setPath(options.path);
  }
  
  const startingPath = process.cwd();

  // Create folder if it doesn't exist
  if (sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    throw new Error("Please select an empty directory");
  }
  sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);

  // Move to base path
  process.chdir(sm.basePath);

  // Clone the Next.js scaffold
  console.log("Fetching Axiom Next.js scaffold...");
  const tempDir = `.axiom-temp-${Date.now()}`; 
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${tempDir}`, "Clone Axiom Next.js scaffold");
  sm.cp(`${tempDir}/.`, ".", `  - Copy Next.js scaffold files to ${chalk.bold(sm.basePath)}`);

  // Install package dependencies
  console.log("Installing Next.js scaffold dependencies...");
  await sm.execWithStream(sm.manager, [sm.installCmd], `Install Next.js scaffold dependencies`);

  // Find and replace all
  sm.findAndReplaceAll("Update chain data");

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Move back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}