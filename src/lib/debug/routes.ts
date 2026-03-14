export const DEBUG_ENV_ROUTE = process.env.NODE_ENV !== "production" ? "/debug/env" : undefined;
export const DEBUG_QA_ROUTE = process.env.NODE_ENV !== "production" ? "/app/debug/qa" : undefined;
export const DEBUG_DEMO_ROUTE =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true" ? "/app/debug/demo" : undefined;
