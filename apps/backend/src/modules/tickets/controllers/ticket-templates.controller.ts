import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import {
  TemplateActor,
  TicketTemplatesService,
} from "../services/ticket-templates.service";
import { CreateTicketTemplateDto } from "../dto/create-template.dto";
import { UpdateTicketTemplateDto } from "../dto/update-template.dto";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../core/auth/guards/roles.guard";
import { Roles } from "../../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { UserRole } from "../../users/enums/user-role.enum";

/**
 * Ticket Templates Controller
 * RESTful API endpoints for ticket template management
 */
@ApiTags("Ticket Templates")
@ApiBearerAuth()
@Controller("tickets/templates")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketTemplatesController {
  constructor(private readonly templatesService: TicketTemplatesService) {}

  /**
   * Get all active templates
   */
  @Get()
  @ApiOperation({ summary: "Get all active ticket templates" })
  @ApiQuery({ name: "isPublic", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Templates retrieved successfully" })
  async findAll(
    @CurrentUser() actor: TemplateActor,
    @Query("isPublic") isPublic?: string,
  ) {
    const isPublicBool =
      isPublic === "true" ? true : isPublic === "false" ? false : undefined;
    return this.templatesService.findAll(actor, isPublicBool);
  }

  /**
   * Get popular templates
   */
  @Get("popular")
  @ApiOperation({ summary: "Get popular templates" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Popular templates retrieved successfully",
  })
  async getPopular(
    @CurrentUser() actor: TemplateActor,
    @Query("limit") limit?: number,
  ) {
    return this.templatesService.getPopular(actor, limit || 10);
  }

  /**
   * Search templates
   */
  @Get("search")
  @ApiOperation({ summary: "Search templates by name or content" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiResponse({
    status: 200,
    description: "Search results retrieved successfully",
  })
  async search(@Query("q") query: string, @CurrentUser() actor: TemplateActor) {
    return this.templatesService.search(query, actor);
  }

  /**
   * Get user's private templates
   */
  @Get("my-templates")
  @ApiOperation({ summary: "Get current user's private templates" })
  @ApiResponse({
    status: 200,
    description: "User templates retrieved successfully",
  })
  async getMyTemplates(@CurrentUser() actor: TemplateActor) {
    return this.templatesService.findByUser(actor);
  }

  /**
   * Get template by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get template details by ID" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 200, description: "Template retrieved successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async findOne(@Param("id") id: string, @CurrentUser() actor: TemplateActor) {
    return this.templatesService.findOne(id, actor);
  }

  /**
   * Get templates by category
   */
  @Get("category/:categoryId")
  @ApiOperation({ summary: "Get templates by category" })
  @ApiParam({ name: "categoryId", description: "Category UUID" })
  @ApiResponse({ status: 200, description: "Templates retrieved successfully" })
  async findByCategory(
    @Param("categoryId") categoryId: string,
    @CurrentUser() actor: TemplateActor,
  ) {
    return this.templatesService.findByCategory(categoryId, actor);
  }

  /**
   * Create new template
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: "Create a new ticket template" })
  @ApiResponse({ status: 201, description: "Template created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  async create(
    @Body() createTemplateDto: CreateTicketTemplateDto,
    @CurrentUser() actor: TemplateActor,
  ) {
    return this.templatesService.create(createTemplateDto, actor);
  }

  /**
   * Update template
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: "Update a ticket template" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 200, description: "Template updated successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  async update(
    @Param("id") id: string,
    @Body() updateTemplateDto: UpdateTicketTemplateDto,
    @CurrentUser() actor: TemplateActor,
  ) {
    return this.templatesService.update(id, updateTemplateDto, actor);
  }

  /**
   * Toggle template active status
   */
  @Patch(":id/toggle")
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: "Toggle template active status" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 200, description: "Template toggled successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  async toggle(@Param("id") id: string, @CurrentUser() actor: TemplateActor) {
    return this.templatesService.toggle(id, actor);
  }

  /**
   * Increment template usage
   */
  @Post(":id/use")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Increment template usage count" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({
    status: 200,
    description: "Usage count incremented successfully",
  })
  @ApiResponse({ status: 404, description: "Template not found" })
  async incrementUsage(
    @Param("id") id: string,
    @CurrentUser() actor: TemplateActor,
  ) {
    await this.templatesService.incrementUsage(id, actor);
    return { success: true };
  }

  /**
   * Delete template
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a ticket template" })
  @ApiParam({ name: "id", description: "Template UUID" })
  @ApiResponse({ status: 204, description: "Template deleted successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  async delete(@Param("id") id: string, @CurrentUser() actor: TemplateActor) {
    await this.templatesService.delete(id, actor);
  }
}
