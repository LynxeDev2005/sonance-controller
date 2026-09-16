# 📱 SONANCE — YOUR PC COMPANION (iOS Wake-on-LAN + Voice Control + Sideloadly)

An elegant, modern iOS remote management system for your Windows PC powered by **React Native Expo** and a custom **Swift Native Module** with **Wake-on-LAN (WOL)**, **Siri Shortcuts**, **In-App Voice Control**, and a lightweight **Windows Companion Daemon** for Shutdown, Restart, Sleep, and Lock.

---

## ⚡ Features

- 🟢 **Wake-on-LAN (WOL)**: Native Swift BSD socket implementation broadcasting 102-byte Magic Packets over UDP port 9 directly to your PC's NIC.
- 🎙️ **Voice Control**:
  - **Siri Shortcuts & App Intents**: Trigger *"Hey Siri, Turn on my PC"* or *"Hey Siri, Shutdown PC"* hands-free from iPhone or Apple Watch.
  - **In-App Speech Assistant**: Tap the mic button to speak commands with live audio visualizer and intent parsing.
- 🔄 **Windows Remote Power Actions**:
  - **Turn On (Wake-on-LAN)**
  - **Restart PC** (`shutdown /r /t 5`)
  - **Shutdown PC** (`shutdown /s /t 5`)
  - **Sleep PC** (`rundll32.exe powrprof.dll,SetSuspendState`)
  - **Lock Workstation** (`rundll32.exe user32.dll,LockWorkStation`)
- 🔒 **Secure PIN Authentication**: Protected with customizable secret PIN token.
- 📦 **No Paid Apple Developer Account Needed**: Built for sideloading via **Sideloadly** or **iLoader** using GitHub Actions unsigned IPA build workflow.

---

## 🚀 Quick Setup Guide

### Step 1: Start the Windows Companion Agent
1. Open the `server/` folder on your PC.
2. Double-click **`install-startup.bat`** (or `start-agent.bat`).
3. The console will display your PC's **Local IP Address** (e.g. `192.168.100.3`) and **MAC Address** (e.g. `9C:6B:00:E2:9C:24`).

### Step 2: Sideload the iOS App to your iPhone
1. Push your repository to GitHub (`main` or `master` branch).
2. The GitHub Actions workflow (`.github/workflows/build-ipa.yml`) will automatically compile the unsigned release IPA: **`PCControl-unsigned.ipa`**.
3. Download the `.ipa` from GitHub Actions **Artifacts**.
4. Open **Sideloadly** (or **iLoader** / **AltStore**) on your PC:
   - Connect your iPhone via USB or Wi-Fi.
   - Drag and drop `PCControl-unsigned.ipa` into Sideloadly.
   - Enter your personal Apple ID and click **Start**.
5. On your iPhone: Go to **Settings → General → VPN & Device Management** → Trust your Apple ID certificate.

### Step 3: Configure Target PC in the App
1. Open **PC Control** on your iPhone.
2. Go to **Device Settings** (⚙️ icon).
3. Enter your PC's **IP Address**, **MAC Address**, and **PIN** (`1234` by default).
4. Tap **Test Agent Connection** and **Test Wake Packet** to verify.

---

## 🎙️ Siri Shortcuts Setup

Every action executed in the app is automatically registered as a Siri Activity. To customize voice phrases:
1. Open the iOS **Shortcuts** app on your iPhone.
2. Create a new shortcut and search for **PC Control**.
3. Choose **Turn On PC**, **Shutdown PC**, **Restart PC**, or **Sleep PC**.
4. Now you can say:
   - *"Hey Siri, Turn on my PC"*
   - *"Hey Siri, Shutdown PC"*
   - *"Hey Siri, Restart PC"*

---

## 🛠️ Wake-on-LAN BIOS Checklist

To allow your PC to power on from sleep or shutdown:
1. **BIOS / UEFI**: Enable `Power On By PCI-E/LAN Device` (or `Wake-on-LAN`) under *Advanced → APM Configuration*.
2. **Windows Device Manager**:
   - Open `Device Manager` → `Network adapters` → Right-click your Ethernet adapter → `Properties`.
   - In **Power Management** tab: Check *"Allow this device to wake the computer"* & *"Only allow a magic packet to wake the computer"*.
   - In **Advanced** tab: Set *"Wake on Magic Packet"* to `Enabled`.
3. Ensure your PC is connected to your local network router via Ethernet cable (or WOL-compatible Wi-Fi card).

---

## 📁 Project Architecture

```
pc-control/
├── .github/workflows/
│   └── build-ipa.yml              # GitHub Actions automated unsigned IPA builder
├── modules/
│   └── pc-control-native/         # Custom Expo Swift Native Module
│       ├── ios/
│       │   ├── PcControlNativeModule.swift # Bare-metal UDP WOL socket & Siri Intent donor
│       │   └── PcControlNative.podspec
│       └── src/index.ts           # TypeScript native bridge
├── server/                        # Windows Companion Daemon (Zero-dependency Node.js)
│   ├── agent.js                   # REST API server (shutdown, restart, sleep, status)
│   ├── config.json                # Server settings & PIN
│   ├── start-agent.bat            # Manual runner
│   └── install-startup.bat        # Silent Windows startup installer
├── src/
│   ├── components/                # UI components (ActionCard, StatusHeader, VoiceModal)
│   ├── screens/                   # Screens (Dashboard, Settings, SiriGuide)
│   ├── services/                  # Business logic (PCControlService, VoiceService)
│   ├── types/                     # TypeScript definitions
│   └── utils/                     # Network & MAC address utilities
├── App.tsx                        # Main application container
└── app.json                       # Expo configuration & iOS network/voice permissions
```
