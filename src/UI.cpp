#include "UI.h"
#include "ShaderManager.h"
#include "imgui.h"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <random>
#include <algorithm>
#include <cstdint>

#ifdef _WIN32
#  ifndef WIN32_LEAN_AND_MEAN
#    define WIN32_LEAN_AND_MEAN
#  endif
#  include <windows.h>
#  include <commdlg.h>
#endif

// stb_image for loading (expected to be available via third_party)
#ifndef STB_IMAGE_IMPLEMENTATION
#  include "stb_image.h"
#endif

static constexpr int MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
static constexpr int MAX_DIMENSION = 8192;

// ---------------------------------------------------------------------------
// Construction / Destruction
// ---------------------------------------------------------------------------

UI::UI()  = default;
UI::~UI() {
    if (m_sourceTexture)    ShaderManager::deleteTexture(m_sourceTexture);
    if (m_processedTexture) ShaderManager::deleteTexture(m_processedTexture);
}

void UI::init() {
    // Nothing special needed initially – ImGui context already created by caller.
}

// ---------------------------------------------------------------------------
// Main render entry-point
// ---------------------------------------------------------------------------

bool UI::render() {
    m_settingsChanged = false;

    // Full-window dockspace
    ImGuiViewport* vp = ImGui::GetMainViewport();
    ImGui::SetNextWindowPos(vp->WorkPos);
    ImGui::SetNextWindowSize(vp->WorkSize);
    ImGuiWindowFlags hostFlags = ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoCollapse |
                                 ImGuiWindowFlags_NoResize   | ImGuiWindowFlags_NoMove |
                                 ImGuiWindowFlags_NoBringToFrontOnFocus |
                                 ImGuiWindowFlags_NoNavFocus  | ImGuiWindowFlags_MenuBar;
    ImGui::Begin("##DockHost", nullptr, hostFlags);

    ImGuiID dockId = ImGui::GetID("MainDockSpace");
    ImGui::DockSpace(dockId, ImVec2(0, 0));

    renderMenuBar();
    ImGui::End();

    renderControlPanel();
    renderPreview();
    renderStatusBar();

    // Detect changes
    if (m_settingsChanged) {
        m_needsReprocess = true;
    }

    m_prevSettings = m_settings;
    return m_settingsChanged;
}

// ---------------------------------------------------------------------------
// Menu bar
// ---------------------------------------------------------------------------

void UI::renderMenuBar() {
    if (ImGui::BeginMenuBar()) {
        if (ImGui::BeginMenu("Файл")) {
            if (ImGui::MenuItem("Открыть...", "Ctrl+O")) {
                m_wantsLoad = true;
            }
            if (ImGui::MenuItem("Сохранить...", "Ctrl+S")) {
                m_wantsSave = true;
            }
            ImGui::Separator();
            if (ImGui::MenuItem("Выход", "Alt+F4")) {
                // Caller handles quit
            }
            ImGui::EndMenu();
        }
        if (ImGui::BeginMenu("Правка")) {
            if (ImGui::MenuItem("Отменить", "Ctrl+Z", false, m_pipeline.canUndo())) {
                ImageBuffer undoImg;
                m_settings = m_pipeline.undo(undoImg);
                if (undoImg.valid()) setProcessedImage(undoImg);
                m_settingsChanged = true;
            }
            if (ImGui::MenuItem("Повторить", "Ctrl+Y", false, m_pipeline.canRedo())) {
                ImageBuffer redoImg;
                m_settings = m_pipeline.redo(redoImg);
                if (redoImg.valid()) setProcessedImage(redoImg);
                m_settingsChanged = true;
            }
            ImGui::EndMenu();
        }
        ImGui::EndMenuBar();
    }
}

// ---------------------------------------------------------------------------
// Control panel (left side)
// ---------------------------------------------------------------------------

