import { PromptObject } from "prompts";

// Available options for the user to select from
export const Options: Record<string, string[]> = {
  scaffold: ["nextjs", "script", "forge"],
  manager: ["npm", "yarn", "pnpm"],
  chainId: ["11155111", "1"],
};

// deployed ExampleV2Client contract address
export const ExampleV2Client: Record<string, string> = {
  "1": "0x4D36100eA7BD6F685Fd44EB6BE5ccE7A92047581",
  "11155111": "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
};

// deployed AverageBalance contract address (if empty then the user will need to deploy it)
export const AverageBalance: Record<string, string> = {
  "1": "",
  "11155111": "0x50F2D5c9a4A35cb922a631019287881f56A00ED5",
};

export const Prompts: Record<string, Record<string, PromptObject>> = {
  "common": {
    "path": {
      name: "path",
      type: "text",
      message: "Path to initialize Axiom Forge project (default: './axiom-quickstart')?"
    },
    "scaffold": {
      name: "scaffold",
      type: "select",
      choices: [
        { title: "Next.js", value: "nextjs", description: "Next.js dApp (default)" }, 
        { title: "Script", value: "script", description: "Simple test script" },
        { title: "Forge", value: "forge", description: "Forge-only project" },
      ],
      message: "Type of Axiom app interface to use?"
    },
    "manager": {
      name: "manager",
      type: "select",
      choices: [
        { title: "npm", value: "npm", description: "Use npm as the package manager (default)" }, 
        { title: "yarn", value: "yarn", description: "Use yarn as the package manager" },
        { title: "pnpm", value: "pnpm", description: "Use pnpm as the package manager" },
      ],
      message: "Which package manager do you want to use for the project?"
    },
  },
  "samechain": {
    "chainId": {
      name: "chainId",
      type: "select",
      choices: [
        { title: "11155111", value: "11155111", description: "Ethereum Sepolia (default)" }, 
        { title: "1", value: "1", description: "Ethereum Mainnet" },
      ],
      message: "Which chain ID would you like your project to use?"
    },
  },
}