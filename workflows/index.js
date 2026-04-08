const { runAgent } = require('../agents');
const fs = require('fs');
const yaml = require('js-yaml');
const { z } = require('zod');

function createZodSchema(structure) {
  if (typeof structure === 'object') {
    const schema = {};
    for (const [key, value] of Object.entries(structure)) {
      if (typeof value === 'string') {
        if (value === 'string') schema[key] = z.string();
        else if (value === 'number') schema[key] = z.number();
        else if (value === 'boolean') schema[key] = z.boolean();
        else schema[key] = z.string(); // default
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object') {
          schema[key] = z.array(createZodSchema(value[0]));
        } else {
          schema[key] = z.array(z.string()); // default
        }
      } else if (typeof value === 'object') {
        schema[key] = createZodSchema(value);
      }
    }
    return z.object(schema);
  }
  return z.string(); // fallback
}

function buildWorkflow(name) {
  console.log(`Building workflow ${name}...`);
}

async function runTeam(config, agentId, input) {
  // Find the agent: could be embedded object or file path
  let agentConfig;
  const agentEntry = config.agents.find(agent => {
    if (typeof agent === 'string') {
      // File path
      const basename = agent.split('/').pop().replace('.yaml', '');
      return basename === agentId;
    } else {
      // Embedded object
      return agent.id === agentId;
    }
  });
  
  if (!agentEntry) {
    throw new Error(`Agent ${agentId} not found in team`);
  }
  
  if (typeof agentEntry === 'string') {
    // Load from file
    try {
      const agentYaml = fs.readFileSync(agentEntry, 'utf8');
      const agentData = yaml.load(agentYaml);
      if (agentData.kind !== 'Agent') {
        throw new Error(`${agentEntry} is not an Agent`);
      }
      agentConfig = agentData.spec;
    } catch (e) {
      throw new Error(`Agent file ${agentEntry} not found or invalid: ${e.message}`);
    }
  } else {
    // Embedded
    agentConfig = agentEntry;
    if (!agentConfig.model) {
      // Try to load from default/
      try {
        const agentYaml = fs.readFileSync(`default/${agentId}.yaml`, 'utf8');
        const agentData = yaml.load(agentYaml);
        agentConfig = agentData.spec;
      } catch (e) {
        throw new Error(`Agent ${agentId} not found or invalid`);
      }
    }
  }
  
  const agentYaml = {
    kind: 'Agent',
    spec: agentConfig
  };
  await runAgent(agentYaml, input);
}

