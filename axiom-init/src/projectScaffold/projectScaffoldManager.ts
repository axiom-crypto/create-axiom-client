import path from 'path';
import fs from 'fs';
import util from 'util';
import childProcess from 'child_process';
import chalk from 'chalk';
import { deleteRecursive, findAndReplaceRecursive, getDevFlag, getInstallCmd, renameAllRecursive } from './utils';
import { AverageBalance, ExampleV2Client } from '../constants';
const exec = util.promisify(childProcess.exec);

export interface Action {
  description: string,
  status: string,
}

export class ProjectScaffoldManager {
  createPath: string;
  basePath: string;
  fullPath: string;
  manager: string;
  chainId: string;
  targetChainId?: string;
  isCrosschain: boolean;
  installCmd: string;
  devFlag: string;
  actions: Action[];

  constructor(basePath: string, manager: string, chainId: string, targetChainId?: string) {
    if (basePath === "" || manager === "" || chainId === "") {
      throw new Error("`basePath`, `manager`, and `chainId` must be provided");
    }
    this.createPath = path.resolve(basePath);
    this.basePath = basePath;
    this.fullPath = path.resolve(basePath);
    this.manager = manager;
    this.chainId = chainId;
    this.targetChainId = targetChainId;
    this.isCrosschain = targetChainId !== undefined;
    this.installCmd = getInstallCmd(manager);
    this.devFlag = getDevFlag(manager);
    this.actions = [] as Action[];
  }

  setPath(newPath: string) {
    this.basePath = newPath;
    this.fullPath = path.resolve(newPath);
    process.chdir(this.fullPath);
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

  handleCrosschainFilesAndFolders(description: string) {
    if (this.targetChainId) {
      deleteRecursive(this.fullPath, "-samechain");
      renameAllRecursive(this.fullPath, "-crosschain", "");
    } else {
      deleteRecursive(this.fullPath, "-crosschain");
      renameAllRecursive(this.fullPath, "-samechain", "");
    }

    this.actions.push({
      description,
      status: chalk.green("OK")
    });
  }

  findAndReplaceAll(description: string) {
      // Update chain ID
    findAndReplaceRecursive(this.fullPath, 'CHAIN_ID = "11155111"', `CHAIN_ID = "${this.chainId}"`);
    findAndReplaceRecursive(this.fullPath, 'SOURCE_CHAIN_ID = "11155111"', `SOURCE_CHAIN_ID = "${this.chainId}"`);
    findAndReplaceRecursive(this.fullPath, '--source-chain-id 11155111', `--source-chain-id ${this.chainId}`);

    // Update provider URI for Foundry
    findAndReplaceRecursive(this.fullPath, 'source_provider = "\\${PROVIDER_URI_11155111}"', `source_provider = "\${PROVIDER_URI_${this.chainId}}"`);
    findAndReplaceRecursive(this.fullPath, 'source_provider = "\\${RPC_URL_11155111}"', `source_provider = "\${RPC_URL_${this.chainId}}"`);

    // Update private key
    findAndReplaceRecursive(this.fullPath, 'PRIVATE_KEY_11155111', `PRIVATE_KEY_${this.chainId}`);

    // Update ExampleV2Client target address 
    findAndReplaceRecursive(this.fullPath, "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e", ExampleV2Client[this.chainId]);

    // Update deployed Average contract address
    findAndReplaceRecursive(this.fullPath, "0x50F2D5c9a4A35cb922a631019287881f56A00ED5", AverageBalance[this.chainId]);

    // Make crosschain updates
    if (this.targetChainId) {
      // Update target chain ID
      findAndReplaceRecursive(this.fullPath, 'TARGET_CHAIN_ID = "84532"', `TARGET_CHAIN_ID = "${this.targetChainId}"`);
      findAndReplaceRecursive(this.fullPath, '--target-chain-id 84532', `--target-chain-id ${this.targetChainId}`);

      // Update provider URI for Foundry
      findAndReplaceRecursive(this.fullPath, 'target_provider = "\\${PROVIDER_URI_84532}"', `target_provider = "\${PROVIDER_URI_${this.targetChainId}}"`);
      findAndReplaceRecursive(this.fullPath, 'target_provider = "\\${RPC_URL_84532}"', `target_provider = "\${RPC_URL_${this.targetChainId}}"`);

      // Next.js folders
      findAndReplaceRecursive(this.fullPath, '-crosschain', ``);
    } else {
      // Next.js folders
      findAndReplaceRecursive(this.fullPath, '-samechain', ``);
    }

    this.actions.push({
      description,
      status: chalk.green("OK")
    });
  }

  report() {
    console.log("\nSummary:")
    this.actions.forEach((action) => {
      console.log(`[${chalk.bold(action.status)}]\t${action.description}`);
    })
    console.log(`Project initialized at ${chalk.bold(this.createPath)}`);
  }
}
