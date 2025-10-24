export interface PerceptionArtifacts {
  screenshotRefId: string;
  uiHierarchyXmlRefId: string;
  perceptualHash: string;
  captureTimestampMs: number;
  deviceScreenDimensions: {
    widthPx: number;
    heightPx: number;
  };
}

export interface ScreenshotData {
  base64Image: string;
  format: "png" | "jpg";
  widthPx: number;
  heightPx: number;
}

export interface UiHierarchyData {
  xmlContent: string;
  captureTimestampMs: number;
}
