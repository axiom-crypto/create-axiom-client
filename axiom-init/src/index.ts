#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./projectScaffold/init";
import { CURRENT_VERSION } from "./version";
import { scaffoldNext } from "./projectScaffold/nextjs";
import { scaffoldScript } from "./projectScaffold/script";
import { scaffoldForge } from "./projectScaffold/forge";

async function main() {
  if (process.argv.length < 3) {
    await init({});
    process.exit();
  }

  const program = new Command('axiom');

  program.name("axiom").version(CURRENT_VERSION).description("Axiom CLI");

  program
    .command("init")
    .description("initialize Axiom project")
    .option("-p, --path <path>", "file path")
    .option("-s, --scaffold <type>", "type of scaffold (nextjs, script, forge, none)")
    .option("-m, --manager <name>", "package manager to use (npm, yarn, pnpm)")
    .option("-q, --query-type <type>", "type of query (`samechain`, `crosschain`) [default: samechain]")
    .option("-c, --chain-id <number>", "(samechain) chainId (default: 11155111)")
    .option("-tc, --target-chain-id <number>", "(crosschain) target chainId [default: 84532]")
    .option("-sc, --source-chain-id <number>", "(crosschain) source chainId [default: 11155111]")
    .action(init);

  const scaffold = program.command("scaffold")
    .description("Generate scaffolds for Axiom apps");

  scaffold
    .command("nextjs")
    .description("Scaffold a Next.js dApp that incorporates Axiom")
    .option("-p, --path <path>", "Next.js dApp path")
    .option("-m, --manager <name>", "package manager to use (npm, yarn, pnpm)")
    .option("-c, --chainId <number>", "chainId (default: 11155111)")
    .action(scaffoldNext)

  scaffold
    .command("script")
    .description("Scaffold a script to send Axiom Queries")
    .option("-p, --path <path>", "Script path")
    .option("-m, --manager <name>", "package manager to use (npm, yarn, pnpm)")
    .option("-c, --chainId <number>", "chainId (default: 11155111)")
    .action(scaffoldScript)

  scaffold
    .command("forge")
    .description("Scaffold a Forge-only project")
    .option("-p, --path <path>", "Forge project path")
    .option("-m, --manager <name>", "package manager to use (npm, yarn, pnpm)")
    .option("-c, --chainId <number>", "chainId (default: 11155111)")
    .action(scaffoldForge);

  program.parseAsync(process.argv);
}

main();
