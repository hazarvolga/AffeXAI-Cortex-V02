import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { crmSearchWhere } from "./crm-search";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrmCustomer } from "./entities/crm-customer.entity";
import { CreateCrmCustomerDto } from "./dto/create-crm-customer.dto";
import { UpdateCrmCustomerDto } from "./dto/update-crm-customer.dto";
import { TenantService } from "../../core/tenant/tenant.service";
import { CrmLead } from "./entities/crm-lead.entity";

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmCustomer)
    private crmCustomerRepository: Repository<CrmCustomer>,
    @InjectRepository(CrmLead)
    private crmLeadRepository: Repository<CrmLead>,
    private readonly tenantService: TenantService,
  ) {}

  private get tenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId)
      throw new InternalServerErrorException("Tenant context is required");
    return tenantId;
  }

  /**
   * Check if email exists in CRM database within a tenant
   * Used during signup to auto-assign customer role
   */
  async isCustomerEmail(email: string): Promise<boolean> {
    const customer = await this.crmCustomerRepository.findOne({
      where: {
        email: email.toLowerCase(),
        isActive: true,
        tenantId: this.tenantId,
      },
    });
    return !!customer;
  }

  /**
   * Get CRM customer by email within a tenant
   */
  async findByEmail(email: string): Promise<CrmCustomer | null> {
    return this.crmCustomerRepository.findOne({
      where: { email: email.toLowerCase(), tenantId: this.tenantId },
    });
  }

  /**
   * Get all CRM customers for a tenant
   */
  /** One page of customers matching `search`, with the total for that same query. */
  async findPage(
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ items: CrmCustomer[]; total: number }> {
    const [items, total] = await this.crmCustomerRepository.findAndCount({
      where: crmSearchWhere(this.tenantId, search),
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async findAll(page = 1, limit = 50): Promise<CrmCustomer[]> {
    return this.crmCustomerRepository.find({
      where: { tenantId: this.tenantId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Get CRM customer by ID and tenant
   */
  async findOne(id: string): Promise<CrmCustomer> {
    const customer = await this.crmCustomerRepository.findOne({
      where: { id, tenantId: this.tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`CRM customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Create a single CRM customer for a tenant
   */
  async create(createDto: CreateCrmCustomerDto): Promise<CrmCustomer> {
    // Check for duplicate email within tenant
    const existing = await this.findByEmail(createDto.email);
    if (existing) {
      throw new ConflictException(
        `Email ${createDto.email} already exists in CRM`,
      );
    }

    const customer = this.crmCustomerRepository.create({
      ...createDto,
      email: createDto.email.toLowerCase(),
      tenantId: this.tenantId,
    });

    try {
      return await this.crmCustomerRepository.save(customer);
    } catch (error) {
      this.rethrowSafePersistenceError(error);
    }
  }

  /**
   * Bulk import CRM customers for a tenant
   * Skips duplicates and returns stats
   */
  async bulkImport(customers: CreateCrmCustomerDto[]): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Use a transaction or just loop for simplicity, ensuring tenant context
    // This runs within the request context so this.tenantId is valid.
    for (const [index, customerDto] of customers.entries()) {
      try {
        // Check if already exists in tenant
        const existing = await this.findByEmail(customerDto.email);
        if (existing) {
          skipped++;
          continue;
        }

        const customer = this.crmCustomerRepository.create({
          ...customerDto,
          email: customerDto.email.trim().toLowerCase(),
          tenantId: this.tenantId,
        });
        await this.crmCustomerRepository.save(customer);
        imported++;
      } catch (error) {
        errors.push(`row_${index + 1}: ${this.importErrorCode(error)}`);
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Update CRM customer
   */
  async update(
    id: string,
    updateDto: UpdateCrmCustomerDto,
  ): Promise<CrmCustomer> {
    const customer = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateDto.email && updateDto.email !== customer.email) {
      const existing = await this.findByEmail(updateDto.email);
      if (existing) {
        throw new ConflictException(
          `Email ${updateDto.email} already exists in CRM`,
        );
      }
    }

    const editableFields: (keyof UpdateCrmCustomerDto)[] = [
      "companyName",
      "email",
      "customerNumber",
      "contactPerson",
      "phone",
      "address",
      "city",
      "country",
      "isActive",
      "notes",
      "metadata",
    ];
    const changes = editableFields.reduce<Partial<CrmCustomer>>(
      (result, field) => {
        if (updateDto[field] === undefined) return result;
        return { ...result, [field]: updateDto[field] };
      },
      {},
    );
    if (changes.email) changes.email = changes.email.trim().toLowerCase();

    try {
      return await this.crmCustomerRepository.save({ ...customer, ...changes });
    } catch (error) {
      this.rethrowSafePersistenceError(error);
    }
  }

  /**
   * Delete CRM customer (soft delete - set isActive = false)
   */
  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    customer.isActive = false;
    await this.crmCustomerRepository.save(customer);
  }

  /**
   * Hard delete CRM customer
   */
  async hardDelete(id: string): Promise<void> {
    const customer = await this.findOne(id);
    const relatedLeads = await this.crmLeadRepository.count({
      where: { tenantId: this.tenantId, customerId: id },
    });
    if (relatedLeads > 0) {
      throw new ConflictException(
        "Customer cannot be permanently deleted while CRM leads reference it",
      );
    }
    await this.crmCustomerRepository.remove(customer);
  }

  /**
   * Get CRM statistics for a tenant
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const total = await this.crmCustomerRepository.count({
      where: { tenantId: this.tenantId },
    });
    const active = await this.crmCustomerRepository.count({
      where: { isActive: true, tenantId: this.tenantId },
    });
    const inactive = total - active;

    return { total, active, inactive };
  }

  private rethrowSafePersistenceError(error: unknown): never {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ConflictException(
        "A CRM customer with this email already exists",
      );
    }
    throw error;
  }

  private importErrorCode(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return "duplicate";
    }
    return "persistence_failed";
  }
}
