package com.screengraph.backend.db

import org.jetbrains.exposed.sql.Database

/**
 * Simple database factory to initialize a SQLite connection for development.
 */
object DatabaseFactory {
    /**
     * Initializes a SQLite database connection using the provided JDBC URL.
     */
    fun init(jdbcUrl: String) {
        // For dev, no connection pool; Exposed manages a simple connection here.
        Database.connect(jdbcUrl, driver = "org.sqlite.JDBC")
    }
}
