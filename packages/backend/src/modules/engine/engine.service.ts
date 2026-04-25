import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import type {
  ExecutionData,
  ExecutionMode,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeItem,
  WebhookData,
  WorkflowConnection,
  WorkflowNode,
} from '@flowforge/shared';

import { Workflow } from '../workflows/workflow.entity';
import { ExecutionsService } from '../executions/executions.service';
import { NodesRegistry } from '../nodes/nodes.registry';
import { CredentialsService } from '../credentials/credentials.service';
import { resolveDeep } from './expression';
import { httpRequestHelper } from './http-helper';

export interface RunOptions {
  mode: ExecutionMode;
  startNodeId?: string;
  /** Initial input for the start node (e.g., webhook payload). */
  input?: NodeItem[];
  /** Webhook context, available to webhook trigger nodes. */
  webhookData?: WebhookData;
}

@Injectable()
export class EngineService {
  private readonly logger = new Logger('Engine');

  constructor(
    private readonly nodes: NodesRegistry,
    @Inject(forwardRef(() => ExecutionsService))
    private readonly executions: ExecutionsService,
    private readonly credentials: CredentialsService,
  ) {}

  /** Execute a workflow by traversing its DAG and running each node. */
  async runWorkflow(workflow: Workflow, opts: RunOptions) {
    const exec = await this.executions.create({
      workflowId: workflow.id,
      workflowName: workflow.name,
      mode: opts.mode,
      status: 'running',
    });

    const data: ExecutionData = { nodes: {}, trace: [] };
    const nodeMap = new Map<string, WorkflowNode>(
      workflow.nodes.map((n) => [n.id, n]),
    );

    // Build adjacency list: source nodeId -> array of {targetId, targetInput, sourceOutput}
    const outgoing = new Map<
      string,
      Array<{ target: string; sourceOutput: number; targetInput: number }>
    >();
    for (const c of workflow.connections) {
      const list = outgoing.get(c.source) ?? [];
      list.push({
        target: c.target,
        sourceOutput: c.sourceOutput ?? 0,
        targetInput: c.targetInput ?? 0,
      });
      outgoing.set(c.source, list);
    }

    // Find start node(s)
    let startNodes: WorkflowNode[];
    if (opts.startNodeId) {
      const n = nodeMap.get(opts.startNodeId);
      if (!n) throw new Error(`Start node ${opts.startNodeId} not found`);
      startNodes = [n];
    } else {
      // For manual runs, start from any non-trigger node with no incoming
      // edges. For trigger runs, start from the trigger node.
      const incoming = new Set<string>();
      for (const c of workflow.connections) incoming.add(c.target);
      startNodes = workflow.nodes.filter((n) => !incoming.has(n.id) && !n.disabled);
      if (startNodes.length === 0 && workflow.nodes.length) {
        startNodes = [workflow.nodes[0]];
      }
    }

    // Per-node input items collected from upstream node outputs.
    const inputBuffer = new Map<string, NodeItem[][]>(); // nodeId -> per-port items
    for (const sn of startNodes) {
      inputBuffer.set(sn.id, [opts.input ?? [{ json: {} }]]);
    }

    // BFS execution honoring DAG order
    const queue: string[] = startNodes.map((n) => n.id);
    const visited = new Set<string>();
    let executionError: { message: string; nodeId?: string } | undefined;

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node || node.disabled) continue;

      const inputs = inputBuffer.get(nodeId) ?? [[{ json: {} }]];
      const result = await this.runNode(node, inputs, {
        workflow,
        executionId: exec.id,
        executedNodes: data.nodes,
        webhookData: opts.webhookData,
      });

      data.nodes[node.id] = result;
      data.trace.push(node.id);

      if (result.status === 'error') {
        executionError = {
          message: result.error?.message ?? 'Node failed',
          nodeId: node.id,
        };
        break;
      }

