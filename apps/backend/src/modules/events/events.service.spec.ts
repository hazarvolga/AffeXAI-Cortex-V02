import { EventsService } from "./events.service";

describe("EventsService", () => {
  it("returns only tenant-scoped published future events in chronological order", async () => {
    const find = jest.fn().mockResolvedValue([
      {
        id: "event-1",
        slug: "launch",
        title: "Launch",
        description: "Demo",
        startDate: new Date("2026-12-01T10:00:00.000Z"),
        endDate: new Date("2026-12-01T11:00:00.000Z"),
        location: "Online",
        capacity: 50,
        price: "12.50",
      },
    ]);
    const service = new EventsService(
      { find } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { getTenantId: () => "tenant-a" } as never,
      {} as never,
      {} as never,
    );

    const result = await service.findUpcoming(200);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-a",
          status: "published",
        }),
        order: { startDate: "ASC" },
        take: 20,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          capacity: true,
          price: true,
        },
      }),
    );
    expect(find.mock.calls[0][0].where.startDate).toBeDefined();
    expect(result).toEqual([
      {
        id: "event-1",
        slug: "launch",
        title: "Launch",
        description: "Demo",
        startDate: "2026-12-01T10:00:00.000Z",
        endDate: "2026-12-01T11:00:00.000Z",
        location: "Online",
        capacity: 50,
        price: 12.5,
      },
    ]);
  });
});
