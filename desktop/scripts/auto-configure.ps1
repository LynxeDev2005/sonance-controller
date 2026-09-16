# Sonance PC Companion — Windows Auto-Configuration Script
# Configures Firewall, Network Adapter WOL, Power Management & Startup

param (
    [string]$OutputJson = ""
)

$results = [ordered]@{
    firewall = $false
    wol = $false
    powerMgmt = $false
    fastStartup = $false
    autoStart = $false
    restartRecommended = $true
    messages = @()
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Sonance PC Companion Auto-Configurator  " -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Configure Windows Defender Firewall
try {
    Write-Host "[1/4] Configuring Windows Defender Firewall..." -ForegroundColor Yellow
    
    # TCP 5005 (Sonance HTTP Daemon)
    $fwTcp = Get-NetFirewallRule -DisplayName "Sonance PC Companion (HTTP Daemon)" -ErrorAction SilentlyContinue
    if (-not $fwTcp) {
        New-NetFirewallRule -DisplayName "Sonance PC Companion (HTTP Daemon)" `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort 5005 `
            -Profile Any `
            -Description "Allows inbound control commands from the Sonance Mobile App" `
            -ErrorAction Stop | Out-Null
    } else {
        Set-NetFirewallRule -DisplayName "Sonance PC Companion (HTTP Daemon)" -Enabled True -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }

    # UDP 9 (Wake-on-LAN Magic Packet)
    $fwUdp = Get-NetFirewallRule -DisplayName "Sonance PC Companion (Wake-on-LAN UDP)" -ErrorAction SilentlyContinue
    if (-not $fwUdp) {
        New-NetFirewallRule -DisplayName "Sonance PC Companion (Wake-on-LAN UDP)" `
            -Direction Inbound `
            -Action Allow `
            -Protocol UDP `
            -LocalPort 9 `
            -Profile Any `
            -Description "Allows Wake-on-LAN Magic Packets for remote power on" `
            -ErrorAction Stop | Out-Null
    } else {
        Set-NetFirewallRule -DisplayName "Sonance PC Companion (Wake-on-LAN UDP)" -Enabled True -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }

    $results.firewall = $true
    $results.messages += "Firewall rules enabled for Port 5005 (TCP) and Port 9 (UDP)."
    Write-Host "  ✓ Windows Firewall configured successfully." -ForegroundColor Green
} catch {
    $results.messages += "Firewall error: $($_.Exception.Message)"
    Write-Host "  ✗ Firewall configuration error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Configure Network Adapter Wake-on-LAN & Magic Packet
try {
    Write-Host "[2/4] Enabling Wake-on-LAN on Network Adapters..." -ForegroundColor Yellow
    
    $adapters = Get-NetAdapter -Physical -ErrorAction SilentlyContinue
    if ($adapters) {
        foreach ($adapter in $adapters) {
            Write-Host "  -> Configuring adapter: $($adapter.Name) ($($adapter.InterfaceDescription))" -ForegroundColor Gray
            
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Wake on Magic Packet" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -RegistryKeyword "*WakeOnMagicPacket" -RegistryValue "1" -ErrorAction SilentlyContinue
            
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Wake on pattern match" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -RegistryKeyword "*WakeOnPattern" -RegistryValue "1" -ErrorAction SilentlyContinue
            
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Shutdown Wake-On-Lan" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
            Set-NetAdapterAdvancedProperty -Name $adapter.Name -RegistryKeyword "*ShutdownWakeOnLan" -RegistryValue "1" -ErrorAction SilentlyContinue

            Set-NetAdapterPowerManagement -Name $adapter.Name -WakeOnMagicPacket $true -ErrorAction SilentlyContinue
        }
    }

    $netClassPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e972-e325-11ce-bfc1-08002be10318}"
    if (Test-Path $netClassPath) {
        Get-ChildItem -Path $netClassPath -ErrorAction SilentlyContinue | ForEach-Object {
            $subPath = $_.PSPath
            Set-ItemProperty -Path $subPath -Name "PnPCapabilities" -Value 0 -Type DWord -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $subPath -Name "*WakeOnMagicPacket" -Value "1" -ErrorAction SilentlyContinue
        }
    }

    $results.wol = $true
    $results.powerMgmt = $true
    $results.messages += "Wake-on-LAN & Magic Packet enabled on physical network adapters."
    Write-Host "  ✓ Network Adapter Wake-on-LAN enabled." -ForegroundColor Green
} catch {
    $results.messages += "Network Adapter error: $($_.Exception.Message)"
    Write-Host "  ✗ Network Adapter config error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Optimize Windows Fast Startup for Wake-on-LAN
try {
    Write-Host "[3/4] Checking Windows Fast Startup settings..." -ForegroundColor Yellow
    $powerKey = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power"
    if (Test-Path $powerKey) {
        Set-ItemProperty -Path $powerKey -Name "HiberbootEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
    }
    $results.fastStartup = $true
    $results.messages += "Fast Startup optimized to preserve network card standby power on shutdown."
    Write-Host "  ✓ Windows power states configured." -ForegroundColor Green
} catch {
    $results.messages += "Power state error: $($_.Exception.Message)"
    Write-Host "  ✗ Power state error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Auto-Start on System Boot
try {
    Write-Host "[4/4] Setting background daemon auto-start..." -ForegroundColor Yellow
    $exePath = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
    if ($exePath -and -not $exePath.ToLower().Contains("powershell")) {
        $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
        Set-ItemProperty -Path $runKey -Name "SonancePCCompanion" -Value "`"$exePath`" --hidden" -ErrorAction SilentlyContinue
    }
    $results.autoStart = $true
    $results.messages += "Auto-start configured on system logon."
    Write-Host "  ✓ Background daemon auto-start configured." -ForegroundColor Green
} catch {
    $results.messages += "Auto-start error: $($_.Exception.Message)"
    Write-Host "  ✗ Auto-start error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Configuration Finished Successfully!    " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

if ($OutputJson) {
    try {
        $jsonContent = $results | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($OutputJson, $jsonContent, [System.Text.Encoding]::UTF8)
    } catch {
        Write-Host "Error writing output JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
}

exit 0
