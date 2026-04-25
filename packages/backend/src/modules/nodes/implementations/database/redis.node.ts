import { NodeDefinition } from '../../types';

let RedisLib: typeof import('ioredis').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RedisLib = require('ioredis').default ?? require('ioredis');
} catch {
  RedisLib = null;
}

export const RedisNode: NodeDefinition = {
  description: {
    type: 'flowforge.redis',
    displayName: 'Redis',
    description: 'Get / set / delete keys, push to lists, publish to channels',
    icon: '🟥',
    color: '#dc382d',
    category: 'database',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'redis' }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'get',
        options: [
          { name: 'GET', value: 'get' },
          { name: 'SET', value: 'set' },
          { name: 'DEL', value: 'del' },
          { name: 'LPUSH', value: 'lpush' },
          { name: 'PUBLISH', value: 'publish' },
        ],
        noExpression: true,
      },
      { name: 'key', displayName: 'Key', type: 'string', default: '' },
      {
        name: 'value',
        displayName: 'Value',
        type: 'string',
        default: '',
        displayOptions: { show: { operation: ['set', 'lpush', 'publish'] } },
      },
    ],
  },
  async execute(ctx, items) {
    if (!RedisLib) throw new Error('ioredis not installed');
    const cred = await ctx.getCredentials<{
      host: string;
      port: number;
      password?: string;
      db?: number;
    }>('redis');
    const client = new RedisLib({
      host: cred.host || 'localhost',
      port: Number(cred.port) || 6379,
      password: cred.password,
      db: cred.db ?? 0,
    });
    try {
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const op = ctx.getNodeParameter<string>('operation', i, 'get');
        const key = ctx.getNodeParameter<string>('key', i, '');
        const value = ctx.getNodeParameter<string>('value', i, '');
        let r: unknown;
        if (op === 'get') r = await client.get(key);
        else if (op === 'set') r = await client.set(key, value);
        else if (op === 'del') r = await client.del(key);
        else if (op === 'lpush') r = await client.lpush(key, value);
        else if (op === 'publish') r = await client.publish(key, value);
        out.push({ json: { result: r as unknown } });
      }
      return out;
    } finally {
      client.disconnect();
    }
  },
};
