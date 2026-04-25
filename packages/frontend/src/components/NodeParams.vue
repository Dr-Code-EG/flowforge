<template>
  <div>
    <div v-if="definition?.credentials?.length">
      <label
        v-for="c in definition.credentials"
        :key="c.name"
      >
        Credential: {{ c.name }}{{ c.required ? ' *' : '' }}
      </label>
      <select v-model="credentialPick" @change="onCredentialPick">
        <option value="">— None —</option>
        <option
          v-for="cred in matchingCreds"
          :key="cred.id"
          :value="cred.id"
        >
          {{ cred.name }}
        </option>
      </select>
    </div>

    <template v-for="prop in visibleProps" :key="prop.name">
      <label>
        {{ prop.displayName ?? prop.name }}{{ prop.required ? ' *' : '' }}
      </label>

      <input
        v-if="prop.type === 'string'"
        :type="prop.typeOptions?.password ? 'password' : 'text'"
        :value="asStr(getVal(prop.name))"
        @input="setVal(prop.name, ($event.target as HTMLInputElement).value)"
      />

      <textarea
        v-else-if="prop.type === 'code'"
        :value="asStr(getVal(prop.name))"
        :rows="prop.typeOptions?.rows ?? 6"
        spellcheck="false"
        @input="setVal(prop.name, ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <input
        v-else-if="prop.type === 'number'"
        type="number"
        :value="asStr(getVal(prop.name))"
        @input="setVal(prop.name, parseFloat(($event.target as HTMLInputElement).value))"
      />

      <label v-else-if="prop.type === 'boolean'" class="row">
        <input
          type="checkbox"
          :checked="!!getVal(prop.name)"
          style="width: auto; margin-right: 8px"
          @change="setVal(prop.name, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ prop.description ?? prop.displayName }}</span>
      </label>

      <select
        v-else-if="prop.type === 'options'"
        :value="asStr(getVal(prop.name))"
        @change="setVal(prop.name, ($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="opt in prop.options ?? []"
          :key="String(opt.value)"
          :value="opt.value"
        >
          {{ opt.name }}
        </option>
      </select>

      <textarea
        v-else-if="prop.type === 'json'"
        :value="getJsonVal(prop.name)"
        rows="5"
        spellcheck="false"
        @input="setJsonVal(prop.name, ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <input
        v-else
        :value="asStr(getVal(prop.name))"
        @input="setVal(prop.name, ($event.target as HTMLInputElement).value)"
      />

      <p v-if="prop.description" class="muted" style="font-size: 11px; margin-top: 4px">
        {{ prop.description }}
      </p>
    </template>

    <details v-if="visibleProps.length === 0" class="muted" style="margin-top: 12px">
      <summary>No parameters</summary>
      <p style="font-size: 12px">This node has no configurable parameters.</p>
    </details>

    <details style="margin-top: 16px">
      <summary class="muted" style="cursor: pointer; font-size: 12px">
        Raw JSON
      </summary>
      <pre class="output">{{ JSON.stringify(node.parameters, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  WorkflowNode,
  NodeTypeDescription,
  NodeParameter,
} from '@flowforge/shared';

const props = defineProps<{
  node: WorkflowNode;
  definition: NodeTypeDescription | null | undefined;
  credentials: { id: string; name: string; type: string }[];
}>();

const emit = defineEmits<{ (e: 'change'): void }>();

const credentialPick = ref<string>('');

watch(
  () => props.node,
  () => {
    const credName = props.definition?.credentials?.[0]?.name;
    if (credName && props.node.credentials?.[credName]) {
      credentialPick.value = props.node.credentials[credName];
    } else {
      credentialPick.value = '';
    }
  },
  { immediate: true },
);

const matchingCreds = computed(() => {
  const credName = props.definition?.credentials?.[0]?.name;
  if (!credName) return [];
  return props.credentials.filter((c) => c.type === credName);
});

function onCredentialPick() {
  const credName = props.definition?.credentials?.[0]?.name;
  if (!credName) return;
  const node = props.node;
  if (!node.credentials) node.credentials = {};
  if (credentialPick.value) {
    node.credentials[credName] = credentialPick.value;
  } else {
    delete node.credentials[credName];
  }
  emit('change');
}

const visibleProps = computed<NodeParameter[]>(() => {
  if (!props.definition) return [];
  return props.definition.properties.filter((p) => {
    if (!p.displayOptions?.show) return true;
    for (const [k, allowed] of Object.entries(p.displayOptions.show)) {
      const v = getVal(k);
      if (!allowed.includes(v as never)) return false;
    }
    return true;
  });
});

function getVal(name: string) {
  return (props.node.parameters as Record<string, unknown>)?.[name];
}

function asStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

function setVal(name: string, value: unknown) {
  (props.node.parameters as Record<string, unknown>)[name] = value;
  emit('change');
}

function getJsonVal(name: string) {
  const v = getVal(name);
  if (typeof v === 'string') return v;
  return JSON.stringify(v ?? null, null, 2);
}

function setJsonVal(name: string, value: string) {
  try {
    const parsed = JSON.parse(value);
    setVal(name, parsed);
  } catch {
    setVal(name, value);
  }
}
</script>

<style scoped>
.output {
  background: var(--bg);
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 200px;
  overflow: auto;
}
</style>
