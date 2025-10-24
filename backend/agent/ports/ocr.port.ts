export interface OCRPort {
  runOCR(screenshotRefId: string): Promise<string>;
}
