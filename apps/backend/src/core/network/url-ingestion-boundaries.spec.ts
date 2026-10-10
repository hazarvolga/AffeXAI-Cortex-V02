import { publicUrlFetcher, PublicUrlHttpError } from "./public-url-fetcher";
import { UrlProcessingService } from "../../modules/knowledge-sources/services/url-processing.service";
import { UrlProcessorService } from "../../modules/chat/services/url-processor.service";
import { UrlValidator } from "../../modules/chat/utils/url-validator.util";
import {
  ChatUrlCache,
  UrlProcessingStatus,
} from "../../modules/chat/entities/chat-url-cache.entity";
import { NeuralCrawlerService } from "../../modules/neural-crawler/services/neural-crawler.service";
import { KnowledgeSourcesService } from "../../modules/knowledge-sources/services/knowledge-sources.service";
import { KnowledgeSourceStatus } from "../../modules/knowledge-sources/entities/enums/knowledge-source-status.enum";
import { KnowledgeSourceType } from "../../modules/knowledge-sources/entities/enums/knowledge-source-type.enum";
import axios from "axios";
import { UrlProcessingController } from "../../modules/chat/controllers/url-processing.controller";

// Explicitly forbid legacy transports: these tests never contact external hosts.
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.reject(new Error("Legacy transport forbidden"))),
    isAxiosError: () => false,
  },
}));
const dependency = <T>(value: unknown): T => value as T;
describe("URL consumers enforce shared transport and preserve good data", () => {
  const response = {
    text: "<html><title>Example</title><body><main>Usable public documentation.</main></body></html>",
    status: 200,
    headers: { "content-type": "text/html" },
    url: "https://example.com/",
  };
  let fetch: jest.SpyInstance;
  beforeEach(() => {
    fetch = jest.spyOn(publicUrlFetcher, "fetch");
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Legacy transport forbidden"));
  });
  afterEach(() => jest.restoreAllMocks());
  it.each([
    "https://example.com:3000",
    "https://user:password@example.com",
    "http://[::ffff:127.0.0.1]",
    "ftp://example.com",
  ])("does not normalize away unsafe destination %s", (url) =>
    expect(UrlValidator.validate(url).isValid).toBe(false),
  );
  it("preserves path and duplicate query semantics", () =>
    expect(
      UrlValidator.validate("https://example.com/docs/?a=1&a=2").normalizedUrl,
    ).toBe("https://example.com/docs/?a=1&a=2"));
  it("knowledge HTML ingestion uses bounded public transport", async () => {
    fetch.mockResolvedValue(response);
    const result = await new UrlProcessingService().processUrl(response.url);
    expect(result.text).toBe("Usable public documentation.");
    expect(fetch).toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });
  it("knowledge ingestion rejects script-only unsupported content", async () => {
    fetch.mockResolvedValue({
      ...response,
      text: "<html><body><script>app()</script></body></html>",
    });
    await expect(
      new UrlProcessingService().processUrl(response.url),
    ).rejects.toThrow();
  });
  it("neural crawler rejects fetch failure without fabricated signal", async () => {
    fetch.mockRejectedValue(new PublicUrlHttpError(500));
    const emit = jest.fn();
    const service = new NeuralCrawlerService(
      dependency({
        get: () => {
          throw new Error("Legacy transport forbidden");
        },
      }),
      dependency({ emit }),
      dependency({ addJob: (work: () => Promise<unknown>) => work() }),
      dependency({}),
      dependency({}),
    );
    await expect(
      service.processTarget("tenant-a", response.url, "SECTOR"),
    ).rejects.toThrow();
    expect(emit).not.toHaveBeenCalled();
  });
  it("failed chat refresh does not write over prior completed content", async () => {
    const cached = Object.assign(new ChatUrlCache(), {
      content: "Prior good content",
      processingStatus: UrlProcessingStatus.COMPLETED,
      expiresAt: new Date(0),
      metadata: {},
    });
    const save = jest.fn();
    fetch.mockImplementation((url: string) =>
      url.endsWith("/robots.txt")
        ? Promise.reject(new PublicUrlHttpError(404))
        : Promise.reject(new PublicUrlHttpError(500)),
    );
    const service = new UrlProcessorService(
      dependency({ findOne: async () => cached, save }),
      dependency({ getTenantId: () => "tenant-a" }),
    );
    expect((await service.processUrl(response.url)).success).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(cached.content).toBe("Prior good content");
    expect(cached.processingStatus).toBe(UrlProcessingStatus.COMPLETED);
  });
  it("chat static extraction succeeds through same guarded transport", async () => {
    fetch.mockImplementation((url: string) =>
      url.endsWith("/robots.txt")
        ? Promise.reject(new PublicUrlHttpError(404))
        : Promise.resolve(response),
    );
    const save = jest.fn(async (entry) => entry);
    const service = new UrlProcessorService(
      dependency({ findOne: async () => null, save }),
      dependency({ getTenantId: () => "tenant-a" }),
    );
    const result = await service.processUrl(response.url);
    expect(result.success).toBe(true);
    expect(result.data?.content).toBe("Usable public documentation.");
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("forced single and batch refresh never delete the previous cache", async () => {
    const processUrl = jest.fn(async () => ({ success: true, cached: false }));
    const removeCacheByUrl = jest.fn();
    const controller = new UrlProcessingController(
      dependency({ processUrl }),
      dependency({ removeCacheByUrl }),
    );
    await controller.processUrl({ url: response.url, forceRefresh: true });
    await controller.processBatchUrls({
      urls: [response.url],
      forceRefresh: true,
    });
    expect(removeCacheByUrl).not.toHaveBeenCalled();
    expect(processUrl).toHaveBeenNthCalledWith(1, response.url, {
      forceRefresh: true,
    });
    expect(processUrl).toHaveBeenNthCalledWith(2, response.url, {
      forceRefresh: true,
    });
  });
  it("failed knowledge refresh preserves prior active version", async () => {
    const source = {
      id: "source",
      sourceType: KnowledgeSourceType.URL,
      url: response.url,
      title: "Old",
      extractedContent: "Good old content",
      metadata: { version: 1 },
      status: KnowledgeSourceStatus.ACTIVE,
    };
    const save = jest.fn(async (entry) => entry);
    const service = new KnowledgeSourcesService(
      dependency({
        findOne: async () => source,
        save,
        create: (value: unknown) => value,
      }),
      dependency({}),
      dependency({
        processUrl: async () => {
          throw new Error("Fetch failed");
        },
      }),
      dependency({}),
    );
    await expect(service.processKnowledgeSource("tenant-test", "source")).rejects.toThrow(
      "refresh failed",
    );
    expect(source.status).toBe(KnowledgeSourceStatus.ACTIVE);
    expect(source.extractedContent).toBe("Good old content");
    expect(save).not.toHaveBeenCalled();
  });
});
