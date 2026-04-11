# LLM-MAR

[![npm version](https://badge.fury.io/js/llm-mar.svg)](https://badge.fury.io/js/llm-mar) [![Socket Badge](https://badge.socket.dev/npm/package/llm-mar)](https://socket.dev/npm/package/llm-mar)

LLM-MAR (Multi Agent Reasoning) is a compact CLI that creates LLM agents, lets them debate, answers questions, and builds workflows.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [YAML Structure](#yaml-structure)

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g llm-mar
```

### Option 2: Install from source

1. Clone the repository:
   ```bash
   git clone https://github.com/llm-mar/llm-mar.git
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

## Quick Start

Get started with LLM-MAR in minutes! Create intelligent agents, form teams, and orchestrate debates—all through simple YAML configurations.

### 1. Create Your First Agent

Let's create an AI assistant specialized in creative writing:

```bash
llm-mar create agent writer --model gpt-4 --goal "To write engaging stories" --role "Creative Writer" --system-prompt "You are a talented fiction writer with a vivid imagination." --instructions "Use descriptive language,Build suspense,End with a twist" --output text
```

This generates a YAML configuration file that defines your agent's personality and capabilities.

### 2. See the YAML Structure

The command above creates `default/writer.yaml` with this structure:

```yaml
version: '1.0'
kind: Agent
metadata:
  name: writer
  description: An agent named writer
spec:
  id: writer
  model: gpt-4
  goal: To write engaging stories
  role: Creative Writer
  system_prompt: You are a talented fiction writer with a vivid imagination.
  instructions:
    - Use descriptive language
    - Build suspense
    - End with a twist
  output: text
```

**Key Components:**
- **metadata**: Basic info and description
- **spec**: The agent's configuration including model, role, and behavior
- **instructions**: List of guidelines for the AI's responses

### 3. Run Your Agent

Now let's use the agent to generate a story:

```bash
llm-mar run default/writer.yaml --input "Write a short story about a mysterious old clock in an antique shop."
```

The agent will respond with a creative story based on its configuration!

### 4. Build a Team

Combine multiple agents for collaborative tasks:

```bash
llm-mar create team story_team --agents "default/writer.yaml,default/editor.yaml" --output text
```

### 5. Set Up a Debate

Create engaging debates between agents:

```bash
llm-mar create debate tech_debate --agents "default/optimist.yaml,default/pessimist.yaml" --judges "default/judge.yaml" --input "Will AI replace human jobs?" --output text
```

## Usage

After installation, use the `llm-mar` command (or `npx llm-mar` if installed locally).

### Creating Agents

Create a new agent YAML file:

```bash
llm-mar create agent myagent --model gpt-4 --goal "To answer questions" --role "Assistant" --system-prompt "You are a helpful assistant." --instructions "Think step by step,Answer clearly" --output text
```

This creates `default/myagent.yaml`.

### Creating Teams

Create a team of agents:

```bash
llm-mar create team myteam --agents "default/agent1.yaml,default/agent2.yaml" --output text
```

### Running Agents

Run an agent with input:

```bash
llm-mar run default/myagent.yaml --input "What is the capital of France?"
```

### Running Teams

Run a team with a specific agent:

```bash
llm-mar run default/myteam.yaml --agent agent1 --input "Discuss this topic"
```

### Running Debates

Run a debate (assuming you have a debate YAML):

```bash
llm-mar run default/debate1.yaml
```

## YAML Structure

LLM-MAR uses YAML files to define agents, teams, and debates. Here's a quick overview of the structure:

### Agent YAML

```yaml
version: '1.0'
kind: Agent
metadata:
  name: Scientist
  description: A scientific analysis agent
spec:
  id: scientist
  model: gpt-4
  goal: To provide scientific explanations
  role: Research Scientist
  system_prompt: You are an expert scientist...
  instructions:
    - Use evidence-based reasoning
    - Explain complex concepts simply
  output: text
```

### Team YAML

```yaml
version: '1.0'
kind: Team
metadata:
  name: Research Team
  description: Collaborative research team
spec:
  agents:
    - default/scientist.yaml
    - default/analyst.yaml
  output: text
```

### Debate YAML

```yaml
version: '1.0'
kind: Debate
metadata:
  name: Ethics Debate
  description: Debate on AI ethics
spec:
  method: majority_vote
  input: Should AI have rights?
  judges:
    - default/judge.yaml
  agents:
    - default/pro.yaml
    - default/con.yaml
  output: text
```

For detailed configuration options and advanced features, see [docs/yaml-structure-guide.md](docs/yaml-structure-guide.md).
