plugins {
    kotlin("multiplatform")
    id("org.jetbrains.compose")
}

kotlin {
    wasmJs {
        moduleName = "ui"
        browser {
            commonWebpackConfig {
                outputFileName = "ui.js"
            }
        }
        binaries.executable()
    }
    sourceSets {
        val wasmJsMain by getting {
            dependencies {
                implementation(compose.runtime)
                implementation(compose.html.core)
                implementation(project(":shared"))
            }
        }
        val wasmJsTest by getting
    }
}
