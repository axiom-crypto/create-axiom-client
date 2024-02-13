#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./projectScaffold/init";
import { checkVersion } from "./checkVersion";
import { CURRENT_VERSION } from "./version";
import { scaffoldNext } from "./projectScaffold/nextjs";
import { scaffoldScript } from "./projectScaffold/script";

async function main() {
  // if (process.argv.length === 3) {
  //   if (process.argv[2] === "--version" || process.argv[2] === "-v") {
  //     console.log(CURRENT_VERSION);
  //     process.exit();
  //   }
  // }

  // Check current scaffold version against latest version
  // await checkVersion();

  if (process.argv.length < 3) {
    await init({});
    process.exit();
  }

  const program = new Command('axiom');

  program.name("axiom").version(CURRENT_VERSION).description("Axiom CLI");

  program
    .command("init")
    .description("initialize Axiom project")
    .option("-p, --path [path]", "file path")
    .option("-s, --scaffold [type]", "type of scaffold (nextjs, script, none)")
    .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
    .action(init);

  const scaffold = program.command("scaffold")
    .description("Generate scaffolds for Axiom apps");
  
  scaffold
    .command("nextjs")
    .description("Scaffold a Next.js dApp that incorporates Axiom")
    .option("-p, --path [path]", "Next.js dApp path")
    .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
    .action(scaffoldNext)
  
  scaffold
    .command("script")
    .description("Scaffold a script to send Axiom Queries")
    .option("-p, --path [path]", "Script path")
    .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
    .action(scaffoldScript)

  program.parseAsync(process.argv);
}

main();