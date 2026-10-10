import { socketTransport } from './socket-transport';

describe('authenticated socket transport contract', () => {
  it.each([['chat','https://api.example.invalid/chat'],['tickets','https://api.example.invalid/tickets'],['notifications','https://api.example.invalid']])('uses configured %s namespace', (namespace, expected) => {
    expect(socketTransport(namespace as 'chat'|'tickets'|'notifications','https://api.example.invalid/api/',()=> 'access').url).toBe(expected);
  });
  it('reads canonical access token again for reconnect and never invents tenant identity', () => {
    let token = 'first';
    const transport = socketTransport('chat','http://127.0.0.1:19006',()=>token);
    const callback=jest.fn();transport.auth(callback);expect(callback).toHaveBeenLastCalledWith({token:'first'});
    token='rotated';transport.auth(callback);expect(callback).toHaveBeenLastCalledWith({token:'rotated'});
  });
  it('passes explicit tenant only as a selector and keeps missing credentials absent',()=>{
    const callback=jest.fn();socketTransport('tickets','http://127.0.0.1:19006',()=>null,'tenant-a').auth(callback);
    expect(callback).toHaveBeenCalledWith({token:null,tenantId:'tenant-a'});
  });
});
