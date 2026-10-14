import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "../../modules/users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto, registrationInput } from "./dto/register.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Throttle } from "@nestjs/throttler";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post("register")
  async register(@Body() createUserDto: RegisterDto) {
    try {
      console.log("📝 Register request received:", {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        hasPhone: !!createUserDto.phone,
        hasMetadata: !!createUserDto.metadata,
      });

      // Create user
      const user = await this.usersService.create(
        registrationInput(createUserDto),
      );

      console.log("✓ User created, sending verification email...");

      // Send verification email
      await this.authService.sendVerificationEmail(
        user.id,
        user.email,
        user.firstName,
        user.tenantId,
      );

      console.log("✓ Verification email sent successfully");

      return {
        success: true,
        message: "Kayıt başarılı! Email adresinize doğrulama linki gönderildi.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      console.error("❌ Register error:", {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
      });

      if (error.status === 409) {
        throw new HttpException(
          "Bu email adresi zaten kayıtlı",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    if (!result) {
      throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }
    return result;
  }

  /** Login without a workspace code; see AuthService.discoverLogin. */
  @Post("login/discover")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async discoverLogin(@Body() loginDto: LoginDto) {
    return this.authService.discoverLogin(loginDto.email, loginDto.password);
  }

  @Post("check-email")
  async checkEmail(@Body("email") email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return {
      exists,
      message: exists
        ? "Bu email adresi zaten kayıtlı"
        : "Email adresi kullanılabilir",
    };
  }

  @Post("refresh")
  async refresh(@Body("refresh_token") refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException("Refresh token required", HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.refreshAccessToken(refreshToken);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Token refresh failed",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      success: true,
      message:
        "Talebiniz alındı. Hesap uygunsa şifre sıfırlama yönergeleri gönderilecektir.",
    };
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      success: true,
      message: "Şifreniz güncellendi. Tüm eski oturumlar kapatıldı.",
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    await this.authService.logout(req.user.userId, req.user.tokenVersion);
    return { success: true };
  }

  @Post("invitations/accept")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    await this.authService.acceptInvitation(dto.token, dto.newPassword);
    return {
      success: true,
      message: "Davet kabul edildi. Giriş yapabilirsiniz.",
    };
  }

  @Post("verify-email")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const user = await this.authService.verifyEmail(dto.token);

    if (!user) {
      throw new HttpException(
        "Geçersiz veya süresi dolmuş doğrulama linki",
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message:
        "Email adresiniz başarıyla doğrulandı. Şimdi giriş yapabilirsiniz.",
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);

    if (!user) {
      throw new HttpException("User not found", HttpStatus.UNAUTHORIZED);
    }

    return {
      success: true,
      data: {
        id: user.id,
        tenantId: user.tenantId,
        isPlatformAdmin: req.user.isPlatformAdmin === true,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        phone: user.phone,
        city: user.city,
        country: user.country,
        address: user.address,
        bio: user.bio,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        metadata: user.metadata,
        // ✅ CRITICAL: Include roles with permissions for frontend permission checks
        roles: user.roles || [], // All user roles with permissions
        primaryRole: user.primaryRole, // Primary role with permissions
      },
    };
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.userId, changePasswordDto);
    return {
      success: true,
      message: "Şifreniz başarıyla güncellendi",
    };
  }
}
