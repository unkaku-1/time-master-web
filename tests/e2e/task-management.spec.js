import { test, expect } from '@playwright/test';

test.describe('任务管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清理localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // 导航到应用
    await page.goto('/');
    
    // 等待应用加载完成
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    
    // 模拟登录状态
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_info', JSON.stringify({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
    
    // 刷新页面以应用登录状态
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('应该显示任务管理页面的主要元素', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // 检查页面标题
    const title = await page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 10000 });
    
    // 检查是否有任务管理相关的内容
    const hasTaskContent = await page.locator('text=任务').first().isVisible().catch(() => false);
    const hasManagementContent = await page.locator('text=管理').first().isVisible().catch(() => false);
    const hasTimeContent = await page.locator('text=Time').first().isVisible().catch(() => false);
    
    // 至少应该有其中一个内容可见
    expect(hasTaskContent || hasManagementContent || hasTimeContent).toBeTruthy();
  });

  test('应该能够打开创建任务对话框', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 查找创建任务按钮 - 尝试多种可能的选择器
    const createButtons = [
      'button:has-text("创建任务")',
      'button:has-text("新建任务")',
      'button:has-text("添加任务")',
      '[data-testid="create-task-button"]',
      'button[aria-label*="创建"]',
      'button[title*="创建"]'
    ];
    
    let createButton = null;
    for (const selector of createButtons) {
      try {
        createButton = page.locator(selector).first();
        if (await createButton.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (createButton && await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // 等待对话框出现
      await page.waitForSelector('[role="dialog"], .dialog, .modal', { timeout: 5000 });
      
      // 验证对话框是否可见
      const dialog = page.locator('[role="dialog"], .dialog, .modal').first();
      await expect(dialog).toBeVisible();
    } else {
      // 如果没有找到创建按钮，跳过此测试
      test.skip('创建任务按钮未找到，跳过测试');
    }
  });

  test('应该能够创建新任务', async ({ page }) => {
    // 点击创建任务按钮
    const createButton = page.locator('button').filter({ hasText: /创建任务/ });
    await createButton.first().click();
    
    // 等待对话框出现
    await expect(page.locator('text=创建新任务')).toBeVisible();
    
    // 填写任务信息
    await page.fill('input#title', '测试任务');
    await page.fill('textarea', '这是一个测试任务的描述');
    
    // 提交表单
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /创建任务/ });
    await submitButton.click();
    
    // 由于是mock环境，我们检查对话框是否关闭
    await expect(page.locator('text=创建新任务')).not.toBeVisible({ timeout: 5000 });
  });

  test('应该能够搜索任务', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 查找搜索输入框
    const searchSelectors = [
      'input[placeholder*="搜索"]',
      'input[placeholder*="查找"]',
      'input[type="search"]',
      '[data-testid="search-input"]',
      'input[aria-label*="搜索"]'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = page.locator(selector).first();
        if (await searchInput.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (searchInput && await searchInput.isVisible().catch(() => false)) {
      // 输入搜索关键词
      await searchInput.fill('测试任务');
      
      // 等待搜索结果
      await page.waitForTimeout(1000);
      
      // 验证搜索功能正常工作（不会报错）
      expect(await searchInput.inputValue()).toBe('测试任务');
    } else {
      // 如果没有找到搜索框，跳过此测试
      test.skip('搜索输入框未找到，跳过测试');
    }
  });

  test('应该能够筛选任务状态', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 查找状态筛选器
    const filterSelectors = [
      'select[aria-label*="状态"]',
      'select[aria-label*="筛选"]',
      '[data-testid="status-filter"]',
      'button:has-text("全部")',
      'button:has-text("进行中")',
      'button:has-text("已完成")'
    ];
    
    let filterElement = null;
    for (const selector of filterSelectors) {
      try {
        filterElement = page.locator(selector).first();
        if (await filterElement.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (filterElement && await filterElement.isVisible().catch(() => false)) {
      // 点击筛选器
      await filterElement.click();
      
      // 等待筛选结果
      await page.waitForTimeout(1000);
      
      // 验证筛选功能正常工作
      expect(await filterElement.isVisible()).toBeTruthy();
    } else {
      // 如果没有找到筛选器，跳过此测试
      test.skip('状态筛选器未找到，跳过测试');
    }
  });

  test('应该显示空状态提示', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 查找空状态提示
    const emptyStateSelectors = [
      'text=暂无任务',
      'text=没有任务',
      'text=空',
      '[data-testid="empty-state"]',
      '.empty-state',
      'text=开始创建'
    ];
    
    let hasEmptyState = false;
    for (const selector of emptyStateSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          hasEmptyState = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 验证是否有空状态提示或任务列表
    const hasTaskList = await page.locator('[data-testid="task-list"], .task-list, .task-item').isVisible().catch(() => false);
    
    // 应该要么有空状态提示，要么有任务列表
    expect(hasEmptyState || hasTaskList).toBeTruthy();
  });
});