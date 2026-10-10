import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { KnowledgeBaseCategory } from '../entities/knowledge-base-category.entity';
import { KnowledgeBaseArticle } from '../entities/knowledge-base-article.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { User } from '../../users/entities/user.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CreateCategoryDto {name:string;description?:string;color?:string;icon?:string;parentId?:string|null;sortOrder?:number;ticketCategoryId?:string|null;}
export interface UpdateCategoryDto extends Partial<CreateCategoryDto>{isActive?:boolean;}
export interface CategoryTreeNode {id:string;name:string;slug:string;color:string;icon:string;articleCount:number;children:CategoryTreeNode[];level:number;}
export interface CategoryStats {totalCategories:number;activeCategories:number;totalArticles:number;averageArticlesPerCategory:number;mostPopularCategories:KnowledgeBaseCategory[];unusedCategories:KnowledgeBaseCategory[];}

/** Help taxonomy is independent of ticket classification. Association is explicit, never inferred by name or UUID. */
@Injectable()
export class KnowledgeBaseCategoryService {
 constructor(@InjectRepository(KnowledgeBaseCategory) private readonly categoryRepository:Repository<KnowledgeBaseCategory>,private readonly tenantService:TenantService){}
 private scope(write=false):string {
  const context=this.tenantService.getTenantContext();
  if(!context?.tenantId || !['authenticated','public','system'].includes(context.source||'') || (write&&context.source==='public'))throw new ForbiddenException('Verified category tenant context required');
  return context.tenantId;
 }
 private uuid(id:unknown):asserts id is string {if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new BadRequestException('Invalid category ID');}
 private async row(id:string,repo=this.categoryRepository,active=false){this.uuid(id);const value=await repo.findOne({where:{id,tenantId:this.scope(),...(active?{isActive:true}:{})}});if(!value)throw new NotFoundException('Category not found');return value;}
 private async transaction<T>(work:(manager:EntityManager)=>Promise<T>):Promise<T>{
  const tenantId=this.scope(true);
  return this.categoryRepository.manager.transaction(async manager=>{
   // Serialize hierarchy changes for a tenant, including concurrent moves/create/reorder.
   await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 14001))',[tenantId]);
   return work(manager);
  });
 }
 private async actor(manager:EntityManager,id:string){this.uuid(id);if(!await manager.getRepository(User).findOne({where:{id,tenantId:this.scope(true),isActive:true,deletedAt:IsNull()}}))throw new NotFoundException('Active category editor not found');}
 private validate(dto:UpdateCategoryDto,creating=false){
  const fields=['name','description','color','icon','parentId','sortOrder','isActive','ticketCategoryId'];
  if(!dto||typeof dto!=='object'||Array.isArray(dto)||Object.keys(dto).some(key=>!fields.includes(key)))throw new BadRequestException('Unsupported category fields');
  if((creating||dto.name!==undefined)&&(typeof dto.name!=='string'||dto.name.trim().length<2||dto.name.length>255))throw new BadRequestException('Category name must contain 2 to 255 characters');
  if(dto.description!==undefined&&(typeof dto.description!=='string'||dto.description.length>1000))throw new BadRequestException('Invalid description');
  if(dto.color!==undefined&&!['blue','green','red','yellow','purple','pink','indigo','gray'].includes(dto.color))throw new BadRequestException('Invalid color');
  if(dto.icon!==undefined&&!['folder','book','file','tag','star','heart','info','help'].includes(dto.icon))throw new BadRequestException('Invalid icon');
  if(dto.sortOrder!==undefined&&(!Number.isInteger(dto.sortOrder)||dto.sortOrder<0||dto.sortOrder>100000))throw new BadRequestException('Invalid sort order');
  if(dto.isActive!==undefined&&typeof dto.isActive!=='boolean')throw new BadRequestException('Invalid active status');
  for(const value of [dto.parentId,dto.ticketCategoryId])if(value!==undefined&&value!==null)this.uuid(value);
 }
 private async mapping(manager:EntityManager,id?:string|null){if(id&&!await manager.getRepository(TicketCategory).findOne({where:{id,tenantId:this.scope(),isActive:true,deletedAt:IsNull()}}))throw new NotFoundException('Mapped ticket category not found');}
 private async graph(repo=this.categoryRepository,active=false){const values=await repo.find({where:{tenantId:this.scope(),...(active?{isActive:true}:{})},order:{sortOrder:'ASC',name:'ASC'},take:2001});if(values.length>2000)throw new BadRequestException('Category hierarchy exceeds supported size');return values;}
 private ancestors(id:string,rows:KnowledgeBaseCategory[]):KnowledgeBaseCategory[]{
  const map=new Map(rows.map(row=>[row.id,row]));const visited=new Set<string>();const result:KnowledgeBaseCategory[]=[];let current=map.get(id);
  while(current){if(visited.has(current.id))throw new BadRequestException('Circular category hierarchy');visited.add(current.id);result.unshift(current);current=current.parentId?map.get(current.parentId):undefined;}
  return result;
 }
 private descendants(id:string,rows:KnowledgeBaseCategory[]):KnowledgeBaseCategory[]{
  const found:KnowledgeBaseCategory[]=[];const visited=new Set([id]);const queue=[id];
  while(queue.length){const parent=queue.shift()!;for(const row of rows.filter(value=>value.parentId===parent)){if(visited.has(row.id))throw new BadRequestException('Circular category hierarchy');visited.add(row.id);found.push(row);queue.push(row.id);}}
  return found;
 }
 private async parent(repo:Repository<KnowledgeBaseCategory>,parentId:string|null|undefined,id?:string){
  if(!parentId)return;const rows=await this.graph(repo);const parent=rows.find(row=>row.id===parentId&&row.isActive);if(!parent)throw new NotFoundException('Parent category not found');
  const path=this.ancestors(parentId,rows);if(parentId===id||path.some(row=>row.id===id))throw new BadRequestException('Circular category hierarchy');
  const subtree=id?this.descendants(id,rows):[];const maxSubDepth=Math.max(0,...subtree.map(row=>this.ancestors(row.id,rows).length-(this.ancestors(id!,rows).length)));
  if(path.length+maxSubDepth>=3)throw new BadRequestException('Maximum category depth of 3 levels exceeded');
 }
 async generateSlug(name:string){return name.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'category';}
 private async slug(name:string,repo:Repository<KnowledgeBaseCategory>,excludeId?:string){const base=await this.generateSlug(name);const rows=await this.graph(repo);let value=base;let n=1;while(rows.some(row=>row.slug===value&&row.id!==excludeId))value=`${base}-${n++}`;return value;}
 async createCategory(dto:CreateCategoryDto,userId:string){this.validate(dto,true);return this.transaction(async manager=>{await this.actor(manager,userId);const repo=manager.getRepository(KnowledgeBaseCategory);await this.parent(repo,dto.parentId);await this.mapping(manager,dto.ticketCategoryId);return repo.save(repo.create({...dto,name:dto.name.trim(),slug:await this.slug(dto.name,repo),tenantId:this.scope(true),createdBy:userId,updatedBy:userId}));});}
 async updateCategory(id:string,dto:UpdateCategoryDto,userId:string){this.validate(dto);return this.transaction(async manager=>{await this.actor(manager,userId);const repo=manager.getRepository(KnowledgeBaseCategory);await this.row(id,repo);if(dto.parentId!==undefined)await this.parent(repo,dto.parentId,id);await this.mapping(manager,dto.ticketCategoryId);const result=await repo.update({id,tenantId:this.scope(true)},{...dto,...(dto.name!==undefined?{name:dto.name.trim(),slug:await this.slug(dto.name,repo,id)}:{}),updatedBy:userId});if(!result.affected)throw new NotFoundException('Category not found');return this.row(id,repo);});}
 async getCategory(id:string){return this.row(id,this.categoryRepository,true);}
 async getAllCategories(){return this.graph(this.categoryRepository,true);}
 async getAdminCategories(){this.scope(true);return this.graph();}
 private async count(category:KnowledgeBaseCategory){if(!category.ticketCategoryId)return 0;return this.categoryRepository.manager.getRepository(KnowledgeBaseArticle).count({where:{tenantId:this.scope(),categoryId:category.ticketCategoryId,status:'published',isPublished:true}});}
 async getCategoriesWithCounts(){return Promise.all((await this.getAllCategories()).map(async value=>({...value,articleCount:await this.count(value)})));}
 async getCategoryTree():Promise<CategoryTreeNode[]>{const rows=await this.getCategoriesWithCounts();const nodes=new Map<string,CategoryTreeNode>();for(const row of rows){const path=this.ancestors(row.id,rows);nodes.set(row.id,{id:row.id,name:row.name,slug:row.slug,color:row.color,icon:row.icon,articleCount:row.articleCount,level:path.length-1,children:[]});}const roots:CategoryTreeNode[]=[];for(const row of rows){const node=nodes.get(row.id)!;const parent=row.parentId?nodes.get(row.parentId):undefined;if(parent)parent.children.push(node);else roots.push(node);}return roots;}
 async getCategoryPath(id:string){await this.getCategory(id);return this.ancestors(id,await this.getAllCategories()).map(row=>row.name);}
 async getCategoryWithPath(id:string){const category=(await this.getCategoriesWithCounts()).find(row=>row.id===id);if(!category)throw new NotFoundException('Category not found');return {...category,path:await this.getCategoryPath(id)};}
 async getCategoryDescendants(id:string){await this.getCategory(id);return this.descendants(id,await this.getAllCategories());}
 async getCategoryAncestors(id:string){await this.getCategory(id);return this.ancestors(id,await this.getAllCategories()).slice(0,-1);}
 async validateHierarchy(id:string,parentId?:string){try{await this.parent(this.categoryRepository,parentId,id);return true;}catch{return false;}}
 async moveCategory(id:string,newParentId?:string|null){return this.transaction(async manager=>{const repo=manager.getRepository(KnowledgeBaseCategory);await this.row(id,repo);await this.parent(repo,newParentId,id);await repo.update({id,tenantId:this.scope(true)},{parentId:newParentId||null});});}
 private ids(ids:string[]){if(!Array.isArray(ids)||ids.length<1||ids.length>100||new Set(ids).size!==ids.length)throw new BadRequestException('Expected 1 to 100 distinct category IDs');for(const id of ids)this.uuid(id);}
 private async selected(repo:Repository<KnowledgeBaseCategory>,ids:string[]){this.ids(ids);const rows=await repo.find({where:{id:In(ids),tenantId:this.scope(true)}});if(rows.length!==ids.length)throw new NotFoundException('Category not found');return rows;}
 async reorderCategories(ids:string[]){this.ids(ids);return this.transaction(async manager=>{const repo=manager.getRepository(KnowledgeBaseCategory);const rows=await this.selected(repo,ids);if(new Set(rows.map(row=>row.parentId||null)).size!==1)throw new BadRequestException('Categories must share a parent');for(const [sortOrder,id]of ids.entries())await repo.update({id,tenantId:this.scope(true)},{sortOrder});});}
 async bulkUpdateStatus(ids:string[],isActive:boolean){if(typeof isActive!=='boolean')throw new BadRequestException('Invalid active status');return this.transaction(async manager=>{const repo=manager.getRepository(KnowledgeBaseCategory);await this.selected(repo,ids);await repo.update({id:In(ids),tenantId:this.scope(true)},{isActive});});}
 async bulkDeleteCategories(ids:string[]){return this.transaction(async manager=>{const repo=manager.getRepository(KnowledgeBaseCategory);const rows=await this.selected(repo,ids);for(const row of rows){if(row.ticketCategoryId)throw new BadRequestException('Unmap ticket classification before deleting a help category');await repo.update({parentId:row.id,tenantId:this.scope(true)},{parentId:row.parentId||null});}await repo.delete({id:In(ids),tenantId:this.scope(true)});});}
 async deleteCategory(id:string){return this.bulkDeleteCategories([id]);}
 async updateArticleCounts(){this.scope(true);for(const row of await this.graph())await this.categoryRepository.update({id:row.id,tenantId:this.scope(true)},{articleCount:await this.count(row)});}
 async getPopularCategories(limit=10){if(!Number.isInteger(limit)||limit<1||limit>100)throw new BadRequestException('Invalid limit');return (await this.getCategoriesWithCounts()).sort((a,b)=>b.articleCount-a.articleCount).slice(0,limit);}
 async getCategoryStats():Promise<CategoryStats>{this.scope(true);const all=await this.graph();const active=await this.getCategoriesWithCounts();const totalArticles=active.reduce((sum,row)=>sum+row.articleCount,0);return {totalCategories:all.length,activeCategories:active.length,totalArticles,averageArticlesPerCategory:active.length?Math.round(totalArticles/active.length*100)/100:0,mostPopularCategories:[...active].sort((a,b)=>b.articleCount-a.articleCount).slice(0,5),unusedCategories:active.filter(row=>row.articleCount===0).slice(0,10)};}
 async searchCategories(query:string){if(typeof query!=='string'||!query.trim()||query.length>200)throw new BadRequestException('Invalid search');const normalized=query.toLocaleLowerCase();return (await this.getCategoriesWithCounts()).filter(row=>`${row.name} ${row.description||''}`.toLocaleLowerCase().includes(normalized));}
 async getCategoriesByParent(parentId?:string){if(parentId)await this.getCategory(parentId);return (await this.getCategoriesWithCounts()).filter(row=>(row.parentId||null)===(parentId||null));}
 async getRootCategories(){return this.getCategoriesByParent();}
 async initializeDefaultCategories(userId:string){const existing=await this.getAdminCategories();const result:KnowledgeBaseCategory[]=[];for(const name of ['Getting Started','Troubleshooting','Features','FAQ'])if(!existing.some(row=>row.name===name))result.push(await this.createCategory({name},userId));return result;}
 async getCategoryArticles(id:string,limit=20,offset=0,includeSubcategories=false){
  if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>10000||typeof includeSubcategories!=='boolean')throw new BadRequestException('Invalid article pagination');
  const category=await this.getCategory(id);const folders=[category,...(includeSubcategories?await this.getCategoryDescendants(id):[])];const ids=[...new Set(folders.map(row=>row.ticketCategoryId).filter((value):value is string=>!!value))];
  if(!ids.length)return {articles:[],total:0,limit,offset};
  const [articles,total]=await this.categoryRepository.manager.getRepository(KnowledgeBaseArticle).findAndCount({where:{tenantId:this.scope(),categoryId:In(ids),status:'published',isPublished:true},relations:['author','category'],order:{createdAt:'DESC',id:'DESC'},take:limit,skip:offset});
  return {articles:articles.map(article=>({id:article.id,slug:article.slug,title:article.title,summary:article.summary,viewCount:article.viewCount,helpfulCount:article.helpfulCount,notHelpfulCount:article.notHelpfulCount,isFeatured:article.isFeatured,publishedAt:article.publishedAt,author:article.author?{id:article.author.id,firstName:article.author.firstName,lastName:article.author.lastName,avatar:article.author.avatar}:undefined,category:article.category?{id:article.category.id,name:article.category.name,color:article.category.color}:undefined})),total,limit,offset};
 }
}
