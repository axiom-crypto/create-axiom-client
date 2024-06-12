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
  console.log("setup opts", options);
  // Check that user has installed forge
  await validateForge();

  // List of questions
  let setupQuestions0: PromptObject[] = [
    Prompts.path,
    Prompts.scaffold,
    Prompts.manager,
    Prompts.queryType,
  ];

  let setupQuestions1: PromptObject[] = [
  ];

  let setupQuestionsSamechain: PromptObject[] = [
    Prompts.samechain.chainId,
  ];

  let setupQuestionsCrosschain: PromptObject[] = [
    Prompts.crosschain.sourceChainId,
    Prompts.crosschain.targetChainId,
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

  // Get queryType response and use it to determine which questions to ask next
  let samechain = true;
  const queryType = answers0.queryType;
  if (queryType === "samechain") {
    samechain = true;
  } else if (queryType === "crosschain") {
    samechain = false;
  } else {
    throw new Error(`Invalid query type: ${queryType}`);
  }
  
  let sourceChainId = "";
  if (samechain) {
    // (samechain) Validate chainId answers in options
    if (parseAnswer("chainId", options, Options.chainId)) {
      setupQuestionsSamechain = filterQuestions("chainId", setupQuestionsSamechain);
    }
    setupQuestions1 = setupQuestionsSamechain;
    sourceChainId = answers0.chainId;
  } else {
    // (crosschain) Validate sourceChainId answers in options
    if (parseAnswer("sourceChainId", options, Options.sourceChainId)) {
      setupQuestionsCrosschain = filterQuestions("sourceChainId", setupQuestionsCrosschain);
    }
    sourceChainId = answers0.sourceChainId;

    // (crosschain) Validate targetChainId answers in options
    if (parseAnswer("targetChainId", options, Options.targetChainId)) {
      setupQuestionsCrosschain = filterQuestions("targetChainId", setupQuestionsCrosschain);
    }
    setupQuestions1 = setupQuestionsCrosschain;
  }

  let answers1 = await prompt(setupQuestions1)

  let answers = {
    ...answers0,
    ...answers1,
    ...options,
    ...toFilter,
  }

  // Validate that the package manager the user has selected is installed
  validatePackageManager(answers.manager);

  // Initialize scaffold manager
  const scaffoldManager = new ProjectScaffoldManager(answers.path!, answers.manager!, sourceChainId, answers.targetChainId);
  return {
    scaffoldManager,
    answers,
  };
}