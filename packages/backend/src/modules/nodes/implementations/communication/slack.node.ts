import axios from 'axios';
import { NodeDefinition } from '../../types';

export const SlackNode: NodeDefinition = {
  description: {
    type: 'flowforge.slack',
    displayName: 'Slack',
    description: 'Send messages to Slack via webhook URL or bot token',
    icon: '💬',
    color: '#4A154B',
    category: 'communication',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'slackApi' }],
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'webhook',
        options: [
          { name: 'Incoming Webhook URL', value: 'webhook' },
          { name: 'Bot Token (chat.postMessage)', value: 'bot' },
        ],
        noExpression: true,
      },
      {
        name: 'webhookUrl',
        displayName: 'Webhook URL',
        type: 'string',
        default: '',
        typeOptions: { password: true },
        displayOptions: { show: { mode: ['webhook'] } },
      },
      {
        name: 'channel',
        displayName: 'Channel',
        type: 'string',
        default: '#general',
        displayOptions: { show: { mode: ['bot'] } },
      },
      {
        name: 'text',
        displayName: 'Message',
        type: 'string',
        default: '',
        typeOptions: { rows: 4 },
      },
    ],
  },
  async execute(ctx, items) {
    const mode = ctx.getNodeParameter<string>('mode', 0, 'webhook');
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const text = ctx.getNodeParameter<string>('text', i, '');
      if (mode === 'webhook') {
        const url = ctx.getNodeParameter<string>('webhookUrl', i, '');
        if (!url) throw new Error('Slack webhook URL is required');
        const res = await axios.post(url, { text });
        out.push({ json: { ok: res.status === 200 } });
      } else {
        const cred = await ctx.getCredentials<{ token: string }>('slackApi');
        const channel = ctx.getNodeParameter<string>('channel', i, '#general');
        const res = await axios.post(
          'https://slack.com/api/chat.postMessage',
          { channel, text },
          { headers: { Authorization: `Bearer ${cred.token}` } },
        );
        out.push({ json: res.data });
      }
    }
    return out;
  },
};
