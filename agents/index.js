const { ChatOpenAI } = require('@langchain/openai');
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

function createAgent({ modelSettings, systemPrompt, responseFormat }) {
  if (!modelSettings) {
    throw new Error('createAgent requires modelSettings');
  }
  if (!systemPrompt) {
    throw new Error('createAgent requires a systemPrompt');
  }

  // Handle both string model name (backward compatibility) and object modelSettings
  let modelConfig;
  if (typeof modelSettings === 'string') {
    modelConfig = { modelName: modelSettings, temperature: 0.7 };
  } else {
    modelConfig = { 
      modelName: modelSettings.model, 
      ...modelSettings 
    };
  }

  const chatModel = new ChatOpenAI(modelConfig);

  if (responseFormat) {
    return chatModel.withStructuredOutput(responseFormat);
  }

  return chatModel;
}

async function runAgent(config, input) {
  const name = config.metadata ? config.metadata.name : config.spec.id;
  const id = config.spec.id;
  const outputFormat = config.spec.output || 'text';
  
  // Get model name for display
  const modelName = config.spec.model_settings ? 
    (typeof config.spec.model_settings === 'string' ? config.spec.model_settings : config.spec.model_settings.model) : 
    config.spec.model;
  
  let systemPrompt = config.spec.system_prompt;
  let responseFormat = null;
  
  if (typeof outputFormat === 'object' && outputFormat.format === 'json' && outputFormat.structure) {
    responseFormat = createZodSchema(outputFormat.structure);
    if (outputFormat.instructions) {
      input = `${outputFormat.instructions}\n\n${input}`;
    }
  } else if (outputFormat === 'json') {
    systemPrompt += '\n\nRespond in valid JSON format only. Structure your response as a JSON object.';
  }
  
  const modelSettings = config.spec.model_settings || config.spec.model;
  
  const model = createAgent({
    modelSettings: modelSettings,
    systemPrompt: systemPrompt,
    responseFormat: responseFormat
  });
  
  try {
    let response;
    if (responseFormat) {
      response = await model.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ]);
      // For structured output, response is already parsed
    } else {
      response = await model.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ]);
    }
    
    if (typeof outputFormat === 'object' && outputFormat.format === 'json') {
      const result = {
        agent: name,
        model: modelName,
        input: input,
        response: responseFormat ? response : response.content,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(result, null, 2));
    } else if (outputFormat === 'json') {
      // Try to parse the response as JSON, if not, wrap it
      try {
        const parsed = JSON.parse(response.content);
        const result = {
          agent: name,
          model: modelName,
          input: input,
          response: parsed,
          timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(result, null, 2));
      } catch (parseError) {
        // If not valid JSON, wrap the text response
        const result = {
          agent: name,
          model: config.spec.model,
          input: input,
          response: response.content,
          timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log(`Running agent: ${name}`);
      console.log(`Model: ${modelName}`);
      console.log(`Input: ${input}`);
      console.log(`Response: ${response.content}`);
    }
  } catch (error) {
    if (outputFormat === 'json' || (typeof outputFormat === 'object' && outputFormat.format === 'json')) {
      const errorResult = {
        agent: name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(errorResult, null, 2));
    } else {
      console.error(`Error calling model: ${error.message}`);
      console.log(`Response: [Error: Could not reach model]`);
    }
  }
}

module.exports = {
  createAgent,
  runAgent
};
