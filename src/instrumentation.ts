export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentryServer } = await import("@/lib/monitoring-server");
    await initSentryServer();
  }
}
