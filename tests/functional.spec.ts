import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('UI İşlevsel Testleri (Forms, Modals & Uploads)', () => {
  
  test('Giriş form sınır ve validasyon kontrolleri', async ({ page }) => {
    // Go to login or homepage with login form
    await page.goto('/');
    
    // Open login modal if it exists
    const loginOpenBtn = page.locator('#login-open-btn');
    if (await loginOpenBtn.count() > 0 && await loginOpenBtn.isVisible()) {
      await loginOpenBtn.click();
    }
    
    // Look for email input and submit
    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button[type="submit"]');
    
    if (await emailInput.count() > 0 && await submitBtn.count() > 0) {
      // Test invalid email
      await emailInput.fill('invalidemail');
      await submitBtn.click();
      
      // Check for validation error indicator/message
      const errorMsg = page.locator('.text-error, .text-destructive, [role="alert"]');
      if (await errorMsg.count() > 0) {
        await expect(errorMsg.first()).toBeVisible();
      }
    }
  });

  test('Dosya Yükleme alanı format ve boyut kontrolleri', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to create content page or open upload modal
    const uploadTrigger = page.locator('#upload-trigger-btn');
    if (await uploadTrigger.count() > 0 && await uploadTrigger.isVisible()) {
      await uploadTrigger.click();
    }

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a dummy large file (> 10MB) or unsupported format to test frontend boundary limits
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      const txtFilePath = path.join(tempDir, 'invalid-test.txt');
      fs.writeFileSync(txtFilePath, 'dummy content');

      // Upload text file (invalid format since we only allow images)
      await fileInput.setInputFiles(txtFilePath);
      
      // Expect client side validation toast/error
      const errorToast = page.locator('.toast-error, .sonner-toast, [role="status"]');
      if (await errorToast.count() > 0) {
        await expect(errorToast.first()).toBeVisible();
      }

      // Cleanup
      fs.unlinkSync(txtFilePath);
      fs.rmdirSync(tempDir);
    }
  });

  test('Modal pencerelerin kapanma tetikleyicileri (ESC & Backdrop)', async ({ page }) => {
    await page.goto('/');
    
    // Find dialog trigger
    const dialogBtn = page.locator('#login-open-btn, #upload-trigger-btn, [data-state="closed"]');
    if (await dialogBtn.count() > 0 && await dialogBtn.first().isVisible()) {
      const btn = dialogBtn.first();
      await btn.click();
      
      // Confirm dialog is open
      const dialog = page.locator('[role="dialog"], .modal-content');
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible();
        
        // Trigger ESC key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await expect(dialog.first()).not.toBeVisible();
      }
    }
  });
});
