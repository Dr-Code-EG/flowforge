import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('./views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      component: () => import('./views/Register.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('./views/Layout.vue'),
      children: [
        {
          path: '',
          redirect: '/workflows',
        },
        {
          path: 'workflows',
          component: () => import('./views/WorkflowsList.vue'),
        },
        {
          path: 'workflows/:id',
          component: () => import('./views/WorkflowEditor.vue'),
        },
        {
          path: 'executions',
          component: () => import('./views/Executions.vue'),
        },
        {
          path: 'executions/:id',
          component: () => import('./views/ExecutionDetail.vue'),
        },
        {
          path: 'credentials',
          component: () => import('./views/Credentials.vue'),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.bootstrap();
  if (!to.meta.public && !auth.isAuthenticated) {
    return '/login';
  }
  if (to.meta.public && auth.isAuthenticated) {
    return '/workflows';
  }
});
