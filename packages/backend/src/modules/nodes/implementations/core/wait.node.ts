import { NodeDefinition } from '../../types';

export const WaitNode: NodeDefinition = {
  description: {
    type: 'flowforge.wait',
    displayName: 'Wait',
    description: 'Pause the workflow for a fixed duration',
    icon: '⏳',
    color: '#666666',
    category: 'flow',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'amount',
        displayName: 'Amount',
        type: 'number',
        default: 1,
      },
      {
        name: 'unit',
        displayName: 'Unit',
        type: 'options',
        default: 'seconds',
        options: [
          { name: 'Milliseconds', value: 'ms' },
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
        ],
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    const amount = ctx.getNodeParameter<number>('amount', 0, 1);
    const unit = ctx.getNodeParameter<string>('unit', 0, 'seconds');
    const ms =
      unit === 'ms' ? amount : unit === 'minutes' ? amount * 60_000 : amount * 1000;
    // Cap to 5 minutes to avoid hanging the engine; for longer waits use scheduled triggers
    const cap = Math.min(ms, 5 * 60_000);
    await new Promise((r) => setTimeout(r, cap));
    return items;
  },
};
