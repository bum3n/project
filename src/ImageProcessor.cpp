#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#include "ImageProcessor.h"

#include <vector>
#include <array>
#include <string>
#include <cmath>
#include <cstdint>
#include <atomic>
#include <algorithm>
#include <random>
#include <cstring>
#include <functional>
#include <numeric>

namespace ImageProcessor {

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

static inline uint8_t clampByte(int v) {
    return static_cast<uint8_t>(std::clamp(v, 0, 255));
}

static inline uint8_t clampByte(float v) {
    return static_cast<uint8_t>(std::clamp(static_cast<int>(std::round(v)), 0, 255));
}

// Simple 2-D pixel access helpers (RGBA assumed)
static inline uint8_t* pixelAt(ImageBuffer& img, int x, int y) {
    return &img.data[static_cast<size_t>((y * img.width + x) * img.channels)];
}

static inline const uint8_t* pixelAt(const ImageBuffer& img, int x, int y) {
    return &img.data[static_cast<size_t>((y * img.width + x) * img.channels)];
}

// ---------------------------------------------------------------------------
// 1. Color Quantization  (median-cut + optional dither)
// ---------------------------------------------------------------------------

struct ColorBox {
    std::vector<std::array<uint8_t, 3>> colors;

    std::array<uint8_t, 3> average() const {
        if (colors.empty()) return {0, 0, 0};
        unsigned long long r = 0, g = 0, b = 0;
        for (auto& c : colors) { r += c[0]; g += c[1]; b += c[2]; }
        auto n = colors.size();
        return {static_cast<uint8_t>(r / n),
                static_cast<uint8_t>(g / n),
                static_cast<uint8_t>(b / n)};
    }

