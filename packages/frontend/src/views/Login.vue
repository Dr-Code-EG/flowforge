<template>
  <div class="auth-wrap">
    <div class="auth-card card">
      <h1 class="logo">⚡ FlowForge</h1>
      <p class="muted">Sign in to your workspace</p>
      <form @submit.prevent="onSubmit">
        <label>Email</label>
        <input v-model="email" type="email" autocomplete="email" required />
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
        <button class="primary" type="submit" :disabled="loading" style="width: 100%; margin-top: 16px">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <p class="muted" style="margin-top: 16px; text-align: center">
        New here? <RouterLink to="/register">Create an account</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function onSubmit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.replace('/workflows');
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-wrap {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 16px;
}
.auth-card {
  width: 100%;
  max-width: 380px;
}
.logo {
  margin: 0 0 4px;
  font-size: 22px;
}
</style>
