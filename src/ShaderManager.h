#pragma once

#include <string>
#include <cstdint>

namespace ShaderManager {

// Initialize OpenGL function pointers (call after GL context creation)
bool init();

// Check if shaders are available (OpenGL 3.3+)
bool isAvailable();

// Create the displacement shader program
// Returns program ID, 0 on failure
unsigned int createDisplacementShader();

// Apply displacement effect using GPU
// inputTexture: OpenGL texture with source image
// outputBuffer: CPU buffer to read result back into
// width, height: image dimensions
// amount: displacement strength 0-100
// seed: random seed for noise
void applyDisplacementGPU(unsigned int program, unsigned int inputTexture,
                          uint8_t* outputBuffer, int width, int height, int channels,
                          int amount, int seed);

// Upload image data to OpenGL texture
unsigned int uploadTexture(const uint8_t* data, int width, int height, int channels);

// Delete texture
void deleteTexture(unsigned int tex);

// Delete shader program
void deleteProgram(unsigned int prog);

// Create texture for displaying preview in ImGui
unsigned int createPreviewTexture(const uint8_t* data, int width, int height, int channels);
void updatePreviewTexture(unsigned int tex, const uint8_t* data, int width, int height, int channels);

// Cleanup
void shutdown();

} // namespace ShaderManager
