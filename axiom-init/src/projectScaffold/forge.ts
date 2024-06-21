import { ProjectScaffoldManager } from "./projectScaffoldManager"
import { setup } from '../setup';
import { scaffoldScript } from './script';

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
    const { scaffoldManager } = await setup(options, {scaffold: "forge"});
    sm = scaffoldManager;
  }

  const startingPath = process.cwd();

  await scaffoldScript({ path: sm.basePath, manager: sm.manager, chainId: sm.chainId }, undefined, sm);

  // Move to base path
  sm.setPath(sm.basePath);

  // Delete .ts files in app folder (not recursive)
  await sm.exec(`find app -maxdepth 1 -type f -name "*.ts" -delete`, "  - Update app folder");

  // Move back to starting path
  process.chdir(startingPath);

  if (shouldPrint) {
    sm.report();
  }
}