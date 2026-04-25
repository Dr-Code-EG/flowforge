<template>
  <div class="page">
    <header class="page-header">
      <h2>Workflows</h2>
      <button class="primary" @click="createNew">+ New Workflow</button>
    </header>

    <div v-if="loading" class="muted" style="padding: 24px">Loading...</div>
    <div v-else-if="!workflows.length" class="empty card">
      <p>No workflows yet.</p>
      <button class="primary" @click="createNew">Create your first workflow</button>
    </div>

    <div v-else class="grid">
      <div
        v-for="wf in workflows"
        :key="wf.id"
        class="card workflow-card"
        @click="open(wf.id)"
      >
        <div class="row">
          <h3 style="margin: 0">{{ wf.name }}</h3>
          <span class="spacer" />
          <span :class="['badge', wf.active ? 'on' : 'off']">{{
            wf.active ? 'active' : 'inactive'
          }}</span>
        </div>
        <p class="muted" style="margin: 8px 0 0; font-size: 12px">
          Updated {{ relTime(wf.updatedAt) }}
        </p>
        <div class="actions" @click.stop>
          <button @click="toggle(wf)">
            {{ wf.active ? 'Deactivate' : 'Activate' }}
          </button>
          <button class="danger" @click="remove(wf)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';

interface WfRow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
}

const router = useRouter();
const workflows = ref<WfRow[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const r = await api.get('/api/workflows');
    workflows.value = r.data;
  } finally {
    loading.value = false;
  }
}

async function createNew() {
  const r = await api.post('/api/workflows', {
    name: 'Untitled workflow',
    nodes: [
      {
        id: 'manual-1',
        name: 'Manual Trigger',
        type: 'flowforge.manualTrigger',
        position: { x: 200, y: 200 },
        parameters: {},
      },
    ],
    connections: [],
  });
  router.push(`/workflows/${r.data.id}`);
}

function open(id: string) {
  router.push(`/workflows/${id}`);
}

async function toggle(wf: WfRow) {
  await api.post(`/api/workflows/${wf.id}/${wf.active ? 'deactivate' : 'activate'}`);
  await load();
}

async function remove(wf: WfRow) {
  if (!confirm(`Delete "${wf.name}"?`)) return;
  await api.delete(`/api/workflows/${wf.id}`);
  await load();
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

onMounted(load);
</script>

<style scoped>
.page {
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.workflow-card {
  cursor: pointer;
  transition: border-color 0.15s;
}
.workflow-card:hover {
  border-color: var(--accent);
}
.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
}
.badge.on {
  background: rgba(46, 204, 113, 0.15);
  color: var(--success);
  border-color: rgba(46, 204, 113, 0.4);
}
.badge.off {
  color: var(--text-dim);
}
.empty {
  text-align: center;
  padding: 48px;
}
</style>
