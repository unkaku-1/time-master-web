# Vercel 部署脚本
# 使用部署钩子触发项目部署

$deployHook = "https://api.vercel.com/v1/integrations/deploy/prj_EdwMRqBe8gnnAs0APRxzrq6NQWRh/snePwcNQro"

Write-Host "🚀 开始部署到 Vercel..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri $deployHook -Method POST -ContentType "application/json"
    
    if ($response.StatusCode -eq 201) {
        $content = $response.Content | ConvertFrom-Json
        Write-Host "✅ 部署任务已创建!" -ForegroundColor Green
        Write-Host "📋 任务ID: $($content.job.id)" -ForegroundColor Cyan
        Write-Host "⏳ 状态: $($content.job.state)" -ForegroundColor Yellow
        Write-Host "🕒 创建时间: $(Get-Date -UnixTimeSeconds ($content.job.createdAt / 1000))" -ForegroundColor Gray
        
        Write-Host "`n🌐 请访问 Vercel 控制台查看部署进度:" -ForegroundColor Blue
        Write-Host "https://vercel.com/dashboard" -ForegroundColor Blue
    } else {
        Write-Host "❌ 部署请求失败，状态码: $($response.StatusCode)" -ForegroundColor Red
        Write-Host $response.Content -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 部署请求出错: $($_.Exception.Message)" -ForegroundColor Red
    
    # 如果是内部服务器错误，可能是钩子URL问题
    if ($_.Exception.Message -like "*internal_server_error*") {
        Write-Host "`n💡 建议检查:" -ForegroundColor Yellow
        Write-Host "1. 确认部署钩子URL是否正确" -ForegroundColor Yellow
        Write-Host "2. 检查Vercel项目是否存在" -ForegroundColor Yellow
        Write-Host "3. 验证GitHub仓库连接状态" -ForegroundColor Yellow
        Write-Host "4. 尝试在Vercel控制台手动触发部署" -ForegroundColor Yellow
    }
}

Write-Host "`n📝 部署完成后，项目将在以下地址可用:" -ForegroundColor Green
Write-Host "- 生产环境: https://time-master-web.vercel.app (或您的自定义域名)" -ForegroundColor Green