import fs from 'fs';
import path from 'path';
import prompt, { PromptObject } from 'prompts';
import { validateForge, validatePackageManager } from './dependency';
import { scaffoldNext } from './nextjs';
import { scaffoldProject } from './project';
import { ProjectScaffoldManager } from './projectScaffoldManager';
import { CURRENT_VERSION } from '../version';

export const init = async (
  options: {
    path?: string,
    scaffold?: string,
    manager?: string,
    chainId?: string,
  }
) => {
  // Check that user has installed forge
  await validateForge();

  // List of questions
  let setupQuestions: PromptObject[] = [
    {
      name: "path",
      type: "text",
      message: "Path to initialize Axiom project (default: ./axiom-quickstart)?"
    },
    {
      name: "scaffold",
      type: "select",
      choices: [
        { title: "Next.js", value: "nextjs", description: "Next.js dApp (default)" }, 
        { title: "Script", value: "script", description: "Simple test script" },
        { title: "Forge", value: "forge", description: "Forge-only project" },
      ],
      message: "Type of Axiom app interface to use?"
    },
    {
      name: "manager",
      type: "select",
      choices: [
        { title: "npm", value: "npm", description: "Use npm as the package manager (default)" }, 
        { title: "yarn", value: "yarn", description: "Use yarn as the package manager" },
        { title: "pnpm", value: "pnpm", description: "Use pnpm as the package manager" },
      ],
      message: "Which package manager do you want to use for the project?"
    },
    {
      name: "chainId",
      type: "select",
      choices: [
        { title: "11155111", value: "11155111", description: "Ethereum Sepolia (default)" }, 
        { title: "84532", value: "84532", description: "Base Sepolia" },
        { title: "1", value: "1", description: "Ethereum Mainnet" },
        { title: "84532", value: "84532", description: "Base Mainnet" },
      ],
      message: "Which chain would you like your project to use?"
    }
  ];

  // Remove prompt for path if it's already passed in
  if (options.path !== undefined) {
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "path";
    });
  }

  // Remove prompt for scaffold if it's already passed in
  if (options.scaffold !== undefined) {
    const parsedScaffold = options.scaffold.trim().toLowerCase();
    switch (parsedScaffold) {
      case "nextjs":
      case "script":
      case "forge":
        break;
      default:
        throw new Error("Invalid option for scaffold. Valid options: [nextjs, script, forge]");
    }
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "scaffold";
    });
  }

  // Validate package manager answers in options
  if (options.manager !== undefined) {
    const parsedManager = options.manager.trim().toLowerCase();
    switch (parsedManager) {
      case "npm":
      case "yarn":
      case "pnpm":
        break;
      default:
        throw new Error("Invalid option for package manager. Valid options: [npm, yarn, pnpm]");
    }
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "manager";
    });
  }

  // Validate chainId answers in options
  if (options.chainId !== undefined) {
    const parsedChainId = options.chainId.trim().toLowerCase();
    switch (parsedChainId) {
      case "1":
      case "11155111":
      case "8453":
      case "84532":
        break;
      default:
        throw new Error("Invalid chainId. Valid options: [1, 11155111, 8453, 84532]");
    }
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "manager";
    });
  }

  let answers = await prompt(setupQuestions)
  
  if (answers.path === "") {
    answers.path = "axiom-quickstart";
  }

  answers = {
    ...answers,
    ...options,
  }

  // Validate that the package manager the user has selected is installed
  validatePackageManager(answers.manager);

  // Initialize scaffold manager
  const sm = new ProjectScaffoldManager(answers.path, answers.manager, answers.chainId);

  // Initialize project
  await scaffoldProject(sm, answers.scaffold);

  // Print report
  sm.report();
}