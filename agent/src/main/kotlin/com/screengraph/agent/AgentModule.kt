package com.screengraph.agent

import com.screengraph.agent.services.AgentService
import org.koin.dsl.module

/**
 * Koin module for Agent-related services.
 */
val agentModule = module {
    single { AgentService() }
}
