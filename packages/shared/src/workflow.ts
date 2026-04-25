export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string; // unique within workflow
  name: string; // user-friendly name shown on canvas
  type: string; // node type id, e.g. "flowforge.http"
  typeVersion?: number;
  position: NodePosition;
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>; // credentialType -> credentialId
  disabled?: boolean;
  notes?: string;
}

export interface WorkflowConnection {
  // source node id, source output port index, target node id, target input port index
  source: string;
  sourceOutput?: number; // default 0
  target: string;
  targetInput?: number; // default 0
}

export interface WorkflowSettings {
  executionTimeout?: number; // seconds
  saveExecutions?: 'all' | 'errors' | 'none';
  errorWorkflow?: string;
  timezone?: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings?: WorkflowSettings;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  updatedAt: string;
}
