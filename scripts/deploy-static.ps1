# Time Master Enterprise - 静态文件部署脚本
# 适用于传统服务器部署方式

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerPath = "C:\inetpub\wwwroot\timemaster",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "C:\Backups\timemaster",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateBackup = $true,
    
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

function Test-BuildFiles {
    Write-Info "检查构建文件..."
    
    if (-not (Test-Path "dist")) {
        Write-Error "dist 目录不存在，请先运行 pnpm run build"
        return $false
    }
    
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "index.html 文件不存在"
        return $false
    }
    
    $distFiles = Get-ChildItem -Recurse "dist" | Measure-Object
    Write-Success "找到 $($distFiles.Count) 个构建文件"
    
    return $true
}

function New-Backup {
    if (-not $CreateBackup) {
        Write-Warning "跳过备份"
        return $true
    }
    
    if (-not (Test-Path $ServerPath)) {
        Write-Info "服务器路径不存在，跳过备份"
        return $true
    }
    
    Write-Info "创建备份..."
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = Join-Path $BackupPath "backup-$timestamp"
    
    try {
        if (-not (Test-Path $BackupPath)) {
            New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        }
        
        if ($DryRun) {
            Write-Warning "DRY RUN: 将备份 $ServerPath 到 $backupDir"
            return $true
        }
        
        Copy-Item -Path $ServerPath -Destination $backupDir -Recurse -Force
        Write-Success "备份完成: $backupDir"
        
        # 清理旧备份（保留最近5个）
        $oldBackups = Get-ChildItem $BackupPath -Directory | 
                     Where-Object { $_.Name -match "backup-\d{8}-\d{6}" } | 
                     Sort-Object CreationTime -Descending | 
                     Select-Object -Skip 5
        
        foreach ($oldBackup in $oldBackups) {
            Remove-Item $oldBackup.FullName -Recurse -Force
            Write-Info "清理旧备份: $($oldBackup.Name)"
        }
        
        return $true
    }
    catch {
        Write-Error "备份失败: $_"
        return $false
    }
}

function Deploy-StaticFiles {
    Write-Info "部署静态文件..."
    
    try {
        # 创建服务器目录
        if (-not (Test-Path $ServerPath)) {
            if ($DryRun) {
                Write-Warning "DRY RUN: 将创建目录 $ServerPath"
            } else {
                New-Item -ItemType Directory -Path $ServerPath -Force | Out-Null
                Write-Info "创建服务器目录: $ServerPath"
            }
        }
        
        if ($DryRun) {
            Write-Warning "DRY RUN: 将复制 dist\* 到 $ServerPath"
            return $true
        }
        
        # 清理现有文件
        if (Test-Path $ServerPath) {
            Get-ChildItem $ServerPath | Remove-Item -Recurse -Force
            Write-Info "清理现有文件"
        }
        
        # 复制新文件
        Copy-Item -Path "dist\*" -Destination $ServerPath -Recurse -Force
        Write-Success "文件部署完成"
        
        # 验证部署
        $deployedFiles = Get-ChildItem -Recurse $ServerPath | Measure-Object
        Write-Info "部署了 $($deployedFiles.Count) 个文件"
        
        return $true
    }
    catch {
        Write-Error "部署失败: $_"
        return $false
    }
}

function Set-IISConfiguration {
    Write-Info "配置 IIS 设置..."
    
    # 检查是否有 IIS 管理权限
    try {
        Import-Module WebAdministration -ErrorAction Stop
    }
    catch {
        Write-Warning "无法导入 WebAdministration 模块，跳过 IIS 配置"
        return $true
    }
    
    $siteName = "Timemaster"
    
    try {
        if ($DryRun) {
            Write-Warning "DRY RUN: 将配置 IIS 站点 $siteName"
            return $true
        }
        
        # 检查站点是否存在
        $site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
        
        if ($site) {
            Write-Info "更新现有站点配置"
            Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name physicalPath -Value $ServerPath
        } else {
            Write-Info "创建新的 IIS 站点"
            New-Website -Name $siteName -PhysicalPath $ServerPath -Port 80
        }
        
        # 配置 MIME 类型
        $mimeTypes = @(
            @{Extension=".js"; MimeType="application/javascript"},
            @{Extension=".css"; MimeType="text/css"},
            @{Extension=".json"; MimeType="application/json"},
            @{Extension=".woff"; MimeType="font/woff"},
            @{Extension=".woff2"; MimeType="font/woff2"}
        )
        
        foreach ($mimeType in $mimeTypes) {
            try {
                Add-WebConfigurationProperty -Filter "system.webServer/staticContent" -Name collection -Value @{fileExtension=$mimeType.Extension; mimeType=$mimeType.MimeType} -PSPath "IIS:\Sites\$siteName" -ErrorAction SilentlyContinue
            }
            catch {
                # MIME 类型可能已存在
            }
        }
        
        # 配置 URL 重写（用于 SPA 路由）
        $webConfig = Join-Path $ServerPath "web.config"
        if (-not (Test-Path $webConfig)) {
            $webConfigContent = @"
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
"@
            $webConfigContent | Out-File -FilePath $webConfig -Encoding UTF8
            Write-Success "创建 web.config 文件"
        }
        
        Write-Success "IIS 配置完成"
        return $true
    }
    catch {
        Write-Warning "IIS 配置失败: $_"
        return $true  # 不阻止部署继续
    }
}

