import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { getArtifactMeta as artifacts_getArtifactMetaImpl0 } from "../../../../artifacts/get";
import { storeArtifact as artifacts_storeArtifactImpl1 } from "../../../../artifacts/store";
import { cancel as run_cancelImpl2 } from "../../../../run/cancel";
import { health as run_healthImpl3 } from "../../../../run/health";
import { start as run_startImpl4 } from "../../../../run/start";
import { stream as run_streamImpl5 } from "../../../../run/stream";
import { getDoc as steering_getDocImpl6 } from "../../../../steering/get-doc";
import { listDocs as steering_listDocsImpl7 } from "../../../../steering/list-docs";
import { updateDoc as steering_updateDocImpl8 } from "../../../../steering/update-doc";
import "../../../../agent/orchestrator/subscription";
import * as graph_service from "../../../../graph/encore.service";
import * as artifacts_service from "../../../../artifacts/encore.service";
import * as run_service from "../../../../run/encore.service";
import * as steering_service from "../../../../steering/encore.service";

const gateways: any[] = [
];

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "artifacts",
            name:              "getArtifactMeta",
            handler:           artifacts_getArtifactMetaImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: artifacts_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "artifacts",
            name:              "storeArtifact",
            handler:           artifacts_storeArtifactImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: artifacts_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "run",
            name:              "cancel",
            handler:           run_cancelImpl2,
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
            handler:           run_healthImpl3,
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
            handler:           run_startImpl4,
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
            handler:           run_streamImpl5,
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
            handler:           steering_getDocImpl6,
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
            handler:           steering_listDocsImpl7,
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
            handler:           steering_updateDocImpl8,
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
