import {ChatDataExtractorService} from './chat-data-extractor.service';
import {TicketDataExtractorService} from './ticket-data-extractor.service';
import {In} from 'typeorm';
describe('FAQ extraction is tenant and source bounded before limit',()=>{
 const builder={leftJoinAndSelect:jest.fn().mockReturnThis(),where:jest.fn().mockReturnThis(),andWhere:jest.fn().mockReturnThis(),orderBy:jest.fn().mockReturnThis(),take:jest.fn().mockReturnThis(),getMany:jest.fn(async()=>[])};
 const tickets={find:jest.fn(async()=>[])};
 const chats={createQueryBuilder:jest.fn(()=>builder)};
 const logger={log:jest.fn(),error:jest.fn(),warn:jest.fn()};
 const chat=Object.assign(Object.create(ChatDataExtractorService.prototype),{chatSessionRepository:chats,logger});
 const ticket=Object.assign(Object.create(TicketDataExtractorService.prototype),{ticketRepository:tickets,logger});
 beforeEach(()=>jest.clearAllMocks());
 it.each(['chat','ticket'])('rejects omitted tenant before %s query',async kind=>{await expect((kind==='chat'?chat:ticket).extract({maxResults:1})).rejects.toThrow();expect(tickets.find).not.toHaveBeenCalled();expect(chats.createQueryBuilder).not.toHaveBeenCalled();});
 it('chat query includes tenant and exact source IDs',async()=>{await chat.extract({tenantId:'ta',sourceIds:['source'],maxResults:1});expect(builder.andWhere).toHaveBeenCalledWith('session.tenantId = :tenantId',{tenantId:'ta'});expect(builder.andWhere).toHaveBeenCalledWith('session.id IN (:...sourceIds)',{sourceIds:['source']});expect(builder.take).toHaveBeenCalledWith(1);});
 it('ticket source ID predicate is applied before query limit',async()=>{await ticket.extract({tenantId:'ta',sourceIds:['source'],maxResults:1});expect(tickets.find).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({tenantId:'ta',id:In(['source'])}),take:1}));});
});