    int longestAxis() const {
        uint8_t minR = 255, minG = 255, minB = 255;
        uint8_t maxR = 0, maxG = 0, maxB = 0;
        for (auto& c : colors) {
            minR = std::min(minR, c[0]); maxR = std::max(maxR, c[0]);
            minG = std::min(minG, c[1]); maxG = std::max(maxG, c[1]);
            minB = std::min(minB, c[2]); maxB = std::max(maxB, c[2]);
        }
        int dr = maxR - minR, dg = maxG - minG, db = maxB - minB;
        if (dr >= dg && dr >= db) return 0;
        if (dg >= dr && dg >= db) return 1;
        return 2;
    }
};

static std::vector<std::array<uint8_t, 3>> medianCut(
        const std::vector<std::array<uint8_t, 3>>& pixels, int numColors) {
    if (numColors <= 0) numColors = 1;
    std::vector<ColorBox> boxes;
    boxes.push_back({pixels});

    while (static_cast<int>(boxes.size()) < numColors) {
        // Find box with most colors to split
        int bestIdx = 0;
        size_t bestSize = 0;
        for (int i = 0; i < static_cast<int>(boxes.size()); ++i) {
            if (boxes[i].colors.size() > bestSize) {
                bestSize = boxes[i].colors.size();
                bestIdx = i;
            }
        }
        if (bestSize <= 1) break;

        ColorBox& box = boxes[bestIdx];
        int axis = box.longestAxis();
        std::sort(box.colors.begin(), box.colors.end(),
                  [axis](const auto& a, const auto& b) { return a[axis] < b[axis]; });

        size_t mid = box.colors.size() / 2;
        ColorBox left, right;
        left.colors.assign(box.colors.begin(), box.colors.begin() + mid);
        right.colors.assign(box.colors.begin() + mid, box.colors.end());

        boxes[bestIdx] = std::move(left);
        boxes.push_back(std::move(right));
    }

    std::vector<std::array<uint8_t, 3>> palette;
    palette.reserve(boxes.size());
    for (auto& b : boxes) palette.push_back(b.average());
    return palette;
}

static std::array<uint8_t, 3> nearestPaletteColor(
        const std::array<uint8_t, 3>& c,
        const std::vector<std::array<uint8_t, 3>>& palette) {
    int bestDist = INT_MAX;
    std::array<uint8_t, 3> best = palette[0];
    for (auto& p : palette) {
        int dr = static_cast<int>(c[0]) - p[0];
        int dg = static_cast<int>(c[1]) - p[1];
        int db = static_cast<int>(c[2]) - p[2];
        int d = dr * dr + dg * dg + db * db;
        if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
}

void colorQuantize(ImageBuffer& img, int level, DitherMode dither) {
    if (!img.valid() || level <= 0) return;
    int numColors = std::max(2, 256 - level * 254 / 100);

    // Collect pixel colors
    int total = img.width * img.height;
    std::vector<std::array<uint8_t, 3>> pixels(total);
    for (int i = 0; i < total; ++i) {
        int idx = i * img.channels;
        pixels[i] = {img.data[idx], img.data[idx + 1], img.data[idx + 2]};
    }

    auto palette = medianCut(pixels, numColors);

    if (dither == DitherMode::FloydSteinberg) {
        // Floyd-Steinberg error diffusion
        std::vector<std::array<float, 3>> errors(total, {0.f, 0.f, 0.f});
        for (int y = 0; y < img.height; ++y) {
            for (int x = 0; x < img.width; ++x) {
                int i = y * img.width + x;
                int idx = i * img.channels;
                std::array<float, 3> old = {
                    std::clamp(img.data[idx + 0] + errors[i][0], 0.f, 255.f),
                    std::clamp(img.data[idx + 1] + errors[i][1], 0.f, 255.f),
                    std::clamp(img.data[idx + 2] + errors[i][2], 0.f, 255.f)};
                std::array<uint8_t, 3> qc = {clampByte(old[0]), clampByte(old[1]), clampByte(old[2])};
                auto nc = nearestPaletteColor(qc, palette);
                img.data[idx + 0] = nc[0];
                img.data[idx + 1] = nc[1];
                img.data[idx + 2] = nc[2];
                std::array<float, 3> err = {old[0] - nc[0], old[1] - nc[1], old[2] - nc[2]};
                auto distribute = [&](int nx, int ny, float w) {
                    if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
                        int ni = ny * img.width + nx;
                        errors[ni][0] += err[0] * w;
                        errors[ni][1] += err[1] * w;
                        errors[ni][2] += err[2] * w;
                    }
                };
                distribute(x + 1, y,     7.f / 16.f);
                distribute(x - 1, y + 1, 3.f / 16.f);
                distribute(x,     y + 1, 5.f / 16.f);
                distribute(x + 1, y + 1, 1.f / 16.f);
            }
        }
    } else if (dither == DitherMode::Ordered) {
        // 4x4 ordered (Bayer) dithering
        static const float bayer[4][4] = {
            { 0.f / 16.f,  8.f / 16.f,  2.f / 16.f, 10.f / 16.f},
            {12.f / 16.f,  4.f / 16.f, 14.f / 16.f,  6.f / 16.f},
            { 3.f / 16.f, 11.f / 16.f,  1.f / 16.f,  9.f / 16.f},
            {15.f / 16.f,  7.f / 16.f, 13.f / 16.f,  5.f / 16.f}
        };
        float spread = 255.f / numColors;
        for (int y = 0; y < img.height; ++y) {
            for (int x = 0; x < img.width; ++x) {
                int idx = (y * img.width + x) * img.channels;
                float threshold = (bayer[y % 4][x % 4] - 0.5f) * spread;
                std::array<uint8_t, 3> c = {
                    clampByte(img.data[idx + 0] + threshold),
                    clampByte(img.data[idx + 1] + threshold),
                    clampByte(img.data[idx + 2] + threshold)};
                auto nc = nearestPaletteColor(c, palette);
                img.data[idx + 0] = nc[0];
                img.data[idx + 1] = nc[1];
                img.data[idx + 2] = nc[2];
            }
        }
    } else {
        // No dither – direct mapping
        for (int i = 0; i < total; ++i) {
            int idx = i * img.channels;
            std::array<uint8_t, 3> c = {img.data[idx], img.data[idx + 1], img.data[idx + 2]};
            auto nc = nearestPaletteColor(c, palette);
            img.data[idx + 0] = nc[0];
            img.data[idx + 1] = nc[1];
            img.data[idx + 2] = nc[2];
        }
    }
}

// ---------------------------------------------------------------------------
// 2. Sharpen  (unsharp mask)
// ---------------------------------------------------------------------------

static ImageBuffer gaussianBlur(const ImageBuffer& src, float radius) {
    ImageBuffer dst = src;
    int r = std::max(1, static_cast<int>(std::ceil(radius * 2.f)));
    // Build 1-D kernel
    std::vector<float> kernel(2 * r + 1);
    float sigma = radius;
    float sum = 0.f;
    for (int i = -r; i <= r; ++i) {
        kernel[i + r] = std::exp(-(i * i) / (2.f * sigma * sigma));
        sum += kernel[i + r];
    }
    for (auto& k : kernel) k /= sum;

    int w = src.width, h = src.height, ch = src.channels;
    // Horizontal pass
    std::vector<uint8_t> tmp(src.data.size());
    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            float acc[4] = {0, 0, 0, 0};
            for (int k = -r; k <= r; ++k) {
                int sx = std::clamp(x + k, 0, w - 1);
                const uint8_t* p = &src.data[(y * w + sx) * ch];
                float wt = kernel[k + r];
                for (int c = 0; c < ch; ++c) acc[c] += p[c] * wt;
            }
            uint8_t* d = &tmp[(y * w + x) * ch];
            for (int c = 0; c < ch; ++c) d[c] = clampByte(acc[c]);
        }
    }
    // Vertical pass
    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            float acc[4] = {0, 0, 0, 0};
            for (int k = -r; k <= r; ++k) {
                int sy = std::clamp(y + k, 0, h - 1);
                const uint8_t* p = &tmp[(sy * w + x) * ch];
                float wt = kernel[k + r];
                for (int c = 0; c < ch; ++c) acc[c] += p[c] * wt;
            }
            uint8_t* d = &dst.data[(y * w + x) * ch];
            for (int c = 0; c < ch; ++c) d[c] = clampByte(acc[c]);
        }
    }
    return dst;
}

