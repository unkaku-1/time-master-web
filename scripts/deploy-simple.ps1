# Time Master Enterprise - 简化部署脚本
param(
    [string]$ServerPath = "C:\inetpub\wwwroot\timemaster",
    [switch]$DryRun = $false
)

Write-Host "🚀 Time Master Enterprise 部署开始" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta

# 检查构建文件
Write-Host "ℹ️  检查构建文件..." -ForegroundColor Cyan
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist 目录不存在，请先运行 pnpm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist\index.html")) {
    Write-Host "❌ index.html 文件不存在" -ForegroundColor Red
    exit 1
}

$distFiles = Get-ChildItem -Recurse "dist" | Measure-Object
Write-Host "✅ 找到 $($distFiles.Count) 个构建文件" -ForegroundColor Green

# 创建服务器目录
Write-Host "ℹ️  准备部署目录..." -ForegroundColor Cyan
if (-not (Test-Path $ServerPath)) {
    if ($DryRun) {
        Write-Host "⚠️  DRY RUN: 将创建目录 $ServerPath" -ForegroundColor Yellow
    } else {
        New-Item -ItemType Directory -Path $ServerPath -Force | Out-Null
        Write-Host "✅ 创建服务器目录: $ServerPath" -ForegroundColor Green
    }
}

# 部署文件
Write-Host "ℹ️  部署静态文件..." -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "⚠️  DRY RUN: 将复制 dist\* 到 $ServerPath" -ForegroundColor Yellow
} else {
    # 清理现有文件
    if (Test-Path $ServerPath) {
        Get-ChildItem $ServerPath | Remove-Item -Recurse -Force
        Write-Host "ℹ️  清理现有文件" -ForegroundColor Cyan
    }
    
    # 复制新文件
    Copy-Item -Path "dist\*" -Destination $ServerPath -Recurse -Force
    Write-Host "✅ 文件部署完成" -ForegroundColor Green
    
    # 验证部署
    $deployedFiles = Get-ChildItem -Recurse $ServerPath | Measure-Object
    Write-Host "ℹ️  部署了 $($deployedFiles.Count) 个文件" -ForegroundColor Cyan
}

# 创建 web.config（用于 IIS SPA 路由）
$webConfigPath = Join-Path $ServerPath "web.config"
if (-not $DryRun -and -not (Test-Path $webConfigPath)) {
    $webConfigContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
'@
    $webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8
    Write-Host "✅ 创建 web.config 文件" -ForegroundColor Green
}

Write-Host "======================================" -ForegroundColor Green
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

if (-not $DryRun) {
    Write-Host "ℹ️  访问地址: http://localhost/" -ForegroundColor Cyan
    Write-Host "ℹ️  文件路径: $ServerPath" -ForegroundColor Cyan
}