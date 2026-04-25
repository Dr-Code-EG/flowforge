import axios from 'axios';
import { NodeDefinition } from '../../types';

export const DiscordNode: NodeDefinition = {
  description: {
    type: 'flowforge.discord',
    displayName: 'Discord',
    description: 'Send a message via a Discord webhook',
    icon: '🎮',
    color: '#5865F2',
    category: 'communication',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'webhookUrl',
        displayName: 'Webhook URL',
        type: 'string',
        default: '',
        typeOptions: { password: true },
        required: true,
      },
      {
        name: 'content',
        displayName: 'Content',
        type: 'string',
        default: '',
        typeOptions: { rows: 4 },
      },
      {
        name: 'username',
        displayName: 'Username (override)',
        type: 'string',
        default: '',
      },
    ],
  },
  async execute(ctx, items) {
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const url = ctx.getNodeParameter<string>('webhookUrl', i, '');
      const content = ctx.getNodeParameter<string>('content', i, '');
      const username = ctx.getNodeParameter<string>('username', i, '');
      const body: Record<string, unknown> = { content };
      if (username) body.username = username;
      const res = await axios.post(url, body);
      out.push({ json: { status: res.status } });
    }
    return out;
  },
};
