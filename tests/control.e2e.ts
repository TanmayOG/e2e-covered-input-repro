import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

/**
 * Controls: these pass. They show the fixture itself works, and that the
 * footer drawn over Brand is the only difference from the failing repro.
 */

test.beforeEach(async ({ app }) => {
  await app.open();
});

test('with the footer hidden, the same steps fill Brand', async ({ screen }) => {
  await screen.getByTestId('toggle-footer').tap();
  await expect(screen.getByTestId('footer-next')).toBeHidden();

  const product = screen.getByTestId('product-name');
  const brand = screen.getByTestId('brand');
  await product.fill('Widget');
  await screen.scrollUntilVisible(brand);
  await brand.fill('Acme');

  await expect(brand).toHaveValue('Acme');
  await expect(product).toHaveValue('Widget');
});

test('an uncovered input above the footer fills normally', async ({ screen }) => {
  const product = screen.getByTestId('product-name');
  await product.fill('Widget');
  await expect(product).toHaveValue('Widget');
  await expect(product).toBeFocused();
});
