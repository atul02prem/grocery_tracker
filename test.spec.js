// @ts-check
const { test, expect } = require('@playwright/test');

test('login with correct credentials', async ({ page }) => {
  // Step 1: Inject user data into localStorage before page load
  await page.addInitScript(() => {
    const users = [{
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123"
    }];
    localStorage.setItem('users', JSON.stringify(users));
  });

  // Step 2: Navigate to login page
  await page.goto('http://localhost:5500/index.html');

  // Step 3: Reload to apply the localStorage before form submission
  await page.reload();

  // Step 4: Fill in the login form
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  // Step 5: Wait for redirect to dashboard
  await page.waitForURL('**/dashboard.html', { timeout: 10000 });

  // Step 6: Check that dashboard loaded
  await expect(page.locator('h1')).toHaveText('Dashboard');
});
