import { NodeDefinition } from '../../types';

export const JsonParseNode: NodeDefinition = {
  description: {
    type: 'flowforge.json',
    displayName: 'JSON',
    description: 'Parse or stringify JSON',
    icon: '{}',
    color: '#aa55aa',
    category: 'transform',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'parse',
        options: [
          { name: 'Parse string -> object', value: 'parse' },
          { name: 'Stringify object -> string', value: 'stringify' },
        ],
        noExpression: true,
      },
      {
        name: 'sourceField',
        displayName: 'Source Field',
        type: 'string',
        default: 'data',
      },
      {
        name: 'destField',
        displayName: 'Destination Field',
        type: 'string',
        default: 'parsed',
      },
    ],
  },
  async execute(ctx, items) {
    const mode = ctx.getNodeParameter<string>('mode', 0, 'parse');
    const src = ctx.getNodeParameter<string>('sourceField', 0, 'data');
    const dst = ctx.getNodeParameter<string>('destField', 0, 'parsed');
    return items.map((item) => {
      const value = (item.json as Record<string, unknown>)[src];
      let result: unknown;
      try {
        if (mode === 'parse') {
          result = typeof value === 'string' ? JSON.parse(value) : value;
        } else {
          result = JSON.stringify(value);
        }
      } catch (e) {
        result = { error: (e as Error).message };
      }
      return { json: { ...item.json, [dst]: result } };
    });
  },
};
