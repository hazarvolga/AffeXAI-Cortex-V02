import { ILike } from "typeorm";
import { crmSearchWhere, escapeLike } from "./crm-search";

describe("crmSearchWhere", () => {
  it("without a query only scopes by tenant", () => {
    expect(crmSearchWhere("acme", undefined)).toEqual({ tenantId: "acme" });
    expect(crmSearchWhere("acme", "   ")).toEqual({ tenantId: "acme" });
  });

  it("matches company, e-mail, contact and customer number within the tenant", () => {
    const where = crmSearchWhere("acme", " Onay ");
    expect(where).toEqual([
      { tenantId: "acme", companyName: ILike("%Onay%") },
      { tenantId: "acme", email: ILike("%Onay%") },
      { tenantId: "acme", contactPerson: ILike("%Onay%") },
      { tenantId: "acme", customerNumber: ILike("%Onay%") },
    ]);
  });

  it("treats % and _ in the query as literal characters", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
