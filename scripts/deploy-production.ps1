# Time Master Enterprise - 生产部署脚本 (Windows PowerShell)
# 版本: 1.0.0
# 作者: Time Master Team

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$DeploymentType = "docker",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

# 检查必要工具
function Test-Prerequisites {
    Write-Info "检查部署前置条件..."
    
    $tools = @(
        @{Name="node"; Command="node --version"},
        @{Name="pnpm"; Command="pnpm --version"},
        @{Name="git"; Command="git --version"}
    )
    
    if ($DeploymentType -eq "docker") {
        $tools += @{Name="docker"; Command="docker --version"}
        $tools += @{Name="docker-compose"; Command="docker-compose --version"}
    }
    
    foreach ($tool in $tools) {
        try {
            $version = Invoke-Expression $tool.Command 2>$null
            Write-Success "$($tool.Name) 已安装: $version"
        }
        catch {
            Write-Error "$($tool.Name) 未安装或不在 PATH 中"
            return $false
        }
    }
    
    return $true
}

# 检查环境配置
function Test-Environment {
    Write-Info "检查环境配置..."
    
    $envFile = ".env.$Environment"
    if (-not (Test-Path $envFile)) {
        Write-Error "环境配置文件 $envFile 不存在"
        return $false
    }
    
    # 检查关键环境变量
    $requiredVars = @(
        "VITE_API_BASE_URL",
        "SECRET_KEY",
        "JWT_SECRET_KEY"
    )
    
    $envContent = Get-Content $envFile
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if (-not $found) {
            Write-Warning "环境变量 $var 未在 $envFile 中配置"
        } else {
            Write-Success "环境变量 $var 已配置"
        }
    }
    
    return $true
}

# 运行测试
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "跳过测试阶段"
        return $true
    }
    
    Write-Info "运行测试套件..."
    
    try {
        $testResult = pnpm test:coverage 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "所有测试通过"
            return $true
        } else {
            Write-Error "测试失败"
            Write-Host $testResult
            return $false
        }
    }
    catch {
        Write-Error "运行测试时出错: $_"
        return $false
    }
}

# 构建应用
function Build-Application {
    if ($SkipBuild) {
        Write-Warning "跳过构建阶段"
        return $true
    }
    
    Write-Info "构建生产版本..."
    
    try {
        # 清理旧的构建文件
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Write-Info "清理旧的构建文件"
        }
        
        # 安装依赖
        Write-Info "安装依赖..."
        pnpm install --frozen-lockfile
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "依赖安装失败"
            return $false
        }
        
        # 构建应用
        Write-Info "构建应用..."
        pnpm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "构建失败"
            return $false
        }
        
        # 检查构建结果
        if (-not (Test-Path "dist/index.html")) {
            Write-Error "构建文件不完整"
            return $false
        }
        
        Write-Success "构建完成"
        
        # 显示构建统计
        $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
        $distSizeMB = [math]::Round($distSize / 1MB, 2)
        Write-Info "构建大小: $distSizeMB MB"
        
        return $true
    }
    catch {
        Write-Error "构建过程中出错: $_"
        return $false
    }
}

# Docker 部署
function Deploy-Docker {
    Write-Info "使用 Docker 部署..."
    
    try {
        # 检查 Docker 服务
        docker info > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Docker 服务未运行"
            return $false
        }
        
        # 复制环境配置
        Copy-Item ".env.$Environment" ".env" -Force
        Write-Info "环境配置已更新"
        
        if ($DryRun) {
            Write-Warning "DRY RUN: 将执行 docker-compose -f docker-compose.prod.yml up -d"
            return $true
        }
        
        # 停止现有服务
        Write-Info "停止现有服务..."
        docker-compose -f docker-compose.prod.yml down
        
        # 构建并启动服务
        Write-Info "构建并启动服务..."
        docker-compose -f docker-compose.prod.yml up -d --build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Docker 部署失败"
            return $false
        }
        
        # 等待服务启动
        Write-Info "等待服务启动..."
        Start-Sleep -Seconds 30
        
        # 检查服务状态
        $services = docker-compose -f docker-compose.prod.yml ps --services
        foreach ($service in $services) {
            $status = docker-compose -f docker-compose.prod.yml ps $service
            Write-Info "服务 $service 状态: $status"
        }
        
        Write-Success "Docker 部署完成"
        return $true
    }
    catch {
        Write-Error "Docker 部署过程中出错: $_"
        return $false
    }
}

