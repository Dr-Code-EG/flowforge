import { NodeDefinition } from '../../types';

export const SwitchNode: NodeDefinition = {
  description: {
    type: 'flowforge.switch',
    displayName: 'Switch',
    description: 'Route items to different outputs based on value matches',
    icon: '🔀',
    color: '#cc6699',
    category: 'flow',
    inputs: 1,
    outputs: ['out 0', 'out 1', 'out 2', 'out 3'],
    properties: [
      {
        name: 'value',
        displayName: 'Value',
        type: 'string',
        default: '={{ $json.type }}',
      },
      {
        name: 'rules',
        displayName: 'Rules (JSON)',
        type: 'json',
        default:
          '[\n  { "match": "a", "output": 0 },\n  { "match": "b", "output": 1 }\n]',
        description:
          'Array of { match, output } objects. First match wins. Items with no match go to the last output.',
      },
    ],
  },
  async execute(ctx, items) {
    const out: { json: Record<string, unknown> }[][] = [[], [], [], []];
    for (let i = 0; i < items.length; i++) {
      const value = ctx.getNodeParameter<unknown>('value', i, '');
      const rulesRaw = ctx.getNodeParameter<unknown>('rules', i, []);
      const rules = parseRules(rulesRaw);
      const match = rules.find((r) => String(r.match) === String(value));
      const idx = match ? Math.min(Math.max(match.output, 0), 3) : 3;
      out[idx].push(items[i]);
    }
    return out;
  },
};

function parseRules(v: unknown): Array<{ match: unknown; output: number }> {
  if (Array.isArray(v)) return v as Array<{ match: unknown; output: number }>;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}
