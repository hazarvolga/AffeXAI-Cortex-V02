// The real collaborators pull in most of the application; none are reached here.
jest.mock("./providers/twitter.provider", () => ({
  TwitterProvider: class {},
}));
jest.mock("./providers/linkedin.provider", () => ({
  LinkedInProvider: class {},
}));
jest.mock("./providers/facebook.provider", () => ({
  FacebookProvider: class {},
}));
jest.mock("./providers/instagram.provider", () => ({
  InstagramProvider: class {},
}));
jest.mock("../../core/shared/services/key-management.service", () => ({
  KeyManagementService: class {},
}));
jest.mock("../media/s3.service", () => ({ S3Service: class {} }));
jest.mock("../strategy/services/strategy.service", () => ({
  StrategyService: class {},
}));
jest.mock("../commerce/services/commerce.service", () => ({
  CommerceService: class {},
}));
jest.mock("../bcc/bcc.service", () => ({ BccService: class {} }));

import { SocialMediaService } from "./social-media.service";

// Records every where clause and answers like an empty table.
function postRepository() {
  const clauses: Array<[string, Record<string, unknown> | undefined]> = [];
  const builder: Record<string, jest.Mock> = {};
  const chain = () => builder;
  for (const method of [
    "select",
    "addSelect",
    "leftJoinAndSelect",
    "groupBy",
    "orderBy",
  ]) {
    builder[method] = jest.fn(chain);
  }
  builder.where = jest.fn((sql: string, params?: Record<string, unknown>) => {
    clauses.push([sql, params]);
    return builder;
  });
  builder.andWhere = builder.where;
  builder.getRawMany = jest.fn(async () => []);
  builder.getRawOne = jest.fn(async () => ({}));
  return {
    clauses,
    repository: { createQueryBuilder: jest.fn(() => builder) },
  };
}

function service(posts: ReturnType<typeof postRepository>) {
  const Service = SocialMediaService as unknown as new (
    ...args: unknown[]
  ) => SocialMediaService;
  return new Service({}, posts.repository, {}, {}, {}, {}, {}, {}, {}, {}, {});
}

// A bind parameter inside a SQL string literal reaches Postgres as an untyped $n.
const quotedParameter = /'[^']*:\w+[^']*'/;

describe("SocialMediaService engagement windows", () => {
  it("binds the history window as a typed parameter", async () => {
    const posts = postRepository();
    await expect(
      service(posts).getEngagementHistory(14, "tenant-a"),
    ).resolves.toEqual([]);
    const [window] = posts.clauses;
    expect(window[0]).not.toMatch(quotedParameter);
    expect(window[0]).toContain("make_interval(days => CAST(:days AS int))");
    expect(window[1]).toEqual({ days: 14 });
  });

  it("binds the trend window as a typed parameter and fills empty days", async () => {
    const posts = postRepository();
    const trend = await service(posts).getEngagementTrend(
      "user",
      "tenant-a",
      7,
    );
    expect(trend).toHaveLength(7);
    expect(posts.clauses.every(([sql]) => !quotedParameter.test(sql))).toBe(
      true,
    );
  });
});
