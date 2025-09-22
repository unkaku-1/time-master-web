import { test, expect } from '@playwright/test';

test.describe('认证功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该显示登录页面', async ({ page }) => {
    // 检查登录页面元素
    await expect(page.locator('h1')).toContainText('Time Master');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('应该能够成功登录', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 等待页面跳转到仪表板
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=仪表板')).toBeVisible();
  });

  test('应该显示登录错误信息', async ({ page }) => {
    // 填写错误的登录信息
    await page.fill('input[type="text"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 检查错误信息
    await expect(page.locator('text=用户名或密码错误')).toBeVisible();
  });

  test('应该能够退出登录', async ({ page }) => {
    // 先登录
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待登录成功
    await expect(page.locator('text=仪表板')).toBeVisible();
    
    // 点击退出登录
    await page.click('text=退出登录');
    
    // 检查是否回到登录页面
    await expect(page.locator('h1')).toContainText('Time Master');
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});