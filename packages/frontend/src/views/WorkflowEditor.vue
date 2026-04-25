<template>
  <div class="editor">
    <header class="topbar">
      <button @click="$router.push('/workflows')">←</button>
      <input v-model="workflow.name" class="title-input" @change="save" />
      <span class="spacer" />
      <span v-if="dirty" class="muted">unsaved</span>
      <button :disabled="saving" @click="save">Save</button>
      <button class="primary" :disabled="running" @click="run">
        {{ running ? 'Running...' : '▶ Run' }}
      </button>
      <button @click="toggleActive">
        {{ workflow.active ? 'Deactivate' : 'Activate' }}
      </button>
    </header>

    <div class="body">
      <aside class="left-panel">
        <h4>Nodes</h4>
        <input v-model="search" placeholder="Search nodes..." />
        <div class="categories">
          <div v-for="cat in categories" :key="cat" class="cat">
            <div class="cat-name">{{ cat }}</div>
            <div
              v-for="n in nodesByCat[cat]"
              :key="n.type"
              class="node-pill"
              :draggable="true"
              @dragstart="onDragStart($event, n.type)"
              @click="addNodeAtCenter(n.type)"
              :title="n.description"
            >
              <span class="ico">{{ n.icon }}</span>
              <span class="lbl">{{ n.displayName }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="canvas-wrap" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="vfNodes"
          v-model:edges="vfEdges"
          :default-edge-options="{ animated: true }"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          @connect="onConnect"
        >
          <Background pattern-color="#2a3142" />
          <Controls />
          <MiniMap pannable zoomable />
        </VueFlow>
      </div>

      <aside v-if="selectedNode" class="right-panel">
        <h4 class="row">
          <span>{{ selectedDef?.displayName ?? 'Node' }}</span>
          <span class="spacer" />
          <button class="danger" @click="deleteSelected">Delete</button>
        </h4>
        <label>Name</label>
        <input v-model="selectedNode.name" @change="markDirty" />

        <NodeParams
          :node="selectedNode"
          :definition="selectedDef"
          :credentials="credentials"
          @change="markDirty"
        />

        <details v-if="lastExecution" style="margin-top: 16px">
          <summary>Last Execution Output</summary>
          <pre class="output">{{
            JSON.stringify(
              lastExecution.data?.nodes?.[selectedNode.id]?.outputs ?? null,
              null,
              2,
            )
          }}</pre>
        </details>
      </aside>
    </div>

    <div v-if="executionError" class="exec-error">
      ⚠️ Execution error: {{ executionError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import type {
  Workflow,
  WorkflowNode,
  WorkflowConnection,
  Execution,
} from '@flowforge/shared';

import { api } from '../api';
import { useNodesStore } from '../stores/nodes';
import NodeParams from '../components/NodeParams.vue';

const route = useRoute();
const nodesStore = useNodesStore();

const workflow = ref<Workflow>({
  id: '',
  name: '',
  active: false,
  nodes: [],
  connections: [],
  ownerId: '',
  createdAt: '',
  updatedAt: '',
});
const credentials = ref<{ id: string; name: string; type: string }[]>([]);
const dirty = ref(false);
const saving = ref(false);
const running = ref(false);
const executionError = ref<string | null>(null);
const lastExecution = ref<Execution | null>(null);
const search = ref('');

const vfNodes = ref<any[]>([]);
const vfEdges = ref<any[]>([]);
const selectedNodeId = ref<string | null>(null);

const selectedNode = computed<WorkflowNode | null>(() => {
  if (!selectedNodeId.value) return null;
  return workflow.value.nodes.find((n) => n.id === selectedNodeId.value) ?? null;
});

const selectedDef = computed(() => {
  if (!selectedNode.value) return null;
  return nodesStore.byType.get(selectedNode.value.type);
});

const filteredTypes = computed(() => {
  const q = search.value.toLowerCase().trim();
  return nodesStore.types.filter(
    (t) =>
      !q ||
      t.displayName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q),
  );
});

const categories = computed(() => {
  const order = [
    'trigger',
    'action',
    'transform',
    'flow',
    'communication',
    'database',
    'ai',
    'storage',
    'developer',
  ];
  const present = new Set<string>(filteredTypes.value.map((t) => t.category as string));
  return order.filter((c) => present.has(c));
});

const nodesByCat = computed(() => {
  const map: Record<string, typeof filteredTypes.value> = {};
  for (const t of filteredTypes.value) {
    (map[t.category] ??= []).push(t);
  }
  return map;
});

function syncToVueFlow() {
  vfNodes.value = workflow.value.nodes.map((n) => ({
    id: n.id,
    type: 'default',
    label: n.name,
    position: n.position,
    data: { node: n, def: nodesStore.byType.get(n.type) },
  }));
  vfEdges.value = workflow.value.connections.map((c, i) => ({
    id: `e${i}-${c.source}-${c.target}`,
    source: c.source,
    target: c.target,
    sourceHandle: String(c.sourceOutput ?? 0),
    targetHandle: String(c.targetInput ?? 0),
  }));
}

function syncFromVueFlow() {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const n of vfNodes.value) positions[n.id] = n.position;
  workflow.value.nodes = workflow.value.nodes.map((n) => ({
    ...n,
    position: positions[n.id] ?? n.position,
  }));
  workflow.value.connections = vfEdges.value.map((e) => ({
    source: e.source,
    target: e.target,
    sourceOutput: parseInt(e.sourceHandle ?? '0', 10) || 0,
    targetInput: parseInt(e.targetHandle ?? '0', 10) || 0,
  }));
}

function onNodesChange() {
  syncFromVueFlow();
  markDirty();
}
function onEdgesChange() {
  syncFromVueFlow();
  markDirty();
}
function onConnect(edge: any) {
  workflow.value.connections.push({
    source: edge.source,
    target: edge.target,
    sourceOutput: parseInt(edge.sourceHandle ?? '0', 10) || 0,
    targetInput: parseInt(edge.targetHandle ?? '0', 10) || 0,
  });
  syncToVueFlow();
  markDirty();
}

function onNodeClick(evt: any) {
  // Vue Flow passes a NodeMouseEvent-like object with a `node` field
  const node = evt?.node ?? evt;
  if (node?.id) selectedNodeId.value = node.id;
}
function onEdgeClick() {
  // future: edge editor
}

function onDragStart(e: DragEvent, type: string) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/flowforge-node', type);
    e.dataTransfer.effectAllowed = 'move';
  }
}

