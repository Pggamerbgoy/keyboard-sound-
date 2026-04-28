# 🎹 KeySound Pro

A high-performance, premium keyboard soundboard built with Electron. Transform your typing experience with mechanical switch sounds or any custom audio files.

![Premium UI](https://img.shields.io/badge/UI-Glassmorphism-00e5ff)
![Tech](https://img.shields.io/badge/Tech-Electron%20%2B%20Anime.js-blue)

## ✨ Features

- **🎮 Full Visual Keyboard**: Interactive QWERTY layout to map sounds to any key (Esc to Ctrl).
- **✂️ Built-in Sound Trimmer**: Fine-tune your audio files with start and end offsets directly in the app.
- **📦 Mechanical Presets**: Instant "One-Click" packs for **Cherry Blue**, **Brown**, and **Red** switches.
- **💎 Premium Aesthetics**: Modern Glassmorphism design with kinetic animations powered by Anime.js.
- **🔄 Auto-Migration**: Automatically imports settings from legacy Python soundboard apps.
- **⌨️ Global Key Hooking**: Works in the background while you type in any application.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- Windows (Current global hooks are optimized for Windows)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Pggamerbgoy/keyboard-sound-.git
   cd keyboard-sound-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm start
   ```

## 🛠️ How to Use
1. **Map a Sound**: Click any key on the visual keyboard and select your audio file.
2. **Edit/Trim**: Click a mapped sound card in the "Active Mappings" section to open the editor.
3. **Presets**: Use the preset buttons at the bottom to instantly apply a full mechanical sound pack.
4. **Clear All**: Reset your soundboard with a single click.

## 🧰 Tech Stack
- **Electron**: Cross-platform desktop framework.
- **uiohook-napi**: Low-level global keyboard and mouse hooks.
- **Anime.js**: Lightweight JavaScript animation library.
- **Electron-Store**: Simple data persistence.

## 📄 License
MIT License - Feel free to use and modify!
