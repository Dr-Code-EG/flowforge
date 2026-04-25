import * as nodemailer from 'nodemailer';
import { NodeDefinition } from '../../types';

// nodemailer is a peer-installed dep; treat as optional
let realNodemailer: typeof nodemailer | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  realNodemailer = require('nodemailer');
} catch {
  realNodemailer = null;
}

export const EmailSendNode: NodeDefinition = {
  description: {
    type: 'flowforge.email',
    displayName: 'Send Email',
    description: 'Send an email via SMTP',
    icon: '✉️',
    color: '#1144aa',
    category: 'communication',
    inputs: 1,
    outputs: 1,
    credentials: [{ name: 'smtp', required: true }],
    properties: [
      { name: 'fromEmail', displayName: 'From', type: 'string', default: '' },
      { name: 'toEmail', displayName: 'To', type: 'string', default: '' },
      { name: 'subject', displayName: 'Subject', type: 'string', default: '' },
      {
        name: 'text',
        displayName: 'Text',
        type: 'string',
        default: '',
        typeOptions: { rows: 5 },
      },
      {
        name: 'html',
        displayName: 'HTML',
        type: 'string',
        default: '',
        typeOptions: { rows: 5 },
      },
    ],
  },
  async execute(ctx, items) {
    if (!realNodemailer) {
      throw new Error('nodemailer is not installed; run `pnpm add nodemailer` in backend');
    }
    const cred = await ctx.getCredentials<{
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    }>('smtp');

    const transporter = realNodemailer.createTransport({
      host: cred.host,
      port: Number(cred.port) || 587,
      secure: !!cred.secure,
      auth: { user: cred.user, pass: cred.password },
    });

    const out: import("@flowforge/shared").NodeItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const info = await transporter.sendMail({
        from: ctx.getNodeParameter<string>('fromEmail', i, ''),
        to: ctx.getNodeParameter<string>('toEmail', i, ''),
        subject: ctx.getNodeParameter<string>('subject', i, ''),
        text: ctx.getNodeParameter<string>('text', i, '') || undefined,
        html: ctx.getNodeParameter<string>('html', i, '') || undefined,
      });
      out.push({ json: { messageId: info.messageId, accepted: info.accepted } });
    }
    return out;
  },
};
