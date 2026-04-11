const fs = require('fs');
const yaml = require('js-yaml');

function setupCreate(program) {
  const createCmd = program.command('create').description('create agents, teams, or debates');

  createCmd
    .command('agent <name>')
    .description('create a new agent YAML')
    .option('--model <model>', 'model to use', 'gpt-4')
    .option('--goal <goal>', 'goal of the agent', 'To assist with tasks')
    .option('--role <role>', 'role of the agent', 'Assistant')
    .option('--system-prompt <prompt>', 'system prompt', 'You are a helpful assistant.')
    .option('--instructions <instructions>', 'instructions as comma-separated list', 'Think step by step,Answer clearly and concisely')
    .option('--output <format>', 'output format', 'text')
    .option('--output-file <path>', 'output file path')
    .action((name, options) => {
      const instructions = options.instructions.split(',').map(s => s.trim());
      const outputFile = options.outputFile || `default/${name}.yaml`;
      const config = {
        version: '1.0',
        kind: 'Agent',
        metadata: {
          name: name,
          description: `An agent named ${name}`
        },
        spec: {
          id: name,
          model: options.model,
          goal: options.goal,
          role: options.role,
          system_prompt: options.systemPrompt,
          instructions: instructions,
          output: options.output
        }
      };
      const yamlStr = yaml.dump(config);
      fs.writeFileSync(outputFile, yamlStr);
      console.log(`Agent YAML created: ${outputFile}`);
    });

  createCmd
    .command('team <name>')
    .description('create a new team YAML')
    .option('--agents <agents>', 'comma-separated list of agent YAML file paths')
    .option('--output <format>', 'output format', 'text')
    .option('--output-file <path>', 'output file path')
    .action((name, options) => {
      if (!options.agents) {
        console.error('Error: --agents is required');
        process.exit(1);
      }
      const agentFiles = options.agents.split(',').map(s => s.trim());
      const outputFile = options.outputFile || `default/${name}.yaml`;
      const config = {
        version: '1.0',
        kind: 'Team',
        metadata: {
          name: name,
          description: `A team named ${name}`
        },
        spec: {
          agents: agentFiles,
          output: options.output
        }
      };
      const yamlStr = yaml.dump(config);
      fs.writeFileSync(outputFile, yamlStr);
      console.log(`Team YAML created: ${outputFile}`);
    });

  createCmd
    .command('debate <name>')
    .description('create a new debate YAML')
    .option('--method <method>', 'debate method', 'majority_vote')
    .option('--agents <agents>', 'comma-separated list of agent YAML file paths')
    .option('--judges <judges>', 'comma-separated list of judge agent YAML file paths')
    .option('--input <input>', 'debate input topic', 'A topic to debate')
    .option('--output <format>', 'output format', 'text')
    .option('--output-file <path>', 'output file path')
    .action((name, options) => {
      if (!options.agents || !options.judges) {
        console.error('Error: --agents and --judges are required');
        process.exit(1);
      }
      const agents = options.agents.split(',').map(s => s.trim());
      const judges = options.judges.split(',').map(s => s.trim());
      const outputFile = options.outputFile || `default/${name}.yaml`;
      const config = {
        version: '1.0',
        kind: 'Debate',
        metadata: {
          name: name,
          description: `A debate named ${name}`
        },
        spec: {
          method: options.method,
          input: options.input,
          judges: judges,
          agents: agents,
          output: options.output
        }
      };
      const yamlStr = yaml.dump(config);
      fs.writeFileSync(outputFile, yamlStr);
      console.log(`Debate YAML created: ${outputFile}`);
    });
}

module.exports = setupCreate;