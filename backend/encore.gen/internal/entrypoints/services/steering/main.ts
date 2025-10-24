import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { getDoc as getDocImpl0 } from "../../../../../steering/get-doc";
import { listDocs as listDocsImpl1 } from "../../../../../steering/list-docs";
import { updateDoc as updateDocImpl2 } from "../../../../../steering/update-doc";
import * as steering_service from "../../../../../steering/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "steering",
            name:              "getDoc",
            handler:           getDocImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: steering_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "steering",
            name:              "listDocs",
            handler:           listDocsImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: steering_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "steering",
            name:              "updateDoc",
            handler:           updateDocImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: steering_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
