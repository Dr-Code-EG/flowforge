import { NodeDefinition } from '../../types';

export const SplitInBatchesNode: NodeDefinition = {
  description: {
    type: 'flowforge.splitInBatches',
    displayName: 'Split in Batches',
    description: 'Split items into smaller batches',
    icon: '📦',
    color: '#88aa55',
    category: 'flow',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'batchSize',
        displayName: 'Batch Size',
        type: 'number',
        default: 10,
      },
    ],
  },
  async execute(ctx, items) {
    const size = Math.max(1, ctx.getNodeParameter<number>('batchSize', 0, 10));
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i += size) {
      out.push({ json: { batch: items.slice(i, i + size).map((x) => x.json) } });
    }
    return out;
  },
};
