import type { NodeItem } from './node';

export type ExecutionStatus =
  | 'new'
  | 'running'
  | 'success'
  | 'error'
  | 'canceled'
  | 'waiting';

export type ExecutionMode = 'manual' | 'trigger' | 'webhook' | 'retry' | 'error';

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  startedAt: string;
  finishedAt?: string;
  status: 'success' | 'error' | 'skipped';
  // outputs[outputPort] = items
  outputs?: NodeItem[][];
  error?: { message: string; stack?: string };
}

export interface ExecutionData {
  // results indexed by node id
  nodes: Record<string, NodeExecutionResult>;
  // execution flow trace (in execution order)
  trace: string[];
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  mode: ExecutionMode;
  startedAt: string;
  finishedAt?: string;
  data: ExecutionData;
  error?: { message: string; nodeId?: string };
}

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  mode: ExecutionMode;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
}
