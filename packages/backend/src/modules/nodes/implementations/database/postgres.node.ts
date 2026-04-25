import { NodeDefinition } from '../../types';

let pgLib: typeof import('pg') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pgLib = require('pg');
} catch {
  pgLib = null;
}

export const PostgresNode: NodeDefinition = {
  description: {
    type: 'flowforge.postgres',
    displayName: 'Postgres',
    description: 'Run a SQL query against a Postgres database',
    icon: '🐘',
    color: '#336791',
    category: 'database',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'postgres', required: true }],
    properties: [
      {
        name: 'query',
        displayName: 'SQL Query',
        type: 'code',
        language: 'json',
        default: 'SELECT NOW() AS now;',
        typeOptions: { rows: 6 },
      },
    ],
  },
  async execute(ctx, items) {
    if (!pgLib) {
      throw new Error('pg driver not installed; run `pnpm add pg` in backend');
    }
    const cred = await ctx.getCredentials<{
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      ssl?: boolean;
    }>('postgres');
    const client = new pgLib.Client({
      host: cred.host,
      port: Number(cred.port) || 5432,
      database: cred.database,
      user: cred.user,
      password: cred.password,
      ssl: cred.ssl ? { rejectUnauthorized: false } : undefined,
    });
    await client.connect();
    try {
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const q = ctx.getNodeParameter<string>('query', i, '');
        const res = await client.query(q);
        for (const row of res.rows) out.push({ json: row });
      }
      return out;
    } finally {
      await client.end();
    }
  },
};
