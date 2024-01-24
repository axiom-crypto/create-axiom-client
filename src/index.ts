#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./projectScaffold/init";
import { checkVersion } from "./checkVersion";
import { SCAFFOLD_VERSION } from "./version";

async function main() {
  // Check current scaffold version against latest version
  checkVersion();

  if (process.argv.length < 3) {
    await init({});
    process.exit();
  }

  const program = new Command('axiom');

  program.name("axiom").version(SCAFFOLD_VERSION).description("Axiom CLI");

  program
    .command("init")
    .description("initialize Axiom project")
    .option("-p, --path [path]", "file path")
    .option("-s, --scaffold [type]", "type of scaffold (nextjs, script, none)")
    .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
    .action(init);

  program.parseAsync(process.argv);
}

main();