#include "ShaderManager.h"

#define GLFW_INCLUDE_NONE
#include <GLFW/glfw3.h>

#include <cstdio>
#include <cstring>
#include <vector>

// ---------------------------------------------------------------------------
// GL type definitions
// ---------------------------------------------------------------------------
typedef unsigned int GLenum;
typedef unsigned int GLbitfield;
typedef unsigned int GLuint;
typedef int GLint;
typedef int GLsizei;
typedef float GLfloat;
typedef char GLchar;
typedef unsigned char GLboolean;
typedef signed long long int GLsizeiptr;
typedef void GLvoid;

// ---------------------------------------------------------------------------
// GL constants
// ---------------------------------------------------------------------------
#define GL_FALSE                          0
#define GL_TRUE                           1
#define GL_TRIANGLES                      0x0004
#define GL_UNSIGNED_BYTE                  0x1401
#define GL_FLOAT                          0x1406
#define GL_RGB                            0x1907
#define GL_RGBA                           0x1908
#define GL_LINEAR                         0x2601
#define GL_TEXTURE_MAG_FILTER             0x2800
#define GL_TEXTURE_MIN_FILTER             0x2801
#define GL_TEXTURE_WRAP_S                 0x2802
#define GL_TEXTURE_WRAP_T                 0x2803
#define GL_TEXTURE_2D                     0x0DE1
#define GL_TEXTURE0                       0x84C0
#define GL_CLAMP_TO_EDGE                  0x812F
#define GL_FRAGMENT_SHADER                0x8B30
#define GL_VERTEX_SHADER                  0x8B31
#define GL_COMPILE_STATUS                 0x8B81
#define GL_LINK_STATUS                    0x8B82
#define GL_ARRAY_BUFFER                   0x8892
#define GL_STATIC_DRAW                    0x88E4
#define GL_FRAMEBUFFER                    0x8D40
#define GL_COLOR_ATTACHMENT0              0x8CE0
#define GL_FRAMEBUFFER_COMPLETE           0x8CD5
#define GL_COLOR_BUFFER_BIT               0x00004000

// ---------------------------------------------------------------------------
// GL function pointer types and storage
// ---------------------------------------------------------------------------
#define DECL_GL(ret, name, ...) \
    typedef ret (*PFN_##name)(__VA_ARGS__); \
    static PFN_##name name##_ = nullptr;

DECL_GL(GLuint, glCreateShader, GLenum)
DECL_GL(void,   glShaderSource, GLuint, GLsizei, const GLchar* const*, const GLint*)
DECL_GL(void,   glCompileShader, GLuint)
DECL_GL(void,   glGetShaderiv, GLuint, GLenum, GLint*)
DECL_GL(void,   glGetShaderInfoLog, GLuint, GLsizei, GLsizei*, GLchar*)
DECL_GL(GLuint, glCreateProgram)
DECL_GL(void,   glAttachShader, GLuint, GLuint)
DECL_GL(void,   glLinkProgram, GLuint)
DECL_GL(void,   glGetProgramiv, GLuint, GLenum, GLint*)
DECL_GL(void,   glGetProgramInfoLog, GLuint, GLsizei, GLsizei*, GLchar*)
DECL_GL(void,   glDeleteShader, GLuint)
DECL_GL(void,   glDeleteProgram, GLuint)
DECL_GL(void,   glUseProgram, GLuint)
DECL_GL(GLint,  glGetUniformLocation, GLuint, const GLchar*)
DECL_GL(void,   glUniform1i, GLint, GLint)
DECL_GL(void,   glUniform1f, GLint, GLfloat)
DECL_GL(void,   glUniform2f, GLint, GLfloat, GLfloat)
DECL_GL(void,   glGenTextures, GLsizei, GLuint*)
DECL_GL(void,   glBindTexture, GLenum, GLuint)
DECL_GL(void,   glTexImage2D, GLenum, GLint, GLint, GLsizei, GLsizei, GLint, GLenum, GLenum, const void*)
DECL_GL(void,   glTexParameteri, GLenum, GLenum, GLint)
DECL_GL(void,   glDeleteTextures, GLsizei, const GLuint*)
DECL_GL(void,   glActiveTexture, GLenum)
DECL_GL(void,   glGenFramebuffers, GLsizei, GLuint*)
DECL_GL(void,   glBindFramebuffer, GLenum, GLuint)
DECL_GL(void,   glFramebufferTexture2D, GLenum, GLenum, GLenum, GLuint, GLint)
DECL_GL(GLenum, glCheckFramebufferStatus, GLenum)
DECL_GL(void,   glDeleteFramebuffers, GLsizei, const GLuint*)
DECL_GL(void,   glReadPixels, GLint, GLint, GLsizei, GLsizei, GLenum, GLenum, void*)
DECL_GL(void,   glViewport, GLint, GLint, GLsizei, GLsizei)
DECL_GL(void,   glClear, GLbitfield)
DECL_GL(void,   glGenVertexArrays, GLsizei, GLuint*)
DECL_GL(void,   glBindVertexArray, GLuint)
DECL_GL(void,   glGenBuffers, GLsizei, GLuint*)
DECL_GL(void,   glBindBuffer, GLenum, GLuint)
DECL_GL(void,   glBufferData, GLenum, GLsizeiptr, const void*, GLenum)
DECL_GL(void,   glVertexAttribPointer, GLuint, GLint, GLenum, GLboolean, GLsizei, const void*)
DECL_GL(void,   glEnableVertexAttribArray, GLuint)
DECL_GL(void,   glDeleteBuffers, GLsizei, const GLuint*)
DECL_GL(void,   glDeleteVertexArrays, GLsizei, const GLuint*)
DECL_GL(void,   glDrawArrays, GLenum, GLint, GLsizei)

#undef DECL_GL

// ---------------------------------------------------------------------------
// Helper to load a single GL function pointer
// ---------------------------------------------------------------------------
#define LOAD_GL(name) \
    name##_ = reinterpret_cast<PFN_##name>(glfwGetProcAddress(#name)); \
    if (!name##_) return false;

static bool s_initialized = false;

// ---------------------------------------------------------------------------
// Embedded shaders
// ---------------------------------------------------------------------------

static const char* kVertexShaderSrc = R"glsl(
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec2 aTexCoord;
out vec2 TexCoord;
void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
    TexCoord = aTexCoord;
}
)glsl";

