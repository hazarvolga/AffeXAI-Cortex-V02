import { TenantService } from "../../../core/tenant/tenant.service";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { KnowledgeBaseService } from "./knowledge-base.service";
import { KnowledgeBaseArticle } from "../entities/knowledge-base-article.entity";

describe("KnowledgeBaseService", () => {
  let service: KnowledgeBaseService;
  let repository: Repository<KnowledgeBaseArticle>;

  let mockArticle: Partial<KnowledgeBaseArticle> = {
    id: "article-123",
    title: "How to Reset Password",
    slug: "how-to-reset-password",
    content: "Step-by-step guide to reset your password...",
    summary: "Learn how to reset your password",
    status: "published",
    authorId: "author-123",
    categoryId: "cat-123",
    tags: ["password", "security", "account"],
    isFeatured: false,
    viewCount: 100,
    helpfulCount: 25,
    notHelpfulCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const initialArticle = structuredClone(mockArticle);
  const query = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const mockRepository = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    manager: { findOne: jest.fn().mockResolvedValue({ id: "fixture" }) },
    createQueryBuilder: jest.fn(() => query),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TenantService,
          useValue: { getTenantId: () => "fixture-tenant" },
        },
        KnowledgeBaseService,
        {
          provide: getRepositoryToken(KnowledgeBaseArticle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
    repository = module.get(getRepositoryToken(KnowledgeBaseArticle));

    jest.clearAllMocks();
    mockArticle = structuredClone(initialArticle);
    query.getManyAndCount.mockResolvedValue([[mockArticle], 1]);
    mockRepository.find.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createArticle", () => {
    it("should create a new article with generated slug", async () => {
      const createDto = {
        title: "How to Reset Password",
        content: "Guide content...",
        summary: "Password reset guide",
        categoryId: "cat-123",
        tags: ["password"],
      };

      mockRepository.create.mockReturnValue(mockArticle);
      mockRepository.save.mockResolvedValue(mockArticle);

      const result = await service.createArticle("author-123", createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.any(String),
          authorId: "author-123",
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockArticle);
    });

    it("should set default status to draft if not provided", async () => {
      const createDto = {
        title: "Draft Article",
        content: "Content",
      };

      mockRepository.create.mockReturnValue({
        ...mockArticle,
        status: "draft",
      });
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        status: "draft",
      });

      const result = await service.createArticle("author-123", createDto);

      expect(result.status).toBe("draft");
    });

    it("should handle Turkish characters in slug generation", async () => {
      const createDto = {
        title: "Şifre Nasıl Sıfırlanır",
        content: "İçerik...",
      };

      mockRepository.create.mockImplementation((data) => ({
        ...mockArticle,
        ...data,
      }));
      mockRepository.save.mockResolvedValue(mockArticle);

      await service.createArticle("author-123", createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.not.stringContaining("ş"),
        }),
      );
    });
  });

  describe("updateArticle", () => {
    it("should update article and regenerate slug if title changed", async () => {
      const updateDto = {
        title: "Updated Title",
        content: "Updated content",
      };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        ...updateDto,
        slug: "updated-title",
      });

      const result = await service.updateArticle("article-123", updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "article-123", tenantId: "fixture-tenant" },
      });
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException if article not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateArticle("non-existent", { title: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should allow partial updates", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        isFeatured: true,
      });

      const result = await service.updateArticle("article-123", {
        isFeatured: true,
      });

      expect(result.isFeatured).toBe(true);
      expect(result.title).toBe(mockArticle.title); // Unchanged
    });
  });

  describe("deleteArticle", () => {
    it("should delete an article", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteArticle("article-123");

      expect(mockRepository.delete).toHaveBeenCalledWith({
        id: "article-123",
        tenantId: "fixture-tenant",
      });
    });

    it("should throw NotFoundException if article not found", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteArticle("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getArticle", () => {
    it("should return published article by id without a view side effect", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        viewCount: 101,
      });

      const result = await service.getArticle("article-123");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: "article-123",
          tenantId: "fixture-tenant",
          isPublished: true,
        },
        relations: ["author", "category"],
      });
      expect(result.viewCount).toBe(100);
    });

    it("should throw NotFoundException if article not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getArticle("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getArticleBySlug", () => {
    it("should return article by slug", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue(mockArticle);

      const result = await service.getArticleBySlug("how-to-reset-password");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          slug: "how-to-reset-password",
          isPublished: true,
          tenantId: "fixture-tenant",
        },
        relations: ["author", "category"],
      });
      expect(result).toEqual({
        ...mockArticle,
        viewCount: mockArticle.viewCount! + 1,
      });
    });

    it("should only return published articles", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getArticleBySlug("draft-article")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("searchArticles", () => {
    it("should search articles by query", async () => {
      const articles = [mockArticle];
      mockRepository.createQueryBuilder().getMany.mockResolvedValue(articles);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(1);

      const result = await service.searchArticles({ query: "password" });

      expect(result.articles).toEqual(articles);
      expect(result.total).toBe(1);
    });

    it("should filter by category", async () => {
      mockRepository
        .createQueryBuilder()
        .getMany.mockResolvedValue([mockArticle]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(1);

      await service.searchArticles({ categoryId: "cat-123" });

      expect(mockRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        expect.stringContaining("categoryId"),
        expect.any(Object),
      );
    });

    it("should filter by tags", async () => {
      mockRepository
        .createQueryBuilder()
        .getMany.mockResolvedValue([mockArticle]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(1);

      await service.searchArticles({ tags: ["password", "security"] });

      expect(mockRepository.createQueryBuilder().andWhere).toHaveBeenCalled();
    });

    it("should support pagination", async () => {
      mockRepository
        .createQueryBuilder()
        .getMany.mockResolvedValue([mockArticle]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(100);

      await service.searchArticles({ limit: 10, offset: 20 });

      expect(mockRepository.createQueryBuilder().take).toHaveBeenCalledWith(10);
      expect(mockRepository.createQueryBuilder().skip).toHaveBeenCalledWith(20);
    });
  });

  describe("getFeaturedArticles", () => {
    it("should return featured articles", async () => {
      const featured = [{ ...mockArticle, isFeatured: true }];
      mockRepository.find.mockResolvedValue(featured);

      const result = await service.getFeaturedArticles(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          isPublished: true,
          tenantId: "fixture-tenant",
        },
        relations: ["author", "category"],
        order: { viewCount: "DESC" },
        take: 5,
      });
      expect(result).toEqual(featured);
    });
  });

  describe("getPopularArticles", () => {
    it("should return articles ordered by view count", async () => {
      mockRepository.find.mockResolvedValue([mockArticle]);

      const result = await service.getPopularArticles(10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isPublished: true, tenantId: "fixture-tenant" },
        relations: ["author", "category"],
        order: { viewCount: "DESC" },
        take: 10,
      });
      expect(result).toEqual([mockArticle]);
    });
  });

  describe("getRelatedArticles", () => {
    it("should return articles with similar tags", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository
        .createQueryBuilder()
        .getMany.mockResolvedValue([mockArticle]);

      const result = await service.getRelatedArticles("article-123", 5);

      expect(result).toBeDefined();
    });

    it("should exclude the current article from results", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);

      await service.getRelatedArticles("article-123", 5);

      expect(mockRepository.createQueryBuilder().where).toHaveBeenCalledWith(
        "article.id != :articleId",
        expect.any(Object),
      );
    });
  });

  describe("markHelpful", () => {
    it("should increment helpful count", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        helpfulCount: 26,
      });

      const result = await service.markHelpful("article-123", true);

      expect(result.helpfulCount).toBe(26);
    });

    it("should increment not helpful count", async () => {
      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue({
        ...mockArticle,
        notHelpfulCount: 4,
      });

      const result = await service.markHelpful("article-123", false);

      expect(result.notHelpfulCount).toBe(4);
    });
  });

  describe("getStatistics", () => {
    it("should return knowledge base statistics", async () => {
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // published
        .mockResolvedValueOnce(15) // draft
        .mockResolvedValueOnce(5); // archived

      mockRepository.find.mockResolvedValue([
        { viewCount: 10000, helpfulCount: 85, notHelpfulCount: 15 },
      ]);

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.published).toBe(80);
      expect(result.draft).toBe(15);
      expect(result.archived).toBe(5);
      expect(result.totalViews).toBe(10000);
    });
  });

  describe("generateSlug", () => {
    it("should generate URL-friendly slug", () => {
      const slug = service["generateSlug"]("How to Reset Password");
      expect(slug).toMatch(/^how-to-reset-password-\d+$/);
    });

    it("should handle special characters", () => {
      const slug = service["generateSlug"]("FAQ: What is 2FA?");
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it("should handle Turkish characters", () => {
      const slug = service["generateSlug"]("Şifre Sıfırlama");
      expect(slug).not.toContain("ş");
      expect(slug).not.toContain("ı");
    });
  });
});
