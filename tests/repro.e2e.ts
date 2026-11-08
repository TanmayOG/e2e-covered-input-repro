import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

/**
 * These tests fail on purpose: each one shows e2e treating the Brand input as
 * visible while the Back/Next footer covers it. The on-screen status line
 * shows where focus and taps went ("Focused: …", "Footer taps: …").
 */

test.beforeEach(async ({ app }) => {
  await app.open();
});

test('a TextInput under the footer reads as hidden', async ({ screen }) => {
  await expect(screen.getByTestId('footer-next')).toBeVisible();
  // A person can neither see nor tap Brand: the footer is drawn over it.
  await expect(screen.getByTestId('brand')).toBeHidden();
});

test('a tap on the covered Brand input focuses it', async ({ screen }) => {
  const brand = screen.getByTestId('brand');
  await brand.tap();
  // Fails: the tap lands on the footer ("Footer taps: 1"), not on Brand.
  await expect(brand).toBeFocused();
});

test('the reported flow: scrollUntilVisible(Brand) brings it out from under the footer', async ({ screen }) => {
  const product = screen.getByTestId('product-name');
  const brand = screen.getByTestId('brand');

  // 1. Focusing Product name opens the keyboard; the footer rises with it
  //    and stays over Brand.
  await product.fill('Widget');

  // 2. Should scroll Brand clear of the footer. It returns at once instead,
  //    because Brand already reads as visible.
  await screen.scrollUntilVisible(brand);

  // 3. The tap that should move focus to Brand lands on the footer, so
  //    Product name keeps focus.
  await brand.tap();
  await expect(brand).toBeFocused();
});

test('the reported flow, typed: pressSequentially into the covered Brand input', async ({ screen }) => {
  const product = screen.getByTestId('product-name');
  const brand = screen.getByTestId('brand');

  await product.fill('Widget');
  await screen.scrollUntilVisible(brand);

  // 4. Typing should go to Brand, and Product name should stay "Widget".
  await brand.pressSequentially('Acme');
  await expect(product).toHaveValue('Widget');
  await expect(brand).toHaveValue('Acme');
});

test('the reported flow, filled: fill into the covered Brand input', async ({ screen }) => {
  const product = screen.getByTestId('product-name');
  const brand = screen.getByTestId('brand');

  await product.fill('Widget');
  await screen.scrollUntilVisible(brand);

  // fill reports success, but it replaces Product name's text instead.
  await brand.fill('Acme');
  await expect(product).toHaveValue('Widget');
  await expect(brand).toHaveValue('Acme');
});
