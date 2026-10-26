# APPLICATION-3E-6：部分正确虚构答案 PNG（大字号、公式稀疏，便于下一轮 live）
param([Parameter(Mandatory = $true)][string]$OutDir)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function New-SafeFont([string]$Name, [float]$Size) {
  try { return New-Object System.Drawing.Font $Name, $Size } catch { }
  try { return New-Object System.Drawing.Font 'SimSun', $Size } catch { }
  return New-Object System.Drawing.Font ([System.Drawing.FontFamily]::GenericSansSerif), $Size
}

function Write-PrintedPng([string]$Path, [string]$Text, [int]$W = 1400, [int]$H = 1800, [float]$FontSize = 28) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $font = New-SafeFont 'Microsoft YaHei' $FontSize
  $brush = [System.Drawing.Brushes]::Black
  $rect = New-Object System.Drawing.RectangleF 48, 48, ($W - 96), ($H - 96)
  $g.DrawString($Text, $font, $brush, $rect)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $font.Dispose()
}

function Write-HandStylePng([string]$Path, [string]$Text, [int]$W = 1400, [int]$H = 1800) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 252, 250, 242))
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $font = $null
  foreach ($name in @('KaiTi', 'SimKai', 'SimSun', 'Microsoft YaHei')) {
    try { $font = New-Object System.Drawing.Font $name, 30; break } catch { }
  }
  if (-not $font) { $font = New-SafeFont 'Microsoft YaHei' 30 }
  $brush = [System.Drawing.Brushes]::Black
  $y = 56.0
  $rnd = New-Object System.Random 42
  foreach ($line in ($Text -split "`n")) {
    $x = 56 + $rnd.Next(-3, 4)
    $g.DrawString($line, $font, $brush, [float]$x, [float]$y)
    $y += 46
  }
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $font.Dispose()
}

$partialP1 = @"
【3E-6 虚构测试·非学生隐私】第1张（部分正确）
设票价为 x 元，x 是 30 至 60 的正整数。

人数：2400 - 30x

收入：
y = x(2400 - 30x)
  = 2400x - 30x^2

定义域：
x 属于 {30, 31, ..., 60}
"@

$partialP2 = @"
【3E-6 虚构测试·非学生隐私】第2张（故意写错对称轴）
配方（错误步骤，应保留为 x=50）：

y = -30(x - 50)^2 + 48000

结论：当 x = 50 时，
最大日收入为 48000 元。
"@

$partialAll = @"
【3E-6 虚构测试·非学生隐私】单页部分正确
y = x(2400 - 30x) = 2400x - 30x^2
定义域：x 属于 {30, 31, ..., 60}

配方（错误）：
y = -30(x - 50)^2 + 48000
所以当 x = 50 时最大收入 48000 元。
"@

Write-PrintedPng (Join-Path $OutDir 'A_printed_partial_p1.png') $partialP1
Write-PrintedPng (Join-Path $OutDir 'A_printed_partial_p2.png') $partialP2
Write-HandStylePng (Join-Path $OutDir 'B_handstyle_partial.png') $partialAll
Write-PrintedPng (Join-Path $OutDir 'C_printed_partial_p1.png') $partialP1
Write-PrintedPng (Join-Path $OutDir 'C_printed_partial_p2.png') $partialP2

$manifest = @{
  itemHint = 'formal application itemId=151 (fictional answer only)'
  samples = @(
    @{
      id = 'A'
      kind = 'PRINTED_SYNTHETIC'
      files = @('A_printed_partial_p1.png', 'A_printed_partial_p2.png')
      notes = 'Clear printed partial credit; wrong axis x=50 on page 2'
    }
    @{
      id = 'B'
      kind = 'HANDWRITING_STYLE_SYNTHETIC'
      files = @('B_handstyle_partial.png')
      notes = 'Synthetic handwriting-style font; NOT a real handwriting photo'
    }
    @{
      id = 'C'
      kind = 'PRINTED_SYNTHETIC'
      files = @('C_printed_partial_p1.png', 'C_printed_partial_p2.png')
      notes = 'Dual-image printed twin of A for next-round live'
    }
  )
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $OutDir 'MANIFEST.json') -Encoding UTF8
Write-Host "Wrote 3E-6 fixtures to $OutDir"
