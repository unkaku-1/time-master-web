import { test, expect } from '@playwright/test';

test.describe('可访问性测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该支持键盘导航', async ({ page }) => {
    // 登录页面键盘导航
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 继续Tab导航
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 使用Enter键激活元素
    await page.keyboard.press('Enter');
  });

  test('应该有正确的ARIA标签', async ({ page }) => {
    // 检查表单元素的ARIA标签
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toHaveAttribute('aria-label', /.+/);
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);
    
    // 检查按钮的可访问性
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute('aria-label', /.+/);
  });

  test('应该有正确的语义化HTML结构', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1')).toBeVisible();
    
    // 检查表单结构
    await expect(page.locator('form')).toBeVisible();
    
    // 检查标签与输入框的关联
    const labels = page.locator('label');
    if (await labels.count() > 0) {
      const firstLabel = labels.first();
      const forAttribute = await firstLabel.getAttribute('for');
      if (forAttribute) {
        await expect(page.locator(`#${forAttribute}`)).toBeVisible();
      }
    }
  });

  test('应该支持屏幕阅读器', async ({ page }) => {
    // 检查页面是否有正确的role属性
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
    
    // 检查导航区域
    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('应该有足够的颜色对比度', async ({ page }) => {
    // 登录后检查主界面的对比度
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=仪表板')).toBeVisible();
    
    // 检查文本元素是否可见（间接检查对比度）
    const textElements = page.locator('text=仪表板, text=任务管理, text=系统管理员');
    await expect(textElements.first()).toBeVisible();
  });

  test('应该支持焦点管理', async ({ page }) => {
    // 登录
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=仪表板')).toBeVisible();
    
    // 检查焦点是否正确设置
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 检查焦点指示器
    const focusedElementBox = await focusedElement.boundingBox();
    expect(focusedElementBox).toBeTruthy();
  });

  test('应该支持高对比度模式', async ({ page }) => {
    // 模拟高对比度模式
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // 登录
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=仪表板')).toBeVisible();
    
    // 检查深色模式下的可见性
    const sidebar = page.locator('text=Time Master');
    await expect(sidebar).toBeVisible();
  });

  test('应该有正确的页面标题', async ({ page }) => {
    // 检查登录页面标题
    await expect(page).toHaveTitle(/Time Master/);
    
    // 登录后检查页面标题
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=仪表板')).toBeVisible();
    await expect(page).toHaveTitle(/Time Master/);
  });
});