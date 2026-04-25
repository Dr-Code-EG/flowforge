import {
  All,
  Body,
  Controller,
  Headers,
  HttpException,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { WorkflowsService } from '../workflows/workflows.service';
import { EngineService } from '../engine/engine.service';
import type { WorkflowNode } from '@flowforge/shared';

@Controller()
export class WebhooksController {
  constructor(
    private readonly workflows: WorkflowsService,
    private readonly engine: EngineService,
  ) {}

  @All('webhook/:path')
  async handle(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    const reqParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.params || {})) {
      reqParams[k] = Array.isArray(v) ? v.join(',') : String(v);
    }
    // Find an active workflow with a webhook trigger matching this path.
    const candidates = await this.workflows.listAllActive();
    let matched:
      | { wf: typeof candidates[number]; node: WorkflowNode }
      | null = null;

    for (const wf of candidates) {
      for (const node of wf.nodes) {
        if (node.type !== 'flowforge.webhookTrigger' || node.disabled) continue;
        const params = node.parameters as Record<string, unknown>;
        const wantPath = String(params.path ?? '').trim();
        const effective = wantPath || wf.id;
        const wantMethod = String(params.method ?? 'POST').toUpperCase();
        if (
          effective === path &&
          (wantMethod === 'ANY' || wantMethod === req.method.toUpperCase())
        ) {
          matched = { wf, node };
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      throw new HttpException(
        `No active webhook found for /webhook/${path}`,
        404,
      );
    }

    const exec = await this.engine.runWorkflow(matched.wf, {
      mode: 'webhook',
      startNodeId: matched.node.id,
      input: [
        {
          json: {
            body,
            headers,
            query,
            method: req.method,
            params: reqParams,
          },
        },
      ],
      webhookData: {
        body,
        headers,
        query,
        params: reqParams,
        method: req.method,
      },
    });

    const responseMode = String(
      (matched.node.parameters as Record<string, unknown>).responseMode ?? 'onReceived',
    );

    if (responseMode === 'lastNode') {
      const trace = exec?.data?.trace ?? [];
      const lastId = trace[trace.length - 1];
      const last = lastId ? exec?.data?.nodes?.[lastId] : undefined;
      const items = last?.outputs?.[0] ?? [];
      res.status(200).json(items.map((i) => i.json));
    } else {
      res.status(200).json({
        ok: true,
        executionId: exec?.id,
        status: exec?.status,
      });
    }
  }
}
