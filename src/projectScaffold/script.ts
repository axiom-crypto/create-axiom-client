import path from 'path';
import chalk from 'chalk';
import prompt, { PromptObject } from 'prompts';
import { ProjectScaffoldManager } from "./projectScaffoldManager"
import { validatePackageManager } from "./dependency";

export const scaffoldScript = async (
  options: {
    path: string,
    packageMgr: string,
  },
  _commands: any, // unused commands from commander.js
  sm?: ProjectScaffoldManager,
) => {
  let shouldPrint = false;
  if (sm === undefined) {
    shouldPrint = true;

    // List of questions
    let setupQuestions: PromptObject[] = [
      {
        name: "path",
        type: "text",
        message: "Path to initialize Axiom Next.js project (default: './app')?"
      },
      {
        name: "packageMgr",
        type: "select",
        choices: [
          { title: "npm", value: "npm", description: "Use npm as the package manager (default)" }, 
          { title: "yarn", value: "yarn", description: "Use yarn as the package manager" },
          { title: "pnpm", value: "pnpm", description: "Use pnpm as the package manager" },
        ],
        message: "Which package manager do you want to use for the project?"
      }
    ];

    // Remove prompt for path if it's already passed in
    if (options.path !== undefined) {
      setupQuestions = setupQuestions.filter((obj) => {
        return obj.name !== "path";
      });
    }

    // Validate package manager answers in options
    if (options.packageMgr !== undefined) {
      const parsedManager = options.packageMgr.trim().toLowerCase();
      switch (parsedManager) {
        case "npm":
        case "yarn":
        case "pnpm":
          break;
        default:
          throw new Error("Invalid option for package manager. Valid options: [npm, yarn, pnpm]");
      }
      setupQuestions = setupQuestions.filter((obj) => {
        return obj.name !== "packageMgr";
      });
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
    validatePackageManager(options.packageMgr);

    sm = new ProjectScaffoldManager(options.path, options.packageMgr);
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
  console.log("Fetching Axiom quickstart template...");
  const tempDir = `.axiom-temp-${Date.now()}`; 
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, "Clone Axiom quickstart template");

  const tempAppDir = path.join(tempDir, "app");

  // Copy files to target path
  sm.cp(tempAppDir, sm.basePath, `  - Copying files to ${chalk.bold(sm.basePath)}`);

  // Clean up cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Move back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}