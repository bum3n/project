# Зыбучий шакал

Desktop meme editor for intentional image degradation. Make your memes cursed with full control over artifacts.

## Features

- **Color quantization** — reduce color depth (0–100) with optional dithering (ordered / Floyd-Steinberg)
- **Sharpen** — over-sharpen to taste (0–100)
- **Resolution** — downscale and re-upscale (1–100 %) with nearest-neighbor (HD8K toggle) or bilinear filtering
- **Displacement** — warp pixels with a GPU-accelerated shader (CPU fallback available)
- **JPEG compression** — simulate recompression artifacts (quality 0–100, configurable iteration count)
- **Noise** — Gaussian, salt-and-pepper, or digital banding (0–100, optional per-channel)
- **RGB shift** — offset color channels horizontally and/or vertically (0–100)
- **Glitch** — random horizontal band shifts with configurable band count, amplitude, and seed
- **Palette presets** — GameBoy, NES, Windows 98, Thermal, Mono Green, or a custom palette
- **Iterative destroy** — re-apply the entire pipeline N times for exponential degradation
- **Watermark** — burn custom text into the image
- Real-time preview with before/after split-view comparison
- Drag-and-drop and clipboard paste support (Ctrl+V, Windows)
- GPU-accelerated displacement shader with automatic CPU fallback
- Undo/redo (up to 10 steps)
- Auto-save settings on exit, auto-load on startup
- Export to PNG, JPEG, BMP with optional EXIF stripping
- Fully offline — no servers, no network access needed

## Building

### Prerequisites

- CMake 3.20+
- C++20 compiler (MSVC 2022, GCC 11+, Clang 13+)
- OpenGL 3.3+ capable GPU (or CPU fallback)
- On Linux: `sudo apt install libgl1-mesa-dev libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev`

### Build with MSVC (Windows)

```
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

Output: `build/Release/ZybuchiyJackal.exe`

### Build with GCC/Clang (Linux)

```
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Output: `build/ZybuchiyJackal`

### Automated builds

The project includes a GitHub Actions workflow (`.github/workflows/build.yml`) that automatically builds the executable on every push and creates GitHub Releases when a version tag (`v*`) is pushed.

## Controls

| Shortcut | Action |
|---|---|
| **Ctrl+O** | Open image file |
| **Ctrl+S** | Save processed image |
| **Ctrl+V** | Paste image from clipboard (Windows) |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** / **Ctrl+Shift+Z** | Redo |
| **Drag & drop** | Load an image by dropping it onto the window |
| **Sliders** | Adjust each effect parameter in the control panel |
| **Randomize** | Randomize all settings |
| **Reset** | Reset all settings to defaults |

## Architecture

| File | Purpose |
|---|---|
| `src/main.cpp` | Entry point, GLFW/OpenGL/ImGui initialization, main loop |
| `src/UI.h` / `src/UI.cpp` | Dear ImGui interface, control panel, preview, file dialogs |
| `src/ImageProcessor.h` / `src/ImageProcessor.cpp` | CPU image processing algorithms |
| `src/ShaderManager.h` / `src/ShaderManager.cpp` | OpenGL shader management (displacement) |
| `src/Pipeline.h` / `src/Pipeline.cpp` | Async processing pipeline with undo/redo history |

## License

MIT