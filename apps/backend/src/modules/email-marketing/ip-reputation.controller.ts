import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { IpReputationService, IpReputationResult } from './services/ip-reputation.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

/**
 * Controller for IP reputation checking endpoints
 * This provides RESTful API endpoints for checking IP reputation
 */
@ApiTags('Email Marketing - IP Reputation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/ip-reputation')
export class IpReputationController {
  constructor(private readonly ipReputationService: IpReputationService) {}

  /**
   * Check the reputation of an IP address
   * This endpoint allows external services to check if an IP is listed on spam blacklists
   * 
   * @param ip The IP address to check
   * @returns IP reputation result
   */
  @Get(':ip')
  @ApiOperation({ 
    summary: 'Check IP reputation', 
    description: 'Check if an IP address is listed on DNS-based blackhole lists (DNSBLs)' 
  })
  @ApiParam({ 
    name: 'ip', 
    description: 'IPv4 address to check', 
    example: '192.168.1.1' 
  })
  @ApiQuery({ 
    name: 'detailed', 
    required: false, 
    description: 'Include detailed error information', 
    type: Boolean 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'IP reputation check result', 
    type: Object 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid IP address format' 
  })
  async checkIpReputation(
    @Param('ip') ip: string,
    @Query('detailed') detailed?: boolean
  ): Promise<IpReputationResult> {
    // Validate IP format
    if (!this.isValidIpAddress(ip)) {
      throw new BadRequestException('Invalid IP address format');
    }

    // Perform IP reputation check
    const result = await this.ipReputationService.checkIpReputation(ip);
    
    // If detailed flag is not set, omit error details for cleaner response
    if (!detailed && result.errors) {
      const { errors, ...resultWithoutErrors } = result;
      return resultWithoutErrors as IpReputationResult;
    }
    
    return result;
  }

  /**
   * Validates IP address format (IPv4 only)
   * This is a helper method to validate IP addresses in the controller
   * 
   * @param ip The IP address to validate
   * @returns True if valid IPv4 format, false otherwise
   */
  private isValidIpAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) {
      return false;
    }

    const octets = ip.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }
}