async function runDebate(config) {
  // Validate API key is set
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required to run debates. Please set it with: export OPENAI_API_KEY=your_api_key');
  }

  // Validate that all agents and judges files exist and are Agents or Teams
  const allFiles = [...config.spec.agents, ...config.spec.judges];
  for (const file of allFiles) {
    try {
      const yamlContent = fs.readFileSync(file, 'utf8');
      const data = yaml.load(yamlContent);
      if (data.kind !== 'Agent' && data.kind !== 'Team') {
        throw new Error(`${file} is not an Agent or Team`);
      }
    } catch (e) {
      throw new Error(`Participant file ${file} not found or invalid: ${e.message}`);
    }
  }

  const outputFormat = config.spec.output || 'text';
  
  // Collect arguments from agents
  const agentArguments = [];
  for (const agentFile of config.spec.agents) {
    try {
      const agentConfig = yaml.load(fs.readFileSync(agentFile, 'utf8'));
      if (agentConfig.kind === 'Agent') {
        // Run the agent with the debate input
        const { ChatOpenAI } = require('@langchain/openai');
        
        // Handle both model_settings object and legacy model string
        const modelSettings = agentConfig.spec.model_settings || agentConfig.spec.model;
        let modelConfig;
        if (typeof modelSettings === 'string') {
          modelConfig = { modelName: modelSettings };
        } else {
          modelConfig = { 
            modelName: modelSettings.model, 
            ...modelSettings 
          };
        }
        
        const model = new ChatOpenAI(modelConfig);
        const response = await model.invoke([
          { role: 'system', content: agentConfig.spec.system_prompt },
          { role: 'user', content: `Debate this topic: ${config.spec.input}. Provide your argument.` }
        ]);
        agentArguments.push({
          agent: agentFile,
          argument: response.content
        });
      }
    } catch (error) {
      agentArguments.push({
        agent: agentFile,
        argument: `Error: ${error.message}`
      });
    }
  }
  
  // Have judges vote
  const votes = [];
  let structuredResult = null;
  for (const judgeFile of config.spec.judges) {
    try {
      const judgeConfig = yaml.load(fs.readFileSync(judgeFile, 'utf8'));
      if (judgeConfig.kind === 'Agent') {
        const { ChatOpenAI } = require('@langchain/openai');
        
        // Handle both model_settings object and legacy model string
        const modelSettings = judgeConfig.spec.model_settings || judgeConfig.spec.model;
        let modelConfig;
        if (typeof modelSettings === 'string') {
          modelConfig = { modelName: modelSettings };
        } else {
          modelConfig = { 
            modelName: modelSettings.model, 
            ...modelSettings 
          };
        }
        
        const model = new ChatOpenAI(modelConfig);
        
        let judgePrompt;
        let responseFormat = null;
        
        if (typeof outputFormat === 'object' && outputFormat.format === 'json' && outputFormat.structure) {
          // Use structured output for judge
          responseFormat = createZodSchema(outputFormat.structure);
          const instructions = outputFormat.instructions || `Evaluate the arguments and provide your judgment in the required structured format. The winner should be the filename of the winning agent. Each vote should have the agent filename and reasoning.`;
          judgePrompt = `You are judging a debate on: ${config.spec.input}\n\nArguments:\n${agentArguments.map((arg, i) => `Agent ${i+1} (${arg.agent}): ${arg.argument}`).join('\n\n')}\n\nTASK: ${instructions}`;
        } else {
          judgePrompt = `You are judging a debate on: ${config.spec.input}\n\nArguments:\n${agentArguments.map((arg, i) => `Agent ${i+1} (${arg.agent}): ${arg.argument}`).join('\n\n')}\n\nTASK: Choose which agent presented the strongest argument.\n\nIMPORTANT: Respond with ONLY the filename of the winning agent. Do not include any other text, explanation, or punctuation.\n\nValid responses: ${config.spec.agents.map(a => `"${a}"`).join(' or ')}`;
        }
        
        let response;
        if (responseFormat) {
          const structuredModel = model.withStructuredOutput(responseFormat);
          response = await structuredModel.invoke([
            { role: 'system', content: judgeConfig.spec.system_prompt },
            { role: 'user', content: judgePrompt }
          ]);
          structuredResult = response; // Use the last judge's structured response
        } else {
          response = await model.invoke([
            { role: 'system', content: judgeConfig.spec.system_prompt },
            { role: 'user', content: judgePrompt }
          ]);
        }
        
        if (responseFormat) {
          // Structured response already handled
        } else {
          // Parse the vote - extract filename
          let vote = response.content.trim();
          // Remove quotes if present
          vote = vote.replace(/^["']|["']$/g, '');
          // Check if it's a valid agent file
          if (!config.spec.agents.includes(vote)) {
            // Try to find a matching filename in the response
            const filenameMatch = vote.match(/(default\/[^.]+\.yaml)/);
            if (filenameMatch) {
              vote = filenameMatch[1];
            } else {
              vote = 'Invalid';
            }
          }
          
          votes.push({
            judge: judgeFile,
            vote: vote
          });
        }
      }
    } catch (error) {
      votes.push({
        judge: judgeFile,
        vote: 'Error'
      });
    }
  }
  
  // Count votes to determine winner
  const voteCount = {};
  votes.forEach(v => {
    if (v.vote && v.vote !== 'Error') {
      voteCount[v.vote] = (voteCount[v.vote] || 0) + 1;
    }
  });
  
  let winner = null;
  let maxVotes = 0;
  for (const [candidate, count] of Object.entries(voteCount)) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = candidate;
    }
  }
  
  const winnerArgument = agentArguments.find(arg => arg.agent === winner)?.argument || 'No argument found';
  
  if (typeof outputFormat === 'object' && outputFormat.format === 'json') {
    let result;
    if (structuredResult) {
      result = structuredResult;
      // Add agents_response in debug mode
      if (config.spec.debug) {
        result.agents_response = agentArguments;
      }
    } else {
      result = {
        debate: config.metadata.name,
        method: config.spec.method,
        input: config.spec.input,
        agents: config.spec.agents,
        judges: config.spec.judges,
        arguments: agentArguments,
        votes: votes,
        winner: winner,
        winnerResponse: winnerArgument,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      // Add agents_response in debug mode
      if (config.spec.debug) {
        result.agents_response = agentArguments;
      }
    }
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Running debate with method: ${config.spec.method}`);
    console.log(`Topic: ${config.spec.input}`);
    console.log(`Agents: ${config.spec.agents.join(', ')}`);
    console.log(`Judges: ${config.spec.judges.join(', ')}`);
    
    agentArguments.forEach((arg, index) => {
      console.log(`\nAgent ${index + 1} (${arg.agent}):`);
      console.log(arg.argument);
    });
    
    console.log('\nVotes:');
    votes.forEach(v => {
      console.log(`${v.judge}: ${v.vote}`);
    });
    
    console.log(`\nWinner: ${winner}`);
    console.log(`Winning argument: ${winnerArgument}`);
  }
}

module.exports = {
  buildWorkflow,
  runTeam,
  runDebate
};
