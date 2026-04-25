import { NodeDefinition } from '../../types';

let mysqlLib: typeof import('mysql2/promise') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mysqlLib = require('mysql2/promise');
} catch {
  mysqlLib = null;
}

export const MysqlNode: NodeDefinition = {
  description: {
    type: 'flowforge.mysql',
    displayName: 'MySQL',
    description: 'Run a SQL query against a MySQL/MariaDB database',
    icon: '🐬',
    color: '#00758f',
    category: 'database',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'mysql', required: true }],
    properties: [
      {
        name: 'query',
        displayName: 'SQL Query',
        type: 'code',
        language: 'json',
        default: 'SELECT 1 AS one;',
        typeOptions: { rows: 6 },
      },
    ],
  },
  async execute(ctx, items) {
    if (!mysqlLib) {
      throw new Error('mysql2 not installed; install it with `pnpm add mysql2`');
    }
    const cred = await ctx.getCredentials<{
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    }>('mysql');
    const conn = await mysqlLib.createConnection({
      host: cred.host,
      port: Number(cred.port) || 3306,
      database: cred.database,
      user: cred.user,
      password: cred.password,
    });
    try {
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const q = ctx.getNodeParameter<string>('query', i, '');
        const [rows] = await conn.query(q);
        if (Array.isArray(rows)) {
          for (const row of rows as Record<string, unknown>[]) out.push({ json: row });
        } else {
          out.push({ json: rows as unknown as Record<string, unknown> });
        }
      }
      return out;
    } finally {
      await conn.end();
    }
  },
};
