<template>
  <div class="page">
    <header class="page-header">
      <h2>Credentials</h2>
      <button class="primary" @click="openNew">+ New Credential</button>
    </header>

    <div v-if="creds.length" class="grid">
      <div v-for="c in creds" :key="c.id" class="card">
        <div class="row">
          <h3 style="margin: 0">{{ c.name }}</h3>
          <span class="spacer" />
          <span class="badge">{{ c.type }}</span>
        </div>
        <p class="muted" style="font-size: 12px; margin: 8px 0 0">
          Updated {{ rel(c.updatedAt) }}
        </p>
        <div class="row" style="margin-top: 8px">
          <button @click="edit(c)">Edit</button>
          <button class="danger" @click="remove(c)">Delete</button>
        </div>
      </div>
    </div>
    <div v-else class="empty card">
      <p>No credentials yet.</p>
      <button class="primary" @click="openNew">Create your first credential</button>
    </div>

    <div v-if="modal" class="modal-overlay" @click.self="modal = null">
      <div class="modal card">
        <h3>{{ editing ? 'Edit credential' : 'New credential' }}</h3>
        <label>Name</label>
        <input v-model="modal.name" placeholder="My Slack token" />
        <label>Type</label>
        <select v-model="modal.type">
          <option v-for="t in credTypes" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
        <label>Data (JSON)</label>
        <textarea
          v-model="modal.dataJson"
          rows="8"
          spellcheck="false"
          placeholder='{ "token": "xoxb-..." }'
        ></textarea>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="row" style="justify-content: flex-end; margin-top: 12px">
          <button @click="modal = null">Cancel</button>
          <button class="primary" :disabled="saving" @click="onSave">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api';

interface Cred {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

const creds = ref<Cred[]>([]);
const modal = ref<{
  id?: string;
  name: string;
  type: string;
  dataJson: string;
} | null>(null);
const editing = ref(false);
const saving = ref(false);
const modalError = ref<string | null>(null);

const credTypes = [
  { value: 'httpBasicAuth', label: 'HTTP Basic Auth' },
  { value: 'httpBearerAuth', label: 'HTTP Bearer Token' },
  { value: 'httpHeaderAuth', label: 'HTTP Header Auth' },
  { value: 'slackApi', label: 'Slack API' },
  { value: 'telegramApi', label: 'Telegram Bot' },
  { value: 'githubApi', label: 'GitHub Token' },
  { value: 'openAiApi', label: 'OpenAI API' },
  { value: 'googleApi', label: 'Google API' },
  { value: 'awsS3', label: 'AWS S3' },
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'smtp', label: 'SMTP / Email' },
  { value: 'ftp', label: 'FTP' },
  { value: 'custom', label: 'Custom' },
];

async function load() {
  const r = await api.get('/api/credentials');
  creds.value = r.data;
}

function openNew() {
  modalError.value = null;
  modal.value = { name: '', type: 'httpBearerAuth', dataJson: '{\n  \n}' };
  editing.value = false;
}

async function edit(c: Cred) {
  modalError.value = null;
  modal.value = {
    id: c.id,
    name: c.name,
    type: c.type,
    dataJson: '{\n  "// data is encrypted; enter new values to overwrite": ""\n}',
  };
  editing.value = true;
}

async function remove(c: Cred) {
  if (!confirm(`Delete "${c.name}"?`)) return;
  await api.delete(`/api/credentials/${c.id}`);
  await load();
}

async function onSave() {
  if (!modal.value) return;
  modalError.value = null;
  let data: unknown;
  try {
    data = JSON.parse(modal.value.dataJson || '{}');
  } catch {
    modalError.value = 'Invalid JSON in data field';
    return;
  }
  saving.value = true;
  try {
    if (modal.value.id) {
      await api.patch(`/api/credentials/${modal.value.id}`, {
        name: modal.value.name,
        data,
      });
    } else {
      await api.post('/api/credentials', {
        name: modal.value.name,
        type: modal.value.type,
        data,
      });
    }
    modal.value = null;
    await load();
  } catch (e: any) {
    modalError.value = e?.response?.data?.message ?? e.message;
  } finally {
    saving.value = false;
  }
}

function rel(iso: string): string {
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--text-dim);
}
.empty {
  text-align: center;
  padding: 48px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 16px;
}
.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
