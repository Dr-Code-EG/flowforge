import { NodeDefinition } from '../../types';

export const HtmlExtractNode: NodeDefinition = {
  description: {
    type: 'flowforge.htmlExtract',
    displayName: 'HTML Extract',
    description: 'Extract text or attribute values from HTML using regex',
    icon: '🕸️',
    color: '#ff6688',
    category: 'transform',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'sourceField',
        displayName: 'HTML Field',
        type: 'string',
        default: 'data',
      },
      {
        name: 'pattern',
        displayName: 'Regex Pattern',
        type: 'string',
        default: '<title[^>]*>([^<]+)</title>',
        description: 'Regex with one capture group. The first match is returned.',
      },
      {
        name: 'destField',
        displayName: 'Destination Field',
        type: 'string',
        default: 'extracted',
      },
      {
        name: 'flags',
        displayName: 'Regex Flags',
        type: 'string',
        default: 'i',
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    return items.map((item, i) => {
      const html = String((item.json as Record<string, unknown>)[
        ctx.getNodeParameter<string>('sourceField', i, 'data')
      ] ?? '');
      const pattern = ctx.getNodeParameter<string>('pattern', i, '');
      const flags = ctx.getNodeParameter<string>('flags', i, 'i');
      const dst = ctx.getNodeParameter<string>('destField', i, 'extracted');
      let value: string | null = null;
      try {
        const m = html.match(new RegExp(pattern, flags));
        value = m?.[1] ?? m?.[0] ?? null;
      } catch (e) {
        value = `regex error: ${(e as Error).message}`;
      }
      return { json: { ...item.json, [dst]: value } };
    });
  },
};
