<template>
  <div class="page">
    <button @click="$router.back()">←</button>
    <h2 v-if="exec">
      {{ exec.workflowName }}
      <span :class="['status', exec.status]">{{ exec.status }}</span>
    </h2>

    <div v-if="exec" class="grid">
      <div class="card">
        <h4>Info</h4>
        <p><b>Mode:</b> {{ exec.mode }}</p>
        <p><b>Started:</b> {{ fmt(exec.startedAt) }}</p>
        <p v-if="exec.finishedAt"><b>Finished:</b> {{ fmt(exec.finishedAt) }}</p>
        <p v-if="exec.error">
          <b style="color: var(--danger)">Error:</b> {{ exec.error.message }}
        </p>
      </div>

      <div class="card">
        <h4>Trace ({{ exec.data?.trace?.length ?? 0 }} nodes)</h4>
        <ol>
          <li v-for="nodeId in exec.data?.trace ?? []" :key="nodeId">
            <code>{{ nodeId }}</code>
            <span
              :class="['mini', exec.data.nodes[nodeId]?.error ? 'err' : 'ok']"
            >
              {{ exec.data.nodes[nodeId]?.error ? 'error' : 'ok' }}
            </span>
          </li>
        </ol>
      </div>
    </div>

    <div v-if="exec" class="card" style="margin-top: 12px">
      <h4>Per-node Output</h4>
      <details
        v-for="[nodeId, info] of Object.entries(exec.data?.nodes ?? {})"
        :key="nodeId"
        style="margin-bottom: 8px"
      >
        <summary>
          <code>{{ nodeId }}</code>
          <span v-if="(info as any).error" class="mini err">error</span>
          <span v-else class="mini ok">ok</span>
        </summary>
        <pre>{{ JSON.stringify(info, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';

const route = useRoute();
const exec = ref<any>(null);

async function load() {
  const r = await api.get(`/api/executions/${route.params.id}`);
  exec.value = r.data;
}

function fmt(s: string) {
  return new Date(s).toLocaleString();
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<style scoped>
.page {
  padding: 24px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 12px;
}
.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 8px;
  vertical-align: middle;
}
.status.success {
  background: rgba(46, 204, 113, 0.15);
  color: var(--success);
}
.status.error {
  background: rgba(255, 87, 87, 0.15);
  color: var(--danger);
}
.mini {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  margin-left: 8px;
}
.mini.ok {
  background: rgba(46, 204, 113, 0.15);
  color: var(--success);
}
.mini.err {
  background: rgba(255, 87, 87, 0.15);
  color: var(--danger);
}
pre {
  background: var(--bg);
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 280px;
  overflow: auto;
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
