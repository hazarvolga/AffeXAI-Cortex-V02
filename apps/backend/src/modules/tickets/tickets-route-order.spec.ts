import { TICKETS_CONTROLLERS } from "./tickets.controllers";
import { TicketsController } from "./tickets.controller";
import { TicketMacroController } from "./controllers/ticket-macro.controller";
import { TicketTemplatesController } from "./controllers/ticket-templates.controller";

/**
 * Nest matches routes in controller registration order. TicketsController owns
 * `tickets/:id`, so it must come after controllers with static `tickets/<name>`
 * paths, or `/tickets/macros` and `/tickets/templates` are read as ticket ids.
 */
describe("tickets route order", () => {
  it("registers TicketsController after every static tickets/* controller", () => {
    expect(TICKETS_CONTROLLERS.at(-1)).toBe(TicketsController);
    expect(TICKETS_CONTROLLERS).toContain(TicketMacroController);
    expect(TICKETS_CONTROLLERS).toContain(TicketTemplatesController);
  });
});
