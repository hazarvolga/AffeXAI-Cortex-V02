import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class ReorderMenuItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  menuItemIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  orderIndexes: number[];
}
