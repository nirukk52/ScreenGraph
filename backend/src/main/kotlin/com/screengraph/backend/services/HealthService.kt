package com.screengraph.backend.services

import com.screengraph.shared.Constants
import com.screengraph.shared.models.Health

/**
 * Provides health info for the service.
 */
class HealthService {
    /**
     * Returns a simple health response for the given service.
     */
    fun getHealth(serviceName: String): Health {
        return Health(status = Constants.HEALTH_OK, service = serviceName)
    }
}