      // Distribute outputs to downstream nodes' input buffers.
      const edges = outgoing.get(node.id) ?? [];
      for (const edge of edges) {
        const port = edge.sourceOutput;
        const items = result.outputs?.[port] ?? [];
        const existing =
          inputBuffer.get(edge.target) ?? [];
        existing[edge.targetInput] = (existing[edge.targetInput] ?? []).concat(
          items,
        );
        inputBuffer.set(edge.target, existing);
        queue.push(edge.target);
      }
    }

    const status = executionError ? 'error' : 'success';
    await this.executions.update(exec.id, {
      status,
      data,
      finishedAt: new Date().toISOString(),
      error: executionError ?? null,
    });

    return this.executions.get(exec.id);
  }

  private async runNode(
    node: WorkflowNode,
    inputsByPort: NodeItem[][],
    runCtx: {
      workflow: Workflow;
      executionId: string;
      executedNodes: Record<string, NodeExecutionResult>;
      webhookData?: WebhookData;
    },
  ): Promise<NodeExecutionResult> {
    const startedAt = new Date().toISOString();
    const def = this.nodes.get(node.type);
    if (!def) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'error',
        error: { message: `Unknown node type: ${node.type}` },
      };
    }

    try {
      const items = inputsByPort[0] ?? [{ json: {} }];

      // Build "$node" map for expressions: each previously executed node's
      // last-output first item is exposed by node *name*.
      const $node: Record<string, { json: Record<string, unknown> }> = {};
      for (const [id, res] of Object.entries(runCtx.executedNodes)) {
        const first = res.outputs?.[0]?.[0];
        if (first) {
          // Resolve original node name via workflow nodes
          const wfNode = runCtx.workflow.nodes.find((n) => n.id === id);
          if (wfNode) $node[wfNode.name] = { json: first.json };
        }
      }

      const outputs: NodeItem[][] = [];

      const ctx: NodeExecutionContext = {
        workflowId: runCtx.workflow.id,
        executionId: runCtx.executionId,
        nodeName: node.name,
        webhookData: runCtx.webhookData,
        helpers: {
          httpRequest: httpRequestHelper,
          returnJsonArray: (data) => {
            const arr = Array.isArray(data) ? data : [data];
            return arr.map((json) => ({ json }));
          },
        },
        logger: {
          debug: (m, meta) => this.logger.debug(`[${node.name}] ${m}`, meta as object | undefined),
          info: (m, meta) => this.logger.log(`[${node.name}] ${m}`, meta as object | undefined),
          warn: (m, meta) => this.logger.warn(`[${node.name}] ${m}`, meta as object | undefined),
          error: (m, meta) => this.logger.error(`[${node.name}] ${m}`, meta as object | undefined),
        },
        getInputData: (port = 0) => inputsByPort[port] ?? [],
        getNodeParameter: <T>(name: string, itemIndex = 0, fallback?: T) => {
          const raw = (node.parameters as Record<string, unknown>)[name];
          if (raw === undefined) return fallback as T;
          const item = items[itemIndex] ?? items[0] ?? { json: {} };
          const exprCtx = {
            $json: item.json,
            $item: (i: number) => items[i]?.json,
            $node,
            $vars: {} as Record<string, unknown>,
            $now: new Date().toISOString(),
            $env: process.env as Record<string, string | undefined>,
          };
          return resolveDeep(raw, exprCtx) as T;
        },
        getCredentials: async <T = Record<string, unknown>>(type: string) => {
          const credIds = node.credentials ?? {};
          const id = credIds[type];
          if (!id) {
            throw new Error(`No credential of type "${type}" attached to node`);
          }
          return this.credentials.getDecryptedById<T>(id);
        },
      };

      const result = await def.execute(ctx, items);

      // Normalize: ensure outputs is NodeItem[][] (one entry per output port)
      const normalized = Array.isArray(result) && Array.isArray(result[0])
        ? (result as NodeItem[][])
        : [result as NodeItem[]];

      return {
        nodeId: node.id,
        nodeName: node.name,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'success',
        outputs: normalized,
      };
    } catch (err: unknown) {
      const e = err as Error;
      this.logger.warn(
        `Node "${node.name}" (${node.type}) failed: ${e.message}`,
      );
      return {
        nodeId: node.id,
        nodeName: node.name,
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'error',
        error: { message: e.message, stack: e.stack },
      };
    }
  }
}
