import { z } from 'zod';
import { insertQueueSchema, queueEntries, users } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  queue: {
    create: {
      method: 'POST' as const,
      path: '/api/queue',
      input: insertQueueSchema,
      responses: {
        201: z.custom<typeof queueEntries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/queue',
      responses: {
        200: z.array(z.custom<typeof queueEntries.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/queue/:id',
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    status: { // Public status check
      method: 'GET' as const,
      path: '/api/queue/:id/status',
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/queue/:id/status',
      input: z.object({ 
        status: z.enum(['waiting', 'called', 'confirmed', 'expired', 'cancelled', 'completed']) 
      }),
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    call: { // Admin calls the customer
      method: 'POST' as const,
      path: '/api/queue/:id/call',
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    accept: { // Customer accepts
      method: 'POST' as const,
      path: '/api/queue/:id/accept',
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    cancel: { // Customer cancels
      method: 'POST' as const,
      path: '/api/queue/:id/cancel',
      responses: {
        200: z.custom<typeof queueEntries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
