import { NodeDefinition } from '../../types';

export const MergeNode: NodeDefinition = {
  description: {
    type: 'flowforge.merge',
    displayName: 'Merge',
    description: 'Combine items from multiple inputs',
    icon: '⫶',
    color: '#999999',
    category: 'flow',
    inputs: 2,
    outputs: 1,
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'append',
        options: [
          { name: 'Append (concat all)', value: 'append' },
          { name: 'Pass-through (input 1 only)', value: 'passthrough' },
        ],
        noExpression: true,
      },
    ],
  },
  async execute(ctx, _items) {
    const mode = ctx.getNodeParameter<string>('mode', 0, 'append');
    const a = ctx.getInputData(0);
    const b = ctx.getInputData(1);
    if (mode === 'passthrough') return a;
    return [...a, ...b];
  },
};
