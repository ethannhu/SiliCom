# SiliCom



![SiliCom Logo (Concept)](https://via.placeholder.com/200x80?text=SiliCom+Serial+Tool)

A lightweight, modern, and cross-platform serial port debugging tool built with Tauri, Rust, and vanilla HTML/CSS/JS.


## 🌟 Core Features

### 🚀 Ultra-Lightweight



* **Minimal Footprint**: Binary sizes start at just \~5MB (depending on platform), far smaller than traditional Electron-based tools.

* **Low Resource Usage**: Uses minimal CPU and memory, ensuring smooth operation even on resource-constrained devices.

### 🎨 Modern UI



* **Clean & Intuitive**: A clutter-free interface designed for efficiency, with clear navigation between serial settings, terminal view, and data monitoring.

* **Responsive Design(TODO)**: Adapts seamlessly to different window sizes, from small laptop screens to large monitors.

* **Dark/Light Modes**: Toggle between color schemes to reduce eye strain during extended use.

### 🔌 Powerful Serial Debugging



* **Comprehensive Port Support**: Detects and lists all available serial ports (USB, Bluetooth, hardware) with detailed information (baud rate, parity, stop bits, etc.).

* **Flexible Configuration(TODO)**: Supports baud rates from 1200 to 921600, configurable data bits (5-8), parity (None, Odd, Even), and stop bits (1-2).

* **Real-Time Data Monitoring**:


  * View incoming/outgoing data in ASCII, Hex, or Decimal format.

  * Timestamp each data packet for precise timing analysis.(TODO)


### 🌍 Cross-Platform



* **Consistent Experience**: Works seamlessly on Windows, macOS, and Linux.

* **Native Integration**: Leverages Tauri's native OS bindings for better performance and system integration (e.g., native file dialogs, tray icons).