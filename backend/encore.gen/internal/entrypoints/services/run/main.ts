import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { cancel as cancelImpl0 } from "../../../../../run/cancel";
import { health as healthImpl1 } from "../../../../../run/health";
import { start as startImpl2 } from "../../../../../run/start";
import { stream as streamImpl3 } from "../../../../../run/stream";
import * as run_service from "../../../../../run/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "run",
            name:              "cancel",
            handler:           cancelImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: run_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "run",
            name:              "health",
            handler:           healthImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: run_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "run",
            name:              "start",
            handler:           startImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: run_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "run",
            name:              "stream",
            handler:           streamImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: true,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
        middlewares: run_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
