#pragma once
#include "ImageProcessor.h"
#include <future>
#include <atomic>
#include <mutex>
#include <vector>
#include <deque>
#include <functional>
#include <chrono>

class Pipeline {
public:
    Pipeline();
    ~Pipeline();

    // Submit a new processing request. Cancels any in-progress one.
    // The callback is called on completion with the result.
    void submit(const ImageBuffer& source, const Settings& settings,
                std::function<void(ImageBuffer)> onComplete);

    // Cancel current processing
    void cancel();

    // Check if currently processing
    bool isProcessing() const;

    // Poll for completed results (call from main thread)
    void poll();

    // Undo/Redo support (up to 10 steps)
    void pushState(const Settings& settings, const ImageBuffer& result);
    bool canUndo() const;
    bool canRedo() const;
    Settings undo(ImageBuffer& outImage);
    Settings redo(ImageBuffer& outImage);
    void clearHistory();

    // Debounce support - returns true if enough time has passed since last submit
    bool shouldUpdate(int debounceMs = 100) const;
    void markSubmitTime();

private:
    struct HistoryEntry {
        Settings settings;
        ImageBuffer image;
    };

    std::atomic<bool> m_cancel{false};
    std::atomic<bool> m_processing{false};
    std::future<ImageBuffer> m_future;
    std::function<void(ImageBuffer)> m_callback;

    std::deque<HistoryEntry> m_undoStack;
    std::deque<HistoryEntry> m_redoStack;
    static constexpr int MAX_HISTORY = 10;

    std::chrono::steady_clock::time_point m_lastSubmitTime;
    mutable std::mutex m_mutex;
};
