const STORAGE_KEY = 'zaiko_sales_app_v2';
let state = loadState();
let scanner = null;
let masterScanner = null;
let scanning = false;
let masterScanning = false;
let deferredPrompt = null;
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const yen = n => new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(Number(n||0));
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{products:{},sales:[]}}catch(e){return{products:{},sales:[]}}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render()}
function beep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=880;gain.gain.value=.05;osc.start();setTimeout(()=>{osc.stop();ctx.close()},120)}catch(e){}}
function productArray(){return Object.values(state.products).sort((a,b)=>a.name.localeCompare(b.name,'ja'))}
function todaysSales(){return state.sales.filter(s=>s.date===today())}
function addSale(barcode, qty=1){barcode=String(barcode||'').trim();if(!barcode)return alert('バーコードを入力してください');let p=state.products[barcode];if(!p){const name=prompt(`未登録バーコードです。商品名を入力してください\n${barcode}`);if(!name)return;const price=Number(prompt('販売価格を入力してください','0')||0);const stock=Number(prompt('現在庫を入力してください','0')||0);p={barcode,name,price,stock};state.products[barcode]=p}p.stock=Math.max(0,Number(p.stock||0)-qty);state.sales.push({id:Date.now()+Math.random(),date:today(),time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),barcode,qty,price:Number(p.price||0),name:p.name});saveState();beep();$('scanStatus').textContent=`販売登録：${p.name} × ${qty}`}
async function startCamera(){if(scanning)return;if(!window.Html5Qrcode){alert('バーコード読取ライブラリを読み込めません。通信環境を確認してください。');return}if(location.protocol!=='https:' && location.hostname!=='localhost'){alert('カメラはHTTPSのURLでのみ使えます。GitHub Pagesの https://〜 で開いてください。');return}try{$('reader').classList.remove('hidden');$('scanStatus').textContent='カメラ許可を確認中...';scanner=new Html5Qrcode('reader');let devices=await Html5Qrcode.getCameras();if(!devices||!devices.length)throw new Error('カメラが見つかりません');let back=devices.find(d=>/back|rear|environment|背面|後/i.test(d.label));const config={fps:10,qrbox:(w,h)=>({width:Math.min(w*0.85,360),height:Math.min(h*0.45,180)}),aspectRatio:1.777};await scanner.start(back?{deviceId:{exact:back.id}}:{facingMode:'environment'},config,(decoded)=>{if(window.__lastCode===decoded && Date.now()-window.__lastTime<1800)return;window.__lastCode=decoded;window.__lastTime=Date.now();addSale(decoded,1)},()=>{});scanning=true;$('startScan').classList.add('hidden');$('stopScan').classList.remove('hidden');$('scanStatus').textContent='読取中：バーコードをカメラに映してください'}catch(err){console.error(err);$('scanStatus').textContent='カメラ起動に失敗しました';alert('カメラを起動できませんでした。Chromeで開く・カメラ許可・HTTPS URLを確認してください。\n\n' + (err.message||err));await stopCamera();}}
async function stopCamera(){try{if(scanner){await scanner.stop();await scanner.clear()}}catch(e){}scanner=null;scanning=false;$('reader').classList.add('hidden');$('startScan').classList.remove('hidden');$('stopScan').classList.add('hidden');}

async function startMasterCamera(){
  if(masterScanning)return;
  if(!window.Html5Qrcode){alert('バーコード読取ライブラリを読み込めません。通信環境を確認してください。');return}
  if(location.protocol!=='https:' && location.hostname!=='localhost'){
    alert('カメラはHTTPSのURLでのみ使えます。GitHub Pagesの https://〜 で開いてください。');return
  }
  try{
    if(scanning) await stopCamera();
    $('masterReader').classList.remove('hidden');
    $('masterScanStatus').textContent='カメラ許可を確認中...';
    masterScanner=new Html5Qrcode('masterReader');
    let devices=await Html5Qrcode.getCameras();
    if(!devices||!devices.length)throw new Error('カメラが見つかりません');
    let back=devices.find(d=>/back|rear|environment|背面|後/i.test(d.label));
    const config={fps:10,qrbox:(w,h)=>({width:Math.min(w*0.85,360),height:Math.min(h*0.45,180)}),aspectRatio:1.777};
    await masterScanner.start(back?{deviceId:{exact:back.id}}:{facingMode:'environment'},config,(decoded)=>{
      if(window.__lastMasterCode===decoded && Date.now()-window.__lastMasterTime<1800)return;
      window.__lastMasterCode=decoded;window.__lastMasterTime=Date.now();
      $('barcode').value=String(decoded).trim();
      const p=state.products[$('barcode').value];
      if(p){$('name').value=p.name;$('price').value=p.price;$('stock').value=p.stock;$('masterScanStatus').textContent=`登録済みJANを読み取り：${p.name}`}
      else {$('masterScanStatus').textContent=`JAN読取完了：${decoded}（商品名・価格・在庫を入力してください）`}
      beep();
      stopMasterCamera();
    },()=>{});
    masterScanning=true;
    $('startMasterScan').classList.add('hidden');
    $('stopMasterScan').classList.remove('hidden');
    $('masterScanStatus').textContent='読取中：JANコードをカメラに映してください';
  }catch(err){
    console.error(err);$('masterScanStatus').textContent='カメラ起動に失敗しました';
    alert('商品マスタ用カメラを起動できませんでした。Chromeで開く・カメラ許可・HTTPS URLを確認してください。\n\n' + (err.message||err));
    await stopMasterCamera();
  }
}
async function stopMasterCamera(){try{if(masterScanner){await masterScanner.stop();await masterScanner.clear()}}catch(e){}masterScanner=null;masterScanning=false;$('masterReader').classList.add('hidden');$('startMasterScan').classList.remove('hidden');$('stopMasterScan').classList.add('hidden');}

