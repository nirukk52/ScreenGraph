/**
 * PURPOSE: Keep the WDIO testrunner process alive so the Appium Service runs
 * an Appium server for the ScreenGraph agent to connect to.
 */

describe("Appium Service Holder", () => {
  it("keeps Appium running for the agent", async () => {
    // Hold the process open until interrupted (Ctrl+C)
    // This lets the agent connect to http://127.0.0.1:4723
    await new Promise(() => {});
  });
});






