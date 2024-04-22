import fs from "fs";
import path from "path";

export const getInstallCmd = (manager: string): string => {
  switch (manager) {
    case "npm":
    case "pnpm":
      return "install";
    case "yarn":
      return "add";
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

export const findAndReplaceRecursive = (folder: string, find: string, replace: string) => {
  if (!fs.existsSync(folder)) {
    return;
  }

  const files = fs.readdirSync(folder);
  files.forEach((file) => {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findAndReplaceRecursive(filePath, find, replace);
    } else {
      let content = fs.readFileSync(filePath, "utf8");
      content = content.replace(new RegExp(find, "g"), replace);
      fs.writeFileSync(filePath, content, "utf8");
    }
  });
}
