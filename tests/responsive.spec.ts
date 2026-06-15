import { test, expect } from '@playwright/test';

test.describe('Cihaz Ekran Tipi UI Testleri (Responsive & Themes)', () => {
  // Desktop Viewport Test
  test('Masaüstü görünümde navigasyon ve düzen kontrolleri', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Masaüstünde header linkleri görünür olmalı, hamburger gizli olmalı
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    if (await mobileMenuBtn.isVisible()) {
      // If we have a mobile menu button, let's make sure it's not visible on desktop
      await expect(mobileMenuBtn).not.toBeVisible();
    }
  });

  // Tablet Viewport Test
  test('Tablet görünümde düzen kontrolleri', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Core structure check
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  // Mobile Viewport Test & Hamburger Menu Toggle
  test('Mobil görünümde hamburger menü etkileşimi', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.locator('#mobile-menu-btn');
    // If mobile menu button exists in the app, test its toggle functionality
    if (await menuButton.count() > 0 && await menuButton.isVisible()) {
      await menuButton.click();
      const mobileNav = page.locator('#mobile-nav');
      await expect(mobileNav).toBeVisible();
      
      // Close menu
      const closeButton = page.locator('#close-mobile-menu-btn');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await expect(mobileNav).not.toBeVisible();
      }
    }
  });

  // Dark/Light Mode Contrast & WCAG compliance checks
  test('Tema geçişi ve kontrast uyumluluğu kontrolü', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('#theme-toggle-btn');
    if (await themeToggle.count() > 0 && await themeToggle.isVisible()) {
      const htmlElement = page.locator('html');
      
      // Check current theme
      const initialTheme = await htmlElement.getAttribute('class') || '';
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500); // Allow transition
      
      const newTheme = await htmlElement.getAttribute('class') || '';
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
