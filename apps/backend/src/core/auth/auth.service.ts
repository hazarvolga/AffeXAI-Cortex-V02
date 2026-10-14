import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  ServiceUnavailableException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../modules/users/users.service";
import { MailService } from "../../modules/mail/mail.service";
import { SettingsService } from "../../modules/settings/settings.service";
import { LoginDto } from "./dto/login.dto";
import { AuthUtilsService } from "../../core/shared/auth-utils.service";
import { createHash, randomBytes, randomUUID } from "crypto";
import { User } from "../../modules/users/entities/user.entity";
import { isConfiguredPlatformAdmin } from "./platform-admin.policy";
import { hasUsableMembership } from "./session-eligibility";
import { TenantService } from "../tenant/tenant.service";
import { MailChannel } from "../../modules/mail/interfaces/mail-service.interface";

/** Same message for unknown email and wrong password: login never reveals which. */
export const INVALID_CREDENTIALS = "Invalid credentials";

/**
 * Constant cost-10 bcrypt hash of a random secret. Compared when no account
 * matches so an unknown email costs about as much as a wrong password.
 */
const TIMING_EQUALIZER_HASH =
  "$2a$10$W7POmjTke1tCCnOqR7xJgebYlmm0XrQ6k63.7X8qK4.PNiCxLY9uS";

export interface WorkspaceChoice {
  slug: string;
  name: string;
}