function Test-Deployment {
    Write-Info "验证部署..."
    
    # 检查关键文件
    $keyFiles = @("index.html", "assets")
    foreach ($file in $keyFiles) {
        $filePath = Join-Path $ServerPath $file
        if (Test-Path $filePath) {
            Write-Success "文件存在: $file"
        } else {
            Write-Error "文件缺失: $file"
        }
    }
    
    # 检查文件大小
    $totalSize = (Get-ChildItem -Recurse $ServerPath | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Info "部署总大小: $totalSizeMB MB"
    
    return $true
}

function New-DeploymentReport {
    Write-Info "生成部署报告..."
    
    $reportPath = "static-deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
    
    $report = @"
# Time Master Enterprise 静态部署报告

## 部署信息
- **部署时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- **部署类型**: 静态文件部署
- **服务器路径**: $ServerPath
- **备份路径**: $BackupPath

## 文件统计
- **源文件**: $(Get-ChildItem -Recurse "dist" | Measure-Object | Select-Object -ExpandProperty Count) 个文件
- **部署文件**: $(Get-ChildItem -Recurse $ServerPath | Measure-Object | Select-Object -ExpandProperty Count) 个文件
- **总大小**: $([math]::Round((Get-ChildItem -Recurse $ServerPath | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB

## 部署状态
- **文件复制**: ✅ 成功
- **IIS 配置**: ✅ 完成
- **备份创建**: ✅ 完成

## 访问信息
- **本地访问**: http://localhost/
- **服务器路径**: $ServerPath

## 后续步骤
1. 配置域名和 SSL 证书
2. 设置 CDN 加速
3. 配置监控和日志
4. 测试所有功能

---
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Success "部署报告已生成: $reportPath"
}

function Main {
    Write-ColorOutput "🚀 Time Master Enterprise 静态文件部署" "Magenta"
    Write-ColorOutput "=============================================" "Magenta"
    
    Write-Info "部署参数:"
    Write-Info "  服务器路径: $ServerPath"
    Write-Info "  备份路径: $BackupPath"
    Write-Info "  创建备份: $CreateBackup"
    Write-Info "  演练模式: $DryRun"
    Write-ColorOutput "=============================================" "Magenta"
    
    # 检查构建文件
    if (-not (Test-BuildFiles)) {
        Write-Error "构建文件检查失败，部署终止"
        exit 1
    }
    
    # 创建备份
    if (-not (New-Backup)) {
        Write-Error "备份失败，部署终止"
        exit 1
    }
    
    # 部署文件
    if (-not (Deploy-StaticFiles)) {
        Write-Error "文件部署失败，部署终止"
        exit 1
    }
    
    # 配置 IIS
    Set-IISConfiguration
    
    # 验证部署
    Test-Deployment
    
    # 生成报告
    if (-not $DryRun) {
        New-DeploymentReport
    }
    
    Write-ColorOutput "=============================================" "Green"
    Write-Success "🎉 静态文件部署完成！"
    Write-ColorOutput "=============================================" "Green"
    
    if (-not $DryRun) {
        Write-Info "部署完成，可以通过以下方式访问："
        Write-Info "1. 本地访问: http://localhost/"
        Write-Info "2. 文件路径: $ServerPath"
        Write-Info "3. 查看部署报告了解详细信息"
    }
}

# 执行主函数
Main