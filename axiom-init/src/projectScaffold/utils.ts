import fs from "fs";
import path from "path";
import { PromptObject } from "prompts";
import { ProjectScaffoldOptions } from "../types";
import { ProjectScaffoldManager } from "./projectScaffoldManager";

export const getInstallCmd = (manager: string): string => {
  switch (manager) {
    case "npm":
    case "pnpm":
      return "install";
    case "yarn":
      return "";
    default:
      throw new Error(`Unsupported package manager ${manager}`);
  }
}

export const getDevFlag = (manager: string): string => {
  switch (manager) {
    case "npm":
    case "pnpm":
      return "--save-dev";
    case "yarn":
      return "--dev";
    default:
      throw new Error(`Unsupported package manager ${manager}`);
  }
}

export const parseAnswer = (name: string, options: ProjectScaffoldOptions, validOptions: string[]): boolean => {
  const option = options[name as keyof ProjectScaffoldOptions];
  if (option === undefined) {
    return false;
  }

  const parsedOption = option.trim().toLowerCase();
  if (!validOptions.includes(parsedOption)) {
    throw new Error(`Invalid option for ${name}. Valid options: [${validOptions.join(", ")}]`);
  }

  return true;
}

export const filterQuestions = (name: string, setupQuestions: PromptObject[]): PromptObject[] => {
  return setupQuestions.filter((obj) => {
    return obj.name !== name;
  });
}

export const findAndReplaceRecursive = (folder: string, find: string, replace: string) => {
  if (!fs.existsSync(folder)) {
    return;
  }
  const items = fs.readdirSync(folder);
  items.forEach((item) => {
    const itemPath = path.join(folder, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      // Skip directories that start with a dot except `.github`
      if (item === ".github" || !item.startsWith('.')) {
        findAndReplaceRecursive(itemPath, find, replace);
      }
    } else {
      let content = fs.readFileSync(itemPath, "utf8");
      content = content.replace(new RegExp(find, "g"), replace);
      fs.writeFileSync(itemPath, content, "utf8");
    }
  });
}

export const renameAllRecursive = (folder: string, find: string, replace: string) => {
  if (!fs.existsSync(folder)) {
    return;
  }
  const items = fs.readdirSync(folder);
  items.forEach((item) => {
    const itemPath = path.join(folder, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      renameAllRecursive(itemPath, find, replace);
    }
    if (item.includes(find)) {
      const newItemPath = path.join(folder, item.replace(find, replace));
      if (fs.existsSync(newItemPath)) {
        fs.rmSync(newItemPath, { recursive: true, force: true });
      }
      fs.renameSync(itemPath, newItemPath);
    }
  });
}

export const deleteRecursive = (folder: string, find: string) => {
  if (!fs.existsSync(folder)) {
    return;
  }
  const items = fs.readdirSync(folder);
  items.forEach((item) => {
    const itemPath = path.join(folder, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      // Skip directories that start with a dot except `.github`
      if (item === ".github" || !item.startsWith('.')) {
        deleteRecursive(itemPath, find);
      }
    }
    if (item.includes(find)) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    }
  });
}
