package com.screengraph.backend.di

import com.screengraph.backend.services.HealthService
import org.koin.dsl.module

/**
 * Backend Koin module providing services and infrastructure bindings.
 */
val backendModule = module {
    single { HealthService() }
}
