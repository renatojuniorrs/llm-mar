const fs = require('fs');
const yaml = require('js-yaml');
const { runAgent } = require('../agents');
const { runTeam, runDebate } = require('../workflows');

function setupRun(program) {
  program
    .command('run <yamlfile>')
    .description('run an agent, team, or debate from a YAML file')
    .option('--input <input>', 'input for agent or team')
    .option('--agent <agentId>', 'agent ID for team')
    .action(async (yamlfile, options) => {
      try {
        const content = fs.readFileSync(yamlfile, 'utf8');
        const config = yaml.load(content);
        
        if (config.kind === 'Agent') {
          if (!options.input) {
            console.error('Error: --input is required for agent');
            process.exit(1);
          }
          await runAgent(config, options.input);
        } else if (config.kind === 'Team') {
          if (!options.agent || !options.input) {
            console.error('Error: --agent and --input are required for team');
            process.exit(1);
          }
          await runTeam(config, options.agent, options.input);
        } else if (config.kind === 'Debate') {
          await runDebate(config);
        } else {
          console.error('Error: Unknown kind in YAML file');
          process.exit(1);
        }
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });
}

module.exports = setupRun;