Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("d:\InFraud.org\logo.jpg")
$bmp = New-Object System.Drawing.Bitmap($img)
$c = $bmp.GetPixel($bmp.Width/2, $bmp.Height/2)
Write-Host "Center: R=$($c.R) G=$($c.G) B=$($c.B)"
$thumb = $bmp.GetThumbnailImage(1, 1, $null, [intptr]::Zero)
$thumbBmp = New-Object System.Drawing.Bitmap($thumb)
$avg = $thumbBmp.GetPixel(0,0)
Write-Host "Average: R=$($avg.R) G=$($avg.G) B=$($avg.B)"
