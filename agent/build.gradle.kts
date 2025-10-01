plugins {
    kotlin("jvm")
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":shared"))
    implementation("io.insert-koin:koin-core:3.5.6")
    // TODO: Add Koog agent + MCP tools once Maven coordinates are confirmed.
}
