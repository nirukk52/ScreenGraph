package com.screengraph.backend

import com.screengraph.backend.db.DatabaseFactory
import com.screengraph.backend.di.backendModule
import com.screengraph.backend.routes.healthRoutes
import com.screengraph.agent.agentModule
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.routing.routing
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

/**
 * Ktor application module configuring DI, serialization, and routes.
 */
fun Application.module() {
    // Initialize dev database (SQLite)
    DatabaseFactory.init("jdbc:sqlite:data/dev.db")

    // Install Koin for dependency injection
    install(Koin) {
        slf4jLogger()
        modules(backendModule, agentModule)
    }

    // Configure JSON serialization
    install(ContentNegotiation) { json() }

    // Register routes
    routing {
        healthRoutes()
    }
}
