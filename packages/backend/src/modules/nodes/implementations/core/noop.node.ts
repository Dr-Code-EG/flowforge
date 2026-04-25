import { NodeDefinition } from '../../types';

export const NoOpNode: NodeDefinition = {
  description: {
    type: 'flowforge.noop',
    displayName: 'No Op',
    description: 'Pass items through unchanged (useful for documentation)',
    icon: '⚪',
    color: '#cccccc',
    category: 'flow',
    inputs: 1,
    outputs: 1,
    properties: [],
  },
  async execute(_ctx, items) {
    return items;
  },
};