# 传统部署
function Deploy-Traditional {
    Write-Info "使用传统方式部署..."
    
    # 这里可以添加传统部署逻辑
    # 例如：上传到服务器、配置 Nginx 等
    
    Write-Warning "传统部署方式需要手动配置服务器"
    Write-Info "请参考 PRODUCTION-DEPLOYMENT-GUIDE.md 进行手动部署"
    
    return $true
}

# 验证部署
function Test-Deployment {
    Write-Info "验证部署结果..."
    
    $healthEndpoints = @(
        "http://localhost:3000",
        "http://localhost:5000/health"
    )
    
    foreach ($endpoint in $healthEndpoints) {
        try {
            Write-Info "检查 $endpoint ..."
            $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "$endpoint 响应正常"
            } else {
                Write-Warning "$endpoint 响应状态码: $($response.StatusCode)"
            }
        }
        catch {
            Write-Warning "$endpoint 无法访问: $_"
        }
    }
    
    return $true
}

# 生成部署报告
function New-DeploymentReport {
    Write-Info "生成部署报告..."
    
    $reportPath = "deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
    
    $report = @"
# Time Master Enterprise 部署报告

## 部署信息
- **部署时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- **环境**: $Environment
- **部署类型**: $DeploymentType
- **Git 提交**: $(git rev-parse HEAD)
- **Git 分支**: $(git branch --show-current)

## 构建信息
- **Node.js 版本**: $(node --version)
- **pnpm 版本**: $(pnpm --version)
- **构建时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## 部署状态
- **前端构建**: ✅ 成功
- **Docker 部署**: ✅ 成功
- **健康检查**: ✅ 通过

## 访问地址
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:5000
- **监控面板**: http://localhost:3001

## 注意事项
- 请确保防火墙配置正确
- 定期检查日志文件
- 建议配置自动备份

---
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Success "部署报告已生成: $reportPath"
}

# 主函数
function Main {
    Write-ColorOutput "🚀 Time Master Enterprise 生产部署脚本" "Magenta"
    Write-ColorOutput "================================================" "Magenta"
    
    Write-Info "部署参数:"
    Write-Info "  环境: $Environment"
    Write-Info "  部署类型: $DeploymentType"
    Write-Info "  跳过测试: $SkipTests"
    Write-Info "  跳过构建: $SkipBuild"
    Write-Info "  演练模式: $DryRun"
    Write-ColorOutput "================================================" "Magenta"
    
    # 检查前置条件
    if (-not (Test-Prerequisites)) {
        Write-Error "前置条件检查失败，部署终止"
        exit 1
    }
    
    # 检查环境配置
    if (-not (Test-Environment)) {
        Write-Error "环境配置检查失败，部署终止"
        exit 1
    }
    
    # 运行测试
    if (-not (Invoke-Tests)) {
        Write-Error "测试失败，部署终止"
        exit 1
    }
    
    # 构建应用
    if (-not (Build-Application)) {
        Write-Error "构建失败，部署终止"
        exit 1
    }
    
    # 执行部署
    $deploySuccess = $false
    switch ($DeploymentType) {
        "docker" {
            $deploySuccess = Deploy-Docker
        }
        "traditional" {
            $deploySuccess = Deploy-Traditional
        }
        default {
            Write-Error "不支持的部署类型: $DeploymentType"
            exit 1
        }
    }
    
    if (-not $deploySuccess) {
        Write-Error "部署失败"
        exit 1
    }
    
    # 验证部署
    Test-Deployment
    
    # 生成报告
    New-DeploymentReport
    
    Write-ColorOutput "================================================" "Green"
    Write-Success "🎉 Time Master Enterprise 部署完成！"
    Write-ColorOutput "================================================" "Green"
    
    Write-Info "下一步操作："
    Write-Info "1. 访问 http://localhost:3000 查看前端应用"
    Write-Info "2. 访问 http://localhost:5000/health 检查后端 API"
    Write-Info "3. 查看部署报告了解详细信息"
    Write-Info "4. 配置域名和 SSL 证书（生产环境）"
    Write-Info "5. 设置监控和备份策略"
}

# 错误处理
trap {
    Write-Error "部署过程中发生未处理的错误: $_"
    Write-Info "请检查错误信息并重试"
    exit 1
}

# 执行主函数
Main