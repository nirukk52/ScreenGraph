plugins {
    kotlin("multiplatform")
}

kotlin {
    jvm()
    wasmJs {
        browser()
    }
    sourceSets {
        val commonMain by getting {
            dependencies {}
        }
        val commonTest by getting
        val jvmMain by getting
        val jvmTest by getting
        val wasmJsMain by getting
        val wasmJsTest by getting
    }
}
