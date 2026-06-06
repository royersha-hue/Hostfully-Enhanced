import { Router, type IRouter } from 'express';
import { storage } from '../storage.js';
import { stripeService } from '../stripeService.js';

const router: IRouter = Router();

router.get('/stripe/products-with-prices', async (_req, res) => {
  try {
    const rows = await storage.listProductsWithPrices();

    const productsMap = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stripe/checkout', async (req, res) => {
  try {
    const { priceId, email } = req.body as { priceId: string; email?: string };

    if (!priceId) {
      res.status(400).json({ error: 'priceId is required' });
      return;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const session = await stripeService.createCheckoutSession(
      priceId,
      `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/api/stripe/cancel`,
      undefined,
      email
    );

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stripe/success', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Subscription Activated</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; margin: 0; background: #f7f6f3; }
          .card { background: white; border-radius: 16px; padding: 40px; text-align: center;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 360px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: #2d4a6e; margin: 0 0 8px; font-size: 24px; }
          p { color: #666; margin: 0 0 24px; }
          .badge { background: #e8f5e9; color: #2e7d32; border-radius: 20px;
                   padding: 6px 16px; font-size: 14px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h1>You're all set!</h1>
          <p>Your StayFlow Pro subscription is now active. Return to the app to enjoy all features.</p>
          <span class="badge">✓ Subscription Active</span>
        </div>
      </body>
    </html>
  `);
});

router.get('/stripe/cancel', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Checkout Cancelled</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; margin: 0; background: #f7f6f3; }
          .card { background: white; border-radius: 16px; padding: 40px; text-align: center;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 360px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: #2d4a6e; margin: 0 0 8px; font-size: 24px; }
          p { color: #666; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">↩️</div>
          <h1>No worries</h1>
          <p>Your checkout was cancelled. Return to StayFlow whenever you're ready to upgrade.</p>
        </div>
      </body>
    </html>
  `);
});

export default router;
