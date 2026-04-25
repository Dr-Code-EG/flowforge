<template>
  <div class="page">
    <header class="page-header">
      <h2>Executions</h2>
      <button @click="load">↻ Refresh</button>
    </header>

    <table v-if="executions.length" class="table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Workflow</th>
          <th>Mode</th>
          <th>Started</th>
          <th>Duration</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in executions" :key="e.id" @click="open(e.id)">
          <td>
            <span :class="['status', e.status]">{{ e.status }}</span>
          </td>
          <td>{{ e.workflowName }}</td>
          <td>{{ e.mode }}</td>
          <td>{{ fmt(e.startedAt) }}</td>
          <td>{{ duration(e) }}</td>
          <td>→</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty card">
      <p>No executions yet. Run a workflow first.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const executions = ref<any[]>([]);

async function load() {
  const r = await api.get('/api/executions');
  executions.value = r.data;
}

function open(id: string) {
  router.push(`/executions/${id}`);
}

function fmt(s: string) {
  return new Date(s).toLocaleString();
}

function duration(e: any) {
  if (!e.finishedAt) return '—';
  const ms = new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

onMounted(load);
</script>

<style scoped>
.page {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}
.table th,
.table td {
  text-align: left;
  padding: 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}
.table tbody tr {
  cursor: pointer;
}
.table tbody tr:hover {
  background: var(--panel-2);
}
.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
}
.status.success {
  background: rgba(46, 204, 113, 0.15);
  color: var(--success);
}
.status.error {
  background: rgba(255, 87, 87, 0.15);
  color: var(--danger);
}
.status.running {
  background: rgba(91, 140, 255, 0.15);
  color: var(--accent);
}
.empty {
  text-align: center;
  padding: 48px;
}
</style>
