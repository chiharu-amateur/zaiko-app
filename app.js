const yen = n => new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(Number(n||0));
const todayKey = () => new Date().toISOString().slice(0,10);
const $ = id => document.getElementById(id);
const LS = 'zaikocam_sales_v1';
let state = JSON.parse(localStorage.getItem(LS) || '{"products":{},"sales":[]}');
let codeReader = null;
let currentScan = null;
function save(){ localStorage.setItem(LS, JSON.stringify(state)); render(); }
function product(code){ return state.products[String(code || '').trim()]; }
function stopScan(){ if(currentScan){ currentScan.stop(); currentScan=null; } document.querySelectorAll('video').forEach(v=>v.srcObject=null); }
async function startScan(videoId, inputId){
  stopScan();
  try{
    if(!window.ZXingBrowser) throw new Error('読取ライブラリを読み込めませんでした');
    codeReader = codeReader || new ZXingBrowser.BrowserMultiFormatReader();
    currentScan = await codeReader.decodeFromVideoDevice(undefined, videoId, (result, err, controls)=>{
      if(result){ $(inputId).value = result.getText(); vibrate(); updateInfo(); }
    });
  }catch(e){ alert('カメラを起動できませんでした。HTTPSのURLで開いているか、カメラ許可を確認してください。'); }
}
function vibrate(){ if(navigator.vibrate) navigator.vibrate(80); }
function addSale(){
  const code = $('sellBarcode').value.trim(); const p = product(code); const qty = Math.max(1, Number($('sellQty').value||1));
  if(!code) return alert('バーコードを入力してください');
  if(!p) return alert('商品マスタに登録されていません。先に商品マスタへ登録してください。');
  state.sales.push({date:todayKey(), barcode:code, name:p.name, price:Number(p.price||0), qty, amount:Number(p.price||0)*qty, time:new Date().toLocaleTimeString('ja-JP')});
  p.stock = Math.max(0, Number(p.stock||0)-qty); $('sellQty').value = 1; save();
}
function saveStock(){
  const code = $('stockBarcode').value.trim(); const p = product(code); const qty = Math.max(0, Number($('stockQty').value||0));
  if(!code) return alert('バーコードを入力してください');
  if(!p) return alert('商品マスタに登録されていません。先に商品マスタへ登録してください。');
  p.stock = qty; p.lastStocktake = new Date().toLocaleString('ja-JP'); save();
}
function saveProduct(){
  const code=$('mBarcode').value.trim(), name=$('mName').value.trim();
  if(!code || !name) return alert('バーコードと商品名を入力してください');
  state.products[code] = {barcode:code, name, price:Number($('mPrice').value||0), stock:Number($('mStock').value||0), updatedAt:new Date().toLocaleString('ja-JP')};
  ['mBarcode','mName'].forEach(id=>$(id).value=''); $('mPrice').value=0; $('mStock').value=0; save();
}
function updateInfo(){
  const s = product($('sellBarcode').value); $('sellProductInfo').textContent = s ? `${s.name} / ${yen(s.price)} / 現在庫 ${s.stock}` : '未登録の商品です。商品マスタに登録してください。';
  const t = product($('stockBarcode').value); $('stockProductInfo').textContent = t ? `${t.name} / 現在庫 ${t.stock} / 価格 ${yen(t.price)}` : '未登録の商品です。商品マスタに登録してください。';
}
function render(){
  const products = Object.values(state.products); const todays = state.sales.filter(s=>s.date===todayKey());
  $('todayRevenue').textContent = yen(todays.reduce((a,s)=>a+s.amount,0));
  $('todayQty').textContent = todays.reduce((a,s)=>a+s.qty,0);
  $('productCount').textContent = products.length;
  $('stockValue').textContent = yen(products.reduce((a,p)=>a+(Number(p.price||0)*Number(p.stock||0)),0));
  $('productList').innerHTML = products.length ? products.map(p=>`<div class="item"><div><b>${esc(p.name)}</b><small>${p.barcode}<br>価格 ${yen(p.price)} / 在庫 ${p.stock}</small><div class="mini-actions"><button onclick="editProduct('${p.barcode}')">編集</button><button class="danger" onclick="deleteProduct('${p.barcode}')">削除</button></div></div><div class="amount">${yen(p.price)}</div></div>`).join('') : '登録商品はありません。';
  $('stockList').innerHTML = products.length ? products.map(p=>`<div class="item"><div><b>${esc(p.name)}</b><small>${p.barcode}<br>最終棚卸 ${p.lastStocktake||'-'}</small></div><div class="amount">${p.stock}個<br><small>${yen(Number(p.price||0)*Number(p.stock||0))}</small></div></div>`).join('') : '商品マスタを登録してください。';
  const byToday = group(todays); $('todaySalesList').innerHTML = byToday.length ? byToday.map(r=>`<div class="item"><div><b>${esc(r.name)}</b><small>${r.barcode}<br>${yen(r.price)} × ${r.qty}個</small></div><div class="amount">${yen(r.amount)}</div></div>`).join('') : 'まだ販売データがありません。';
  const byAll = group(state.sales).sort((a,b)=>b.amount-a.amount); $('rankingList').innerHTML = byAll.length ? byAll.map((r,i)=>`<div class="item"><div><b>${i+1}. ${esc(r.name)}</b><small>${r.barcode}<br>${r.qty}個販売</small></div><div class="amount">${yen(r.amount)}</div></div>`).join('') : 'まだ販売データがありません。';
  updateInfo();
}
function group(rows){ const m={}; rows.forEach(s=>{m[s.barcode]??={barcode:s.barcode,name:s.name,price:s.price,qty:0,amount:0}; m[s.barcode].qty+=s.qty; m[s.barcode].amount+=s.amount;}); return Object.values(m); }
function editProduct(code){ const p=product(code); if(!p)return; $('mBarcode').value=p.barcode; $('mName').value=p.name; $('mPrice').value=p.price; $('mStock').value=p.stock; showTab('master'); }
function deleteProduct(code){ if(confirm('この商品を削除しますか？')){ delete state.products[code]; save(); } }
function clearToday(){ if(confirm('今日の販売データを削除しますか？在庫数は戻りません。')){ state.sales = state.sales.filter(s=>s.date!==todayKey()); save(); } }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function csv(name, rows){ if(!rows.length) return alert('出力するデータがありません'); const keys=Object.keys(rows[0]); const body=[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))].join('\n'); download(name, '\ufeff'+body, 'text/csv'); }
function download(name, text, type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function showTab(id){ document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active')); document.querySelector(`.tab[data-tab="${id}"]`).classList.add('active'); $(id).classList.add('active'); stopScan(); }
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('startSellScan').onclick=()=>startScan('sellVideo','sellBarcode'); $('stopSellScan').onclick=stopScan; $('startStockScan').onclick=()=>startScan('stockVideo','stockBarcode'); $('stopStockScan').onclick=stopScan;
$('addSale').onclick=addSale; $('saveStock').onclick=saveStock; $('saveProduct').onclick=saveProduct; $('clearToday').onclick=clearToday;
['sellBarcode','stockBarcode'].forEach(id=>$(id).addEventListener('input', updateInfo));
$('exportSales').onclick=()=>csv(`sales_${todayKey()}.csv`, state.sales);
$('exportStock').onclick=()=>csv(`stock_${todayKey()}.csv`, Object.values(state.products).map(p=>({barcode:p.barcode,name:p.name,price:p.price,stock:p.stock,stock_value:p.price*p.stock,last_stocktake:p.lastStocktake||''})));
$('exportMaster').onclick=()=>csv(`master_${todayKey()}.csv`, Object.values(state.products));
$('backupData').onclick=()=>download(`zaikocam_backup_${todayKey()}.json`, JSON.stringify(state,null,2), 'application/json');
$('restoreData').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=JSON.parse(r.result); save(); alert('読み込みました');}catch{alert('読み込めませんでした');}}; r.readAsText(f); };
let deferredPrompt; window.addEventListener('beforeinstallprompt', e=>{e.preventDefault(); deferredPrompt=e; $('installBtn').classList.remove('hidden');}); $('installBtn').onclick=()=>deferredPrompt?.prompt();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
