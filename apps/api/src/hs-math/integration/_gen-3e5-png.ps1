# APPLICATION-3E-5：清晰印刷体虚构答案 PNG（大字号，便于转写）
param([Parameter(Mandatory = $true)][string]$OutDir)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Write-TextPng([string]$Path, [string]$Text, [int]$W = 1200, [int]$H = 1600, [float]$FontSize = 22) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $font = New-Object System.Drawing.Font 'Microsoft YaHei', $FontSize
  $brush = [System.Drawing.Brushes]::Black
  $rect = New-Object System.Drawing.RectangleF 40, 40, ($W - 80), ($H - 80)
  $g.DrawString($Text, $font, $brush, $rect)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $font.Dispose()
}

function Write-BlurPng([string]$Path, [string]$HiddenText) {
  # 先画清晰再强模糊：缩小再放大 + 噪声
  $tmp = Join-Path $env:TEMP ('3e5blur_' + [guid]::NewGuid().ToString() + '.png')
  Write-TextPng $tmp $HiddenText 800 600 18
  $src = [System.Drawing.Image]::FromFile($tmp)
  $small = New-Object System.Drawing.Bitmap 40, 30
  $gs = [System.Drawing.Graphics]::FromImage($small)
  $gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Low
  $gs.DrawImage($src, 0, 0, 40, 30)
  $gs.Dispose(); $src.Dispose()
  $out = New-Object System.Drawing.Bitmap 640, 480
  $go = [System.Drawing.Graphics]::FromImage($out)
  $go.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $go.DrawImage($small, 0, 0, 640, 480)
  $rnd = New-Object System.Random 7
  for ($i = 0; $i -lt 80000; $i++) {
    $x = $rnd.Next(0, 640); $y = $rnd.Next(0, 480)
    $v = $rnd.Next(0, 255)
    $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($v, $v, $v))
  }
  $out.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $go.Dispose(); $out.Dispose(); $small.Dispose()
  Remove-Item -Force $tmp -ErrorAction SilentlyContinue
}

$a1 = @"
【3E-5 虚构测试·非学生隐私】第1张
设暑期票价为 x 元，x 是 30 至 60 的正整数。
日接待人数为 2400-30x。
日票务收入：
y = x(2400-30x)
  = 2400x - 30x^2
定义域：x 属于集合 {30, 31, ..., 60}
"@

$a2 = @"
【3E-5 虚构测试·非学生隐私】第2张
配方：
y = -30(x-40)^2 + 48000
因为开口向下，在定义域内当 x=40 时取得最大值。
最大日收入为 48000 元。
"@

$b1 = @"
【3E-5 虚构·部分正确】第1张
设票价 x 元（正整数，30 到 60）。
人数：2400-30x
收入：y=x(2400-30x)=2400x-30x^2
定义域：{30,31,...,60}
"@

$b2 = @"
【3E-5 虚构·部分正确】第2张（故意写错对称轴）
我配方写成：
y=-30(x-50)^2+48000
结论：当 x=50 时最大收入为 48000 元。
"@

Write-TextPng (Join-Path $OutDir 'A_p1_correct.png') $a1
Write-TextPng (Join-Path $OutDir 'A_p2_correct.png') $a2
Write-TextPng (Join-Path $OutDir 'B_p1_partial.png') $b1
Write-TextPng (Join-Path $OutDir 'B_p2_partial.png') $b2
Write-BlurPng (Join-Path $OutDir 'C_blur.png') $a1
Write-Output "OK $OutDir"
