# Time Master Enterprise - 简化部署脚本

param(
    [Parameter(Mandatory=$false)]
    [string]$TargetPath = ".\deploy",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param([string]$Message); Write-ColorOutput "✅ $Message" "Green" }
function Write-Error { param([string]$Message); Write-ColorOutput "❌ $Message" "Red" }
function Write-Warning { param([string]$Message); Write-ColorOutput "⚠️  $Message" "Yellow" }
function Write-Info { param([string]$Message); Write-ColorOutput "ℹ️  $Message" "Cyan" }

Write-ColorOutput "🚀 Time Master Enterprise 部署" "Magenta"
Write-ColorOutput "================================" "Magenta"

# 检查构建文件
Write-Info "检查构建文件..."
if (-not (Test-Path "dist")) {
    Write-Error "dist 目录不存在，请先运行 pnpm build"
    exit 1
}

if (-not (Test-Path "dist\index.html")) {
    Write-Error "index.html 文件不存在"
    exit 1
}

$distFiles = Get-ChildItem -Recurse "dist" | Measure-Object
Write-Success "找到 $($distFiles.Count) 个构建文件"

# 创建部署目录
Write-Info "准备部署目录..."
if ($DryRun) {
    Write-Warning "DRY RUN: 将创建部署目录 $TargetPath"
} else {
    if (Test-Path $TargetPath) {
        Remove-Item $TargetPath -Recurse -Force
        Write-Info "清理现有部署目录"
    }
    
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    Write-Success "创建部署目录: $TargetPath"
}

# 复制文件
Write-Info "复制构建文件..."
if ($DryRun) {
    Write-Warning "DRY RUN: 将复制 dist\* 到 $TargetPath"
} else {
    Copy-Item -Path "dist\*" -Destination $TargetPath -Recurse -Force
    Write-Success "文件复制完成"
}

# 创建 web.config（用于 IIS）
$webConfigPath = Join-Path $TargetPath "web.config"
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
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".woff" mimeType="font/woff" />
            <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
        </staticContent>
        <httpCompression>
            <dynamicTypes>
                <add mimeType="application/javascript" enabled="true" />
                <add mimeType="text/css" enabled="true" />
            </dynamicTypes>
        </httpCompression>
    </system.webServer>
</configuration>
'@
    $webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8
    Write-Success "创建 web.config 文件"
}

# 验证部署
Write-Info "验证部署..."
if (-not $DryRun) {
    $deployedFiles = Get-ChildItem -Recurse $TargetPath | Measure-Object
    $totalSize = (Get-ChildItem -Recurse $TargetPath | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Success "部署完成！"
    Write-Info "部署统计:"
    Write-Info "  文件数量: $($deployedFiles.Count)"
    Write-Info "  总大小: $totalSizeMB MB"
    Write-Info "  部署路径: $TargetPath"
}

# 生成部署报告
$reportPath = "deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
if (-not $DryRun) {
    $report = @"
# Time Master Enterprise 部署报告

## 部署信息
- **部署时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- **部署路径**: $TargetPath
- **构建版本**: 2.0.0

## 文件统计
- **文件数量**: $($deployedFiles.Count)
- **总大小**: $totalSizeMB MB

## 部署文件
$(Get-ChildItem -Recurse $TargetPath | ForEach-Object { "- $($_.FullName.Replace($TargetPath, ''))" } | Out-String)

## 访问说明
1. 将 $TargetPath 目录内容复制到 Web 服务器
2. 配置服务器支持 SPA 路由
3. 确保 HTTPS 和安全头配置

---
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Success "部署报告已生成: $reportPath"
}

Write-ColorOutput "================================" "Green"
Write-Success "🎉 部署完成！"
Write-ColorOutput "================================" "Green"

if (-not $DryRun) {
    Write-Info "后续步骤:"
    Write-Info "1. 将 $TargetPath 目录上传到服务器"
    Write-Info "2. 配置 Web 服务器（Apache/Nginx/IIS）"
    Write-Info "3. 设置域名和 SSL 证书"
    Write-Info "4. 测试应用功能"
}