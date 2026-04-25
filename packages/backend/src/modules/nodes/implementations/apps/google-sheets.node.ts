import axios from 'axios';
import { NodeDefinition } from '../../types';

export const GoogleSheetsNode: NodeDefinition = {
  description: {
    type: 'flowforge.googleSheets',
    displayName: 'Google Sheets',
    description: 'Read or append rows in a Google Sheets spreadsheet (uses an API key)',
    icon: '📗',
    color: '#0F9D58',
    category: 'storage',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'googleApi', required: true }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'read',
        options: [
          { name: 'Read Range', value: 'read' },
          { name: 'Append Row', value: 'append' },
        ],
        noExpression: true,
      },
      {
        name: 'spreadsheetId',
        displayName: 'Spreadsheet ID',
        type: 'string',
        default: '',
      },
      { name: 'range', displayName: 'Range', type: 'string', default: 'Sheet1!A1:Z' },
      {
        name: 'values',
        displayName: 'Values to append (JSON array)',
        type: 'json',
        default: '[["a","b","c"]]',
        displayOptions: { show: { operation: ['append'] } },
      },
    ],
  },
  async execute(ctx, items) {
    const cred = await ctx.getCredentials<{ apiKey: string; accessToken?: string }>(
      'googleApi',
    );
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const op = ctx.getNodeParameter<string>('operation', i, 'read');
      const sid = ctx.getNodeParameter<string>('spreadsheetId', i, '');
      const range = ctx.getNodeParameter<string>('range', i, 'Sheet1!A1:Z');

      if (op === 'read') {
        // API key works for public sheets; OAuth token works for private
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}`;
        const params = cred.accessToken ? {} : { key: cred.apiKey };
        const headers = cred.accessToken
          ? { Authorization: `Bearer ${cred.accessToken}` }
          : {};
        const r = await axios.get(url, { params, headers });
        const rows = r.data?.values ?? [];
        if (rows.length) {
          const head = rows[0];
          for (let row = 1; row < rows.length; row++) {
            const obj: Record<string, unknown> = {};
            head.forEach((h: string, idx: number) => {
              obj[h] = rows[row][idx];
            });
            out.push({ json: obj });
          }
        }
      } else {
        if (!cred.accessToken) {
          throw new Error('Append requires an OAuth access token (accessToken in credential)');
        }
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
        const valuesRaw = ctx.getNodeParameter<unknown>('values', i, []);
        const values = Array.isArray(valuesRaw) ? valuesRaw : [];
        const r = await axios.post(
          url,
          { values },
          { headers: { Authorization: `Bearer ${cred.accessToken}` } },
        );
        out.push({ json: r.data });
      }
    }
    return out;
  },
};
