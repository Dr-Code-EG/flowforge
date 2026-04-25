import { NodeDefinition } from '../../types';

let mongoLib: typeof import('mongodb') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mongoLib = require('mongodb');
} catch {
  mongoLib = null;
}

export const MongoDbNode: NodeDefinition = {
  description: {
    type: 'flowforge.mongodb',
    displayName: 'MongoDB',
    description: 'Find / insert / update documents',
    icon: '🍃',
    color: '#13aa52',
    category: 'database',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'mongodb', required: true }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'find',
        options: [
          { name: 'Find', value: 'find' },
          { name: 'Insert One', value: 'insertOne' },
          { name: 'Update One', value: 'updateOne' },
          { name: 'Delete One', value: 'deleteOne' },
        ],
        noExpression: true,
      },
      { name: 'collection', displayName: 'Collection', type: 'string', default: '' },
      {
        name: 'filter',
        displayName: 'Filter (JSON)',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: { operation: ['find', 'updateOne', 'deleteOne'] },
        },
      },
      {
        name: 'document',
        displayName: 'Document (JSON)',
        type: 'json',
        default: '{}',
        displayOptions: { show: { operation: ['insertOne'] } },
      },
      {
        name: 'update',
        displayName: 'Update (JSON, $set wrapper)',
        type: 'json',
        default: '{}',
        displayOptions: { show: { operation: ['updateOne'] } },
      },
    ],
  },
  async execute(ctx, items) {
    if (!mongoLib) {
      throw new Error('mongodb driver not installed; install with `pnpm add mongodb`');
    }
    const cred = await ctx.getCredentials<{ uri: string; database: string }>(
      'mongodb',
    );
    const client = new mongoLib.MongoClient(cred.uri);
    await client.connect();
    try {
      const db = client.db(cred.database);
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const op = ctx.getNodeParameter<string>('operation', i, 'find');
        const collection = ctx.getNodeParameter<string>('collection', i, '');
        const col = db.collection(collection);
        if (op === 'find') {
          const filter = parseObj(ctx.getNodeParameter<unknown>('filter', i, {}));
          const docs = await col.find(filter).limit(1000).toArray();
          for (const d of docs) out.push({ json: d as Record<string, unknown> });
        } else if (op === 'insertOne') {
          const doc = parseObj(ctx.getNodeParameter<unknown>('document', i, {}));
          const r = await col.insertOne(doc);
          out.push({ json: { insertedId: r.insertedId } });
        } else if (op === 'updateOne') {
          const filter = parseObj(ctx.getNodeParameter<unknown>('filter', i, {}));
          const update = parseObj(ctx.getNodeParameter<unknown>('update', i, {}));
          const r = await col.updateOne(filter, { $set: update });
          out.push({ json: { matched: r.matchedCount, modified: r.modifiedCount } });
        } else if (op === 'deleteOne') {
          const filter = parseObj(ctx.getNodeParameter<unknown>('filter', i, {}));
          const r = await col.deleteOne(filter);
          out.push({ json: { deleted: r.deletedCount } });
        }
      }
      return out;
    } finally {
      await client.close();
    }
  },
};

function parseObj(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return typeof p === 'object' && p !== null ? p : {};
    } catch {
      return {};
    }
  }
  return {};
}
