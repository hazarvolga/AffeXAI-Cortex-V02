import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserRoleDto {
  @ApiProperty({ description: 'New role ID (UUID)', example: 'a1b2c3d4-e5f6-4789-abcd-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}
