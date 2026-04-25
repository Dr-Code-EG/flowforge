import { NodeDefinition } from '../../types';

let ftpLib: typeof import('basic-ftp') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ftpLib = require('basic-ftp');
} catch {
  ftpLib = null;
}

export const FtpNode: NodeDefinition = {
  description: {
    type: 'flowforge.ftp',
    displayName: 'FTP',
    description: 'List or download files from an FTP server',
    icon: '📁',
    color: '#aa8866',
    category: 'storage',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'ftp', required: true }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'list',
        options: [
          { name: 'List', value: 'list' },
          { name: 'Download (text)', value: 'download' },
        ],
        noExpression: true,
      },
      { name: 'path', displayName: 'Path', type: 'string', default: '/' },
    ],
  },
  async execute(ctx, items) {
    if (!ftpLib) throw new Error('basic-ftp not installed; run `pnpm add basic-ftp`');
    const cred = await ctx.getCredentials<{
      host: string;
      port: number;
      user: string;
      password: string;
      secure?: boolean;
    }>('ftp');
    const client = new ftpLib.Client();
    try {
      await client.access({
        host: cred.host,
        port: Number(cred.port) || 21,
        user: cred.user,
        password: cred.password,
        secure: cred.secure ?? false,
      });
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const op = ctx.getNodeParameter<string>('operation', i, 'list');
        const path = ctx.getNodeParameter<string>('path', i, '/');
        if (op === 'list') {
          const list = await client.list(path);
          for (const f of list) {
            out.push({
              json: { name: f.name, size: f.size, type: f.type, modifiedAt: f.modifiedAt },
            });
          }
        } else {
          const { Writable } = await import('stream');
          const chunks: Buffer[] = [];
          const writable = new Writable({
            write(chunk, _enc, cb) {
              chunks.push(Buffer.from(chunk));
              cb();
            },
          });
          await client.downloadTo(writable, path);
          out.push({ json: { content: Buffer.concat(chunks).toString('utf8') } });
        }
      }
      return out;
    } finally {
      client.close();
    }
  },
};
