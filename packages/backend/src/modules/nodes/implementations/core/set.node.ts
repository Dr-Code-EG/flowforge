import { NodeDefinition } from '../../types';

export const SetNode: NodeDefinition = {
  description: {
    type: 'flowforge.set',
    displayName: 'Set',
    description: 'Set or override fields on the current item',
    icon: '✏️',
    color: '#0099cc',
    category: 'transform',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'keepOnlySet',
        displayName: 'Keep Only Set Fields',
        type: 'boolean',
        default: false,
      },
      {
        name: 'fields',
        displayName: 'Fields to Set (JSON object)',
        type: 'json',
        default: '{\n  "key": "value"\n}',
        description:
          'Each key becomes a field on the item. Values can be expressions like ={{ $json.foo }}.',
      },
    ],
  },
  async execute(ctx, items) {
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const fieldsRaw = ctx.getNodeParameter<unknown>('fields', i, {});
      const keepOnly = ctx.getNodeParameter<boolean>('keepOnlySet', i, false);
      const fields = parseObject(fieldsRaw);
      const base = keepOnly ? {} : { ...items[i].json };
      out.push({ json: { ...base, ...fields } });
    }
    return out;
  },
};

function parseObject(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return typeof p === 'object' && p !== null ? p : {};
    } catch {
      return {};
    }
  }
  return {};
}
