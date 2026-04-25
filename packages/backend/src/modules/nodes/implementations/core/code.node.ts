import * as vm from 'vm';
import { NodeDefinition } from '../../types';

export const CodeNode: NodeDefinition = {
  description: {
    type: 'flowforge.code',
    displayName: 'Code',
    description: 'Run custom JavaScript on items',
    icon: '💻',
    color: '#444444',
    category: 'developer',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'all',
        options: [
          { name: 'Run Once for All Items', value: 'all' },
          { name: 'Run Once Per Item', value: 'each' },
        ],
        noExpression: true,
      },
      {
        name: 'code',
        displayName: 'JavaScript',
        type: 'code',
        language: 'javascript',
        default:
          '// Available: items (array), $now, $env\n// Return an array of items, or a single item.\nreturn items.map(i => ({ json: { ...i.json, processed: true } }));',
        typeOptions: { rows: 12 },
        noExpression: true,
      },
    ],
  },
  async execute(ctx, items) {
    const mode = ctx.getNodeParameter<string>('mode', 0, 'all');
    const code = ctx.getNodeParameter<string>('code', 0, '') as string;

    const sandbox = {
      $now: new Date().toISOString(),
      $env: process.env,
      console: { log: (...a: unknown[]) => ctx.logger.info(a.map(String).join(' ')) },
    };

    if (mode === 'each') {
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const result = await runScript(code, { ...sandbox, item: items[i], items });
        const arr = Array.isArray(result) ? result : [result];
        for (const r of arr) {
          out.push(toItem(r));
        }
      }
      return out;
    }

    const result = await runScript(code, { ...sandbox, items });
    const arr = Array.isArray(result) ? result : [result];
    return arr.map(toItem);
  },
};

async function runScript(code: string, context: Record<string, unknown>) {
  const script = new vm.Script(`(async () => { ${code} })()`);
  const ctx = vm.createContext(context);
  return script.runInContext(ctx, { timeout: 5000 });
}

function toItem(v: unknown) {
  if (v && typeof v === 'object' && 'json' in (v as object)) {
    return v as { json: Record<string, unknown> };
  }
  return { json: v as Record<string, unknown> };
}
