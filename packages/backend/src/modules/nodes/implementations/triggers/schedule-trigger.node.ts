import { NodeDefinition } from '../../types';

export const ScheduleTriggerNode: NodeDefinition = {
  description: {
    type: 'flowforge.scheduleTrigger',
    displayName: 'Schedule (Cron)',
    description: 'Triggers the workflow on a recurring schedule',
    icon: '⏰',
    color: '#22aa66',
    category: 'trigger',
    inputs: 0,
    outputs: 1,
    trigger: true,
    polling: true,
    properties: [
      {
        name: 'cron',
        displayName: 'Cron Expression',
        type: 'string',
        default: '*/5 * * * *',
        description: 'Standard cron, e.g. */5 * * * * (every 5 minutes)',
        required: true,
        noExpression: true,
      },
      {
        name: 'timezone',
        displayName: 'Timezone',
        type: 'string',
        default: 'UTC',
        noExpression: true,
      },
    ],
  },
  async execute(_ctx, _items) {
    return [{ json: { firedAt: new Date().toISOString() } }];
  },
};
