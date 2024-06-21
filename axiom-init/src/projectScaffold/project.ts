import { ProjectScaffoldManager } from './projectScaffoldManager';
import { scaffoldNext } from './nextjs';
import { scaffoldScript } from './script';
import { scaffoldForge } from './forge';

export const scaffoldProject = async (sm: ProjectScaffoldManager, appScaffold?: string) => {
  if (appScaffold === "nextjs") {
    await scaffoldNext({ path: sm.basePath, manager: sm.manager, chainId: sm.chainId }, undefined, sm);
  } else if (appScaffold === "script") {
    await scaffoldScript({ path: sm.basePath, manager: sm.manager, chainId: sm.chainId }, undefined, sm);
  } else if (appScaffold === "forge") {
    await scaffoldForge({ path: sm.basePath, manager: sm.manager, chainId: sm.chainId }, undefined, sm);
  } else {
    throw new Error(`Invalid app scaffold choice: ${appScaffold}`);
  }
}