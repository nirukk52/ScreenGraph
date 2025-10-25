import { CallOpts } from "encore.dev/api";

import {
  StreamInOutHandlerFn,
  StreamInHandlerFn,
  StreamOutHandlerFn,
  StreamOutWithResponse,
  StreamIn,
  StreamInOut,
} from "encore.dev/api";

import { stream as stream_handler } from "../../../../backend/run/stream.js";

type StreamHandshake<Type extends (...args: any[]) => any> = Parameters<Type> extends [infer H, any] ? H : void;

type StreamRequest<Type> = Type extends
  | StreamInOutHandlerFn<any, infer Req, any>
  | StreamInHandlerFn<any, infer Req, any>
  | StreamOutHandlerFn<any, any>
  ? Req
  : never;

type StreamResponse<Type> = Type extends
  | StreamInOutHandlerFn<any, any, infer Resp>
  | StreamInHandlerFn<any, any, infer Resp>
  | StreamOutHandlerFn<any, infer Resp>
  ? Resp
  : never;

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { cancel as cancel_handler } from "../../../../backend/run/cancel.js";
declare const cancel: WithCallOpts<typeof cancel_handler>;
export { cancel };

import { health as health_handler } from "../../../../backend/run/health.js";
declare const health: WithCallOpts<typeof health_handler>;
export { health };

import { start as start_handler } from "../../../../backend/run/start.js";
declare const start: WithCallOpts<typeof start_handler>;
export { start };

export function stream(
  ...args: StreamHandshake<typeof stream_handler> extends void
    ? [opts?: CallOpts]
    : [data: StreamHandshake<typeof stream_handler>, opts?: CallOpts]
): Promise<
  StreamIn<
    StreamResponse<typeof stream_handler>
  >
>;

