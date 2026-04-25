import { NodeDefinition } from '../../types';

export const ItemListsNode: NodeDefinition = {
  description: {
    type: 'flowforge.itemLists',
    displayName: 'Item Lists',
    description: 'Aggregate, split, sort or limit items',
    icon: '📋',
    color: '#5566aa',
    category: 'transform',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'aggregate',
        options: [
          { name: 'Aggregate (combine all into one item)', value: 'aggregate' },
          { name: 'Split out (one item per array element)', value: 'split' },
          { name: 'Sort', value: 'sort' },
          { name: 'Limit (take first N)', value: 'limit' },
        ],
        noExpression: true,
      },
      {
        name: 'field',
        displayName: 'Field',
        type: 'string',
        default: 'data',
        description: 'For split/sort: the field to operate on',
      },
      {
        name: 'count',
        displayName: 'Count',
        type: 'number',
        default: 10,
        displayOptions: { show: { operation: ['limit'] } },
      },
      {
        name: 'order',
        displayName: 'Order',
        type: 'options',
        default: 'asc',
        options: [
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' },
        ],
        displayOptions: { show: { operation: ['sort'] } },
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    const op = ctx.getNodeParameter<string>('operation', 0, 'aggregate');
    if (op === 'aggregate') {
      return [{ json: { items: items.map((i) => i.json) } }];
    }
    if (op === 'split') {
      const field = ctx.getNodeParameter<string>('field', 0, 'data');
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (const item of items) {
        const arr = (item.json as Record<string, unknown>)[field];
        if (Array.isArray(arr)) {
          for (const v of arr) {
            out.push({ json: typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : { value: v } });
          }
        } else {
          out.push(item);
        }
      }
      return out;
    }
    if (op === 'sort') {
      const field = ctx.getNodeParameter<string>('field', 0, 'data');
      const order = ctx.getNodeParameter<string>('order', 0, 'asc');
      const sorted = [...items].sort((a, b) => {
        const av = (a.json as Record<string, unknown>)[field];
        const bv = (b.json as Record<string, unknown>)[field];
        if (av === bv) return 0;
        const cmp = String(av) < String(bv) ? -1 : 1;
        return order === 'asc' ? cmp : -cmp;
      });
      return sorted;
    }
    if (op === 'limit') {
      const n = ctx.getNodeParameter<number>('count', 0, 10);
      return items.slice(0, n);
    }
    return items;
  },
};
