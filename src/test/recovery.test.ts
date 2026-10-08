import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {clearToken, currentToken} from '../drive/google'
import {clearLocalData, exportLocalData, localStore} from '../lib/store'
beforeEach(async()=>{await clearLocalData();clearToken()})
afterEach(()=>vi.restoreAllMocks())
it('ignores corrupt, expired and near-expiry session tokens',()=>{
 for(const raw of ['{broken',JSON.stringify({accessToken:'synthetic',expiresAt:Date.now()-1}),JSON.stringify({accessToken:'synthetic',expiresAt:Date.now()+10000})]){
  sessionStorage.setItem('pilares:gdrive:token',raw);expect(currentToken()).toBeNull()
 }
 sessionStorage.setItem('pilares:gdrive:token',JSON.stringify({accessToken:'synthetic',expiresAt:Date.now()+60000}));expect(currentToken()).toBe('synthetic')
})
it('an actual IndexedDB transaction abort rejects and preserves previous committed data',async()=>{
 await localStore.set('synthetic-record',{value:1})
 const transaction=IDBDatabase.prototype.transaction
 vi.spyOn(IDBDatabase.prototype,'transaction').mockImplementation(function(this:IDBDatabase,...args:Parameters<IDBDatabase['transaction']>){
  const tx=transaction.apply(this,args);if(args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx
 })
 await expect(localStore.set('synthetic-record',{value:2})).rejects.toThrow()
 vi.restoreAllMocks()
 expect(await localStore.get('synthetic-record')).toEqual({value:1})
 expect(await exportLocalData()).toEqual({'synthetic-record':{value:1}})
})
