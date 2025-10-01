import org.jetbrains.kotlin.gradle.plugin.KotlinJsCompilerType

plugins {
    kotlin("multiplatform") version "2.0.21" apply false
    kotlin("jvm") version "2.0.21" apply false
    id("org.jetbrains.compose") version "1.7.0" apply false
    id("io.ktor.plugin") version "3.0.1" apply false
}

ext.set("versions", mapOf(
    "kotlin" to "2.0.21",
    "ktor" to "3.0.1",
    "koin" to "3.5.6",
    "compose" to "1.7.0",
    "exposed" to "0.53.0"
))

allprojects {
    repositories {
        mavenCentral()
        google()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}
