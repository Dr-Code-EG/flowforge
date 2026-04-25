import axios from 'axios';
import { NodeDefinition } from '../../types';

export const RssReadNode: NodeDefinition = {
  description: {
    type: 'flowforge.rss',
    displayName: 'RSS Feed Read',
    description: 'Fetch and parse an RSS or Atom feed',
    icon: '📰',
    color: '#ff8800',
    category: 'action',
    inputs: 1,
    outputs: 1,
    properties: [
      {
        name: 'url',
        displayName: 'Feed URL',
        type: 'string',
        default: '',
        required: true,
      },
    ],
  },
  async execute(ctx, items) {
    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const url = ctx.getNodeParameter<string>('url', i, '');
      const res = await axios.get(url, { responseType: 'text', timeout: 30000 });
      const xml = String(res.data);
      const itemRe = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
      const titleRe = /<title[^>]*>([\s\S]*?)<\/title>/i;
      const linkRe = /<link[^>]*?(?:href="([^"]+)"[^>]*\/?>|>([\s\S]*?)<\/link>)/i;
      const descRe = /<(?:description|summary)[^>]*>([\s\S]*?)<\/(?:description|summary)>/i;
      const dateRe = /<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i;
      let m: RegExpExecArray | null;
      while ((m = itemRe.exec(xml)) !== null) {
        const block = m[1];
        const title = stripCdata(block.match(titleRe)?.[1] ?? '');
        const linkMatch = block.match(linkRe);
        const link = linkMatch?.[1] ?? stripCdata(linkMatch?.[2] ?? '');
        const description = stripCdata(block.match(descRe)?.[1] ?? '');
        const pubDate = stripCdata(block.match(dateRe)?.[1] ?? '');
        out.push({ json: { title, link, description, pubDate } });
      }
    }
    return out;
  },
};

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}
