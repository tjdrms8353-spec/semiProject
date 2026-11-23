import test from 'node:test'
import assert from 'node:assert/strict'
import { sendSelection, sendRecommendations } from './api.js'

test('integrated AI segmentation uses the common API base and multipart image', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/circle-search/segment')
    assert.equal(options.method, 'POST')
    assert.equal(options.body.get('width'), '100')
    assert.equal(options.body.get('image').name, 'sample.png')
    return {ok:true,json:async()=>({selected_object:{product_type:'shirt'}})}
  })
  const result=await sendSelection({file:new File(['test'],'sample.png'),width:100,height:100}, {point:{x:1,y:1},box:{},polygon:[]})
  assert.equal(result.selected_object.product_type,'shirt')
})
test('integrated AI service preserves structured server errors rather than fake recommendations', async t => {
  t.mock.method(globalThis, 'fetch', async()=>({ok:false,status:503,json:async()=>({detail:{message:'Unavailable',search_diagnostics:{stage:'search'}}})}))
  await assert.rejects(sendRecommendations(new File(['test'],'crop.png'),{}),error=>{
    assert.match(error.message,/503: Unavailable/)
    assert.equal(error.diagnostics.stage,'search')
    return true
  })
})
