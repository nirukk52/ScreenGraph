import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { cancel as run_cancelImpl0 } from "../../../../run/cancel";
import { start as run_startImpl1 } from "../../../../run/start";
import { stream as run_streamImpl2 } from "../../../../run/stream";
import { getDoc as steering_getDocImpl3 } from "../../../../steering/get-doc";
import { listDocs as steering_listDocsImpl4 } from "../../../../steering/list-docs";
import { updateDoc as steering_updateDocImpl5 } from "../../../../steering/update-doc";
import "../../../../run/orchestrator";
import * as steering_service from "../../../../steering/encore.service";
import * as frontend_service from "../../../../frontend/encore.service";
import * as run_service from "../../../../run/encore.service";

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
            name:              "start",
            handler:           run_startImpl1,
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
            handler:           run_streamImpl2,
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
            handler:           steering_getDocImpl3,
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
            handler:           steering_listDocsImpl4,
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
            handler:           steering_updateDocImpl5,
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
