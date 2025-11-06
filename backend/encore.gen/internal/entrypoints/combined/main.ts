import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { getArtifactMeta as artifacts_getArtifactMetaImpl0 } from "../../../../artifacts/get";
import { storeArtifact as artifacts_storeArtifactImpl1 } from "../../../../artifacts/store";
import { diagnostics as graph_diagnosticsImpl2 } from "../../../../graph/diagnostics";
import { getScreens as graph_getScreensImpl3 } from "../../../../graph/get-screens";
import { streamGraphForRun as graph_streamGraphForRunImpl4 } from "../../../../graph/stream";
import { cancel as run_cancelImpl5 } from "../../../../run/cancel";
import { health as run_healthImpl6 } from "../../../../run/health";
import { start as run_startImpl7 } from "../../../../run/start";
import { stream as run_streamImpl8 } from "../../../../run/stream";
import { getDoc as steering_getDocImpl9 } from "../../../../steering/get-doc";
import { listDocs as steering_listDocsImpl10 } from "../../../../steering/list-docs";
import { updateDoc as steering_updateDocImpl11 } from "../../../../steering/update-doc";
import "../../../../agent/orchestrator/subscription";
import * as run_service from "../../../../run/encore.service";
import * as graph_service from "../../../../graph/encore.service";
import * as steering_service from "../../../../steering/encore.service";
import * as artifacts_service from "../../../../artifacts/encore.service";

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
            service:           "graph",
            name:              "diagnostics",
            handler:           graph_diagnosticsImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: graph_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "graph",
            name:              "getScreens",
            handler:           graph_getScreensImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: graph_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "graph",
            name:              "streamGraphForRun",
            handler:           graph_streamGraphForRunImpl4,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: true,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
        middlewares: graph_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "run",
            name:              "cancel",
            handler:           run_cancelImpl5,
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
            handler:           run_healthImpl6,
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
            handler:           run_startImpl7,
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
            handler:           run_streamImpl8,
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
            handler:           steering_getDocImpl9,
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
            handler:           steering_listDocsImpl10,
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
            handler:           steering_updateDocImpl11,
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
