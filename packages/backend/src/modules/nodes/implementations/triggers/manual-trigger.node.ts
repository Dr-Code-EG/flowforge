import { NodeDefinition } from '../../types';

export const ManualTriggerNode: NodeDefinition = {
  description: {
    type: 'flowforge.manualTrigger',
    displayName: 'Manual Trigger',
    description: 'Starts the workflow when run from the editor',
    icon: '👆',
    color: '#888888',
    category: 'trigger',
    inputs: 0,
    outputs: 1,
    trigger: true,
    properties: [],
  },
  async execute(_ctx, items) {
    return items.length ? items : [{ json: {} }];
  },
};