function onDrop(e: DragEvent) {
  const type = e.dataTransfer?.getData('application/flowforge-node');
  if (!type) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const pos = { x: e.clientX - rect.left - 50, y: e.clientY - rect.top - 20 };
  addNode(type, pos);
}

function addNodeAtCenter(type: string) {
  const center = { x: 300 + Math.random() * 200, y: 200 + Math.random() * 100 };
  addNode(type, center);
}

function addNode(type: string, position: { x: number; y: number }) {
  const def = nodesStore.byType.get(type);
  if (!def) return;
  const id = `${type.split('.').pop()}-${Math.random().toString(36).slice(2, 7)}`;
  const defaults: Record<string, unknown> = {};
  for (const p of def.properties) {
    if (p.default !== undefined) defaults[p.name] = p.default;
  }
  const node: WorkflowNode = {
    id,
    name: def.displayName,
    type,
    position,
    parameters: defaults,
  };
  workflow.value.nodes.push(node);
  syncToVueFlow();
  selectedNodeId.value = id;
  markDirty();
}

function deleteSelected() {
  if (!selectedNodeId.value) return;
  const id = selectedNodeId.value;
  workflow.value.nodes = workflow.value.nodes.filter((n) => n.id !== id);
  workflow.value.connections = workflow.value.connections.filter(
    (c) => c.source !== id && c.target !== id,
  );
  selectedNodeId.value = null;
  syncToVueFlow();
  markDirty();
}

function markDirty() {
  dirty.value = true;
}

async function save() {
  saving.value = true;
  try {
    syncFromVueFlow();
    const id = workflow.value.id;
    const body = {
      name: workflow.value.name,
      active: workflow.value.active,
      nodes: workflow.value.nodes,
      connections: workflow.value.connections,
      settings: workflow.value.settings,
      tags: workflow.value.tags,
    };
    await api.patch(`/api/workflows/${id}`, body);
    dirty.value = false;
  } finally {
    saving.value = false;
  }
}

async function toggleActive() {
  await save();
  await api.post(
    `/api/workflows/${workflow.value.id}/${workflow.value.active ? 'deactivate' : 'activate'}`,
  );
  workflow.value.active = !workflow.value.active;
}

async function run() {
  if (dirty.value) await save();
  running.value = true;
  executionError.value = null;
  try {
    const r = await api.post(`/api/workflows/${workflow.value.id}/run`, {});
    lastExecution.value = r.data;
    if (r.data.status === 'error') {
      executionError.value =
        r.data.error?.message ?? 'Workflow finished with an error';
    }
  } catch (e: any) {
    executionError.value = e?.response?.data?.message ?? e.message;
  } finally {
    running.value = false;
  }
}

async function load() {
  await nodesStore.load();
  const id = route.params.id as string;
  const [wfRes, credRes] = await Promise.all([
    api.get<Workflow>(`/api/workflows/${id}`),
    api.get('/api/credentials'),
  ]);
  workflow.value = wfRes.data;
  credentials.value = credRes.data;
  syncToVueFlow();
}

onMounted(load);
watch(
  () => route.params.id,
  () => load(),
);
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}
.title-input {
  width: auto;
  flex: 0 1 320px;
  background: transparent;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 600;
}
.title-input:hover,
.title-input:focus {
  border-color: var(--border);
}
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 220px 1fr 320px;
  min-height: 0;
}
.left-panel,
.right-panel {
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 12px;
  overflow-y: auto;
}
.right-panel {
  border-right: none;
  border-left: 1px solid var(--border);
}
.canvas-wrap {
  position: relative;
  background: var(--bg);
}
.cat {
  margin: 12px 0;
}
.cat-name {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-dim);
  margin: 8px 0 4px;
  letter-spacing: 0.5px;
}
.node-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  cursor: grab;
  margin-bottom: 4px;
  font-size: 12px;
}
.node-pill:hover {
  background: #262d40;
  border-color: var(--accent);
}
.node-pill .ico {
  font-size: 16px;
}
.exec-error {
  position: fixed;
  bottom: 12px;
  right: 12px;
  background: var(--danger);
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  max-width: 400px;
  z-index: 100;
}
.output {
  background: var(--bg);
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 240px;
  overflow: auto;
}

@media (max-width: 1100px) {
  .body {
    grid-template-columns: 200px 1fr;
  }
  .right-panel {
    position: fixed;
    top: 49px;
    right: 0;
    bottom: 0;
    width: 320px;
    z-index: 30;
    box-shadow: var(--shadow);
  }
}
@media (max-width: 768px) {
  .body {
    grid-template-columns: 1fr;
  }
  .left-panel {
    position: fixed;
    top: 49px;
    left: 0;
    bottom: 0;
    width: 75vw;
    max-width: 280px;
    z-index: 30;
    box-shadow: var(--shadow);
  }
  .right-panel {
    width: 90vw;
    max-width: 360px;
  }
}
</style>
