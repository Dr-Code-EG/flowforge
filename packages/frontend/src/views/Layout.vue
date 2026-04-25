<template>
  <div class="layout">
    <aside class="sidebar" :class="{ open: drawerOpen }">
      <div class="brand">
        <span class="logo">⚡</span>
        <span class="name">FlowForge</span>
      </div>
      <nav>
        <RouterLink to="/workflows" class="nav-link" @click="drawerOpen = false">
          📂 Workflows
        </RouterLink>
        <RouterLink to="/executions" class="nav-link" @click="drawerOpen = false">
          📊 Executions
        </RouterLink>
        <RouterLink to="/credentials" class="nav-link" @click="drawerOpen = false">
          🔐 Credentials
        </RouterLink>
      </nav>
      <div class="bottom">
        <div class="user-info">
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="muted" style="font-size: 11px">{{ auth.user?.email }}</div>
        </div>
        <button @click="logout" style="width: 100%; margin-top: 8px">
          Sign out
        </button>
      </div>
    </aside>

    <button
      class="hamburger"
      @click="drawerOpen = !drawerOpen"
      :aria-label="drawerOpen ? 'Close menu' : 'Open menu'"
    >
      ☰
    </button>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const drawerOpen = ref(false);

function logout() {
  auth.logout();
  router.replace('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100dvh;
  width: 100vw;
}
.sidebar {
  width: 220px;
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.logo {
  font-size: 22px;
}
.name {
  font-weight: 700;
  letter-spacing: 0.5px;
}
.nav-link {
  display: block;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
}
.nav-link:hover {
  background: var(--panel-2);
}
.nav-link.router-link-active {
  background: var(--panel-2);
  color: var(--accent);
}
.bottom {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.user-info {
  padding: 4px 8px;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
}
.content {
  flex: 1;
  overflow: auto;
  padding: 0;
  background: var(--bg);
  min-width: 0;
}
.hamburger {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 50;
  font-size: 18px;
  padding: 8px 12px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 240px;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.2s;
    box-shadow: var(--shadow);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .hamburger {
    display: block;
  }
  .content {
    width: 100%;
    padding-top: 50px;
  }
}
</style>
