import path from 'path';
import fs from 'fs';
import util from 'util';
import childProcess from 'child_process';
import chalk from 'chalk';
import { getDevFlag, getInstallCmd } from './utils';
const exec = util.promisify(childProcess.exec);

export interface Action {
  description: string,
  status: string,
}

export class ProjectScaffoldManager {
  basePath: string;
  fullPath: string;
  packageMgr: string;
  installCmd: string;
  devFlag: string;
  actions: Action[];

  constructor(basePath: string, packageMgr: string) {
    this.basePath = basePath;
    this.fullPath = path.resolve(basePath);
    this.packageMgr = packageMgr;
    this.installCmd = getInstallCmd(packageMgr);
    this.devFlag = getDevFlag(packageMgr);
    this.actions = [] as Action[];
  }

  setPath(newPath: string) {
    this.basePath = newPath;
    this.fullPath = path.resolve(newPath);
  }

  exists(inputPath: string, description: string): boolean {
    const doesExist = fs.existsSync(path.join(this.fullPath, inputPath));
    this.actions.push({
      description,
      status: doesExist ? chalk.blue("EXIST") : chalk.blue("MAKE")
    });
    return doesExist;
  }

  readFile(filePath: string): string {
    return fs.readFileSync(path.join(this.fullPath, filePath), 'utf8');
  }

  writeFile(filePath: string, data: string) {
    fs.writeFileSync(path.join(this.fullPath, filePath), data);
  }

  mkdir(dir: string, description: string) {
    const res = fs.mkdirSync(path.join(this.fullPath, dir), { recursive: true });
    this.actions.push({
      description,
      status: res!.length === 0 ? chalk.red("ERR") : chalk.green("OK")
    });
  }

  async exec(cmd: string, description: string, options?: { inPlace?: boolean }) {
    let stdout, stderr, err;
    try {
      if (options?.inPlace !== true) {
        ({ stdout, stderr } = await exec(cmd));
      }
      else {
        const cwd = process.cwd();
        process.chdir(this.fullPath);
        ({ stdout, stderr } = await exec(cmd));
        process.chdir(cwd);
      }
    } catch (e) {
      err = e;
    }

    this.actions.push({
      description,
      status: err !== undefined ? chalk.red("ERR") : chalk.green("OK")
    });
    
    return { stdout, stderr, err }
  }

  async execWithStream(cmd: string, args: string[], description: string, options?: { inPlace?: boolean }) {
    return new Promise((resolve, reject) => {
      const cwd = process.cwd();
      if (options?.inPlace !== true) {
        process.chdir(this.fullPath);
      }
      const child = childProcess.spawn(cmd, args, { shell: true, stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          this.actions.push({
            description,
            status: chalk.green("OK")
          });
          resolve(`Child process exited with code ${code}`);
        } else {
          this.actions.push({
            description,
            status: chalk.red("ERR")
          });
          reject(`Child process exited with code ${code}`);
        }
        if (options?.inPlace !== true) {
          process.chdir(cwd);
        }
      });
    });
  }

  cpFromTemplate(src: string, dst: string, description: string) {
    const fullDstPath = path.join(this.fullPath, dst);
    fs.cpSync(path.join(__dirname, "templates", src), fullDstPath);
    const fileExists = fs.existsSync(fullDstPath);
    this.actions.push({
      description,
      status: !fileExists ? chalk.red("ERR") : chalk.green("OK")
    })
  }

  cp(src: string, dst: string, description: string) {
    const fullSrcPath = path.join(this.fullPath, src);
    const fullDstPath = path.join(this.fullPath, dst);
    fs.cpSync(fullSrcPath, fullDstPath, { recursive: true });
    const fileExists = fs.existsSync(fullDstPath);
    this.actions.push({
      description,
      status: !fileExists ? chalk.red("ERR") : chalk.green("OK")
    })
  }

  rm(filePath: string, description: string) {
    const fullFilePath = path.join(this.fullPath, filePath);
    fs.rmSync(fullFilePath, { recursive: true });
    const fileExists = fs.existsSync(fullFilePath);
    this.actions.push({
      description,
      status: fileExists ? chalk.red("ERR") : chalk.green("OK")
    });
  }

  report() {
    console.log("\nSummary:")
    this.actions.forEach((action) => {
      console.log(`[${chalk.bold(action.status)}]\t${action.description}`);
    })
  }
}