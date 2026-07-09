type CaptureContext = Record<string, unknown>;

let sentryReady = false;

async function ensureSentry() {
  if (sentryReady) return Boolean(process.env.SENTRY_DSN?.trim());
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  const Sentry = await import("@sentry/nextjs");
  if (!Sentry.getClient()) {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    });
  }

  sentryReady = true;
  return true;
}

export async function captureException(
  error: unknown,
  context?: CaptureContext
) {
  if (await ensureSentry()) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, context ? { extra: context } : undefined);
    return;
  }

  console.error("[error]", error, context ?? "");
}

export function captureExceptionSync(
  error: unknown,
  context?: CaptureContext
) {
  void captureException(error, context);
}
