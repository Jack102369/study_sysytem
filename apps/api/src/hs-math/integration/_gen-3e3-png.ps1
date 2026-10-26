# Generate fictional math answer PNGs for APPLICATION-3E-3 (no student privacy).
param(
  [Parameter(Mandatory = $true)][string]$OutDir
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Write-TextPng([string]$Path, [string]$Text, [int]$W = 900, [int]$H = 1400) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $font = New-Object System.Drawing.Font 'Microsoft YaHei', 15
  $brush = [System.Drawing.Brushes]::Black
  $rect = New-Object System.Drawing.RectangleF 24, 24, ($W - 48), ($H - 48)
  $g.DrawString($Text, $font, $brush, $rect)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $font.Dispose()
}

function Write-BlurPng([string]$Path, [int]$W = 640, [int]$H = 480) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $rnd = New-Object System.Random 42
  for ($y = 0; $y -lt $H; $y++) {
    for ($x = 0; $x -lt $W; $x++) {
      $v = $rnd.Next(90, 170)
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($v, $v, $v))
    }
  }
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$correct1 = @"
【3E-3 虚构测试·非真实学生作业】页1/2
设暑期票价为 x 元，x 为 30 到 60 的正整数。
每日接待人数为 2400-30x。
日票务收入：
y = x(2400-30x) = 2400x - 30x^2
定义域：x 属于 {30,31,...,60}
"@

$correct2 = @"
【3E-3 虚构测试·非真实学生作业】页2/2
配方：y = -30(x-40)^2 + 48000
开口向下，在定义域内于 x=40 取最大值。
当票价为 40 元时，最大日收入为 48000 元。
"@

$partial1 = @"
【3E-3 虚构·部分正确】页1
设票价 x 元（正整数 30~60）。
人数：2400-30x
收入：y=x(2400-30x)=2400x-30x^2
定义域：{30,31,...,60}
"@

$partial2 = @"
【3E-3 虚构·部分正确】页2（故意求错最大值）
我把对称轴错写成 x=30，配方 y=-30(x-30)^2+常数，
结论：票价 30 元时收入最大，最大收入 45000 元。
"@

$wrong1 = @"
【3E-3 虚构·明显错误】
我认为收入就是人数，所以 y=2400-30x。
定义域随便取 x>0。
当 x=0 时最大，收入 2400。
"@

$mixedImg = @"
【3E-3 虚构·文图混合·图片部分】
配方过程写在图上：
y=-30(x-40)^2+48000
最大值在 x=40，y=48000
"@

$qwenPartial = @"
【3E-3 虚构·千问部分正确】
建模：y=x(2400-30x)=2400x-30x^2  （正确）
定义域：{30..60} （正确）
求最值时误用 x=50，结论最大收入算错为 45000。
"@

Write-TextPng (Join-Path $OutDir 'B_correct_p1.png') $correct1
Write-TextPng (Join-Path $OutDir 'B_correct_p2.png') $correct2
Write-TextPng (Join-Path $OutDir 'C_partial_p1.png') $partial1
Write-TextPng (Join-Path $OutDir 'C_partial_p2.png') $partial2
Write-TextPng (Join-Path $OutDir 'D_wrong.png') $wrong1
Write-BlurPng (Join-Path $OutDir 'E_blur.png')
Write-TextPng (Join-Path $OutDir 'F_mixed_img.png') $mixedImg
Write-TextPng (Join-Path $OutDir 'H_partial.png') $qwenPartial
Write-TextPng (Join-Path $OutDir 'A_correct_p1.png') $correct1
Write-TextPng (Join-Path $OutDir 'A_correct_p2.png') $correct2
Write-Output "OK gen png -> $OutDir"
