import * as crypto from 'crypto';
import axios from 'axios';
import { NodeDefinition } from '../../types';

export const S3Node: NodeDefinition = {
  description: {
    type: 'flowforge.s3',
    displayName: 'AWS S3',
    description: 'Upload or download an object from an S3-compatible bucket (presigned)',
    icon: '🪣',
    color: '#FF9900',
    category: 'storage',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'awsS3', required: true }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'putObject',
        options: [
          { name: 'Put Object', value: 'putObject' },
          { name: 'Get Object', value: 'getObject' },
        ],
        noExpression: true,
      },
      { name: 'bucket', displayName: 'Bucket', type: 'string', default: '' },
      { name: 'key', displayName: 'Object Key', type: 'string', default: '' },
      {
        name: 'body',
        displayName: 'Body (string)',
        type: 'string',
        default: '',
        typeOptions: { rows: 4 },
        displayOptions: { show: { operation: ['putObject'] } },
      },
      {
        name: 'contentType',
        displayName: 'Content Type',
        type: 'string',
        default: 'text/plain',
        displayOptions: { show: { operation: ['putObject'] } },
      },
    ],
  },
  async execute(ctx, items) {
    const cred = await ctx.getCredentials<{
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
    }>('awsS3');
    const region = cred.region || 'us-east-1';
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const op = ctx.getNodeParameter<string>('operation', i, 'putObject');
      const bucket = ctx.getNodeParameter<string>('bucket', i, '');
      const key = ctx.getNodeParameter<string>('key', i, '');
      const host = cred.endpoint
        ? new URL(cred.endpoint).host
        : `${bucket}.s3.${region}.amazonaws.com`;
      const url = cred.endpoint
        ? `${cred.endpoint.replace(/\/$/, '')}/${bucket}/${encodeURI(key)}`
        : `https://${host}/${encodeURI(key)}`;

      if (op === 'putObject') {
        const body = ctx.getNodeParameter<string>('body', i, '');
        const contentType = ctx.getNodeParameter<string>('contentType', i, 'text/plain');
        const headers = signAwsV4({
          method: 'PUT',
          url,
          host,
          region,
          service: 's3',
          accessKey: cred.accessKeyId,
          secretKey: cred.secretAccessKey,
          payload: body,
          extraHeaders: { 'content-type': contentType },
        });
        const r = await axios.put(url, body, { headers });
        out.push({ json: { status: r.status, etag: r.headers.etag } });
      } else {
        const headers = signAwsV4({
          method: 'GET',
          url,
          host,
          region,
          service: 's3',
          accessKey: cred.accessKeyId,
          secretKey: cred.secretAccessKey,
          payload: '',
        });
        const r = await axios.get(url, { headers, responseType: 'text' });
        out.push({ json: { body: r.data } });
      }
    }
    return out;
  },
};

interface SignArgs {
  method: string;
  url: string;
  host: string;
  region: string;
  service: string;
  accessKey: string;
  secretKey: string;
  payload: string;
  extraHeaders?: Record<string, string>;
}

function signAwsV4(args: SignArgs): Record<string, string> {
  const u = new URL(args.url);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = crypto.createHash('sha256').update(args.payload).digest('hex');

  const headers: Record<string, string> = {
    host: args.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(args.extraHeaders ?? {}),
  };
  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}\n`).join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    args.method,
    u.pathname,
    u.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${args.region}/${args.service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const kDate = crypto.createHmac('sha256', `AWS4${args.secretKey}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(args.region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(args.service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${args.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
