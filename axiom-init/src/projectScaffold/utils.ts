import fs from "fs";
import path from "path";
import { PromptObject } from "prompts";

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

export const parseAnswer = (name: string, options: Record<string, string>, validOptions: string[]): boolean => {
  if (options[name] === undefined) {
    return false;
  }

  const parsedOption = options[name].trim().toLowerCase();
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
