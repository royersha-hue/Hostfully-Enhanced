import { getUncachableStripeClient } from './stripeClient.js';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating StayFlow subscription products in Stripe...');

    const existing = await stripe.products.search({
      query: "name:'StayFlow Pro' AND active:'true'"
    });

    if (existing.data.length > 0) {
      console.log('StayFlow Pro already exists. Skipping creation.');
      console.log(`Product ID: ${existing.data[0].id}`);
      return;
    }

    const product = await stripe.products.create({
      name: 'StayFlow Pro',
      description: 'Unlimited properties, advanced analytics, priority support, and more.',
      metadata: {
        app: 'stayflow',
        tier: 'pro',
      },
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 1900,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Created monthly price: $19.00/month (${monthlyPrice.id})`);

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 19000,
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    console.log(`Created yearly price: $190.00/year (${yearlyPrice.id})`);

    console.log('\n✓ StayFlow Pro subscription created successfully!');
    console.log('Webhooks will sync this data to your database automatically.');
  } catch (error: any) {
    console.error('Error creating products:', error.message);
    process.exit(1);
  }
}

createProducts();
