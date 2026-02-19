#pragma once
#include "ImageProcessor.h"
#include "Pipeline.h"
#include <string>

// Forward declare GL texture type
typedef unsigned int GLuint;

class UI {
public:
    UI();
    ~UI();

    // Initialize UI (call after ImGui context is created)
    void init();

    // Render the UI. Returns true if settings changed.
    bool render();

    // Load image from file path
    bool loadImage(const char* path);

    // Load image from memory (for clipboard paste)
    bool loadImageFromMemory(const unsigned char* data, int len);

    // Get current settings
    const Settings& getSettings() const { return m_settings; }
    Settings& getSettings() { return m_settings; }

    // Get source image
    const ImageBuffer& getSourceImage() const { return m_sourceImage; }

    // Set the processed result for preview
    void setProcessedImage(const ImageBuffer& img);

    // Check if we need to reprocess
    bool needsReprocess() const { return m_needsReprocess; }
    void clearReprocessFlag() { m_needsReprocess = false; }

    // Get pipeline reference
    Pipeline& getPipeline() { return m_pipeline; }

    // Save/Load settings to/from INI
    void saveSettings(const char* path);
    void loadSettings(const char* path);

    // Show file open dialog (platform native)
    std::string showOpenDialog();
    // Show file save dialog
    std::string showSaveDialog();

    // Get save format info
    bool getSaveStripExif() const { return m_settings.stripExif; }

    bool wantsSave() const { return m_wantsSave; }
    void clearSaveFlag() { m_wantsSave = false; }

    bool wantsLoad() const { return m_wantsLoad; }
    void clearLoadFlag() { m_wantsLoad = false; }
    std::string getLoadPath() const { return m_loadPath; }

private:
    void renderMenuBar();
    void renderControlPanel();
    void renderPreview();
    void renderStatusBar();
    void randomizeSettings();
    void resetSettings();

    Settings m_settings;
    Settings m_prevSettings;
    Pipeline m_pipeline;

    ImageBuffer m_sourceImage;
    ImageBuffer m_processedImage;

    GLuint m_sourceTexture = 0;
    GLuint m_processedTexture = 0;

    float m_zoom = 1.0f;
    float m_panX = 0.0f;
    float m_panY = 0.0f;
    bool m_showOriginal = false; // split view toggle

    bool m_needsReprocess = false;
    bool m_wantsSave = false;
    bool m_wantsLoad = false;
    std::string m_loadPath;

    bool m_settingsChanged = false;
    int m_debounceMs = 100;
};
