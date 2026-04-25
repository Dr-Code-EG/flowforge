// Node type system shared between backend node implementations
// and frontend node panel/parameter renderer.

export type NodeParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'options'
  | 'multiOptions'
  | 'collection'
  | 'fixedCollection'
  | 'code'
  | 'credentials';

export interface NodeParameterOption {
  name: string;
  value: string | number | boolean;
  description?: string;
}

export interface DisplayCondition {
  // show this parameter only when these other parameters have these values
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

export interface NodeParameter {
  name: string;
  displayName: string;
  type: NodeParameterType;
  default?: unknown;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options?: NodeParameterOption[];
  // for `collection`/`fixedCollection`
  fields?: NodeParameter[];
  // expression/templating support
  noExpression?: boolean;
  // visibility
  displayOptions?: DisplayCondition;
  // for credentials type
  credentialType?: string;
  // for code type
  language?: 'javascript' | 'json';
  // multi-line text
  typeOptions?: {
    rows?: number;
    password?: boolean;
    minValue?: number;
    maxValue?: number;
  };
}

export interface CredentialDefinition {
  name: string; // e.g. "httpBasicAuth"
  displayName: string;
  fields: NodeParameter[];
}

export type NodeCategory =
  | 'trigger'
  | 'action'
  | 'transform'
  | 'flow'
  | 'communication'
  | 'database'
  | 'ai'
  | 'storage'
  | 'developer';

export interface NodeTypeDescription {
  type: string; // unique node type id, e.g. "flowforge.http"
  displayName: string;
  description: string;
  icon: string; // emoji or icon name
  color: string; // hex
  category: NodeCategory;
  // input/output structure
  inputs: number; // number of input ports (0 for triggers)
  outputs: number | string[]; // number, or named output labels (e.g. for IF: ["true","false"])
  // declarative parameter schema rendered by the frontend
  properties: NodeParameter[];
  // optional credential types this node can use
  credentials?: Array<{ name: string; required?: boolean }>;
  // marks this node as a trigger (no inputs, starts an execution)
  trigger?: boolean;
  // marks as a webhook trigger (registers a webhook route)
  webhook?: boolean;
  // marks as a polling trigger (cron/schedule)
  polling?: boolean;
}

// Items flowing through the graph. n8n calls these INodeExecutionData.
export interface NodeItem {
  json: Record<string, unknown>;
  binary?: Record<
    string,
    {
      data: string; // base64
      mimeType: string;
      fileName?: string;
    }
  >;
}

export interface NodeExecutionContext {
  // node parameters with expressions already resolved
  getNodeParameter<T = unknown>(name: string, itemIndex?: number, fallback?: T): T;
  // credentials decrypted on demand
  getCredentials<T = Record<string, unknown>>(type: string): Promise<T>;
  // input items for this node (port 0)
  getInputData(port?: number): NodeItem[];
  // helper to return outputs
  helpers: {
    httpRequest: (options: HttpRequestOptions) => Promise<unknown>;
    returnJsonArray: (data: Record<string, unknown> | Record<string, unknown>[]) => NodeItem[];
  };
  // misc
  workflowId: string;
  executionId: string;
  nodeName: string;
  // logger
  logger: {
    debug: (msg: string, meta?: unknown) => void;
    info: (msg: string, meta?: unknown) => void;
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
  };
  // for webhook nodes
  webhookData?: WebhookData;
}

export interface HttpRequestOptions {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  qs?: Record<string, unknown>;
  body?: unknown;
  json?: boolean;
  timeout?: number;
  auth?: { username: string; password: string };
}

export interface WebhookData {
  body: unknown;
  headers: Record<string, string>;
  query: Record<string, unknown>;
  params: Record<string, string>;
  method: string;
}
