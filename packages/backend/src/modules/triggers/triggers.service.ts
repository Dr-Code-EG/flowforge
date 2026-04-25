import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CronJob } from 'cron';

import { WorkflowsService } from '../workflows/workflows.service';
import { EngineService } from '../engine/engine.service';

interface RegisteredTrigger {
  workflowId: string;
  nodeId: string;
  job: CronJob;
}

@Injectable()
export class TriggersService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('Triggers');
  private registered: RegisteredTrigger[] = [];

  constructor(
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflows: WorkflowsService,
    @Inject(forwardRef(() => EngineService))
    private readonly engine: EngineService,
  ) {}

  async onApplicationBootstrap() {
    const active = await this.workflows.listAllActive();
    for (const wf of active) {
      this.registerForWorkflow(wf.id);
    }
    this.logger.log(`Initialized ${this.registered.length} cron triggers`);
  }

  onModuleDestroy() {
    for (const r of this.registered) r.job.stop();
    this.registered = [];
  }

  async refresh(workflowId: string) {
    await this.unregister(workflowId);
    await this.registerForWorkflow(workflowId);
  }

  async unregister(workflowId: string) {
    const keep: RegisteredTrigger[] = [];
    for (const r of this.registered) {
      if (r.workflowId === workflowId) {
        r.job.stop();
      } else {
        keep.push(r);
      }
    }
    this.registered = keep;
  }

  private async registerForWorkflow(workflowId: string) {
    let wf;
    try {
      wf = await this.workflows.getById(workflowId);
    } catch {
      return;
    }
    if (!wf.active) return;
    for (const node of wf.nodes) {
      if (node.type !== 'flowforge.scheduleTrigger' || node.disabled) continue;
      const cronExpr = String(
        (node.parameters as Record<string, unknown>).cron ?? '',
      ).trim();
      if (!cronExpr) continue;
      const tz = String(
        (node.parameters as Record<string, unknown>).timezone ?? 'UTC',
      );
      try {
        const job = new CronJob(
          cronExpr,
          () => {
            this.engine
              .runWorkflow(wf, { mode: 'trigger', startNodeId: node.id })
              .catch((e) =>
                this.logger.error(`Cron run failed: ${(e as Error).message}`),
              );
          },
          null,
          true,
          tz,
        );
        this.registered.push({ workflowId: wf.id, nodeId: node.id, job });
        this.logger.log(`Registered cron "${cronExpr}" for ${wf.name}/${node.name}`);
      } catch (e) {
        this.logger.error(
          `Invalid cron expression "${cronExpr}" on ${wf.name}/${node.name}: ${(e as Error).message}`,
        );
      }
    }
  }
}
