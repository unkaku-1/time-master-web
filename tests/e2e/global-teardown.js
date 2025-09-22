/**
 * Playwright全局清理
 * 在所有测试运行后执行的清理
 */

async function globalTeardown(config) {
  console.log('🧹 Starting E2E test global teardown...')
  
  // 清理测试数据
  console.log('🗑️ Cleaning up test data...')
  
  // 可以在这里添加全局清理逻辑
  // 例如：清理测试数据、关闭数据库连接等
  
  console.log('✅ Global teardown completed')
}

module.exports = globalTeardown