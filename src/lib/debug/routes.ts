export const DEBUG_ENV_ROUTE = process.env.NODE_ENV !== "production" ? "/debug/env" : undefined;
export const DEBUG_QA_ROUTE = process.env.NODE_ENV !== "production" ? "/app/debug/qa" : undefined;
