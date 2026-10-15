import type { Request, Response } from "express";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";

function response() {
  const res = {
    status: jest.fn(),
    send: jest.fn(),
    redirect: jest.fn(),
    set: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

function setup(target: string | null) {
  const service = {
    resolveClickTarget: jest.fn(async () => target),
    trackEmailClick: jest.fn(async () => undefined),
    trackEmailOpen: jest.fn(async () => {
      throw new Error("unknown tracking id");
    }),
  };
  return {
    controller: new TrackingController(service as unknown as TrackingService),
    service,
  };
}

const req = { ip: "203.0.113.9" } as Request;

describe("TrackingController", () => {
  it("redirects only to a resolved target and records the trusted client IP", async () => {
    const { controller, service } = setup("https://shop.example.com/");
    const res = response();
    await controller.trackClick(
      "log-1",
      "https://shop.example.com/",
      "sig",
      "UA",
      req,
      res as unknown as Response,
    );
    expect(service.resolveClickTarget).toHaveBeenCalledWith(
      "log-1",
      "https://shop.example.com/",
      "sig",
    );
    expect(service.trackEmailClick).toHaveBeenCalledWith(
      "log-1",
      expect.objectContaining({ ipAddress: "203.0.113.9" }),
    );
    expect(res.redirect).toHaveBeenCalledWith(302, "https://shop.example.com/");
  });

  it("answers 404 instead of redirecting to an unverified URL", async () => {
    const { controller, service } = setup(null);
    const res = response();
    await controller.trackClick(
      "log-1",
      "https://evil.example.net/",
      undefined,
      "UA",
      req,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(service.trackEmailClick).not.toHaveBeenCalled();
  });

  it("still serves the pixel when open tracking fails", async () => {
    const { controller } = setup(null);
    const res = response();
    await controller.trackOpen("nope", "UA", req, res as unknown as Response);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Content-Type": "image/png" }),
    );
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
