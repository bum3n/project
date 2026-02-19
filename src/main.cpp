#include "UI.h"
#include "ShaderManager.h"
#include "ImageProcessor.h"

#include "imgui.h"
#include "imgui_impl_glfw.h"
#include "imgui_impl_opengl3.h"

#include <GLFW/glfw3.h>
#include "stb_image_write.h"

#include <cstdio>
#include <cstring>
#include <string>
#include <filesystem>

#ifdef _WIN32
#include <windows.h>
#endif

// ---------------------------------------------------------------------------
// Utility: get the directory containing the running executable
// ---------------------------------------------------------------------------
static std::string getExeDirectory() {
#ifdef _WIN32
    char buf[MAX_PATH];
    DWORD len = GetModuleFileNameA(nullptr, buf, MAX_PATH);
    if (len == 0) return ".";
    std::string p(buf, len);
    auto pos = p.find_last_of("\\/");
    return (pos != std::string::npos) ? p.substr(0, pos) : ".";
#else
    char buf[4096];
    ssize_t len = readlink("/proc/self/exe", buf, sizeof(buf) - 1);
    if (len <= 0) return ".";
    buf[len] = '\0';
    std::string p(buf);
    auto pos = p.find_last_of('/');
    return (pos != std::string::npos) ? p.substr(0, pos) : ".";
#endif
}

// ---------------------------------------------------------------------------
// Drag-and-drop support: stored via GLFW window user pointer
// ---------------------------------------------------------------------------
struct AppState {
    std::string droppedFile;
    UI* ui = nullptr;
};

static void dropCallback(GLFWwindow* w, int count, const char** paths) {
    if (count < 1) return;
    auto* state = static_cast<AppState*>(glfwGetWindowUserPointer(w));
    if (state) state->droppedFile = paths[0];
}

// ---------------------------------------------------------------------------
// Clipboard image paste (Windows only)
// ---------------------------------------------------------------------------
#ifdef _WIN32
static bool tryPasteClipboardImage(UI& ui) {
    if (!OpenClipboard(nullptr)) return false;
    HANDLE hDib = GetClipboardData(CF_DIB);
    if (!hDib) { CloseClipboard(); return false; }

    auto* bih = static_cast<BITMAPINFOHEADER*>(GlobalLock(hDib));
    if (!bih) { CloseClipboard(); return false; }

    SIZE_T totalSize = GlobalSize(hDib);
    auto* rawBytes = reinterpret_cast<const unsigned char*>(bih);

    // Build a minimal BMP in memory so stb_image can decode it
    std::vector<unsigned char> bmp;
    BITMAPFILEHEADER bfh{};
    bfh.bfType = 0x4D42; // "BM"
    bfh.bfSize = static_cast<DWORD>(sizeof(bfh) + totalSize);
    bfh.bfOffBits = sizeof(bfh) + bih->biSize;

    bmp.resize(sizeof(bfh) + totalSize);
    std::memcpy(bmp.data(), &bfh, sizeof(bfh));
    std::memcpy(bmp.data() + sizeof(bfh), rawBytes, totalSize);

    GlobalUnlock(hDib);
    CloseClipboard();

    return ui.loadImageFromMemory(bmp.data(), static_cast<int>(bmp.size()));
}
#endif

// ---------------------------------------------------------------------------
// Save processed image to file
// ---------------------------------------------------------------------------
static bool saveImage(const ImageBuffer& img, const std::string& path) {
    if (!img.valid() || path.empty()) return false;

    auto ext = std::filesystem::path(path).extension().string();
    for (auto& c : ext) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));

    int ok = 0;
    if (ext == ".png") {
        ok = stbi_write_png(path.c_str(), img.width, img.height, img.channels,
                            img.data.data(), img.width * img.channels);
    } else if (ext == ".jpg" || ext == ".jpeg") {
        ok = stbi_write_jpg(path.c_str(), img.width, img.height, img.channels,
                            img.data.data(), 90);
    } else if (ext == ".bmp") {
        ok = stbi_write_bmp(path.c_str(), img.width, img.height, img.channels,
                            img.data.data());
    } else {
        // Default to PNG
        ok = stbi_write_png(path.c_str(), img.width, img.height, img.channels,
                            img.data.data(), img.width * img.channels);
    }
    return ok != 0;
}

