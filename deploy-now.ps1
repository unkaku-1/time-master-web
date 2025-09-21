# Time Master Enterprise - 立即部署脚本

Write-Host "🚀 Time Master Enterprise 部署开始" -ForegroundColor Magenta

# 检查构建文件
if (-not (Test-Path "dist")) {
    Write-Host "❌ 请先运行构建: pnpm run build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 构建文件检查通过" -ForegroundColor Green

# 设置部署路径
$deployPath = "C:\Deploy\timemaster"

# 创建部署目录
if (-not (Test-Path $deployPath)) {
    New-Item -ItemType Directory -Path $deployPath -Force | Out-Null
    Write-Host "✅ 创建部署目录: $deployPath" -ForegroundColor Green
}

# 清理旧文件
Get-ChildItem $deployPath | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ 清理旧文件" -ForegroundColor Green

# 复制新文件
Copy-Item -Path "dist\*" -Destination $deployPath -Recurse -Force
Write-Host "✅ 文件部署完成" -ForegroundColor Green

# 统计文件
$fileCount = (Get-ChildItem -Recurse $deployPath | Measure-Object).Count
$totalSize = [math]::Round((Get-ChildItem -Recurse $deployPath | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "📊 部署统计:" -ForegroundColor Cyan
Write-Host "   文件数量: $fileCount" -ForegroundColor White
Write-Host "   总大小: $totalSize MB" -ForegroundColor White
Write-Host "   部署路径: $deployPath" -ForegroundColor White

Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "💡 提示: 可以使用 pnpm preview 在本地预览" -ForegroundColor Yellow