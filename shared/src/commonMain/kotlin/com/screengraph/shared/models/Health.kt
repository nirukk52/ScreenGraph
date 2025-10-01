package com.screengraph.shared.models

/**
 * Represents a simple health check response model.
 */
data class Health(
    val status: String,
    val service: String,
)
