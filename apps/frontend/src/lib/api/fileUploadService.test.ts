import { fileUploadService } from "./fileUploadService";
import { httpClient } from "./http-client";
jest.mock("./http-client", () => ({
  httpClient: { postWrapped: jest.fn(), get: jest.fn(), getWrapped: jest.fn() },
}));
describe("Private ticket attachment transport", () => {
  beforeEach(() => jest.clearAllMocks());
  it("lets the browser set multipart boundary and rejects oversize before request", async () => {
    const file = new File(["plain text"], "test.txt", { type: "text/plain" });
    await fileUploadService.uploadFile(file);
    expect(httpClient.postWrapped).toHaveBeenCalledWith(
      "/tickets/attachments/upload",
      expect.any(FormData),
      { headers: { "Content-Type": undefined } },
    );
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.txt");
    await expect(fileUploadService.uploadFile(large)).rejects.toThrow();
    expect(httpClient.postWrapped).toHaveBeenCalledTimes(1);
  });
  it("uses bearer-enabled HTTP client for bytes, never a public link", async () => {
    const blob = new Blob(["data"]);
    (httpClient.get as jest.Mock).mockResolvedValue(blob);
    expect(
      await fileUploadService.downloadFile(
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toBe(blob);
    expect(httpClient.get).toHaveBeenCalledWith(
      "/tickets/attachments/00000000-0000-4000-8000-000000000001/download",
      { responseType: "blob" },
    );
  });
});