void applySharpen(ImageBuffer& img, int level) {
    if (!img.valid() || level <= 0) return;
    float amount = level * 5.f / 100.f;           // 0..5
    float radius = 0.5f + level * 4.5f / 100.f;   // 0.5..5.0

    auto blurred = gaussianBlur(img, radius);
    size_t n = img.data.size();
    for (size_t i = 0; i < n; ++i) {
        float v = img.data[i] + amount * (static_cast<float>(img.data[i]) - blurred.data[i]);
        img.data[i] = clampByte(v);
    }
}

// ---------------------------------------------------------------------------
// 3. Resolution  (downscale then upscale)
// ---------------------------------------------------------------------------

void applyResolution(ImageBuffer& img, int resPercent, bool hd8k) {
    if (!img.valid() || resPercent >= 100 || resPercent <= 0) return;

    int origW = img.width, origH = img.height, ch = img.channels;
    int newW = std::max(1, origW * resPercent / 100);
    int newH = std::max(1, origH * resPercent / 100);

    // Downscale with box filter
    std::vector<uint8_t> small(newW * newH * ch);
    for (int y = 0; y < newH; ++y) {
        for (int x = 0; x < newW; ++x) {
            float x0f = static_cast<float>(x) * origW / newW;
            float y0f = static_cast<float>(y) * origH / newH;
            float x1f = static_cast<float>(x + 1) * origW / newW;
            float y1f = static_cast<float>(y + 1) * origH / newH;
            int ix0 = static_cast<int>(x0f), iy0 = static_cast<int>(y0f);
            int ix1 = std::min(static_cast<int>(std::ceil(x1f)), origW);
            int iy1 = std::min(static_cast<int>(std::ceil(y1f)), origH);
            float acc[4] = {0, 0, 0, 0};
            int count = 0;
            for (int sy = iy0; sy < iy1; ++sy) {
                for (int sx = ix0; sx < ix1; ++sx) {
                    const uint8_t* p = &img.data[(sy * origW + sx) * ch];
                    for (int c = 0; c < ch; ++c) acc[c] += p[c];
                    ++count;
                }
            }
            uint8_t* d = &small[(y * newW + x) * ch];
            if (count > 0) {
                for (int c = 0; c < ch; ++c) d[c] = clampByte(acc[c] / count);
            }
        }
    }

    // Upscale back to original size
    std::vector<uint8_t> result(origW * origH * ch);
    if (hd8k) {
        // Nearest neighbor
        for (int y = 0; y < origH; ++y) {
            for (int x = 0; x < origW; ++x) {
                int sx = x * newW / origW;
                int sy = y * newH / origH;
                sx = std::clamp(sx, 0, newW - 1);
                sy = std::clamp(sy, 0, newH - 1);
                const uint8_t* p = &small[(sy * newW + sx) * ch];
                uint8_t* d = &result[(y * origW + x) * ch];
                std::memcpy(d, p, ch);
            }
        }
    } else {
        // Bilinear
        for (int y = 0; y < origH; ++y) {
            for (int x = 0; x < origW; ++x) {
                float fx = (x + 0.5f) * newW / origW - 0.5f;
                float fy = (y + 0.5f) * newH / origH - 0.5f;
                int x0 = static_cast<int>(std::floor(fx));
                int y0 = static_cast<int>(std::floor(fy));
                float xf = fx - x0;
                float yf = fy - y0;
                int x1 = std::min(x0 + 1, newW - 1);
                int y1 = std::min(y0 + 1, newH - 1);
                x0 = std::max(x0, 0);
                y0 = std::max(y0, 0);
                const uint8_t* p00 = &small[(y0 * newW + x0) * ch];
                const uint8_t* p10 = &small[(y0 * newW + x1) * ch];
                const uint8_t* p01 = &small[(y1 * newW + x0) * ch];
                const uint8_t* p11 = &small[(y1 * newW + x1) * ch];
                uint8_t* d = &result[(y * origW + x) * ch];
                for (int c = 0; c < ch; ++c) {
                    float top = p00[c] * (1 - xf) + p10[c] * xf;
                    float bot = p01[c] * (1 - xf) + p11[c] * xf;
                    d[c] = clampByte(top * (1 - yf) + bot * yf);
                }
            }
        }
    }
    img.data = std::move(result);
}

