# YAML Structure Guide for LLM-MAR

This guide explains how to structure YAML configuration files for the LLM-MAR (Large Language Model Multi-Agent Reasoning) tool.

## Overview

LLM-MAR uses YAML files to define agents, teams, and debates. Each configuration follows a consistent structure with version, kind, metadata, and spec sections.

## Common Structure

All YAML files share this basic structure:

```yaml
version: '1.0'
kind: [Agent|Team|Debate]
metadata:
  name: [string]
  description: [string]
spec:
  # Kind-specific configuration
```

## Agent Configuration

Agents are individual AI entities with specific roles and behaviors.

### Basic Agent Structure

```yaml
version: '1.0'
kind: Agent
metadata:
  name: Albert Einstein
  description: Theoretical physicist agent
spec:
  id: einstein
  model: gpt-4
  goal: To think deeply about scientific questions
  role: Theoretical Physicist
  system_prompt: You are Albert Einstein, the brilliant theoretical physicist...
  instructions:
    - Think with deep intellectual curiosity
    - Use thought experiments and analogies
    - Challenge conventional assumptions
    - Express complex ideas with elegant simplicity
  output:  # Optional: for structured responses
    format: json
    structure:
      response: string
      reasoning: string
```

### Agent Fields

- **id**: Unique identifier for the agent
- **model**: OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo)
- **goal**: High-level objective of the agent
- **role**: Specific role or persona
- **system_prompt**: Instructions that define the agent's personality and behavior
- **instructions**: List of specific behavioral guidelines
- **output**: Optional structured output configuration

### Output Structure

For structured responses, define the expected JSON format:

```yaml
output:
  format: json
  structure:
    field_name: data_type  # string, number, boolean
    nested_object:
      subfield: string
    array_field:
      - item_type: string
  instructions: |
    Detailed instructions for the AI about what content to put in each field.
    Explain the purpose of each field and what kind of response is expected.
    This text will be included in the AI prompt to guide its output.
```

The `instructions` field is optional but recommended for complex structured outputs. It provides specific guidance to the AI about how to fill each field, making the output more predictable and useful.

## Team Configuration

Teams coordinate multiple agents to work together on tasks.

### Basic Team Structure

```yaml
version: '1.0'
kind: Team
metadata:
  name: Research Team
  description: A team for collaborative research
spec:
  method: sequential  # or parallel
  input: Research question here
  agents:
    - agent1.yaml
    - agent2.yaml
  output:
    format: json
    structure:
      conclusion: string
      evidence: string
```

### Team Fields

- **method**: How agents collaborate (sequential, parallel)
- **input**: The task or question for the team
- **agents**: List of agent YAML file paths
- **output**: Optional structured output format

## Debate Configuration

Debates pit agents against each other with judges to determine winners.

### Basic Debate Structure

```yaml
version: '1.0'
kind: Debate
metadata:
  name: AI Ethics Debate
  description: Debate on AI regulation
spec:
  method: majority_vote  # or first_judge
  input: Should AI be regulated?
  judges:
    - judge.yaml
  agents:
    - agent1.yaml
    - agent2.yaml
  output:
    format: json
    structure:
      winner: string
      votes:
        - agent: string
          vote: string
```

### Debate Fields

- **method**: Voting method (majority_vote, first_judge)
- **input**: The debate topic or question
- **judges**: List of judge agent YAML file paths
- **agents**: List of debating agent YAML file paths
- **output**: Structured output for debate results with optional instructions

### Structured Output with Instructions

For debates with complex evaluation requirements, use the `instructions` field to guide the judge's evaluation criteria:

```yaml
output:
  format: json
  structure:
    winner: string
    reasoning: string
    votes:
      - agent: string
        vote: string
  instructions: |
    Evaluate the debate arguments and provide structured judgment.
    - winner: filename of the winning agent
    - reasoning: overall explanation for the decision
    - votes: detailed analysis of each agent's argument quality
```

## File Organization

Store YAML files in organized directories:

```
default/
  agents/
    scientist.yaml
    philosopher.yaml
    judge.yaml
  teams/
    research_team.yaml
  debates/
    ethics_debate.yaml
```

## Best Practices

1. **Use descriptive names**: Choose clear, meaningful names for agents and configurations
2. **Write detailed system prompts**: Provide comprehensive instructions for agent behavior
3. **Define clear roles**: Give each agent a distinct purpose and expertise
4. **Structure outputs**: Use structured output for programmatic processing
5. **Add instructions for complex outputs**: Use the `instructions` field in output configuration to guide AI behavior for structured responses
6. **Test configurations**: Run agents individually before using in teams/debates
7. **Version control**: Keep YAML files under version control for collaboration

## Examples

### Simple Agent
```yaml
version: '1.0'
kind: Agent
metadata:
  name: Helper
  description: A helpful assistant
spec:
  id: helper
  model: gpt-4
  goal: To assist users
  role: Assistant
  system_prompt: You are a helpful assistant.
  instructions:
    - Be polite and clear
    - Provide accurate information
```

### Structured Output Agent
```yaml
version: '1.0'
kind: Agent
metadata:
  name: Analyst
  description: Data analysis agent
spec:
  id: analyst
  model: gpt-4
  goal: To analyze data and provide insights
  role: Data Analyst
  system_prompt: You are a data analyst who provides structured insights.
  instructions:
    - Analyze data objectively
    - Provide clear conclusions
    - Support claims with evidence
  output:
    format: json
    structure:
      analysis: string
      key_findings:
        - finding: string
          importance: string
      recommendation: string
```

### Debate with Multiple Judges
```yaml
version: '1.0'
kind: Debate
metadata:
  name: Climate Change Debate
  description: Debate on climate policy
spec:
  method: majority_vote
  input: What is the best approach to combat climate change?
  judges:
    - judges/scientist_judge.yaml
    - judges/economist_judge.yaml
  agents:
    - agents/environmentalist.yaml
    - agents/economist.yaml
    - agents/technologist.yaml
  output:
    format: json
    structure:
      winner: string
      reasoning: string
      votes:
        - agent: string
          vote: string
    instructions: |
      Evaluate each agent's argument based on:
      - Scientific accuracy and evidence
      - Economic feasibility and cost-benefit analysis
      - Technical implementation challenges
      - Social and political considerations
      Provide detailed reasoning for your judgment.
```

## Validation

Always validate your YAML files:
- Use a YAML validator to check syntax
- Test agents individually with `llm-mar run agent.yaml`
- Ensure file paths are correct and accessible
- Verify structured output schemas match expected formats</content>
<parameter name="filePath">/root/llm-mar/docs/yaml-structure-guide.md