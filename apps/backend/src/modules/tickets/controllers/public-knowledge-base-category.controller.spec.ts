import { PublicKnowledgeBaseCategoryController } from './public-knowledge-base-category.controller';

describe('public knowledge category projection',()=>{
 const internal={id:'11111111-1111-4111-8111-111111111111',name:'Guides',description:'Public',slug:'guides',color:'blue',icon:'book',parentId:null,articleCount:2,path:['Guides'],tenantId:'tenant-private',createdBy:'private-user',updatedBy:'private-user',ticketCategoryId:'private-mapping'};
 const service={getCategoriesWithCounts:jest.fn().mockResolvedValue([internal]),getCategoryTree:jest.fn(),getCategoryWithPath:jest.fn().mockResolvedValue(internal),getCategoryArticles:jest.fn(),getCategory:jest.fn().mockResolvedValue(internal)};
 const controller=new PublicKnowledgeBaseCategoryController(service as never);
 it('omits tenant, audit and internal mapping fields from list',async()=>{const [category]=await controller.list();expect(category).toMatchObject({id:internal.id,name:'Guides',articleCount:2});expect(category).not.toHaveProperty('tenantId');expect(category).not.toHaveProperty('createdBy');expect(category).not.toHaveProperty('ticketCategoryId');});
 it('preserves breadcrumb path without exposing internal fields',async()=>{const category=await controller.path(internal.id);expect(category.path).toEqual(['Guides']);expect(category).not.toHaveProperty('updatedBy');});
});
