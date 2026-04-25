import axios from 'axios';
import { NodeDefinition } from '../../types';

export const GithubNode: NodeDefinition = {
  description: {
    type: 'flowforge.github',
    displayName: 'GitHub',
    description: 'Interact with the GitHub REST API',
    icon: '🐙',
    color: '#181717',
    category: 'action',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'githubApi', required: true }],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'options',
        default: 'getRepo',
        options: [
          { name: 'Get Repo', value: 'getRepo' },
          { name: 'List Issues', value: 'listIssues' },
          { name: 'Create Issue', value: 'createIssue' },
        ],
        noExpression: true,
      },
      { name: 'owner', displayName: 'Owner', type: 'string', default: '' },
      { name: 'repo', displayName: 'Repo', type: 'string', default: '' },
      {
        name: 'title',
        displayName: 'Issue Title',
        type: 'string',
        default: '',
        displayOptions: { show: { operation: ['createIssue'] } },
      },
      {
        name: 'body',
        displayName: 'Issue Body',
        type: 'string',
        default: '',
        typeOptions: { rows: 4 },
        displayOptions: { show: { operation: ['createIssue'] } },
      },
    ],
  },
  async execute(ctx, items) {
    const cred = await ctx.getCredentials<{ token: string }>('githubApi');
    const headers = {
      Authorization: `Bearer ${cred.token}`,
      Accept: 'application/vnd.github+json',
    };
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const op = ctx.getNodeParameter<string>('operation', i, 'getRepo');
      const owner = ctx.getNodeParameter<string>('owner', i, '');
      const repo = ctx.getNodeParameter<string>('repo', i, '');
      if (op === 'getRepo') {
        const r = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        out.push({ json: r.data });
      } else if (op === 'listIssues') {
        const r = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          { headers },
        );
        for (const issue of r.data) out.push({ json: issue });
      } else if (op === 'createIssue') {
        const r = await axios.post(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            title: ctx.getNodeParameter<string>('title', i, ''),
            body: ctx.getNodeParameter<string>('body', i, ''),
          },
          { headers },
        );
        out.push({ json: r.data });
      }
    }
    return out;
  },
};