// ---------------------------------------------------------------------------
// 4. JPEG Compression artifact simulation
// ---------------------------------------------------------------------------

static void jpegWriteCallback(void* context, void* data, int size) {
    auto* buf = static_cast<std::vector<uint8_t>*>(context);
    auto* bytes = static_cast<const uint8_t*>(data);
    buf->insert(buf->end(), bytes, bytes + size);
}

void applyJpegCompression(ImageBuffer& img, int quality, int iterations) {
    if (!img.valid() || quality <= 0 || quality >= 100) return;
    quality = std::clamp(quality, 1, 99);

    for (int iter = 0; iter < iterations; ++iter) {
        // Encode to JPEG in memory (RGB, 3 channels)
        // Convert RGBA -> RGB for JPEG
        std::vector<uint8_t> rgb(img.width * img.height * 3);
        for (int i = 0; i < img.width * img.height; ++i) {
            rgb[i * 3 + 0] = img.data[i * img.channels + 0];
            rgb[i * 3 + 1] = img.data[i * img.channels + 1];
            rgb[i * 3 + 2] = img.data[i * img.channels + 2];
        }

        std::vector<uint8_t> jpegBuf;
        jpegBuf.reserve(img.width * img.height * 3);
        stbi_write_jpg_to_func(jpegWriteCallback, &jpegBuf,
                               img.width, img.height, 3, rgb.data(), quality);

        // Decode back
        int w, h, ch;
        uint8_t* decoded = stbi_load_from_memory(
            jpegBuf.data(), static_cast<int>(jpegBuf.size()), &w, &h, &ch, 3);
        if (!decoded) break;

        // Copy back to RGBA buffer
        for (int i = 0; i < w * h; ++i) {
            img.data[i * img.channels + 0] = decoded[i * 3 + 0];
            img.data[i * img.channels + 1] = decoded[i * 3 + 1];
            img.data[i * img.channels + 2] = decoded[i * 3 + 2];
            // Alpha stays unchanged
        }
        stbi_image_free(decoded);
    }
}

