import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { cancel as run_cancelImpl0 } from "../../../../backend/run/cancel";
import { health as run_healthImpl1 } from "../../../../backend/run/health";
import { start as run_startImpl2 } from "../../../../backend/run/start";
import { stream as run_streamImpl3 } from "../../../../backend/run/stream";
import { getDoc as steering_getDocImpl4 } from "../../../../backend/steering/get-doc";
import { listDocs as steering_listDocsImpl5 } from "../../../../backend/steering/list-docs";
import { updateDoc as steering_updateDocImpl6 } from "../../../../backend/steering/update-doc";
import "../../../../backend/run/orchestrator";
import * as run_service from "../../../../backend/run/encore.service";
import * as steering_service from "../../../../backend/steering/encore.service";
import * as frontend_service from "../../../../frontend/encore.service";

const gateways: any[] = [
];

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "run",
            name:              "cancel",
            handler:           run_cancelImpl0,
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
            handler:           run_healthImpl1,
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
            handler:           run_startImpl2,
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
            handler:           run_streamImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: true,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
        middlewares: run_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "steering",
            name:              "getDoc",
            handler:           steering_getDocImpl4,
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
            handler:           steering_listDocsImpl5,
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
            handler:           steering_updateDocImpl6,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: steering_service.default.cfg.middlewares || [],
    },
];

registerGateways(gateways);
registerHandlers(handlers);

await run(import.meta.url);
