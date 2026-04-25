import axios from 'axios';
import { NodeDefinition } from '../../types';

export const OpenAiNode: NodeDefinition = {
  description: {
    type: 'flowforge.openai',
    displayName: 'OpenAI',
    description: 'Chat completion via the OpenAI API (also works with OpenAI-compatible providers)',
    icon: '🤖',
    color: '#10a37f',
    category: 'ai',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'openAiApi', required: true }],
    properties: [
      {
        name: 'baseUrl',
        displayName: 'Base URL',
        type: 'string',
        default: 'https://api.openai.com/v1',
        noExpression: true,
      },
      {
        name: 'model',
        displayName: 'Model',
        type: 'string',
        default: 'gpt-4o-mini',
      },
      {
        name: 'systemPrompt',
        displayName: 'System Prompt',
        type: 'string',
        default: 'You are a helpful assistant.',
        typeOptions: { rows: 3 },
      },
      {
        name: 'userPrompt',
        displayName: 'User Prompt',
        type: 'string',
        default: '={{ $json.input }}',
        typeOptions: { rows: 4 },
      },
      {
        name: 'temperature',
        displayName: 'Temperature',
        type: 'number',
        default: 0.7,
      },
    ],
  },
  async execute(ctx, items) {
    const cred = await ctx.getCredentials<{ apiKey: string }>('openAiApi');
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const baseUrl = ctx.getNodeParameter<string>('baseUrl', i, 'https://api.openai.com/v1');
      const model = ctx.getNodeParameter<string>('model', i, 'gpt-4o-mini');
      const system = ctx.getNodeParameter<string>('systemPrompt', i, '');
      const user = ctx.getNodeParameter<string>('userPrompt', i, '');
      const temperature = ctx.getNodeParameter<number>('temperature', i, 0.7);

      const res = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model,
          temperature,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${cred.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120_000,
        },
      );
      const content = res.data?.choices?.[0]?.message?.content ?? '';
      out.push({ json: { content, raw: res.data } });
    }
    return out;
  },
};
