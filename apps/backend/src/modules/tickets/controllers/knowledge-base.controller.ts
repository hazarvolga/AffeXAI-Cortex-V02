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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { KnowledgeBaseService } from "../services/knowledge-base.service";
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleSearchFilters,
} from "../services/knowledge-base.service";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../core/auth/guards/roles.guard";
import { Roles } from "../../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { Public } from "../../../core/auth/decorators/public.decorator";
import { UserRole } from "../../users/enums/user-role.enum";

/**
 * Knowledge Base Controller
 * Manages self-service help articles
 */
@ApiTags("Knowledge Base")
@Controller("knowledge-base")
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  async getAdminArticles(@Query() filters: ArticleSearchFilters) {
    return this.knowledgeBaseService.searchArticles(filters, false);
  }

  @Get("admin/articles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  async getAdminArticle(@Param("id") id: string) {
    return this.knowledgeBaseService.getArticle(id, false);
  }

  /**
   * Create a new article (ADMIN/EDITOR only)
   */
  @Post("articles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new knowledge base article" })
  @ApiResponse({ status: 201, description: "Article created successfully" })
  async createArticle(
    @Body() dto: CreateArticleDto,
    @CurrentUser("id") authorId: string,
  ) {
    return await this.knowledgeBaseService.createArticle(authorId, dto);
  }

  /**
   * Update an article (ADMIN/EDITOR only)
   */
  @Patch("articles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a knowledge base article" })
  @ApiResponse({ status: 200, description: "Article updated successfully" })
  async updateArticle(@Param("id") id: string, @Body() dto: UpdateArticleDto) {
    return await this.knowledgeBaseService.updateArticle(id, dto);
  }

  /**
   * Delete an article (ADMIN only)
   */
  @Delete("articles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a knowledge base article" })
  @ApiResponse({ status: 200, description: "Article deleted successfully" })
  async deleteArticle(@Param("id") id: string) {
    await this.knowledgeBaseService.deleteArticle(id);
    return { message: "Article deleted successfully" };
  }

  /**
   * Get article by ID (Public for published, auth for draft)
   */
  @Get("articles/:id")
  @Public()
  @ApiOperation({ summary: "Get article by ID" })
  @ApiResponse({ status: 200, description: "Article retrieved successfully" })
  async getArticle(@Param("id") id: string) {
    return await this.knowledgeBaseService.getArticle(id);
  }

  /**
   * Get article by slug (Public)
   */
  @Get("articles/slug/:slug")
  @Public()
  @ApiOperation({ summary: "Get article by slug" })
  @ApiResponse({ status: 200, description: "Article retrieved successfully" })
  async getArticleBySlug(@Param("slug") slug: string) {
    return await this.knowledgeBaseService.getArticleBySlug(slug);
  }

  /**
   * Search articles (Public)
   */
  @Get("search")
  @Public()
  @ApiOperation({ summary: "Search knowledge base articles" })
  @ApiResponse({ status: 200, description: "Search results retrieved" })
  async searchArticles(@Query() filters: ArticleSearchFilters) {
    return await this.knowledgeBaseService.searchArticles(filters);
  }

  /**
   * Get featured articles (Public)
   */
  @Get("featured")
  @Public()
  @ApiOperation({ summary: "Get featured articles" })
  @ApiResponse({ status: 200, description: "Featured articles retrieved" })
  async getFeaturedArticles(@Query("limit") limit?: string) {
    return await this.knowledgeBaseService.getFeaturedArticles(
      limit ? parseInt(limit, 10) : 5,
    );
  }

  /**
   * Get popular articles (Public)
   */
  @Get("popular")
  @Public()
  @ApiOperation({ summary: "Get popular articles" })
  @ApiResponse({ status: 200, description: "Popular articles retrieved" })
  async getPopularArticles(@Query("limit") limit?: string) {
    return await this.knowledgeBaseService.getPopularArticles(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Get related articles (Public)
   */
  @Get("articles/:id/related")
  @Public()
  @ApiOperation({ summary: "Get related articles" })
  @ApiResponse({ status: 200, description: "Related articles retrieved" })
  async getRelatedArticles(
    @Param("id") id: string,
    @Query("limit") limit?: string,
  ) {
    return await this.knowledgeBaseService.getRelatedArticles(
      id,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  /**
   * Mark article as helpful/not helpful (Public)
   */
  @Post("articles/:id/feedback")
  @Public()
  @ApiOperation({ summary: "Provide feedback on article helpfulness" })
  @ApiResponse({ status: 200, description: "Feedback recorded" })
  async markHelpful(
    @Param("id") id: string,
    @Body() body: { isHelpful: boolean },
  ) {
    return await this.knowledgeBaseService.markHelpful(id, body.isHelpful);
  }

  /**
   * Get knowledge base statistics (ADMIN/EDITOR only)
   */
  @Get("stats/overview")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get knowledge base statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics() {
    return await this.knowledgeBaseService.getStatistics();
  }
}
