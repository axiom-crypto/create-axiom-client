import { scaffoldProject } from './project';
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