// ---------------------------------------------------------------------------
// 5. Noise
// ---------------------------------------------------------------------------

void applyNoise(ImageBuffer& img, int intensity, NoiseType type, bool perChannel) {
    if (!img.valid() || intensity <= 0) return;
    float strength = intensity / 100.f;
    std::mt19937 rng(42);
    std::normal_distribution<float> gaussDist(0.f, 1.f);
    std::uniform_real_distribution<float> uniformDist(0.f, 1.f);

    int w = img.width, h = img.height, ch = img.channels;

    if (type == NoiseType::Gaussian) {
        for (int y = 0; y < h; ++y) {
            for (int x = 0; x < w; ++x) {
                uint8_t* p = pixelAt(img, x, y);
                if (perChannel) {
                    for (int c = 0; c < 3; ++c) {
                        float noise = gaussDist(rng) * strength * 128.f;
                        p[c] = clampByte(static_cast<int>(p[c]) + static_cast<int>(noise));
                    }
                } else {
                    float noise = gaussDist(rng) * strength * 128.f;
                    for (int c = 0; c < 3; ++c)
                        p[c] = clampByte(static_cast<int>(p[c]) + static_cast<int>(noise));
                }
            }
        }
    } else if (type == NoiseType::SaltPepper) {
        float prob = strength * 0.5f;
        for (int y = 0; y < h; ++y) {
            for (int x = 0; x < w; ++x) {
                float r = uniformDist(rng);
                if (r < prob) {
                    uint8_t* p = pixelAt(img, x, y);
                    uint8_t val = (uniformDist(rng) < 0.5f) ? 0 : 255;
                    p[0] = p[1] = p[2] = val;
                }
            }
        }
    } else if (type == NoiseType::DigitalBanding) {
        // Horizontal banding artifacts
        int bandHeight = std::max(1, h / std::max(1, static_cast<int>(10 * strength)));
        for (int y = 0; y < h; ++y) {
            int bandIdx = y / bandHeight;
            float bandNoise = gaussDist(rng) * strength * 40.f;
            // Only apply noise once per band
            if (y % bandHeight != 0) {
                // Reuse previous band noise – re-seed to be deterministic
                std::mt19937 bandRng(42 + bandIdx);
                std::normal_distribution<float> bd(0.f, 1.f);
                bandNoise = bd(bandRng) * strength * 40.f;
            }
            for (int x = 0; x < w; ++x) {
                uint8_t* p = pixelAt(img, x, y);
                for (int c = 0; c < 3; ++c)
                    p[c] = clampByte(static_cast<int>(p[c]) + static_cast<int>(bandNoise));
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 6. RGB Shift
// ---------------------------------------------------------------------------

void applyRGBShift(ImageBuffer& img, int amount, bool shiftX, bool shiftY) {
    if (!img.valid() || amount <= 0) return;

    int w = img.width, h = img.height, ch = img.channels;
    std::vector<uint8_t> orig(img.data);

    auto sampleChannel = [&](int x, int y, int c) -> uint8_t {
        x = std::clamp(x, 0, w - 1);
        y = std::clamp(y, 0, h - 1);
        return orig[(y * w + x) * ch + c];
    };

    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            uint8_t* p = pixelAt(img, x, y);
            int dxR = shiftX ? amount : 0;
            int dyR = shiftY ? amount : 0;
            int dxB = shiftX ? -amount : 0;
            int dyB = shiftY ? -amount : 0;
            p[0] = sampleChannel(x + dxR, y + dyR, 0);  // R shifted +
            // G stays at original position
            p[1] = sampleChannel(x, y, 1);
            p[2] = sampleChannel(x + dxB, y + dyB, 2);  // B shifted -
        }
    }
}

// ---------------------------------------------------------------------------
// 7. Glitch
// ---------------------------------------------------------------------------

void applyGlitch(ImageBuffer& img, int bands, int amplitude, int seed) {
    if (!img.valid() || bands <= 0 || amplitude <= 0) return;

    int w = img.width, h = img.height, ch = img.channels;
    std::mt19937 rng(seed);
    std::uniform_int_distribution<int> yDist(0, h - 1);
    std::uniform_int_distribution<int> hDist(1, std::max(1, h / 10));
    std::uniform_int_distribution<int> shiftDist(-amplitude, amplitude);

    std::vector<uint8_t> orig(img.data);

    for (int b = 0; b < bands; ++b) {
        int bandY = yDist(rng);
        int bandH = hDist(rng);
        int shift = shiftDist(rng);
        if (shift == 0) continue;

        for (int y = bandY; y < std::min(bandY + bandH, h); ++y) {
            for (int x = 0; x < w; ++x) {
                int sx = x - shift;
                sx = std::clamp(sx, 0, w - 1);
                uint8_t* dst = &img.data[(y * w + x) * ch];
                const uint8_t* src = &orig[(y * w + sx) * ch];
                std::memcpy(dst, src, ch);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 8. Palette
// ---------------------------------------------------------------------------

static std::vector<std::array<uint8_t, 3>> getPalette(PalettePreset preset) {
    switch (preset) {
    case PalettePreset::GameBoy:
        return {{15,56,15}, {48,98,48}, {139,172,15}, {155,188,15}};
    case PalettePreset::NES:
        // Simplified 16-color NES palette
        return {
            {0,0,0},       {0,0,170},     {0,170,0},     {0,170,170},
            {170,0,0},     {170,0,170},   {170,85,0},    {170,170,170},
            {85,85,85},    {85,85,255},   {85,255,85},   {85,255,255},
            {255,85,85},   {255,85,255},  {255,255,85},  {255,255,255}
        };
    case PalettePreset::Windows98:
        return {
            {0,0,0},       {128,0,0},     {0,128,0},     {128,128,0},
            {0,0,128},     {128,0,128},   {0,128,128},   {192,192,192},
            {128,128,128}, {255,0,0},     {0,255,0},     {255,255,0},
            {0,0,255},     {255,0,255},   {0,255,255},   {255,255,255}
        };
    case PalettePreset::Thermal:
        return {
            {0,0,32},      {0,0,64},      {0,0,128},     {0,0,192},
            {0,64,192},    {0,128,192},   {0,192,128},   {0,255,64},
            {64,255,0},    {128,255,0},   {192,255,0},   {255,255,0},
            {255,192,0},   {255,128,0},   {255,64,0},    {255,0,0}
        };
    case PalettePreset::MonoGreen:
        return {{0,32,0}, {0,85,0}, {0,170,0}, {0,255,0}};
    default:
        return {};
    }
}

void applyPalette(ImageBuffer& img, PalettePreset preset,
                  const std::vector<std::array<uint8_t, 3>>& customPalette) {
    if (!img.valid() || preset == PalettePreset::None) return;

    auto pal = (preset == PalettePreset::Custom) ? customPalette : getPalette(preset);
    if (pal.empty()) return;

    int total = img.width * img.height;
    for (int i = 0; i < total; ++i) {
        int idx = i * img.channels;
        std::array<uint8_t, 3> c = {img.data[idx], img.data[idx + 1], img.data[idx + 2]};
        auto nc = nearestPaletteColor(c, pal);
        img.data[idx + 0] = nc[0];
        img.data[idx + 1] = nc[1];
        img.data[idx + 2] = nc[2];
    }
}

// ---------------------------------------------------------------------------
// 9. Displacement  (Perlin-like warp)
// ---------------------------------------------------------------------------

// Simple hash-based gradient noise for displacement
static float gradientNoise(float x, float y, int seed) {
    auto hash = [](int ix, int iy, int s) -> float {
        unsigned int h = static_cast<unsigned int>(ix * 374761393 + iy * 668265263 + s * 1274126177);
        h = (h ^ (h >> 13)) * 1274126177;
        h = h ^ (h >> 16);
        return (h & 0xFFFF) / 32768.f - 1.f;  // -1..1
    };

    int ix = static_cast<int>(std::floor(x));
    int iy = static_cast<int>(std::floor(y));
    float fx = x - ix;
    float fy = y - iy;
    // Smoothstep
    float sx = fx * fx * (3.f - 2.f * fx);
    float sy = fy * fy * (3.f - 2.f * fy);

    float n00 = hash(ix, iy, seed);
    float n10 = hash(ix + 1, iy, seed);
    float n01 = hash(ix, iy + 1, seed);
    float n11 = hash(ix + 1, iy + 1, seed);

    float nx0 = n00 + sx * (n10 - n00);
    float nx1 = n01 + sx * (n11 - n01);
    return nx0 + sy * (nx1 - nx0);
}

void applyDisplacement(ImageBuffer& img, int amount, int seed) {
    if (!img.valid() || amount <= 0) return;

    int w = img.width, h = img.height, ch = img.channels;
    std::vector<uint8_t> orig(img.data);
    float scale = 8.f;  // noise frequency
    float strength = amount * 0.5f;  // pixel displacement range

    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            float nx = static_cast<float>(x) / w * scale;
            float ny = static_cast<float>(y) / h * scale;
            float dx = gradientNoise(nx, ny, seed) * strength;
            float dy = gradientNoise(nx + 100.f, ny + 100.f, seed) * strength;

            int sx = std::clamp(static_cast<int>(x + dx), 0, w - 1);
            int sy = std::clamp(static_cast<int>(y + dy), 0, h - 1);

            uint8_t* dst = &img.data[(y * w + x) * ch];
            const uint8_t* src = &orig[(sy * w + sx) * ch];
            std::memcpy(dst, src, ch);
        }
    }
}

// ---------------------------------------------------------------------------
// 10. Master pipeline
// ---------------------------------------------------------------------------

ImageBuffer processImage(const ImageBuffer& input, const Settings& settings,
                         std::atomic<bool>& cancel) {
    if (!input.valid()) return {};
    ImageBuffer img = input;

    auto step = [&](auto fn) {
        if (!cancel.load(std::memory_order_relaxed)) fn();
    };

    auto applyOnce = [&]() {
        step([&] { applyResolution(img, settings.resolution, settings.hd8k); });
        step([&] { colorQuantize(img, settings.quantization, settings.ditherMode); });
        step([&] { applySharpen(img, settings.sharpen); });
        step([&] { applyNoise(img, settings.noiseIntensity, settings.noiseType, settings.noisePerChannel); });
        step([&] { applyRGBShift(img, settings.rgbShiftAmount, settings.rgbShiftX, settings.rgbShiftY); });
        step([&] { applyGlitch(img, settings.glitchBands, settings.glitchAmplitude, settings.glitchSeed); });
        step([&] { applyDisplacement(img, settings.displacement, settings.displacementSeed); });
        step([&] { applyJpegCompression(img, settings.jpegQuality, settings.jpegIterations); });
        step([&] { applyPalette(img, settings.palette, settings.customPalette); });
    };

    if (settings.iterativeDestroy && settings.iterativeCount > 1) {
        for (int i = 0; i < settings.iterativeCount && !cancel.load(std::memory_order_relaxed); ++i)
            applyOnce();
    } else {
        applyOnce();
    }

    return img;
}

} // namespace ImageProcessor
