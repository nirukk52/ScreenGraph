package com.screengraph.backend

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

/**
 * Entry point that starts Ktor Netty server.
 */
fun main() {
    // Keeping startup simple and under 50 lines as per guidelines.
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        module()
    }.start(wait = true)
}
