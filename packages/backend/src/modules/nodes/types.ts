import type {
  NodeExecutionContext,
  NodeItem,
  NodeTypeDescription,
} from '@flowforge/shared';

export interface NodeDefinition {
  description: NodeTypeDescription;
  /**
   * Execute the node. Return either:
   *   - NodeItem[]            : items going to output port 0
   *   - NodeItem[][]          : items per output port (used by IF/Switch)
   */
  execute(
    ctx: NodeExecutionContext,
    items: NodeItem[],
  ): Promise<NodeItem[] | NodeItem[][]>;
}