export interface TenantSelectionRequired {
  requiresTenantSelection: true;
  tenants: WorkspaceChoice[];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private authUtilsService: AuthUtilsService,
    private mailService: MailService,
    private settingsService: SettingsService,
    private tenantService: TenantService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const tenantId = this.requireTenant();
    const user = await this.usersService.findByEmail(email, tenantId, true);
    if (
      user?.tenantId === tenantId &&
      user.isActive &&
      user.emailVerified === true &&
      (await this.authUtilsService.comparePassword(password, user.password))
    ) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return null;
    }

    return this.issueSession(user);
  }

  /**
   * Login without a workspace code. Only accounts whose password matches are
   * considered, so the answer never tells an anonymous caller whether an email
   * exists. One match opens the session through the normal tenant login path;
   * several matches return the workspaces to choose from, without a token.
   */
  async discoverLogin(
    email: string,
    password: string,
  ): Promise<
    | NonNullable<Awaited<ReturnType<AuthService["login"]>>>
    | TenantSelectionRequired
  > {
    const candidates = (
      await this.usersService.findLoginCandidatesByEmail(email)
    ).filter(
      (user) =>
        user.isActive &&
        user.emailVerified === true &&
        !!user.tenantId &&
        hasUsableMembership(user),
    );
    if (candidates.length === 0) {
      await this.authUtilsService.comparePassword(
        password,
        TIMING_EQUALIZER_HASH,
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const matches: User[] = [];
    for (const candidate of candidates) {
      if (
        await this.authUtilsService.comparePassword(
          password,
          candidate.password,
        )
      ) {
        matches.push(candidate);
      }
    }
    if (matches.length === 0)
      throw new UnauthorizedException(INVALID_CREDENTIALS);

    if (matches.length > 1) {
      return {
        requiresTenantSelection: true,
        tenants: matches
          .map((user) => ({
            slug: user.tenantId,
            name: user.organization?.name || user.tenantId,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "tr")),
      };
    }

    const session = await this.tenantService.runWithTenant(
      { tenantId: matches[0].tenantId, source: "public" },
      () => this.login({ email, password }),
    );
    if (!session) throw new UnauthorizedException(INVALID_CREDENTIALS);
    return session;
  }

  async createVerifiedSession(userId: string, tenantId: string) {
    const user = await this.usersService.findOne(userId, tenantId);
    if (!user?.isActive || !user.emailVerified || user.tenantId !== tenantId) {
      throw new UnauthorizedException("Invalid verification session");
    }
    return this.issueSession(user);
  }

  private createRefreshToken(user: Pick<User, "id" | "tokenVersion">): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        type: "refresh",
        tokenVersion: user.tokenVersion ?? 1,
        jti: randomUUID(),
      },
      { expiresIn: "7d" },
    );
  }

  private hashRefreshToken(token: string): string {
    return `refresh_hash_${createHash("sha256").update(token).digest("hex")}`;
  }

  private async issueSession(fullUser: User) {
    if (!fullUser.isActive || !fullUser.tenantId)
      throw new UnauthorizedException("Invalid identity");

    // JWT Payload Strategy: Minimal data to avoid stale role/permission issues
    // Role information is fetched fresh from DB on each request via JWT strategy
    const payload = {
      sub: fullUser.id,
      type: "access",
      email: fullUser.email,
      tokenVersion: fullUser.tokenVersion || 1, // For invalidating tokens on role changes
      // Multi-Tenancy: Inject technical tenantId slug (e.g. 'default')
      tenantId: fullUser.tenantId || null,
    };

    // Generate access token (60 minutes)
    const accessToken = this.jwtService.sign(payload, { expiresIn: "60m" });

    // Generate refresh token (7 days)
    const refreshToken = this.createRefreshToken(fullUser);

    // Store refresh token in database
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    await this.usersService.updateUser(
      fullUser.id,
      {
        refreshToken: this.hashRefreshToken(refreshToken),
        refreshTokenExpires,
        lastLoginAt: new Date(),
      },
      fullUser.tenantId,
    );

    // Return user info for initial frontend state (NOT in JWT)
    // Include role information for immediate UI rendering
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 60 minutes in seconds
      user: {
        id: fullUser.id,
        tenantId: fullUser.tenantId,
        isPlatformAdmin: isConfiguredPlatformAdmin(fullUser.id),
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        // Legacy roleId for backward compatibility
        roleId: fullUser.roleEntity?.name || null,
        // Multi-role support: include all roles with full details
        roles:
          fullUser.userRoles?.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            displayName: ur.role.displayName,
            isPrimary: ur.isPrimary,
          })) || [],
        // Primary role for quick access
        primaryRole: fullUser.userRoles?.find((ur) => ur.isPrimary)?.role
          ? {
              id: fullUser.userRoles.find((ur) => ur.isPrimary).role.id,
              name: fullUser.userRoles.find((ur) => ur.isPrimary).role.name,
              displayName: fullUser.userRoles.find((ur) => ur.isPrimary).role
                .displayName,
            }
          : fullUser.roleEntity
            ? {
                id: fullUser.roleEntity.id,
                name: fullUser.roleEntity.name,
                displayName: fullUser.roleEntity.displayName,
              }
            : null,
        // Include metadata for profile completion checks
        metadata: fullUser.metadata,
        // Include Organization Context
        organization: fullUser.organization
          ? {
              id: fullUser.organization.id,
              name: fullUser.organization.name,
              slug: fullUser.organization.slug,
            }
          : null,
      },
    };
  }

  private requireTenant(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId)
      throw new UnauthorizedException("Tenant context is required");
    return tenantId;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(
      email,
      this.requireTenant(),
      true,
    );
    return !!user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        sub?: string;
        type?: string;
        tokenVersion?: number;
        jti?: string;
      }>(refreshToken);
      if (
        payload.type !== "refresh" ||
        typeof payload.sub !== "string" ||
        !Number.isInteger(payload.tokenVersion) ||
        payload.tokenVersion < 1 ||
        typeof payload.jti !== "string" ||
        !payload.jti
      )
        throw new UnauthorizedException();
      // Verified subject is the only reason this identity lookup is global.
      const user = await this.usersService.findOne(
        payload.sub,
        undefined,
        true,
      );
      const hint = this.tenantService.getTenantId();
      if (
        !user?.isActive ||
        !user.tenantId ||
        (hint && hint !== user.tenantId) ||
        payload.tokenVersion !== (user.tokenVersion ?? 1) ||
        user.refreshToken !== this.hashRefreshToken(refreshToken) ||
        !user.refreshTokenExpires ||
        !(new Date(user.refreshTokenExpires).getTime() > Date.now())
      ) {
        throw new UnauthorizedException();
      }
      const newRefreshToken = this.createRefreshToken(user);
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (
        !(await this.usersService.rotateRefreshToken(
          user.id,
          user.tenantId,
          refreshToken,
          user.tokenVersion ?? 1,
          newRefreshToken,
          expires,
        ))
      )
        throw new UnauthorizedException();
      return {
        access_token: this.jwtService.sign(
          {
            sub: user.id,
            type: "access",
            email: user.email,
            tokenVersion: user.tokenVersion ?? 1,
            tenantId: user.tenantId,
          },
          { expiresIn: "60m" },
        ),
        refresh_token: newRefreshToken,
        expires_in: 3600,
      };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  /**
   * Generate email verification token
   */
  generateVerificationToken(): string {
    return `verify_${randomBytes(32).toString("hex")}`;
  }

  generatePasswordResetToken(): string {
    return `reset_${randomBytes(32).toString("hex")}`;
  }

  private hashPasswordResetToken(token: string): string {
    return `reset_hash_${createHash("sha256").update(token).digest("hex")}`;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const tenantId = this.requireTenant();
    const user = await this.usersService.findByEmail(email, tenantId, true);
    if (!user?.isActive || user.tenantId !== tenantId) return;

    const token = this.generatePasswordResetToken();
    await this.usersService.updateUser(
      user.id,
      {
        emailVerificationToken: this.hashPasswordResetToken(token),
        emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
      tenantId,
    );

    const baseUrl = await this.settingsService.getFrontendUrl(tenantId);
    const resetUrl = new URL(
      `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`,
    );
    if (!["https:", "http:"].includes(resetUrl.protocol)) return;

    try {
      await this.mailService.sendMail(
        {
          to: [{ email: user.email, name: user.firstName }],
          subject: "Şifrenizi Sıfırlayın - AffeXAI Cortex",
          html: `<p>Merhaba ${this.escapeHtml(user.firstName || "")},</p><p>Şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın. Bağlantı bir saat geçerlidir.</p><p><a href="${this.escapeHtml(resetUrl.toString())}">Şifremi sıfırla</a></p>`,
          text: `Şifrenizi yenilemek için bu bağlantıyı kullanın: ${resetUrl.toString()}`,
          channel: MailChannel.TRANSACTIONAL,
        },
        tenantId,
      );
    } catch {
      // Keep the public response account-enumeration safe. Mail delivery
      // failures remain observable in the mail subsystem.
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!/^reset_[a-f0-9]{64}$/.test(token))
      throw new BadRequestException("Invalid or expired reset token");
    const tenantId = this.requireTenant();
    const user = await this.usersService.findByVerificationToken(
      this.hashPasswordResetToken(token),
    );
    if (
      !user?.isActive ||
      user.tenantId !== tenantId ||
      !user.emailVerificationExpires ||
      new Date(user.emailVerificationExpires).getTime() <= Date.now()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }
    const hashedPassword =
      await this.authUtilsService.hashPassword(newPassword);
    if (
      !(await this.usersService.consumePasswordResetToken(
        user.id,
        tenantId,
        token,
        hashedPassword,
      ))
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }
  }

  async logout(userId: string, tokenVersion: number): Promise<void> {
    const tenantId = this.requireTenant();
    if (
      !(await this.usersService.revokeSessions(userId, tenantId, tokenVersion))
    )
      throw new UnauthorizedException("Session changed; sign in again");
  }

  async acceptInvitation(token: string, newPassword: string): Promise<void> {
    if (!/^invite_[a-f0-9]{64}$/.test(token))
      throw new BadRequestException("Invalid or expired invitation");
    const tenantId = this.requireTenant();
    const tokenHash = `invite_hash_${createHash("sha256").update(token).digest("hex")}`;
    const user = await this.usersService.findByVerificationToken(tokenHash);
    if (
      !user?.isActive ||
      user.emailVerified ||
      user.tenantId !== tenantId ||
      !user.emailVerificationExpires ||
      new Date(user.emailVerificationExpires).getTime() <= Date.now()
    ) {
      throw new BadRequestException("Invalid or expired invitation");
    }
    const hashedPassword =
      await this.authUtilsService.hashPassword(newPassword);
    if (
      !(await this.usersService.consumeInvitationToken(
        user.id,
        tenantId,
        token,
        hashedPassword,
      ))
    )
      throw new BadRequestException("Invalid or expired invitation");
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  /**
   * Create email verification token for user
   * Returns the token (to be sent via email)
   */
  async createEmailVerificationToken(
    userId: string,
    tenantId: string,
  ): Promise<string> {
    if (!tenantId)
      throw new UnauthorizedException("Tenant context is required");
    const token = this.generateVerificationToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token valid for 24 hours

    await this.usersService.updateUser(
      userId,
      {
        emailVerificationToken: `verify_hash_${createHash("sha256").update(token).digest("hex")}`,
        emailVerificationExpires: expires,
      },
      tenantId,
    );

    return token;
  }

  /**
   * Verify email with token
   * Returns user if successful, null if token invalid/expired
   */
  async verifyEmail(
    token: string,
  ): Promise<{ id: string; tenantId: string } | null> {
    // Legacy raw reset/welcome tokens cannot authorize email-verification login.
    if (!/^verify_[a-f0-9]{64}$/.test(token)) return null;
    const tokenHash = `verify_hash_${createHash("sha256").update(token).digest("hex")}`;
    const user = await this.usersService.findByVerificationToken(tokenHash);
    const hint = this.tenantService.getTenantId();
    if (
      !user?.isActive ||
      user.emailVerified ||
      !user.tenantId ||
      (hint && hint !== user.tenantId) ||
      !user.emailVerificationExpires ||
      !(new Date(user.emailVerificationExpires).getTime() > Date.now())
    )
      return null;
    const consumed = await this.usersService.consumeEmailVerificationToken(
      user.id,
      user.tenantId,
      token,
    );
    return consumed ? { id: user.id, tenantId: user.tenantId } : null;
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string,
    tenantId: string,
  ): Promise<void> {
    const token = await this.createEmailVerificationToken(userId, tenantId);
    // Use domain from site settings instead of hardcoded env variable
    const baseUrl = await this.settingsService.getFrontendUrl(tenantId);
    const verificationUrl = new URL(
      `${baseUrl.replace(/\/$/, "")}/verify-email/${token}`,
    );
    if (!["https:", "http:"].includes(verificationUrl.protocol)) {
      throw new ServiceUnavailableException(
        "Invalid verification URL configuration",
      );
    }
    const verificationLink = verificationUrl.toString();
    const escapeHtml = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character],
      );
    const safeName = escapeHtml(firstName);
    const safeLink = escapeHtml(verificationLink);

    try {
      const result = await this.mailService.sendMail(
        {
          to: [{ email, name: firstName }],
          subject: "Email Adresinizi Doğrulayın - AffeXAI Cortex",
          html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Email Adresinizi Doğrulayın</h2>
                <p>Merhaba ${safeName},</p>
                <p>AffeXAI Cortex hesabınızı etkinleştirmek için lütfen aşağıdaki butona tıklayın. Bu bağlantı 24 saat süreyle geçerlidir.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${safeLink}"
                     style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    E-posta Adresimi Doğrula
                  </a>
                </div>
                <p>Veya bu linki tarayıcınıza kopyalayın:</p>
                <p style="word-break: break-all; color: #666;">${safeLink}</p>
                <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.</p>
                <p>Teşekkürler,<br/>AffeXAI Cortex Ekibi</p>
              </div>
            </body>
          </html>
        `,
          text: `Merhaba ${firstName},\n\nAffeXAI Cortex hesabınızı etkinleştirmek için lütfen aşağıdaki linke tıklayın:\n${verificationLink}\n\nBu bağlantı 24 saat süreyle geçerlidir.\n\nTeşekkürler,\nAffeXAI Cortex Ekibi`,
          channel: MailChannel.TRANSACTIONAL,
        },
        tenantId,
      );
      if (result?.success !== true)
        throw new Error("Verification delivery failed");
    } catch {
      throw new ServiceUnavailableException(
        "Verification email could not be sent",
      );
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    dto: import("./dto/change-password.dto").ChangePasswordDto,
  ): Promise<void> {
    const tenantId = this.requireTenant();
    const user = await this.usersService.findOne(userId, tenantId);
    if (!user?.isActive || user.tenantId !== tenantId)
      throw new UnauthorizedException("Invalid identity");

    // Check if current password matches
    const isPasswordValid = await this.authUtilsService.comparePassword(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Mevcut şifre hatalı");
    }

    // Hash new password
    const hashedPassword = await this.authUtilsService.hashPassword(
      dto.newPassword,
    );

    // Update user
    if (
      !(await this.usersService.changePasswordCredentials(
        userId,
        tenantId,
        hashedPassword,
        user.tokenVersion ?? 1,
      ))
    ) {
      throw new UnauthorizedException("Session changed; sign in again");
    }
  }
}
