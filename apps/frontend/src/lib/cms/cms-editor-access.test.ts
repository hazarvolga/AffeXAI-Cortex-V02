import assert from "node:assert/strict";
import { test } from "node:test";
import { canEditCms, cmsPagesPath } from "./cms-editor-access";

test("anonymous visitors never get the CMS shortcut", () => {
  assert.equal(canEditCms(null, false), false);
  assert.equal(canEditCms(undefined, true), false);
});

test("only a cms.edit permission or super admin authority shows the shortcut", () => {
  assert.equal(
    canEditCms({ roles: [{ permissions: ["events.view"] }] }, false),
    false,
  );
  assert.equal(
    canEditCms({ primaryRole: { permissions: null } }, false),
    false,
  );
  assert.equal(
    canEditCms({ roles: [{ permissions: ["cms.view", "cms.edit"] }] }, false),
    true,
  );
  assert.equal(
    canEditCms({ roleEntity: { permissions: ["cms.edit"] } }, false),
    true,
  );
  assert.equal(canEditCms({}, true), true);
});

test("CMS shortcut stays inside the user tenant", () => {
  assert.equal(
    cmsPagesPath({ tenantId: "xyz-company-ui" }),
    "/xyz-company-ui/admin/cms/pages",
  );
  assert.equal(cmsPagesPath({ tenantId: "  " }), "/admin/cms/pages");
  assert.equal(cmsPagesPath({}), "/admin/cms/pages");
  assert.equal(
    cmsPagesPath({ tenantId: "../evil" }),
    "/..%2Fevil/admin/cms/pages",
  );
});
