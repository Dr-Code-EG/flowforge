import { NodeDefinition } from '../../types';

export const CsvParseNode: NodeDefinition = {
  description: {
    type: 'flowforge.csv',
    displayName: 'CSV',
    description: 'Parse CSV string into items, or convert items to CSV',
    icon: '📊',
    color: '#33aa66',
    category: 'transform',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'parse',
        options: [
          { name: 'Parse CSV -> rows', value: 'parse' },
          { name: 'Build CSV from items', value: 'build' },
        ],
        noExpression: true,
      },
      {
        name: 'sourceField',
        displayName: 'Source Field (parse mode)',
        type: 'string',
        default: 'data',
      },
      {
        name: 'delimiter',
        displayName: 'Delimiter',
        type: 'string',
        default: ',',
        noExpression: true,
      },
      {
        name: 'header',
        displayName: 'First row is header',
        type: 'boolean',
        default: true,
      },
    ],
  },
  async execute(ctx, items) {
    const mode = ctx.getNodeParameter<string>('mode', 0, 'parse');
    const delimiter = ctx.getNodeParameter<string>('delimiter', 0, ',');
    const header = ctx.getNodeParameter<boolean>('header', 0, true);

    if (mode === 'parse') {
      const src = ctx.getNodeParameter<string>('sourceField', 0, 'data');
      const out: import("@flowforge/shared").NodeItem[] = [];
      for (const item of items) {
        const text = String((item.json as Record<string, unknown>)[src] ?? '');
        const rows = parseCsv(text, delimiter);
        if (header && rows.length) {
          const head = rows[0];
          for (let r = 1; r < rows.length; r++) {
            const obj: Record<string, string> = {};
            head.forEach((h, i) => {
              obj[h] = rows[r][i] ?? '';
            });
            out.push({ json: obj });
          }
        } else {
          for (const row of rows) out.push({ json: { row } });
        }
      }
      return out;
    }

    // build
    const allKeys = new Set<string>();
    for (const item of items) Object.keys(item.json).forEach((k) => allKeys.add(k));
    const headers = Array.from(allKeys);
    const lines = [headers.join(delimiter)];
    for (const item of items) {
      lines.push(
        headers
          .map((h) => csvEscape(String((item.json as Record<string, unknown>)[h] ?? '')))
          .join(delimiter),
      );
    }
    return [{ json: { csv: lines.join('\n') } }];
  },
};

function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delim) {
        row.push(cur);
        cur = '';
      } else if (ch === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else if (ch === '\r') {
        // ignore
      } else {
        cur += ch;
      }
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
