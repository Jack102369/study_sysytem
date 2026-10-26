# APPLICATION-3E-9：清晰部分正确虚构答案（公式为主、少中文，降低 GDI 乱码）
param([Parameter(Mandatory = $true)][string]$OutDir)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function New-SafeFont([float]$Size) {
  foreach ($name in @('Consolas', 'Courier New', 'Microsoft YaHei', 'SimSun')) {
    try { return New-Object System.Drawing.Font $name, $Size } catch { }
  }
  return New-Object System.Drawing.Font ([System.Drawing.FontFamily]::GenericMonospace), $Size
}

function Write-FormulaPng([string]$Path, [string]$Text, [int]$W = 1400, [int]$H = 1000, [float]$FontSize = 32) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $font = New-SafeFont $FontSize
  $brush = [System.Drawing.Brushes]::Black
  $y = 48.0
  foreach ($line in ($Text -split "`n")) {
    $g.DrawString($line, $font, $brush, 48, $y)
    $y += ($FontSize + 18)
  }
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $font.Dispose()
}

# 单图：建模+定义域正确，配方对称轴故意 x=50
$single = @"
[3E-9 fiction test / no PII]
y = x(2400 - 30x)
  = 2400x - 30x^2
domain: x in {30, 31, ..., 60}

WRONG complete-square:
y = -30(x - 50)^2 + 48000
so when x = 50, max income = 48000
"@

$p1 = @"
[3E-9 fiction / page 1]
y = x(2400 - 30x)
  = 2400x - 30x^2
domain: x in {30, 31, ..., 60}
"@

$p2 = @"
[3E-9 fiction / page 2]
WRONG:
y = -30(x - 50)^2 + 48000
when x = 50, max = 48000
"@

Write-FormulaPng (Join-Path $OutDir 'A_partial_single.png') $single 1400 1100 34
Write-FormulaPng (Join-Path $OutDir 'B_partial_p1.png') $p1 1400 900 34
Write-FormulaPng (Join-Path $OutDir 'B_partial_p2.png') $p2 1400 900 34

$manifest = @{
  itemHint = 'formal application itemId=151 fictional partial answer'
  samples = @(
    @{
      id = 'A'
      kind = 'PRINTED_SYNTHETIC'
      files = @('A_partial_single.png')
      notes = 'Single-page formula-heavy partial; wrong axis x=50'
    }
    @{
      id = 'B'
      kind = 'PRINTED_SYNTHETIC'
      files = @('B_partial_p1.png', 'B_partial_p2.png')
      notes = 'Dual-page printed partial; formula-heavy ASCII'
    }
  )
}
($manifest | ConvertTo-Json -Depth 6) | Out-File -FilePath (Join-Path $OutDir 'MANIFEST.json') -Encoding utf8NoBOM -ErrorAction SilentlyContinue
if (-not (Test-Path (Join-Path $OutDir 'MANIFEST.json'))) {
  [System.IO.File]::WriteAllText((Join-Path $OutDir 'MANIFEST.json'), ($manifest | ConvertTo-Json -Depth 6))
}
Write-Host "Wrote 3E-9 fixtures to $OutDir"
