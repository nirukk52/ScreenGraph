package com.screengraph.backend.routes

import com.screengraph.backend.services.HealthService
import com.screengraph.shared.Constants
import com.screengraph.shared.models.Health
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import org.koin.ktor.ext.inject

/**
 * Registers health-related routes.
 */
fun Route.healthRoutes() {
    // Inject a HealthService instance using Koin
    val healthService by inject<HealthService>()

        val status: Health = healthService.getHealth(Constants.APP_NAME)
        call.respond(status)
    }
}
