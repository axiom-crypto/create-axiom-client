import prompt, { PromptObject } from 'prompts';
import { ProjectScaffoldManager } from "./projectScaffold/projectScaffoldManager";
import { validateForge, validatePackageManager } from './projectScaffold/dependency';
import { filterQuestions, parseAnswer } from './projectScaffold/utils';
import { Options, Prompts } from './constants';
import { ProjectScaffoldOptions } from './types';

export const setup = async (
  options: ProjectScaffoldOptions,
  toFilter?: ProjectScaffoldOptions
): Promise<{
  scaffoldManager: ProjectScaffoldManager,
  answers: Record<string, string>,
}> => {
  // Check that user has installed forge
  await validateForge();

  // List of questions
  let setupQuestions0: PromptObject[] = [
    Prompts.common.path,
    Prompts.common.scaffold,
    Prompts.common.manager,
  ];

  let setupQuestions1: PromptObject[] = [
  ];

  let setupQuestionsSamechain: PromptObject[] = [
    Prompts.samechain.chainId,
  ];

  // Remove prompt for path if it's already passed in
  if (options.path !== undefined) {
    setupQuestions0 = filterQuestions("path", setupQuestions0);
  }

  // Remove prompt answers if they're already passed in
  let prompts = ["scaffold", "manager", "queryType"];
  let filterKeys = Object.keys(toFilter || {});
  prompts = prompts.filter(prompt => !filterKeys.includes(prompt));

  for (const prompt of prompts) {
    if (parseAnswer(prompt, options, Options[prompt as keyof typeof Options])) {
      setupQuestions0 = filterQuestions(prompt, setupQuestions0);
    }
  }

  let answers0 = await prompt(setupQuestions0)

  if (!answers0.path || answers0.path === "") {
    answers0.path = "axiom-quickstart";
  }
  answers0 = {
    ...answers0,
    ...options,
  }
  
  // (samechain) Validate chainId answers in options
  if (parseAnswer("chainId", options, Options.chainId)) {
    setupQuestionsSamechain = filterQuestions("chainId", setupQuestionsSamechain);
  }
  setupQuestions1 = setupQuestionsSamechain;
  
  let answers1 = await prompt(setupQuestions1);

  let answers = {
    ...answers0,
    ...answers1,
    ...options,
    ...toFilter,
  }

  let sourceChainId = answers.sourceChainId || answers.chainId!;

  // Validate that the package manager the user has selected is installed
  validatePackageManager(answers.manager);

  // Initialize scaffold manager
  const scaffoldManager = new ProjectScaffoldManager(answers.path!, answers.manager!, sourceChainId);
  return {
    scaffoldManager,
    answers,
  };
}