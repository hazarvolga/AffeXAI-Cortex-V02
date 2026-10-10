import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCrmCustomerDto } from './create-crm-customer.dto';

export class ImportCrmCustomersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateCrmCustomerDto)
  customers: CreateCrmCustomerDto[];
}