void UI::renderControlPanel() {
    ImGui::Begin("\xd0\x9f\xd0\xb0\xd0\xbd\xd0\xb5\xd0\xbb\xd1\x8c "
                 "\xd1\x83\xd0\xbf\xd1\x80\xd0\xb0\xd0\xb2\xd0\xbb\xd0\xb5"
                 "\xd0\xbd\xd0\xb8\xd1\x8f");  // "Панель управления"

    // ---- Load / Save buttons ------------------------------------------------
    ImVec2 btnSize(-1, 40);
    if (ImGui::Button("\xd0\x97\xd0\xb0\xd0\xb3\xd1\x80\xd1\x83\xd0\xb7\xd0\xb8\xd1\x82\xd1\x8c "
                      "\xd1\x84\xd0\xbe\xd1\x82\xd0\xbe\xd0\xb3\xd1\x80\xd0\xb0\xd1\x84\xd0\xb8\xd1\x8e",
                      btnSize)) { // "Загрузить фотографию"
        m_wantsLoad = true;
    }

    if (ImGui::Button("\xd0\xa1\xd0\xbe\xd1\x85\xd1\x80\xd0\xb0\xd0\xbd\xd0\xb8\xd1\x82\xd1\x8c "
                      "\xd1\x84\xd0\xbe\xd1\x82\xd0\xbe\xd0\xb3\xd1\x80\xd0\xb0\xd1\x84\xd0\xb8\xd1\x8e",
                      btnSize)) { // "Сохранить фотографию"
        m_wantsSave = true;
    }

    ImGui::Separator();

    // ---- HD8K ---------------------------------------------------------------
    if (ImGui::Checkbox("HD8K (\xd1\x87\xd0\xb5\xd1\x82\xd0\xba\xd0\xb8\xd0\xb5 "
                        "\xd0\xbf\xd0\xb8\xd0\xba\xd1\x81\xd0\xb5\xd0\xbb\xd0\xb8)",
                        &m_settings.hd8k)) { // "HD8K (четкие пиксели)"
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- Степень сжатия (Color quantization) --------------------------------
    if (ImGui::SliderInt("\xd0\xa1\xd1\x82\xd0\xb5\xd0\xbf\xd0\xb5\xd0\xbd\xd1\x8c "
                         "\xd1\x81\xd0\xb6\xd0\xb0\xd1\x82\xd0\xb8\xd1\x8f",
                         &m_settings.quantization, 0, 100)) { // "Степень сжатия"
        m_settingsChanged = true;
    }
    if (m_settings.quantization == 0)
        ImGui::TextDisabled("\xd0\x9e\xd1\x80\xd0\xb8\xd0\xb3\xd0\xb8\xd0\xbd\xd0\xb0\xd0\xbb"); // "Оригинал"
    else if (m_settings.quantization <= 50)
        ImGui::TextDisabled("128 \xd1\x86\xd0\xb2\xd0\xb5\xd1\x82\xd0\xbe\xd0\xb2"); // "128 цветов"
    else
        ImGui::TextDisabled("2 \xd1\x86\xd0\xb2\xd0\xb5\xd1\x82\xd0\xb0"); // "2 цвета"

    {
        const char* ditherItems[] = { "Off", "Ordered", "Floyd-Steinberg" };
        int cur = static_cast<int>(m_settings.ditherMode);
        if (ImGui::Combo("\xd0\x94\xd0\xb8\xd0\xb7\xd0\xb5\xd1\x80\xd0\xb8\xd0\xbd\xd0\xb3",
                         &cur, ditherItems, 3)) { // "Дизеринг"
            m_settings.ditherMode = static_cast<DitherMode>(cur);
            m_settingsChanged = true;
        }
    }

    ImGui::Separator();

    // ---- Резкость деда (Sharpen) --------------------------------------------
    if (ImGui::SliderInt("\xd0\xa0\xd0\xb5\xd0\xb7\xd0\xba\xd0\xbe\xd1\x81\xd1\x82\xd1\x8c "
                         "\xd0\xb4\xd0\xb5\xd0\xb4\xd0\xb0",
                         &m_settings.sharpen, 0, 100)) { // "Резкость деда"
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- Разрешение (Resolution %) ------------------------------------------
    if (ImGui::SliderInt("\xd0\xa0\xd0\xb0\xd0\xb7\xd1\x80\xd0\xb5\xd1\x88\xd0\xb5\xd0\xbd\xd0\xb8\xd0\xb5 %",
                         &m_settings.resolution, 1, 100)) { // "Разрешение %"
        m_settingsChanged = true;
    }
    // Resolution preset buttons
    {
        int presets[] = { 64, 128, 256, 512, 1024 };
        for (int i = 0; i < 5; ++i) {
            if (i > 0) ImGui::SameLine();
            char label[16];
            snprintf(label, sizeof(label), "%d", presets[i]);
            if (ImGui::Button(label)) {
                if (m_sourceImage.width > 0) {
                    int pct = std::clamp(presets[i] * 100 / m_sourceImage.width, 1, 100);
                    m_settings.resolution = pct;
                } else {
                    m_settings.resolution = presets[i] * 100 / 1920;
                    if (m_settings.resolution < 1) m_settings.resolution = 1;
                }
                m_settingsChanged = true;
            }
        }
    }

    ImGui::Separator();

    // ---- Зыбучесть шакалов (Displacement) -----------------------------------
    if (ImGui::SliderInt("\xd0\x97\xd1\x8b\xd0\xb1\xd1\x83\xd1\x87\xd0\xb5\xd1\x81\xd1\x82\xd1\x8c "
                         "\xd1\x88\xd0\xb0\xd0\xba\xd0\xb0\xd0\xbb\xd0\xbe\xd0\xb2",
                         &m_settings.displacement, 0, 100)) { // "Зыбучесть шакалов"
        m_settingsChanged = true;
    }
    if (ImGui::InputInt("Seed##disp", &m_settings.displacementSeed)) {
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- JPEG quality -------------------------------------------------------
    if (ImGui::SliderInt("\xd0\x91\xd0\xb8\xd1\x82\xd1\x80\xd0\xb5\xd0\xb9\xd1\x82 JPEG",
                         &m_settings.jpegQuality, 1, 100)) { // "Битрейт JPEG"
        m_settingsChanged = true;
    }
    ImGui::Text("\xd0\xa6\xd0\xb8\xd0\xba\xd0\xbb\xd0\xb8\xd1\x87\xd0\xb5\xd1\x81\xd0\xba\xd0\xbe\xd0\xb5 "
                "\xd1\x81\xd0\xb6\xd0\xb0\xd1\x82\xd0\xb8\xd0\xb5"); // "Циклическое сжатие"
    if (ImGui::SliderInt("\xd0\x98\xd1\x82\xd0\xb5\xd1\x80\xd0\xb0\xd1\x86\xd0\xb8\xd0\xb8##jpeg",
                         &m_settings.jpegIterations, 1, 20)) { // "Итерации"
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- Шум (Noise) --------------------------------------------------------
    if (ImGui::SliderInt("\xd0\xa8\xd1\x83\xd0\xbc",
                         &m_settings.noiseIntensity, 0, 100)) { // "Шум"
        m_settingsChanged = true;
    }
    {
        const char* noiseItems[] = { "Gaussian", "Salt & Pepper", "Digital Banding" };
        int cur = static_cast<int>(m_settings.noiseType);
        if (ImGui::Combo("\xd0\xa2\xd0\xb8\xd0\xbf \xd1\x88\xd1\x83\xd0\xbc\xd0\xb0",
                         &cur, noiseItems, 3)) { // "Тип шума"
            m_settings.noiseType = static_cast<NoiseType>(cur);
            m_settingsChanged = true;
        }
    }
    if (ImGui::Checkbox("Per-channel##noise", &m_settings.noisePerChannel)) {
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- RGB shift ----------------------------------------------------------
    if (ImGui::SliderInt("RGB \xd1\x81\xd0\xb4\xd0\xb2\xd0\xb8\xd0\xb3",
                         &m_settings.rgbShiftAmount, 0, 100)) { // "RGB сдвиг"
        m_settingsChanged = true;
    }
    if (ImGui::Checkbox("X##rgb", &m_settings.rgbShiftX)) m_settingsChanged = true;
    ImGui::SameLine();
    if (ImGui::Checkbox("Y##rgb", &m_settings.rgbShiftY)) m_settingsChanged = true;

    ImGui::Separator();

    // ---- Glitch -------------------------------------------------------------
    if (ImGui::SliderInt("Glitch bands", &m_settings.glitchBands, 0, 50)) {
        m_settingsChanged = true;
    }
    if (ImGui::SliderInt("Glitch amplitude", &m_settings.glitchAmplitude, 0, 200)) {
        m_settingsChanged = true;
    }
    if (ImGui::InputInt("Seed##glitch", &m_settings.glitchSeed)) {
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- ПАЛИТРЫ (Palette) --------------------------------------------------
    {
        const char* palItems[] = {
            "None", "Game Boy", "NES", "Windows 98", "Thermal", "Mono Green", "Custom"
        };
        int cur = static_cast<int>(m_settings.palette);
        if (ImGui::Combo("\xd0\x9f\xd0\x90\xd0\x9b\xd0\x98\xd0\xa2\xd0\xa0\xd0\xab",
                         &cur, palItems, 7)) { // "ПАЛИТРЫ"
            m_settings.palette = static_cast<PalettePreset>(cur);
            m_settingsChanged = true;
        }
    }

    ImGui::Separator();

    // ---- Iterative destroy --------------------------------------------------
    if (ImGui::Checkbox("\xd0\x98\xd1\x82\xd0\xb5\xd1\x80\xd0\xb0\xd1\x82\xd0\xb8\xd0\xb2\xd0\xbd\xd0\xbe\xd0\xb5 "
                        "\xd1\x83\xd0\xbd\xd0\xb8\xd1\x87\xd1\x82\xd0\xbe\xd0\xb6\xd0\xb5\xd0\xbd\xd0\xb8\xd0\xb5",
                        &m_settings.iterativeDestroy)) { // "Итеративное уничтожение"
        m_settingsChanged = true;
    }
    if (m_settings.iterativeDestroy) {
        if (ImGui::SliderInt("\xd0\x9a\xd0\xbe\xd0\xbb-\xd0\xb2\xd0\xbe##iter",
                             &m_settings.iterativeCount, 1, 20)) { // "Кол-во"
            m_settingsChanged = true;
        }
    }

    ImGui::Separator();

    // ---- Watermark ----------------------------------------------------------
    if (ImGui::Checkbox("\xd0\x92\xd0\xbe\xd0\xb4\xd1\x8f\xd0\xbd\xd0\xbe\xd0\xb9 "
                        "\xd0\xb7\xd0\xbd\xd0\xb0\xd0\xba",
                        &m_settings.watermark)) { // "Водяной знак"
        m_settingsChanged = true;
    }
    if (m_settings.watermark) {
        char buf[256];
        snprintf(buf, sizeof(buf), "%s", m_settings.watermarkText.c_str());
        if (ImGui::InputText("\xd0\xa2\xd0\xb5\xd0\xba\xd1\x81\xd1\x82##wm",
                             buf, sizeof(buf))) { // "Текст"
            m_settings.watermarkText = buf;
            m_settingsChanged = true;
        }
    }

    ImGui::Separator();

    // ---- Strip EXIF ---------------------------------------------------------
    if (ImGui::Checkbox("Strip EXIF", &m_settings.stripExif)) {
        m_settingsChanged = true;
    }

    ImGui::Separator();

    // ---- Randomize / Reset --------------------------------------------------
    if (ImGui::Button("\xd0\xa1\xd0\xbb\xd1\x83\xd1\x87\xd0\xb0\xd0\xb9\xd0\xbd\xd1\x8b\xd0\xb9 "
                      "\xd0\xb3\xd0\xb5\xd0\xbd\xd0\xb5\xd1\x80\xd0\xb0\xd1\x82\xd0\xbe\xd1\x80",
                      ImVec2(-1, 0))) { // "Случайный генератор"
        randomizeSettings();
        m_settingsChanged = true;
    }
    if (ImGui::Button("\xd0\xa1\xd0\xb1\xd1\x80\xd0\xbe\xd1\x81",
                      ImVec2(-1, 0))) { // "Сброс"
        resetSettings();
        m_settingsChanged = true;
    }

    // ---- Undo / Redo buttons ------------------------------------------------
    ImGui::Separator();
    {
        bool canUndo = m_pipeline.canUndo();
        bool canRedo = m_pipeline.canRedo();
        if (!canUndo) ImGui::BeginDisabled();
        if (ImGui::Button("\xd0\x9e\xd1\x82\xd0\xbc\xd0\xb5\xd0\xbd\xd0\xb0",
                          ImVec2(ImGui::GetContentRegionAvail().x * 0.5f, 0))) { // "Отмена"
            ImageBuffer undoImg;
            m_settings = m_pipeline.undo(undoImg);
            if (undoImg.valid()) setProcessedImage(undoImg);
            m_settingsChanged = true;
        }
        if (!canUndo) ImGui::EndDisabled();

        ImGui::SameLine();

        if (!canRedo) ImGui::BeginDisabled();
        if (ImGui::Button("\xd0\x9f\xd0\xbe\xd0\xb2\xd1\x82\xd0\xbe\xd1\x80",
                          ImVec2(-1, 0))) { // "Повтор"
            ImageBuffer redoImg;
            m_settings = m_pipeline.redo(redoImg);
            if (redoImg.valid()) setProcessedImage(redoImg);
            m_settingsChanged = true;
        }
        if (!canRedo) ImGui::EndDisabled();
    }

    ImGui::End(); // "Панель управления"
}

// ---------------------------------------------------------------------------
// Preview area
// ---------------------------------------------------------------------------

void UI::renderPreview() {
    ImGui::Begin("\xd0\x9f\xd1\x80\xd0\xb5\xd0\xb4\xd0\xbf\xd1\x80\xd0\xbe\xd1\x81\xd0\xbc\xd0\xbe\xd1\x82\xd1\x80"); // "Предпросмотр"

    // Tab bar for before/after toggle
    if (ImGui::BeginTabBar("##preview_tabs")) {
        if (ImGui::BeginTabItem("\xd0\x94\xd0\xbe")) { // "До"
            m_showOriginal = true;
            ImGui::EndTabItem();
        }
        if (ImGui::BeginTabItem("\xd0\x9f\xd0\xbe\xd1\x81\xd0\xbb\xd0\xb5")) { // "После"
            m_showOriginal = false;
            ImGui::EndTabItem();
        }
        ImGui::EndTabBar();
    }

    // Zoom via mouse wheel
    if (ImGui::IsWindowHovered()) {
        float wheel = ImGui::GetIO().MouseWheel;
        if (wheel > 0.0f) m_zoom *= 1.1f;
        else if (wheel < 0.0f) m_zoom /= 1.1f;
        m_zoom = std::clamp(m_zoom, 0.1f, 20.0f);
    }

    // Determine which texture/image to show
    GLuint tex   = m_showOriginal ? m_sourceTexture : m_processedTexture;
    int    imgW  = m_showOriginal ? m_sourceImage.width : m_processedImage.width;
    int    imgH  = m_showOriginal ? m_sourceImage.height : m_processedImage.height;

    if (tex != 0 && imgW > 0 && imgH > 0) {
        ImVec2 dispSize(imgW * m_zoom, imgH * m_zoom);
        ImGui::Image((ImTextureID)(intptr_t)tex, dispSize);

        ImGui::Text("%dx%d  (zoom %.0f%%)", imgW, imgH, m_zoom * 100.0f);
    } else {
        ImGui::TextDisabled("\xd0\x9d\xd0\xb5\xd1\x82 "
                            "\xd0\xb8\xd0\xb7\xd0\xbe\xd0\xb1\xd1\x80\xd0\xb0\xd0\xb6\xd0\xb5\xd0\xbd\xd0\xb8\xd1\x8f"); // "Нет изображения"
    }

    ImGui::End(); // "Предпросмотр"
}

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

void UI::renderStatusBar() {
    ImGuiViewport* vp = ImGui::GetMainViewport();
    float h = ImGui::GetFrameHeight();
    ImGui::SetNextWindowPos(ImVec2(vp->WorkPos.x, vp->WorkPos.y + vp->WorkSize.y - h));
    ImGui::SetNextWindowSize(ImVec2(vp->WorkSize.x, h));
    ImGuiWindowFlags flags = ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoResize |
                             ImGuiWindowFlags_NoMove     | ImGuiWindowFlags_NoScrollbar |
                             ImGuiWindowFlags_NoSavedSettings;
    ImGui::Begin("##StatusBar", nullptr, flags);

    if (m_pipeline.isProcessing()) {
        ImGui::Text("\xd0\x9e\xd0\xb1\xd1\x80\xd0\xb0\xd0\xb1\xd0\xbe\xd1\x82\xd0\xba\xd0\xb0..."); // "Обработка..."
    } else if (m_sourceImage.valid()) {
        ImGui::Text("\xd0\x93\xd0\xbe\xd1\x82\xd0\xbe\xd0\xb2\xd0\xbe | %dx%d",
                    m_sourceImage.width, m_sourceImage.height); // "Готово | WxH"
    } else {
        ImGui::Text("\xd0\x97\xd0\xb0\xd0\xb3\xd1\x80\xd1\x83\xd0\xb7\xd0\xb8\xd1\x82\xd0\xb5 "
                    "\xd0\xb8\xd0\xb7\xd0\xbe\xd0\xb1\xd1\x80\xd0\xb0\xd0\xb6\xd0\xb5\xd0\xbd\xd0\xb8\xd0\xb5"); // "Загрузите изображение"
    }

    ImGui::End();
}

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

bool UI::loadImage(const char* path) {
    // Check file size
    FILE* f = fopen(path, "rb");
    if (!f) return false;
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fclose(f);
    if (sz > MAX_FILE_SIZE) return false;

    int w, h, ch;
    unsigned char* pixels = stbi_load(path, &w, &h, &ch, 4);
    if (!pixels) return false;

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        // Offer downscale: clamp to MAX_DIMENSION keeping aspect ratio
        float scale = std::min(static_cast<float>(MAX_DIMENSION) / w,
                               static_cast<float>(MAX_DIMENSION) / h);
        int nw = static_cast<int>(w * scale);
        int nh = static_cast<int>(h * scale);

        // Simple box downscale via a temporary buffer
        std::vector<uint8_t> tmp(nw * nh * 4);
        for (int y = 0; y < nh; ++y) {
            for (int x = 0; x < nw; ++x) {
                int sx = x * w / nw;
                int sy = y * h / nh;
                memcpy(&tmp[(y * nw + x) * 4], &pixels[(sy * w + sx) * 4], 4);
            }
        }
        stbi_image_free(pixels);
        m_sourceImage.width    = nw;
        m_sourceImage.height   = nh;
        m_sourceImage.channels = 4;
        m_sourceImage.data.assign(tmp.begin(), tmp.end());
    } else {
        m_sourceImage.width    = w;
        m_sourceImage.height   = h;
        m_sourceImage.channels = 4;
        m_sourceImage.data.assign(pixels, pixels + w * h * 4);
        stbi_image_free(pixels);
    }

    // Upload source texture
    if (m_sourceTexture) ShaderManager::deleteTexture(m_sourceTexture);
    m_sourceTexture = ShaderManager::createPreviewTexture(
        m_sourceImage.data.data(), m_sourceImage.width, m_sourceImage.height, 4);

    m_zoom = 1.0f;
    m_needsReprocess = true;
    return true;
}

bool UI::loadImageFromMemory(const unsigned char* data, int len) {
    if (len > MAX_FILE_SIZE) return false;

    int w, h, ch;
    unsigned char* pixels = stbi_load_from_memory(data, len, &w, &h, &ch, 4);
    if (!pixels) return false;

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        float scale = std::min(static_cast<float>(MAX_DIMENSION) / w,
                               static_cast<float>(MAX_DIMENSION) / h);
        int nw = static_cast<int>(w * scale);
        int nh = static_cast<int>(h * scale);
        std::vector<uint8_t> tmp(nw * nh * 4);
        for (int y = 0; y < nh; ++y) {
            for (int x = 0; x < nw; ++x) {
                int sx = x * w / nw;
                int sy = y * h / nh;
                memcpy(&tmp[(y * nw + x) * 4], &pixels[(sy * w + sx) * 4], 4);
            }
        }
        stbi_image_free(pixels);
        m_sourceImage.width    = nw;
        m_sourceImage.height   = nh;
        m_sourceImage.channels = 4;
        m_sourceImage.data.assign(tmp.begin(), tmp.end());
    } else {
        m_sourceImage.width    = w;
        m_sourceImage.height   = h;
        m_sourceImage.channels = 4;
        m_sourceImage.data.assign(pixels, pixels + w * h * 4);
        stbi_image_free(pixels);
    }

    if (m_sourceTexture) ShaderManager::deleteTexture(m_sourceTexture);
    m_sourceTexture = ShaderManager::createPreviewTexture(
        m_sourceImage.data.data(), m_sourceImage.width, m_sourceImage.height, 4);

    m_zoom = 1.0f;
    m_needsReprocess = true;
    return true;
}

// ---------------------------------------------------------------------------
// Processed image update
// ---------------------------------------------------------------------------

void UI::setProcessedImage(const ImageBuffer& img) {
    m_processedImage = img;
    if (!img.valid()) return;

    if (m_processedTexture) {
        ShaderManager::updatePreviewTexture(m_processedTexture,
            img.data.data(), img.width, img.height, img.channels);
    } else {
        m_processedTexture = ShaderManager::createPreviewTexture(
            img.data.data(), img.width, img.height, img.channels);
    }
}

// ---------------------------------------------------------------------------
// Settings persistence (simple INI-style)
// ---------------------------------------------------------------------------

void UI::saveSettings(const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return;
    fprintf(f, "hd8k=%d\n",            m_settings.hd8k ? 1 : 0);
    fprintf(f, "quantization=%d\n",     m_settings.quantization);
    fprintf(f, "ditherMode=%d\n",       static_cast<int>(m_settings.ditherMode));
    fprintf(f, "sharpen=%d\n",          m_settings.sharpen);
    fprintf(f, "resolution=%d\n",       m_settings.resolution);
    fprintf(f, "displacement=%d\n",     m_settings.displacement);
    fprintf(f, "displacementSeed=%d\n", m_settings.displacementSeed);
    fprintf(f, "jpegQuality=%d\n",      m_settings.jpegQuality);
    fprintf(f, "jpegIterations=%d\n",   m_settings.jpegIterations);
    fprintf(f, "noiseIntensity=%d\n",   m_settings.noiseIntensity);
    fprintf(f, "noiseType=%d\n",        static_cast<int>(m_settings.noiseType));
    fprintf(f, "noisePerChannel=%d\n",  m_settings.noisePerChannel ? 1 : 0);
    fprintf(f, "rgbShiftAmount=%d\n",   m_settings.rgbShiftAmount);
    fprintf(f, "rgbShiftX=%d\n",        m_settings.rgbShiftX ? 1 : 0);
    fprintf(f, "rgbShiftY=%d\n",        m_settings.rgbShiftY ? 1 : 0);
    fprintf(f, "glitchBands=%d\n",      m_settings.glitchBands);
    fprintf(f, "glitchAmplitude=%d\n",  m_settings.glitchAmplitude);
    fprintf(f, "glitchSeed=%d\n",       m_settings.glitchSeed);
    fprintf(f, "palette=%d\n",          static_cast<int>(m_settings.palette));
    fprintf(f, "iterativeDestroy=%d\n", m_settings.iterativeDestroy ? 1 : 0);
    fprintf(f, "iterativeCount=%d\n",   m_settings.iterativeCount);
    fprintf(f, "watermark=%d\n",        m_settings.watermark ? 1 : 0);
    fprintf(f, "watermarkText=%s\n",    m_settings.watermarkText.c_str());
    fprintf(f, "randomSeed=%d\n",       m_settings.randomSeed);
    fprintf(f, "stripExif=%d\n",        m_settings.stripExif ? 1 : 0);
    fclose(f);
}

void UI::loadSettings(const char* path) {
    FILE* f = fopen(path, "r");
    if (!f) return;

    char line[512];
    while (fgets(line, sizeof(line), f)) {
        char key[128];
        char val[384];
        if (sscanf(line, "%127[^=]=%383[^\n]", key, val) != 2) continue;

        int iv = atoi(val);
        if      (strcmp(key, "hd8k") == 0)            m_settings.hd8k = iv != 0;
        else if (strcmp(key, "quantization") == 0)     m_settings.quantization = iv;
        else if (strcmp(key, "ditherMode") == 0)       m_settings.ditherMode = static_cast<DitherMode>(iv);
        else if (strcmp(key, "sharpen") == 0)          m_settings.sharpen = iv;
        else if (strcmp(key, "resolution") == 0)       m_settings.resolution = iv;
        else if (strcmp(key, "displacement") == 0)     m_settings.displacement = iv;
        else if (strcmp(key, "displacementSeed") == 0) m_settings.displacementSeed = iv;
        else if (strcmp(key, "jpegQuality") == 0)      m_settings.jpegQuality = iv;
        else if (strcmp(key, "jpegIterations") == 0)   m_settings.jpegIterations = iv;
        else if (strcmp(key, "noiseIntensity") == 0)   m_settings.noiseIntensity = iv;
        else if (strcmp(key, "noiseType") == 0)        m_settings.noiseType = static_cast<NoiseType>(iv);
        else if (strcmp(key, "noisePerChannel") == 0)  m_settings.noisePerChannel = iv != 0;
        else if (strcmp(key, "rgbShiftAmount") == 0)   m_settings.rgbShiftAmount = iv;
        else if (strcmp(key, "rgbShiftX") == 0)        m_settings.rgbShiftX = iv != 0;
        else if (strcmp(key, "rgbShiftY") == 0)        m_settings.rgbShiftY = iv != 0;
        else if (strcmp(key, "glitchBands") == 0)      m_settings.glitchBands = iv;
        else if (strcmp(key, "glitchAmplitude") == 0)  m_settings.glitchAmplitude = iv;
        else if (strcmp(key, "glitchSeed") == 0)       m_settings.glitchSeed = iv;
        else if (strcmp(key, "palette") == 0)          m_settings.palette = static_cast<PalettePreset>(iv);
        else if (strcmp(key, "iterativeDestroy") == 0) m_settings.iterativeDestroy = iv != 0;
        else if (strcmp(key, "iterativeCount") == 0)   m_settings.iterativeCount = iv;
        else if (strcmp(key, "watermark") == 0)        m_settings.watermark = iv != 0;
        else if (strcmp(key, "watermarkText") == 0)    m_settings.watermarkText = val;
        else if (strcmp(key, "randomSeed") == 0)       m_settings.randomSeed = iv;
        else if (strcmp(key, "stripExif") == 0)        m_settings.stripExif = iv != 0;
    }
    fclose(f);
    m_needsReprocess = true;
}

// ---------------------------------------------------------------------------
// Native file dialogs
// ---------------------------------------------------------------------------

std::string UI::showOpenDialog() {
#ifdef _WIN32
    char filename[MAX_PATH] = {};
    OPENFILENAMEA ofn = {};
    ofn.lStructSize = sizeof(ofn);
    ofn.lpstrFilter = "Images\0*.png;*.jpg;*.jpeg;*.bmp;*.tga\0All\0*.*\0";
    ofn.lpstrFile   = filename;
    ofn.nMaxFile    = MAX_PATH;
    ofn.Flags       = OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;
    if (GetOpenFileNameA(&ofn)) return std::string(filename);
    return {};
#else
    // Try zenity if available
    FILE* p = popen("zenity --file-selection --file-filter='Images|*.png *.jpg *.jpeg *.bmp *.tga' 2>/dev/null", "r");
    if (p) {
        char buf[1024] = {};
        if (fgets(buf, sizeof(buf), p)) {
            pclose(p);
            // Strip trailing newline
            size_t len = strlen(buf);
            if (len > 0 && buf[len - 1] == '\n') buf[len - 1] = '\0';
            return std::string(buf);
        }
        pclose(p);
    }
    return {};
#endif
}

std::string UI::showSaveDialog() {
#ifdef _WIN32
    char filename[MAX_PATH] = {};
    OPENFILENAMEA ofn = {};
    ofn.lStructSize  = sizeof(ofn);
    ofn.lpstrFilter  = "PNG\0*.png\0JPEG\0*.jpg;*.jpeg\0BMP\0*.bmp\0All\0*.*\0";
    ofn.lpstrFile    = filename;
    ofn.nMaxFile     = MAX_PATH;
    ofn.Flags        = OFN_OVERWRITEPROMPT | OFN_NOCHANGEDIR;
    ofn.lpstrDefExt  = "png";
    if (GetSaveFileNameA(&ofn)) return std::string(filename);
    return {};
#else
    FILE* p = popen("zenity --file-selection --save --confirm-overwrite "
                    "--file-filter='Images|*.png *.jpg *.jpeg *.bmp' 2>/dev/null", "r");
    if (p) {
        char buf[1024] = {};
        if (fgets(buf, sizeof(buf), p)) {
            pclose(p);
            size_t len = strlen(buf);
            if (len > 0 && buf[len - 1] == '\n') buf[len - 1] = '\0';
            return std::string(buf);
        }
        pclose(p);
    }
    return {};
#endif
}

// ---------------------------------------------------------------------------
// Randomize / Reset
// ---------------------------------------------------------------------------

void UI::randomizeSettings() {
    std::mt19937 rng;
    if (m_settings.randomSeed != 0) {
        rng.seed(static_cast<unsigned>(m_settings.randomSeed));
    } else {
        std::random_device rd;
        rng.seed(rd());
    }

    auto randInt = [&](int lo, int hi) {
        return std::uniform_int_distribution<int>(lo, hi)(rng);
    };

    m_settings.hd8k             = randInt(0, 1) != 0;
    m_settings.quantization     = randInt(0, 100);
    m_settings.ditherMode       = static_cast<DitherMode>(randInt(0, 2));
    m_settings.sharpen          = randInt(0, 100);
    m_settings.resolution       = randInt(10, 100);
    m_settings.displacement     = randInt(0, 100);
    m_settings.displacementSeed = randInt(0, 99999);
    m_settings.jpegQuality      = randInt(1, 100);
    m_settings.jpegIterations   = randInt(1, 10);
    m_settings.noiseIntensity   = randInt(0, 100);
    m_settings.noiseType        = static_cast<NoiseType>(randInt(0, 2));
    m_settings.noisePerChannel  = randInt(0, 1) != 0;
    m_settings.rgbShiftAmount   = randInt(0, 50);
    m_settings.rgbShiftX        = randInt(0, 1) != 0;
    m_settings.rgbShiftY        = randInt(0, 1) != 0;
    m_settings.glitchBands      = randInt(0, 30);
    m_settings.glitchAmplitude  = randInt(0, 100);
    m_settings.glitchSeed       = randInt(0, 99999);
    m_settings.palette          = static_cast<PalettePreset>(randInt(0, 5));
}

void UI::resetSettings() {
    m_settings = Settings{};
}
