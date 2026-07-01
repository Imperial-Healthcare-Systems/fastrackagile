# ============================================================
#  Fastrack Agile — Success Stories manifest generator
# ------------------------------------------------------------
#  1. Copy your testimonial screenshot images into THIS folder
#     (public/stories/). Any filenames are fine (.jpg .jpeg .png .webp).
#  2. Right-click this file  ->  "Run with PowerShell"
#     (or in a terminal here:  powershell -ExecutionPolicy Bypass -File .\normalize-stories.ps1)
#  3. Refresh the Success Stories page. Done.
#
#  This does NOT rename or modify your images. It just writes a
#  manifest.json listing them (sorted by filename) that the page reads.
# ============================================================

$dir = $PSScriptRoot
$exts = '.jpg', '.jpeg', '.png', '.webp'

$imgs = Get-ChildItem -LiteralPath $dir -File |
        Where-Object { $exts -contains $_.Extension.ToLower() } |
        Sort-Object { if ($_.BaseName -match '^\d+') { '{0:D8}' -f [int]$Matches[0] } else { $_.BaseName } }

if ($imgs.Count -eq 0) {
  Write-Host "No image files found in this folder. Copy your screenshots here first, then re-run." -ForegroundColor Yellow
  return
}

# Build the JSON array by hand (avoids PowerShell 5.1 single-item ConvertTo-Json quirks)
$items = foreach ($f in $imgs) {
  $name = $f.Name -replace '\\', '\\' -replace '"', '\"'
  '"' + $name + '"'
}
$json = '[' + ($items -join ',') + ']'

$out = Join-Path $dir 'manifest.json'
Set-Content -LiteralPath $out -Value $json -Encoding utf8

Write-Host ("manifest.json written with " + $imgs.Count + " image(s):") -ForegroundColor Green
$i = 0
foreach ($f in $imgs) { $i++; Write-Host ("  {0,2}. {1}" -f $i, $f.Name) }
Write-Host "`nRefresh the Success Stories page (Ctrl+F5) to see them." -ForegroundColor Cyan
