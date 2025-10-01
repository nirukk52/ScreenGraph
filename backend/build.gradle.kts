plugins {
    kotlin("jvm")
    id("io.ktor.plugin")
    application
}

application {
    mainClass.set("com.screengraph.backend.MainKt")
}

val versions = rootProject.ext.get("versions") as Map<*, *>

kotlin {
    jvmToolchain(17)
}

dependencies {
    val ktor = versions["ktor"] as String
    val koin = versions["koin"] as String
    val exposed = versions["exposed"] as String

    implementation(project(":shared"))
    implementation(project(":agent"))

    implementation("io.ktor:ktor-server-core-jvm:$ktor")
    implementation("io.ktor:ktor-server-netty-jvm:$ktor")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktor")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktor")

    implementation("io.insert-koin:koin-ktor:$koin")
    implementation("io.insert-koin:koin-logger-slf4j:$koin")

    implementation("org.xerial:sqlite-jdbc:3.45.3.0")
    implementation("org.jetbrains.exposed:exposed-core:$exposed")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposed")

    implementation("org.slf4j:slf4j-simple:2.0.13")
    testImplementation(kotlin("test"))
}

ktor {
    fatJar {
        archiveFileName.set("backend-all.jar")
    }
}
