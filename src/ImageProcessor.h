#pragma once

#include <vector>
#include <array>
#include <string>
#include <cstdint>
#include <atomic>

struct ImageBuffer {
    std::vector<uint8_t> data;
    int width = 0;
    int height = 0;
    int channels = 4; // RGBA
    bool valid() const { return !data.empty() && width > 0 && height > 0; }
};

enum class DitherMode { Off, Ordered, FloydSteinberg };
enum class NoiseType { Gaussian, SaltPepper, DigitalBanding };
enum class PalettePreset { None, GameBoy, NES, Windows98, Thermal, MonoGreen, Custom };

struct Settings {
    // HD8K toggle - nearest neighbor vs bilinear
    bool hd8k = false;

    // Color Quantization 0-100
    int quantization = 0;
    DitherMode ditherMode = DitherMode::Off;

    // Sharpen 0-100
    int sharpen = 0;

    // Resolution 1-100 (percentage)
    int resolution = 100;

    // Displacement 0-100
    int displacement = 0;
    int displacementSeed = 42;

    // JPEG quality 0-100 (0 = no JPEG compression effect)
    int jpegQuality = 100;
    int jpegIterations = 1;

    // Noise 0-100
    int noiseIntensity = 0;
    NoiseType noiseType = NoiseType::Gaussian;
    bool noisePerChannel = false;

    // RGB shift 0-100
    int rgbShiftAmount = 0;
    bool rgbShiftX = true;
    bool rgbShiftY = false;

    // Glitch
    int glitchBands = 0;
    int glitchAmplitude = 0;
    int glitchSeed = 42;

    // Palette
    PalettePreset palette = PalettePreset::None;
    std::vector<std::array<uint8_t, 3>> customPalette;

    // Iterative destroy
    bool iterativeDestroy = false;
    int iterativeCount = 1;

    // Watermark
    bool watermark = false;
    std::string watermarkText = "";

    // Randomize seed
    int randomSeed = 0;

    // Strip EXIF on save
    bool stripExif = true;
};

namespace ImageProcessor {

void colorQuantize(ImageBuffer& img, int level, DitherMode dither);
void applySharpen(ImageBuffer& img, int level);
void applyResolution(ImageBuffer& img, int resPercent, bool hd8k);
void applyJpegCompression(ImageBuffer& img, int quality, int iterations);
void applyNoise(ImageBuffer& img, int intensity, NoiseType type, bool perChannel);
void applyRGBShift(ImageBuffer& img, int amount, bool shiftX, bool shiftY);
void applyGlitch(ImageBuffer& img, int bands, int amplitude, int seed);
void applyPalette(ImageBuffer& img, PalettePreset preset,
                  const std::vector<std::array<uint8_t, 3>>& customPalette);
void applyDisplacement(ImageBuffer& img, int amount, int seed);

ImageBuffer processImage(const ImageBuffer& input, const Settings& settings,
                         std::atomic<bool>& cancel);

} // namespace ImageProcessor
