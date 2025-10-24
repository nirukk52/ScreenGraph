import { OCRPort } from "../../ports/ocr.port";

export class FakeOCR implements OCRPort {
  async runOCR(screenshotRefId: string): Promise<string> {
    return `obj://ocr/${screenshotRefId.replace("shots", "ocr").replace(".png", ".json")}`;
  }
}
