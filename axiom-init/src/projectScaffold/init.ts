import prompt, { PromptObject } from 'prompts';
import { validateForge, validatePackageManager } from './dependency';
import { scaffoldProject } from './project';
import { ProjectScaffoldManager } from './projectScaffoldManager';
import { filterQuestions, parseAnswer } from './utils';
import { Options, Prompts } from '../constants';
import { setup } from '../setup';
import { ProjectScaffoldOptions } from '../types';

export const init = async (
  options: ProjectScaffoldOptions,
) => {
  // Initialize scaffold manager
  const {scaffoldManager, answers} = await setup(options);

  // Initialize project
  await scaffoldProject(scaffoldManager, answers.scaffold);

  // Print report
  scaffoldManager.report();
}

