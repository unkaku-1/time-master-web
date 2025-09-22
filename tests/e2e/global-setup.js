/**
 * Playwright全局设置
 * 在所有测试运行前执行的设置
 */

async function globalSetup(config) {
  console.log('🚀 Starting E2E test global setup...')
  
  // 清理测试环境
  console.log('🧹 Cleaning test environment...')
  
  // 可以在这里添加全局设置逻辑
  // 例如：数据库初始化、测试用户创建等
  
  console.log('✅ Global setup completed')
}

module.exports = globalSetup