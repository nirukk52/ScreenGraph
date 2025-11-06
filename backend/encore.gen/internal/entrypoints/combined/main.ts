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
import { archiveDoc as steering_archiveDocImpl9 } from "../../../../steering/archive-doc";
import { createDoc as steering_createDocImpl10 } from "../../../../steering/create-doc";
import { streamSteeringEvents as steering_streamSteeringEventsImpl11 } from "../../../../steering/events.stream";
import { getDoc as steering_getDocImpl12 } from "../../../../steering/get-doc";
import { getDocRevision as steering_getDocRevisionImpl13 } from "../../../../steering/get-revision";
import { getDocsIndex as steering_getDocsIndexImpl14 } from "../../../../steering/index.read";
import { rebuildDocsIndex as steering_rebuildDocsIndexImpl15 } from "../../../../steering/index.rebuild";
import { listDocs as steering_listDocsImpl16 } from "../../../../steering/list-docs";
import { listDocRevisions as steering_listDocRevisionsImpl17 } from "../../../../steering/list-revisions";
import { renameDoc as steering_renameDocImpl18 } from "../../../../steering/rename-doc";
import { restoreDoc as steering_restoreDocImpl19 } from "../../../../steering/restore-doc";
import { revertDocToRevision as steering_revertDocToRevisionImpl20 } from "../../../../steering/revert-revision";
import { searchDocs as steering_searchDocsImpl21 } from "../../../../steering/search.endpoint";
import { getSteeringTools as steering_getSteeringToolsImpl22 } from "../../../../steering/tools";
import { updateDoc as steering_updateDocImpl23 } from "../../../../steering/update-doc";
import "../../../../agent/orchestrator/subscription";
import * as run_service from "../../../../run/encore.service";
import * as steering_service from "../../../../steering/encore.service";
import * as graph_service from "../../../../graph/encore.service";
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
            name:              "archiveDoc",
            handler:           steering_archiveDocImpl9,
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
            name:              "createDoc",
            handler:           steering_createDocImpl10,
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
            name:              "streamSteeringEvents",
            handler:           steering_streamSteeringEventsImpl11,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: true,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
        middlewares: steering_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "steering",
            name:              "getDoc",
            handler:           steering_getDocImpl12,
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
            name:              "getDocRevision",
            handler:           steering_getDocRevisionImpl13,
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
            name:              "getDocsIndex",
            handler:           steering_getDocsIndexImpl14,
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
            name:              "rebuildDocsIndex",
            handler:           steering_rebuildDocsIndexImpl15,
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
            handler:           steering_listDocsImpl16,
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
            name:              "listDocRevisions",
            handler:           steering_listDocRevisionsImpl17,
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
            name:              "renameDoc",
            handler:           steering_renameDocImpl18,
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
            name:              "restoreDoc",
            handler:           steering_restoreDocImpl19,
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
            name:              "revertDocToRevision",
            handler:           steering_revertDocToRevisionImpl20,
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
            name:              "searchDocs",
            handler:           steering_searchDocsImpl21,
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
            name:              "getSteeringTools",
            handler:           steering_getSteeringToolsImpl22,
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
            handler:           steering_updateDocImpl23,
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
