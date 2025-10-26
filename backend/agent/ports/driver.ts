import type { ScreenshotData, UiHierarchyData } from "../domain/perception";
import { ActionKind } from "../domain/actions";

export interface DriverPort {
  captureScreenshot(): Promise<ScreenshotData>;
  dumpUiHierarchy(): Promise<UiHierarchyData>;
  performTap(x: number, y: number): Promise<void>;
  performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void>;
  performBack(): Promise<void>;
  performTextInput(text: string): Promise<void>;
  performLongPress(x: number, y: number, durationMs: number): Promise<void>;
  getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }>;
}
