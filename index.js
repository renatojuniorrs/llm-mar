#!/usr/bin/env node

const { Command } = require('commander');
const setupCreate = require('./commands/create');
const setupRun = require('./commands/run');

const program = new Command();

program
  .name('llm-mar')
  .description('CLI for LLM agent workflows')
  .version('1.0.0');

setupCreate(program);
setupRun(program);

program.parse(process.argv);
