import { NodeDefinition } from '../../types';

export const WebhookTriggerNode: NodeDefinition = {
  description: {
    type: 'flowforge.webhookTrigger',
    displayName: 'Webhook',
    description: 'Triggers the workflow when its URL is called',
    icon: '🌐',
    color: '#0088ff',
    category: 'trigger',
    inputs: 0,
    outputs: 1,
    trigger: true,
    webhook: true,
    properties: [
      {
        name: 'path',
        displayName: 'Path',
        type: 'string',
        default: '',
        placeholder: 'my-webhook (leave empty to use workflow id)',
        required: false,
        noExpression: true,
      },
      {
        name: 'method',
        displayName: 'HTTP Method',
        type: 'options',
        default: 'POST',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'Any', value: 'ANY' },
        ],
        noExpression: true,
      },
      {
        name: 'responseMode',
        displayName: 'Response',
        type: 'options',
        default: 'onReceived',
        options: [
          { name: 'Immediately on receive', value: 'onReceived' },
          { name: 'When workflow finishes', value: 'lastNode' },
        ],
        noExpression: true,
      },
    ],
  },
  async execute(ctx, _items) {
    const wd = ctx.webhookData;
    if (!wd) return [{ json: {} }];
    return [
      {
        json: {
          body: wd.body,
          headers: wd.headers,
          query: wd.query,
          params: wd.params,
          method: wd.method,
        },
      },
    ];
  },
};
