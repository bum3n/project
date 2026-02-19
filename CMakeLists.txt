cmake_minimum_required(VERSION 3.20)
project("Шакальность" LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# GLFW
set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

FetchContent_Declare(
    glfw
    GIT_REPOSITORY https://github.com/glfw/glfw.git
    GIT_TAG        3.4
)

# Dear ImGui
FetchContent_Declare(
    imgui
    GIT_REPOSITORY https://github.com/ocornut/imgui.git
    GIT_TAG        v1.91.8
)

FetchContent_MakeAvailable(glfw imgui)

# Build Dear ImGui as a static library
add_library(imgui_lib STATIC
    ${imgui_SOURCE_DIR}/imgui.cpp
    ${imgui_SOURCE_DIR}/imgui_draw.cpp
    ${imgui_SOURCE_DIR}/imgui_tables.cpp
    ${imgui_SOURCE_DIR}/imgui_widgets.cpp
    ${imgui_SOURCE_DIR}/imgui_demo.cpp
    ${imgui_SOURCE_DIR}/backends/imgui_impl_glfw.cpp
    ${imgui_SOURCE_DIR}/backends/imgui_impl_opengl3.cpp
)

target_include_directories(imgui_lib PUBLIC
    ${imgui_SOURCE_DIR}
    ${imgui_SOURCE_DIR}/backends
)

target_link_libraries(imgui_lib PUBLIC glfw)

# Application sources
set(APP_SOURCES
    src/main.cpp
    src/UI.cpp
    src/ImageProcessor.cpp
    src/ShaderManager.cpp
    src/Pipeline.cpp
)

if(WIN32)
    add_executable(Shakalnost WIN32 ${APP_SOURCES})
else()
    add_executable(Shakalnost ${APP_SOURCES})
endif()

target_include_directories(Shakalnost PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/third_party/stb
)

target_link_libraries(Shakalnost PRIVATE imgui_lib glfw)

if(WIN32)
    target_link_libraries(Shakalnost PRIVATE opengl32 gdi32 shell32 comdlg32)
elseif(UNIX)
    target_link_libraries(Shakalnost PRIVATE GL X11 pthread dl)
endif()

# Compiler flags
if(MSVC)
    target_compile_options(Shakalnost PRIVATE /utf-8)
    target_compile_options(Shakalnost PRIVATE $<$<CONFIG:Release>:/O2>)
    target_compile_options(imgui_lib PRIVATE /utf-8)
    target_compile_options(imgui_lib PRIVATE $<$<CONFIG:Release>:/O2>)
else()
    target_compile_options(Shakalnost PRIVATE $<$<CONFIG:Release>:-O2>)
    target_compile_options(imgui_lib PRIVATE $<$<CONFIG:Release>:-O2>)
endif()
