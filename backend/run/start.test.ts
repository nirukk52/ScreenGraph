import { describe, it, expect, beforeEach } from "vitest";
import { start } from "./start";
import db from "../db";

describe("POST /run - Start Run Endpoint", () => {
  beforeEach(async () => {
    await db.exec`DELETE FROM run_events`;
    await db.exec`DELETE FROM runs`;
  });

  it("should create a new run with minimal required fields", async () => {
    const response = await start({
      appPackage: "com.example.app",
    });

    expect(response.runId).toBeTruthy();
    expect(response.status).toBe("PENDING");
    expect(response.createdAt).toBeInstanceOf(Date);
    expect(response.streamUrl).toBe(`/run/${response.runId}/stream`);

    const run = await db.queryRow`
      SELECT * FROM runs WHERE id = ${response.runId}
    `;

    expect(run).toBeTruthy();
    expect(run.app_package).toBe("com.example.app");
    expect(run.status).toBe("PENDING");
    expect(run.max_steps).toBe(100);
    expect(run.device_config === null || run.device_config === "null").toBe(true);
    expect(run.goal === null || run.goal === "null").toBe(true);
  });

  it("should create a new run with all optional fields", async () => {
    const deviceConfig = {
      platform: "android" as const,
      version: "14.0",
    };

    const response = await start({
      appPackage: "com.example.app",
      deviceConfig,
      maxSteps: 50,
      goal: "Login to the app",
    });

    expect(response.runId).toBeTruthy();
    expect(response.status).toBe("PENDING");

    const run = await db.queryRow`
      SELECT * FROM runs WHERE id = ${response.runId}
    `;

    expect(run).toBeTruthy();
    expect(run.app_package).toBe("com.example.app");
    expect(run.max_steps).toBe(50);
    expect(run.goal).toBe("Login to the app");
    expect(JSON.parse(run.device_config as any)).toEqual(deviceConfig);
  });

  it("should throw error when appPackage is missing", async () => {
    await expect(
      start({ appPackage: "" })
    ).rejects.toThrow("appPackage is required");
  });

  it("should use default maxSteps of 100 when not provided", async () => {
    const response = await start({
      appPackage: "com.example.app",
    });

    const run = await db.queryRow`
      SELECT * FROM runs WHERE id = ${response.runId}
    `;

    expect(run.max_steps).toBe(100);
  });

  it("should create multiple independent runs", async () => {
    const response1 = await start({
      appPackage: "com.example.app1",
    });

    const response2 = await start({
      appPackage: "com.example.app2",
    });

    expect(response1.runId).not.toBe(response2.runId);

    const runs = await db.queryAll`
      SELECT * FROM runs ORDER BY created_at ASC
    `;

    expect(runs.length).toBe(2);
    expect(runs[0].app_package).toBe("com.example.app1");
    expect(runs[1].app_package).toBe("com.example.app2");
  });
});