// ---------------------------------------------------------------------------
// GLFW error callback
// ---------------------------------------------------------------------------
static void glfwErrorCb(int /*error*/, const char* description) {
    std::fprintf(stderr, "GLFW error: %s\n", description);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
int main(int /*argc*/, char** /*argv*/) {
    glfwSetErrorCallback(glfwErrorCb);
    if (!glfwInit()) {
        std::fprintf(stderr, "Failed to initialize GLFW\n");
        return 1;
    }

    // OpenGL 3.3 Core
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#endif

    GLFWwindow* window = glfwCreateWindow(
        1280, 800,
        "\xd0\xa8\xd0\xb0\xd0\xba\xd0\xb0\xd0\xbb\xd1\x8c\xd0\xbd\xd0\xbe\xd1\x81\xd1\x82\xd1\x8c"
        " - "
        "\xd0\x9c\xd0\xb5\xd0\xbc-\xd1\x80\xd0\xb5\xd0\xb4\xd0\xb0\xd0\xba\xd1\x82\xd0\xbe\xd1\x80",
        nullptr, nullptr);
    if (!window) {
        std::fprintf(stderr, "Failed to create GLFW window\n");
        glfwTerminate();
        return 1;
    }

    glfwMakeContextCurrent(window);
    glfwSwapInterval(1); // vsync

    // Initialize OpenGL helpers
    if (!ShaderManager::init()) {
        std::fprintf(stderr, "Warning: ShaderManager::init() failed\n");
    }

    // Dear ImGui setup
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;
    ImGui::StyleColorsDark();

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");

    // Application state
    AppState appState;
    UI ui;
    appState.ui = &ui;
    ui.init();

    glfwSetWindowUserPointer(window, &appState);
    glfwSetDropCallback(window, dropCallback);

    // Load persisted settings
    std::string exeDir = getExeDirectory();
    std::string iniPath = exeDir + "/shakalnost_settings.ini";
    ui.loadSettings(iniPath.c_str());

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();

        // Start ImGui frame
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // Keyboard shortcuts (after NewFrame so ImGui state is current)
#ifdef _WIN32
        if (io.KeyCtrl && ImGui::IsKeyPressed(ImGuiKey_V)) {
            tryPasteClipboardImage(ui);
        }
#endif
        if (io.KeyCtrl && ImGui::IsKeyPressed(ImGuiKey_Z) && !io.KeyShift) {
            if (ui.getPipeline().canUndo()) {
                ImageBuffer undoImg;
                Settings s = ui.getPipeline().undo(undoImg);
                ui.getSettings() = s;
                ui.setProcessedImage(undoImg);
            }
        }
        if (io.KeyCtrl &&
            (ImGui::IsKeyPressed(ImGuiKey_Y) ||
             (ImGui::IsKeyPressed(ImGuiKey_Z) && io.KeyShift))) {
            if (ui.getPipeline().canRedo()) {
                ImageBuffer redoImg;
                Settings s = ui.getPipeline().redo(redoImg);
                ui.getSettings() = s;
                ui.setProcessedImage(redoImg);
            }
        }

        // Render UI
        ui.render();

        // Handle load requests
        if (ui.wantsLoad()) {
            ui.clearLoadFlag();
            std::string path = ui.getLoadPath();
            if (path.empty()) path = ui.showOpenDialog();
            if (!path.empty()) ui.loadImage(path.c_str());
        }

        // Handle save requests
        if (ui.wantsSave()) {
            ui.clearSaveFlag();
            std::string path = ui.showSaveDialog();
            if (!path.empty()) {
                const ImageBuffer& img = ui.getProcessedImage().valid()
                    ? ui.getProcessedImage()
                    : ui.getSourceImage();
                saveImage(img, path);
            }
        }

        // Submit processing when settings changed and debounce allows
        if (ui.needsReprocess() && ui.getPipeline().shouldUpdate()) {
            ui.clearReprocessFlag();
            ui.getPipeline().markSubmitTime();
            ui.getPipeline().submit(
                ui.getSourceImage(), ui.getSettings(),
                [&ui](ImageBuffer result) {
                    ui.setProcessedImage(result);
                });
        }

        // Poll pipeline for completed async results
        ui.getPipeline().poll();

        // Handle drag-and-drop
        if (!appState.droppedFile.empty()) {
            ui.loadImage(appState.droppedFile.c_str());
            appState.droppedFile.clear();
        }

        // GL render
        ImGui::Render();
        int display_w, display_h;
        glfwGetFramebufferSize(window, &display_w, &display_h);
        glViewport(0, 0, display_w, display_h);
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(window);
    }

    // ------------------------------------------------------------------
    // Cleanup
    // ------------------------------------------------------------------
    ui.saveSettings(iniPath.c_str());

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    ShaderManager::shutdown();
    glfwDestroyWindow(window);
    glfwTerminate();

    return 0;
}

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
    return main(0, nullptr);
}
#endif
