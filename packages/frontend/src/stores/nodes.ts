import { defineStore } from 'pinia';
import type { NodeTypeDescription } from '@flowforge/shared';
import { api } from '../api';

interface State {
  types: NodeTypeDescription[];
  loaded: boolean;
}

export const useNodesStore = defineStore('nodes', {
  state: (): State => ({ types: [], loaded: false }),
  getters: {
    byType: (s) => {
      const map = new Map<string, NodeTypeDescription>();
      for (const t of s.types) map.set(t.type, t);
      return map;
    },
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return;
      const r = await api.get('/api/nodes/types');
      this.types = r.data;
      this.loaded = true;
    },
  },
});
