#include "Pipeline.h"
#include <thread>

Pipeline::Pipeline()
    : m_lastSubmitTime(std::chrono::steady_clock::now()) {}

Pipeline::~Pipeline() {
    m_cancel.store(true);
    if (m_future.valid())
        m_future.wait();
}

void Pipeline::submit(const ImageBuffer& source, const Settings& settings,
                      std::function<void(ImageBuffer)> onComplete) {
    // Cancel any in-progress work
    m_cancel.store(true);
    if (m_future.valid()) {
        m_future.wait();
    }

    m_cancel.store(false);
    m_processing.store(true);
    m_callback = std::move(onComplete);

    m_future = std::async(std::launch::async,
        [this, source, settings]() {
            return ImageProcessor::processImage(source, settings, m_cancel);
        });

    markSubmitTime();
}

void Pipeline::cancel() {
    m_cancel.store(true);
}

bool Pipeline::isProcessing() const {
    return m_processing.load();
}

void Pipeline::poll() {
    if (!m_future.valid() || !m_processing.load())
        return;

    auto status = m_future.wait_for(std::chrono::seconds(0));
    if (status == std::future_status::ready) {
        m_processing.store(false);
        ImageBuffer result = m_future.get();
        if (m_callback)
            m_callback(std::move(result));
    }
}

void Pipeline::pushState(const Settings& settings, const ImageBuffer& result) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (static_cast<int>(m_undoStack.size()) >= MAX_HISTORY)
        m_undoStack.pop_front();
    m_undoStack.push_back({settings, result});
    m_redoStack.clear();
}

bool Pipeline::canUndo() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return !m_undoStack.empty();
}

bool Pipeline::canRedo() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return !m_redoStack.empty();
}

Settings Pipeline::undo(ImageBuffer& outImage) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_undoStack.empty())
        return Settings{};

    HistoryEntry entry = m_undoStack.back();
    m_undoStack.pop_back();

    if (static_cast<int>(m_redoStack.size()) >= MAX_HISTORY)
        m_redoStack.pop_front();

    outImage = entry.image;
    Settings result = entry.settings;
    m_redoStack.push_back(std::move(entry));
    return result;
}

Settings Pipeline::redo(ImageBuffer& outImage) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_redoStack.empty())
        return Settings{};

    HistoryEntry entry = m_redoStack.back();
    m_redoStack.pop_back();

    if (static_cast<int>(m_undoStack.size()) >= MAX_HISTORY)
        m_undoStack.pop_front();

    outImage = entry.image;
    Settings result = entry.settings;
    m_undoStack.push_back(std::move(entry));
    return result;
}

void Pipeline::clearHistory() {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_undoStack.clear();
    m_redoStack.clear();
}

bool Pipeline::shouldUpdate(int debounceMs) const {
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        now - m_lastSubmitTime).count();
    return elapsed >= debounceMs;
}

void Pipeline::markSubmitTime() {
    m_lastSubmitTime = std::chrono::steady_clock::now();
}