static const char* kFragmentShaderSrc = R"glsl(
#version 330 core
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
uniform float uAmount;
uniform float uSeed;
uniform vec2 uResolution;

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1 + uSeed, 311.7 + uSeed)),
             dot(p, vec2(269.5 + uSeed, 183.3 + uSeed)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i + vec2(0,0)), f - vec2(0,0)),
                   dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
               mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)),
                   dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}

void main() {
    vec2 uv = TexCoord;
    float strength = uAmount / 100.0;
    float scale = 4.0 + strength * 8.0;
    vec2 offset = vec2(
        noise(uv * scale + vec2(0.0, 0.0)),
        noise(uv * scale + vec2(100.0, 100.0))
    ) * strength * 0.15;

    vec2 displaced = clamp(uv + offset, 0.0, 1.0);
    FragColor = texture(uTexture, displaced);
}
)glsl";

// Fullscreen quad: 2 triangles covering [-1,1] with UV [0,1]
static const float kQuadVertices[] = {
    // pos        // uv
    -1.f, -1.f,   0.f, 0.f,
     1.f, -1.f,   1.f, 0.f,
     1.f,  1.f,   1.f, 1.f,
    -1.f, -1.f,   0.f, 0.f,
     1.f,  1.f,   1.f, 1.f,
    -1.f,  1.f,   0.f, 1.f,
};

// Quad VAO/VBO, lazily created
static GLuint s_quadVAO = 0;
static GLuint s_quadVBO = 0;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

static void ensureQuad() {
    if (s_quadVAO) return;
    glGenVertexArrays_(1, &s_quadVAO);
    glGenBuffers_(1, &s_quadVBO);
    glBindVertexArray_(s_quadVAO);
    glBindBuffer_(GL_ARRAY_BUFFER, s_quadVBO);
    glBufferData_(GL_ARRAY_BUFFER, sizeof(kQuadVertices), kQuadVertices, GL_STATIC_DRAW);
    glVertexAttribPointer_(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), nullptr);
    glEnableVertexAttribArray_(0);
    glVertexAttribPointer_(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float),
                           reinterpret_cast<const void*>(2 * sizeof(float)));
    glEnableVertexAttribArray_(1);
    glBindVertexArray_(0);
}

