/**
 * Expression evaluator for FlowForge node parameters.
 *
 * Supports `{{ ... }}` templating and `={{ ... }}` whole-string expressions
 * (n8n-compatible syntax). Inside expressions, the following are available:
 *   $json           current item's json data
 *   $item(i)        nth input item
 *   $node["name"]   another node's last item ($node.NodeName.json.foo also works)
 *   $vars           workflow-level variables (env-injected)
 *   $now            ISO timestamp
 *   $env.FOO        process.env.FOO
 *
 * Expressions are evaluated in a sandboxed Function (no `require`, no globals
 * other than what we expose). This is best-effort isolation — do NOT run
 * untrusted workflows on a shared server without additional sandboxing.
 */

export interface ExpressionContext {
  $json: Record<string, unknown>;
  $item: (i: number) => Record<string, unknown> | undefined;
  $node: Record<string, { json: Record<string, unknown> }>;
  $vars: Record<string, unknown>;
  $now: string;
  $env: Record<string, string | undefined>;
}

const EXPR_RE = /\{\{([\s\S]+?)\}\}/g;

export function isExpression(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('={{') && value.endsWith('}}')) return true;
  return EXPR_RE.test(value);
}

function evalSingle(code: string, ctx: ExpressionContext): unknown {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const fn = new Function(
    '$json',
    '$item',
    '$node',
    '$vars',
    '$now',
    '$env',
    `"use strict"; return (${code});`,
  );
  return fn(ctx.$json, ctx.$item, ctx.$node, ctx.$vars, ctx.$now, ctx.$env);
}

export function resolveExpression(value: unknown, ctx: ExpressionContext): unknown {
  if (typeof value !== 'string') return value;

  // Whole-string expression: ={{ ... }}
  if (value.startsWith('={{') && value.endsWith('}}')) {
    const code = value.slice(3, -2);
    try {
      return evalSingle(code, ctx);
    } catch (e) {
      throw new Error(`Expression error in "={{${code}}}": ${(e as Error).message}`);
    }
  }

  // Inline interpolation
  if (!value.includes('{{')) return value;
  return value.replace(EXPR_RE, (_match, code) => {
    try {
      const v = evalSingle(code, ctx);
      return v === undefined || v === null ? '' : String(v);
    } catch (e) {
      throw new Error(`Expression error in "{{${code}}}": ${(e as Error).message}`);
    }
  });
}

export function resolveDeep<T>(value: T, ctx: ExpressionContext): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return resolveExpression(value, ctx) as T;
  if (Array.isArray(value)) {
    return value.map((v) => resolveDeep(v, ctx)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveDeep(v, ctx);
    }
    return out as unknown as T;
  }
  return value;
}
