import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { KnowledgeBaseCategoryService } from '../services/knowledge-base-category.service';

/** Public projection only; TenantMiddleware must resolve an explicit valid tenant. */
@Controller('public/knowledge-base/categories')
export class PublicKnowledgeBaseCategoryController {
 constructor(private readonly service:KnowledgeBaseCategoryService){}
 private present(value:any){return {id:value.id,name:value.name,description:value.description,slug:value.slug,color:value.color,icon:value.icon,parentId:value.parentId,articleCount:value.articleCount,...(value.path?{path:value.path}:{})};}
 @Get() async list(){return (await this.service.getCategoriesWithCounts()).map(value=>this.present(value));}
 @Get('tree') tree(){return this.service.getCategoryTree();}
 @Get(':id/path') async path(@Param('id',ParseUUIDPipe)id:string){return this.present(await this.service.getCategoryWithPath(id));}
 @Get(':id/articles') articles(@Param('id',ParseUUIDPipe)id:string,@Query('limit')limit='20',@Query('offset')offset='0',@Query('includeSubcategories')descendants='false'){
  if(!['true','false'].includes(descendants))throw new BadRequestException('Invalid descendant option');
  return this.service.getCategoryArticles(id,Number(limit),Number(offset),descendants==='true');
 }
 @Get(':id') async detail(@Param('id',ParseUUIDPipe)id:string){return this.present(await this.service.getCategory(id));}
}