static GLuint compileShader(GLenum type, const char* source) {
    GLuint shader = glCreateShader_(type);
    glShaderSource_(shader, 1, &source, nullptr);
    glCompileShader_(shader);

    GLint success = 0;
    glGetShaderiv_(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char log[512];
        glGetShaderInfoLog_(shader, sizeof(log), nullptr, log);
        std::fprintf(stderr, "ShaderManager: compile error:\n%s\n", log);
        glDeleteShader_(shader);
        return 0;
    }
    return shader;
}

static GLuint linkProgram(GLuint vert, GLuint frag) {
    GLuint prog = glCreateProgram_();
    glAttachShader_(prog, vert);
    glAttachShader_(prog, frag);
    glLinkProgram_(prog);

    GLint success = 0;
    glGetProgramiv_(prog, GL_LINK_STATUS, &success);
    if (!success) {
        char log[512];
        glGetProgramInfoLog_(prog, sizeof(log), nullptr, log);
        std::fprintf(stderr, "ShaderManager: link error:\n%s\n", log);
        glDeleteProgram_(prog);
        return 0;
    }
    return prog;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

namespace ShaderManager {

bool init() {
    if (s_initialized) return true;

    LOAD_GL(glCreateShader)
    LOAD_GL(glShaderSource)
    LOAD_GL(glCompileShader)
    LOAD_GL(glGetShaderiv)
    LOAD_GL(glGetShaderInfoLog)
    LOAD_GL(glCreateProgram)
    LOAD_GL(glAttachShader)
    LOAD_GL(glLinkProgram)
    LOAD_GL(glGetProgramiv)
    LOAD_GL(glGetProgramInfoLog)
    LOAD_GL(glDeleteShader)
    LOAD_GL(glDeleteProgram)
    LOAD_GL(glUseProgram)
    LOAD_GL(glGetUniformLocation)
    LOAD_GL(glUniform1i)
    LOAD_GL(glUniform1f)
    LOAD_GL(glUniform2f)
    LOAD_GL(glGenTextures)
    LOAD_GL(glBindTexture)
    LOAD_GL(glTexImage2D)
    LOAD_GL(glTexParameteri)
    LOAD_GL(glDeleteTextures)
    LOAD_GL(glActiveTexture)
    LOAD_GL(glGenFramebuffers)
    LOAD_GL(glBindFramebuffer)
    LOAD_GL(glFramebufferTexture2D)
    LOAD_GL(glCheckFramebufferStatus)
    LOAD_GL(glDeleteFramebuffers)
    LOAD_GL(glReadPixels)
    LOAD_GL(glViewport)
    LOAD_GL(glClear)
    LOAD_GL(glGenVertexArrays)
    LOAD_GL(glBindVertexArray)
    LOAD_GL(glGenBuffers)
    LOAD_GL(glBindBuffer)
    LOAD_GL(glBufferData)
    LOAD_GL(glVertexAttribPointer)
    LOAD_GL(glEnableVertexAttribArray)
    LOAD_GL(glDeleteBuffers)
    LOAD_GL(glDeleteVertexArrays)
    LOAD_GL(glDrawArrays)

    s_initialized = true;
    return true;
}

bool isAvailable() {
    return s_initialized;
}

unsigned int createDisplacementShader() {
    if (!s_initialized) return 0;

    GLuint vert = compileShader(GL_VERTEX_SHADER, kVertexShaderSrc);
    if (!vert) return 0;
    GLuint frag = compileShader(GL_FRAGMENT_SHADER, kFragmentShaderSrc);
    if (!frag) { glDeleteShader_(vert); return 0; }

    GLuint prog = linkProgram(vert, frag);
    glDeleteShader_(vert);
    glDeleteShader_(frag);
    return prog;
}

void applyDisplacementGPU(unsigned int program, unsigned int inputTexture,
                          uint8_t* outputBuffer, int width, int height, int channels,
                          int amount, int seed) {
    if (!s_initialized || !program || !inputTexture || !outputBuffer) return;

    ensureQuad();

    // Create render target
    GLuint fbo = 0, renderTex = 0;
    glGenFramebuffers_(1, &fbo);
    glGenTextures_(1, &renderTex);

    GLenum fmt = (channels == 4) ? GL_RGBA : GL_RGB;

    glBindTexture_(GL_TEXTURE_2D, renderTex);
    glTexImage2D_(GL_TEXTURE_2D, 0, static_cast<GLint>(fmt),
                  width, height, 0, fmt, GL_UNSIGNED_BYTE, nullptr);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    glBindFramebuffer_(GL_FRAMEBUFFER, fbo);
    glFramebufferTexture2D_(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                            GL_TEXTURE_2D, renderTex, 0);

    if (glCheckFramebufferStatus_(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        std::fprintf(stderr, "ShaderManager: framebuffer incomplete\n");
        glBindFramebuffer_(GL_FRAMEBUFFER, 0);
        glDeleteFramebuffers_(1, &fbo);
        glDeleteTextures_(1, &renderTex);
        return;
    }

    glViewport_(0, 0, width, height);
    glClear_(GL_COLOR_BUFFER_BIT);

    glUseProgram_(program);
    glActiveTexture_(GL_TEXTURE0);
    glBindTexture_(GL_TEXTURE_2D, inputTexture);

    glUniform1i_(glGetUniformLocation_(program, "uTexture"), 0);
    glUniform1f_(glGetUniformLocation_(program, "uAmount"),
                 static_cast<float>(amount));
    glUniform1f_(glGetUniformLocation_(program, "uSeed"),
                 static_cast<float>(seed));
    glUniform2f_(glGetUniformLocation_(program, "uResolution"),
                 static_cast<float>(width), static_cast<float>(height));

    glBindVertexArray_(s_quadVAO);
    glDrawArrays_(GL_TRIANGLES, 0, 6);
    glBindVertexArray_(0);

    // Read back pixels
    glReadPixels_(0, 0, width, height, fmt, GL_UNSIGNED_BYTE, outputBuffer);

    // OpenGL reads bottom-to-top; flip vertically
    int rowBytes = width * channels;
    std::vector<uint8_t> rowTmp(rowBytes);
    for (int y = 0; y < height / 2; ++y) {
        uint8_t* top = outputBuffer + y * rowBytes;
        uint8_t* bot = outputBuffer + (height - 1 - y) * rowBytes;
        std::memcpy(rowTmp.data(), top, rowBytes);
        std::memcpy(top, bot, rowBytes);
        std::memcpy(bot, rowTmp.data(), rowBytes);
    }

    // Cleanup
    glUseProgram_(0);
    glBindFramebuffer_(GL_FRAMEBUFFER, 0);
    glDeleteFramebuffers_(1, &fbo);
    glDeleteTextures_(1, &renderTex);
}

unsigned int uploadTexture(const uint8_t* data, int width, int height, int channels) {
    if (!s_initialized || !data) return 0;

    GLuint tex = 0;
    glGenTextures_(1, &tex);
    glBindTexture_(GL_TEXTURE_2D, tex);

    GLenum fmt = (channels == 4) ? GL_RGBA : GL_RGB;
    glTexImage2D_(GL_TEXTURE_2D, 0, static_cast<GLint>(fmt),
                  width, height, 0, fmt, GL_UNSIGNED_BYTE, data);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri_(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    return tex;
}

void deleteTexture(unsigned int tex) {
    if (!s_initialized || !tex) return;
    GLuint t = tex;
    glDeleteTextures_(1, &t);
}

void deleteProgram(unsigned int prog) {
    if (!s_initialized || !prog) return;
    glDeleteProgram_(prog);
}

unsigned int createPreviewTexture(const uint8_t* data, int width, int height, int channels) {
    return uploadTexture(data, width, height, channels);
}

void updatePreviewTexture(unsigned int tex, const uint8_t* data,
                          int width, int height, int channels) {
    if (!s_initialized || !tex || !data) return;
    glBindTexture_(GL_TEXTURE_2D, tex);
    GLenum fmt = (channels == 4) ? GL_RGBA : GL_RGB;
    glTexImage2D_(GL_TEXTURE_2D, 0, static_cast<GLint>(fmt),
                  width, height, 0, fmt, GL_UNSIGNED_BYTE, data);
}

void shutdown() {
    if (!s_initialized) return;
    if (s_quadVBO) { glDeleteBuffers_(1, &s_quadVBO); s_quadVBO = 0; }
    if (s_quadVAO) { glDeleteVertexArrays_(1, &s_quadVAO); s_quadVAO = 0; }
    s_initialized = false;
}

} // namespace ShaderManager