function saveProduct(){const barcode=$('barcode').value.trim();const name=$('name').value.trim();const price=Number($('price').value||0);const stock=Number($('stock').value||0);if(!barcode||!name)return alert('バーコードと商品名を入力してください');state.products[barcode]={barcode,name,price,stock};saveState();clearForm()}
function clearForm(){['barcode','name','price','stock'].forEach(id=>$(id).value='')}
function editProduct(barcode){const p=state.products[barcode];$('barcode').value=p.barcode;$('name').value=p.name;$('price').value=p.price;$('stock').value=p.stock;document.querySelector('[data-tab="master"]').click();scrollTo(0,0)}
function deleteProduct(barcode){if(confirm('この商品を削除しますか？')){delete state.products[barcode];saveState()}}
function stocktakeApply(barcode){const v=Number(document.querySelector(`[data-stocktake="${CSS.escape(barcode)}"]`).value||0);state.products[barcode].stock=v;saveState()}
function csvEscape(v){return `"${String(v??'').replaceAll('"','""')}"`}
function download(filename, rows){const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}
function render(){const sales=todaysSales();const total=sales.reduce((sum,s)=>sum+s.qty*s.price,0);$('todaySales').textContent=yen(total);$('todayQty').textContent=sales.reduce((sum,s)=>sum+s.qty,0);$('productCount').textContent=productArray().length;$('stockTotal').textContent=productArray().reduce((sum,p)=>sum+Number(p.stock||0),0);renderProducts();renderToday();renderStocktake()}
function renderProducts(){const list=$('productList');const ps=productArray();if(!ps.length){list.className='list empty';list.textContent='商品がありません';return}list.className='list';list.innerHTML=ps.map(p=>`<div class="item"><div class="item-head"><div><div class="item-title">${p.name}</div><div class="meta">${p.barcode} / ${yen(p.price)} / 在庫 ${p.stock}</div></div></div><div class="item-actions"><button class="ghost small" onclick="editProduct('${p.barcode}')">編集</button><button class="danger small" onclick="deleteProduct('${p.barcode}')">削除</button><button class="primary small" onclick="addSale('${p.barcode}',1)">1個販売</button></div></div>`).join('')}
function renderToday(){const list=$('todayList');const map={};todaysSales().forEach(s=>{if(!map[s.barcode])map[s.barcode]={...s,qty:0,total:0};map[s.barcode].qty+=s.qty;map[s.barcode].total+=s.qty*s.price});const rows=Object.values(map).sort((a,b)=>b.total-a.total);if(!rows.length){list.className='list empty';list.textContent='まだ販売データがありません';return}list.className='list';list.innerHTML=rows.map(r=>`<div class="item"><div class="item-head"><div><div class="item-title">${r.name}</div><div class="meta">販売 ${r.qty}個 / ${yen(r.price)} / 小計 ${yen(r.total)}</div></div></div></div>`).join('')}
function renderStocktake(){const list=$('stocktakeList');const ps=productArray();if(!ps.length){list.className='list empty';list.textContent='商品がありません';return}list.className='list';list.innerHTML=ps.map(p=>`<div class="item"><div class="item-title">${p.name}</div><div class="meta">${p.barcode} / 現在庫 ${p.stock}</div><div class="item-actions"><input class="stock-input" data-stocktake="${p.barcode}" type="number" min="0" value="${p.stock}"><button class="primary small" onclick="stocktakeApply('${p.barcode}')">棚卸反映</button></div></div>`).join('')}
function backup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`zaiko-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
function restore(file){const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!data.products||!data.sales)throw new Error();state=data;saveState();alert('読込しました')}catch(e){alert('バックアップファイルを読めませんでした')}};reader.readAsText(file)}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active'));btn.classList.add('active');$(btn.dataset.tab).classList.add('active')}));
$('startScan').onclick=startCamera;$('stopScan').onclick=stopCamera;$('startMasterScan').onclick=startMasterCamera;$('stopMasterScan').onclick=stopMasterCamera;$('addSaleOne').onclick=()=>addSale($('saleBarcode').value,1);$('saveProduct').onclick=saveProduct;$('clearForm').onclick=clearForm;$('exportSales').onclick=()=>download(`sales-${today()}.csv`,[['日付','時刻','バーコード','商品名','数量','単価','売上'],...state.sales.map(s=>[s.date,s.time,s.barcode,s.name,s.qty,s.price,s.qty*s.price])]);$('exportStock').onclick=()=>download(`stock-${today()}.csv`,[['バーコード','商品名','販売価格','在庫数'],...productArray().map(p=>[p.barcode,p.name,p.price,p.stock])]);$('exportMaster').onclick=()=>download(`master-${today()}.csv`,[['バーコード','商品名','販売価格','在庫数'],...productArray().map(p=>[p.barcode,p.name,p.price,p.stock])]);$('backupBtn').onclick=backup;$('restoreFile').onchange=e=>e.target.files[0]&&restore(e.target.files[0]);$('clearSalesToday').onclick=()=>{if(confirm('今日の売上を削除しますか？')){state.sales=state.sales.filter(s=>s.date!==today());saveState()}};$('clearAll').onclick=()=>{if(confirm('商品・売上データを全て削除しますか？')){state={products:{},sales:[]};saveState()}};window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').classList.add('hidden')}};if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}render();
