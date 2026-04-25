import axios from 'axios';
import { NodeDefinition } from '../../types';

export const TelegramNode: NodeDefinition = {
  description: {
    type: 'flowforge.telegram',
    displayName: 'Telegram',
    description: 'Send messages via a Telegram bot',
    icon: '✈️',
    color: '#0088cc',
    category: 'communication',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'telegramApi', required: true }],
    properties: [
      { name: 'chatId', displayName: 'Chat ID', type: 'string', default: '' },
      {
        name: 'text',
        displayName: 'Message',
        type: 'string',
        default: '',
        typeOptions: { rows: 4 },
      },
      {
        name: 'parseMode',
        displayName: 'Parse Mode',
        type: 'options',
        default: 'none',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Markdown', value: 'Markdown' },
          { name: 'MarkdownV2', value: 'MarkdownV2' },
          { name: 'HTML', value: 'HTML' },
        ],
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    const cred = await ctx.getCredentials<{ token: string }>('telegramApi');
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const chatId = ctx.getNodeParameter<string>('chatId', i, '');
      const text = ctx.getNodeParameter<string>('text', i, '');
      const parseMode = ctx.getNodeParameter<string>('parseMode', i, 'none');
      const body: Record<string, unknown> = { chat_id: chatId, text };
      if (parseMode !== 'none') body.parse_mode = parseMode;
      const res = await axios.post(
        `https://api.telegram.org/bot${cred.token}/sendMessage`,
        body,
      );
      out.push({ json: res.data });
    }
    return out;
  },
};
