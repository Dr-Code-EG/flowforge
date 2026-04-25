import axios, { AxiosRequestConfig } from 'axios';
import { NodeDefinition } from '../../types';

export const HttpRequestNode: NodeDefinition = {
  description: {
    type: 'flowforge.http',
    displayName: 'HTTP Request',
    description: 'Make a request to any HTTP API',
    icon: '🔗',
    color: '#2185d0',
    category: 'action',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'method',
        displayName: 'Method',
        type: 'options',
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => ({
          name: m,
          value: m,
        })),
      },
      {
        name: 'url',
        displayName: 'URL',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'https://api.example.com/items',
      },
      {
        name: 'authentication',
        displayName: 'Authentication',
        type: 'options',
        default: 'none',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basic' },
          { name: 'Bearer Token', value: 'bearer' },
          { name: 'Header Auth', value: 'header' },
        ],
        noExpression: true,
      },
      {
        name: 'username',
        displayName: 'Username',
        type: 'string',
        default: '',
        displayOptions: { show: { authentication: ['basic'] } },
      },
      {
        name: 'password',
        displayName: 'Password',
        type: 'string',
        default: '',
        typeOptions: { password: true },
        displayOptions: { show: { authentication: ['basic'] } },
      },
      {
        name: 'token',
        displayName: 'Bearer Token',
        type: 'string',
        default: '',
        typeOptions: { password: true },
        displayOptions: { show: { authentication: ['bearer'] } },
      },
      {
        name: 'headerName',
        displayName: 'Header Name',
        type: 'string',
        default: 'Authorization',
        displayOptions: { show: { authentication: ['header'] } },
      },
      {
        name: 'headerValue',
        displayName: 'Header Value',
        type: 'string',
        default: '',
        typeOptions: { password: true },
        displayOptions: { show: { authentication: ['header'] } },
      },
      {
        name: 'queryParameters',
        displayName: 'Query Parameters (JSON object)',
        type: 'json',
        default: '{}',
      },
      {
        name: 'headers',
        displayName: 'Headers (JSON object)',
        type: 'json',
        default: '{}',
      },
      {
        name: 'bodyType',
        displayName: 'Body Type',
        type: 'options',
        default: 'json',
        options: [
          { name: 'None', value: 'none' },
          { name: 'JSON', value: 'json' },
          { name: 'Form (urlencoded)', value: 'form' },
          { name: 'Raw text', value: 'text' },
        ],
        displayOptions: {
          show: { method: ['POST', 'PUT', 'PATCH', 'DELETE'] },
        },
      },
      {
        name: 'body',
        displayName: 'Body',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: { method: ['POST', 'PUT', 'PATCH', 'DELETE'] },
        },
      },
      {
        name: 'timeout',
        displayName: 'Timeout (ms)',
        type: 'number',
        default: 30000,
      },
    ],
  },
  async execute(ctx, items) {
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const method = ctx.getNodeParameter<string>('method', i, 'GET');
      const url = ctx.getNodeParameter<string>('url', i, '');
      const auth = ctx.getNodeParameter<string>('authentication', i, 'none');
      const headersRaw = ctx.getNodeParameter<unknown>('headers', i, {});
      const qsRaw = ctx.getNodeParameter<unknown>('queryParameters', i, {});
      const bodyRaw = ctx.getNodeParameter<unknown>('body', i, undefined);
      const bodyType = ctx.getNodeParameter<string>('bodyType', i, 'json');
      const timeout = ctx.getNodeParameter<number>('timeout', i, 30000);

      const headers = parseObject(headersRaw);
      const params = parseObject(qsRaw);

      if (auth === 'bearer') {
        const tok = ctx.getNodeParameter<string>('token', i, '');
        headers['Authorization'] = `Bearer ${tok}`;
      } else if (auth === 'header') {
        const hn = ctx.getNodeParameter<string>('headerName', i, 'Authorization');
        const hv = ctx.getNodeParameter<string>('headerValue', i, '');
        headers[hn] = hv;
      }

      const config: AxiosRequestConfig = {
        method: method as AxiosRequestConfig['method'],
        url,
        headers: headers as AxiosRequestConfig['headers'],
        params,
        timeout,
        validateStatus: () => true,
      };

      if (auth === 'basic') {
        config.auth = {
          username: ctx.getNodeParameter<string>('username', i, ''),
          password: ctx.getNodeParameter<string>('password', i, ''),
        };
      }

      if (bodyType !== 'none' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (bodyType === 'json') {
          config.data = parseObject(bodyRaw);
          config.headers = { 'Content-Type': 'application/json', ...config.headers };
        } else if (bodyType === 'form') {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(parseObject(bodyRaw))) {
            params.append(k, String(v));
          }
          config.data = params.toString();
          config.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...config.headers,
          };
        } else {
          config.data = typeof bodyRaw === 'string' ? bodyRaw : JSON.stringify(bodyRaw);
        }
      }

      const res = await axios.request(config);
      out.push({
        json: {
          status: res.status,
          headers: res.headers,
          body: res.data,
        },
      });
    }
    return out;
  },
};

function parseObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}
