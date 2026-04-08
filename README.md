# LLM-MAR

LLM-MAR is a compact CLI that creates LLM agents, lets them debate, answers questions, and builds workflows.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/renatojuniorrs/llm-mar.git
   cd llm-mar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### Creating Agents

Create a new agent YAML file:

```bash
npx llm-mar create agent myagent --model gpt-4 --goal "To answer questions" --role "Assistant" --system-prompt "You are a helpful assistant." --instructions "Think step by step,Answer clearly" --output text
```

This creates `default/myagent.yaml`.

### Creating Teams

Create a team of agents:

```bash
npx llm-mar create team myteam --agents "default/agent1.yaml,default/agent2.yaml" --output text
```

### Running Agents

Run an agent with input:

```bash
npx llm-mar run default/myagent.yaml --input "What is the capital of France?"
```

### Running Teams

Run a team with a specific agent:

```bash
npx llm-mar run default/myteam.yaml --agent agent1 --input "Discuss this topic"
```

### Running Debates

Run a debate (assuming you have a debate YAML):

```bash
npx llm-mar run default/debate1.yaml
```

## YAML Structure

See [docs/yaml-structure-guide.md](docs/yaml-structure-guide.md) for details on YAML file formats.
