import { NodeDefinition } from '../../types';

const OPERATORS = [
  { name: 'Equal', value: 'equal' },
  { name: 'Not Equal', value: 'notEqual' },
  { name: 'Greater', value: 'gt' },
  { name: 'Less', value: 'lt' },
  { name: 'Greater Or Equal', value: 'gte' },
  { name: 'Less Or Equal', value: 'lte' },
  { name: 'Contains', value: 'contains' },
  { name: 'Starts With', value: 'startsWith' },
  { name: 'Ends With', value: 'endsWith' },
  { name: 'Is Empty', value: 'isEmpty' },
  { name: 'Is Not Empty', value: 'isNotEmpty' },
  { name: 'Regex', value: 'regex' },
];

export const IfNode: NodeDefinition = {
  description: {
    type: 'flowforge.if',
    displayName: 'IF',
    description: 'Routes items based on a condition (true / false outputs)',
    icon: '❓',
    color: '#ff9933',
    category: 'flow',
    inputs: 1,
    outputs: ['true', 'false'],
    properties: [
      {
        name: 'value1',
        displayName: 'Value 1',
        type: 'string',
        default: '',
        placeholder: '={{ $json.foo }}',
      },
      {
        name: 'operator',
        displayName: 'Operator',
        type: 'options',
        default: 'equal',
        options: OPERATORS,
        noExpression: true,
      },
      {
        name: 'value2',
        displayName: 'Value 2',
        type: 'string',
        default: '',
      },
      {
        name: 'combineOperation',
        displayName: 'Combine',
        type: 'options',
        default: 'all',
        options: [
          { name: 'All conditions (AND)', value: 'all' },
          { name: 'Any condition (OR)', value: 'any' },
        ],
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    const trueItems: import('@flowforge/shared').NodeItem[] = [];
    const falseItems: import('@flowforge/shared').NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const v1 = ctx.getNodeParameter<unknown>('value1', i, '');
      const op = ctx.getNodeParameter<string>('operator', i, 'equal');
      const v2 = ctx.getNodeParameter<unknown>('value2', i, '');
      if (compare(v1, op, v2)) trueItems.push(items[i]);
      else falseItems.push(items[i]);
    }
    return [trueItems, falseItems];
  },
};

function compare(a: unknown, op: string, b: unknown): boolean {
  const sa = a == null ? '' : String(a);
  const sb = b == null ? '' : String(b);
  switch (op) {
    case 'equal':
      return sa === sb;
    case 'notEqual':
      return sa !== sb;
    case 'gt':
      return Number(a) > Number(b);
    case 'lt':
      return Number(a) < Number(b);
    case 'gte':
      return Number(a) >= Number(b);
    case 'lte':
      return Number(a) <= Number(b);
    case 'contains':
      return sa.includes(sb);
    case 'startsWith':
      return sa.startsWith(sb);
    case 'endsWith':
      return sa.endsWith(sb);
    case 'isEmpty':
      return sa === '' || a === null || a === undefined;
    case 'isNotEmpty':
      return sa !== '' && a !== null && a !== undefined;
    case 'regex':
      try {
        return new RegExp(sb).test(sa);
      } catch {
        return false;
      }
    default:
      return false;
  }
}
