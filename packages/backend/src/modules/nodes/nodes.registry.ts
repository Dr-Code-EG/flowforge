import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { NodeTypeDescription } from '@flowforge/shared';

import { NodeDefinition } from './types';
import { ALL_NODES } from './implementations';

@Injectable()
export class NodesRegistry implements OnModuleInit {
  private readonly logger = new Logger('NodesRegistry');
  private readonly map = new Map<string, NodeDefinition>();

  onModuleInit() {
    for (const node of ALL_NODES) {
      this.register(node);
    }
    this.logger.log(`Registered ${this.map.size} node types`);
  }

  register(node: NodeDefinition) {
    if (this.map.has(node.description.type)) {
      this.logger.warn(`Duplicate node type ${node.description.type}; overwriting`);
    }
    this.map.set(node.description.type, node);
  }

  get(type: string): NodeDefinition | undefined {
    return this.map.get(type);
  }

  list(): NodeTypeDescription[] {
    return Array.from(this.map.values()).map((n) => n.description);
  }
}
