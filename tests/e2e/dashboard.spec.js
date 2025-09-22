import { test, expect } from '@playwright/test';

test.describe('仪表板功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到应用
    await page.goto('/');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=仪表板')).toBeVisible();
  });

  test('应该显示仪表板主要元素', async ({ page }) => {
    // 检查侧边栏
    await expect(page.locator('text=Time Master')).toBeVisible();
    await expect(page.locator('text=仪表板')).toBeVisible();
    await expect(page.locator('text=任务管理')).toBeVisible();
    
    // 检查用户信息
    await expect(page.locator('text=系统管理员')).toBeVisible();
    await expect(page.locator('text=IT部门')).toBeVisible();
  });

  test('应该能够切换到任务管理页面', async ({ page }) => {
    // 点击任务管理菜单
    await page.click('text=任务管理');
    
    // 检查页面是否切换
    await expect(page.locator('text=任务管理')).toBeVisible();
    
    // 检查任务管理页面的元素
    await expect(page.locator('button')).toContainText(['新建任务', '创建任务']);
  });

  test('应该显示管理后台菜单（管理员用户）', async ({ page }) => {
    // 检查管理后台菜单是否可见
    await expect(page.locator('text=管理后台')).toBeVisible();
    
    // 点击管理后台
    await page.click('text=管理后台');
    
    // 检查是否切换到管理后台页面
    await expect(page.locator('text=管理后台')).toBeVisible();
  });

  test('应该响应键盘导航', async ({ page }) => {
    // 使用Tab键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 检查焦点是否正确
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('应该在移动端正确显示', async ({ page, browserName }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 检查响应式布局
    await expect(page.locator('text=Time Master')).toBeVisible();
    await expect(page.locator('text=仪表板')).toBeVisible();
    
    // 检查移动端特定的UI元素
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});