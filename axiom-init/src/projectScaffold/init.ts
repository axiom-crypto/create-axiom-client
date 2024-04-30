import prompt, { PromptObject } from 'prompts';
import { validateForge, validatePackageManager } from './dependency';
import { scaffoldProject } from './project';
import { ProjectScaffoldManager } from './projectScaffoldManager';
import { filterQuestions, parseAnswer } from './utils';
import { Options, Prompts } from '../constants';

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
    Prompts.path,
    Prompts.scaffold,
    Prompts.manager,
    Prompts.chainId,
  ];

  // Remove prompt for path if it's already passed in
  if (options.path !== undefined) {
    setupQuestions = filterQuestions("path", setupQuestions);
  }

  // Remove prompt for scaffold if it's already passed in
  if (parseAnswer("scaffold", options, Options.scaffold)) {
    setupQuestions = filterQuestions("scaffold", setupQuestions);
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