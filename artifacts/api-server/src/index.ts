import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripeClient.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set — skipping Stripe initialization');
    return;
  }

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info('Stripe webhook configured');

    stripeSync.syncBackfill()
      .then(() => logger.info('Stripe data synced'))
      .catch((err: any) => logger.error({ err }, 'Error syncing Stripe data'));
  } catch (error: any) {
    logger.warn({ err: error }, 'Stripe initialization skipped — connect Stripe via the Integrations tab to enable payments');
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Initialize Stripe after the server is already accepting connections
  // so health checks pass during startup
  initStripe().catch((err) => {
    logger.error({ err }, "Stripe initialization failed");
  });
});
