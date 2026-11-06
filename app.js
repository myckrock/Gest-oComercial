const KEY='gestao_comercial_v2';
const state=JSON.parse(localStorage.getItem(KEY)||'{"clientes":[],"produtos":[],"vendas":[],"itensVenda":[],"parcelas":[],"movimentos":[],"fornecedores":[],"despesas":[],"socios":[],"movimentosSocios":[]}');
state.fornecedores ||= []; state.despesas ||= []; state.socios ||= []; state.movimentosSocios ||= [];
const save=()=>localStorage.setItem(KEY,JSON.stringify(state)); const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const uid=()=> (globalThis.crypto && typeof globalThis.crypto.randomUUID==='function')
  ? globalThis.crypto.randomUUID()
  : 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const dateBR=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR'):'—';
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const addMonths=(iso,n)=>{const d=new Date(iso+'T12:00:00'),day=d.getDate();d.setMonth(d.getMonth()+n,1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return d.toISOString().slice(0,10)};
function show(id){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(id).classList.remove('hidden');renderAll()}
function initApp(){
  document.querySelectorAll('nav button').forEach(b=>{
    b.addEventListener('click',()=>show(b.dataset.view));
  });
  const venc=$('vendaPrimeiroVenc');
  if(venc && !venc.value) venc.value=addDays(today(),30);
}

function novoCliente(){$('clienteForm').reset();$('clienteId').value='';show('clientes')}
$('clienteForm').onsubmit=e=>{e.preventDefault();const id=$('clienteId').value||uid(),c={id,nome:$('clienteNome').value.trim(),doc:$('clienteDoc').value.trim(),tel:$('clienteTel').value.trim(),dia:Number($('clienteDia').value||0),limite:Number($('clienteLimite').value||0),email:$('clienteEmail').value.trim(),obs:$('clienteObs').value.trim()};const i=state.clientes.findIndex(x=>x.id===id);i>=0?state.clientes[i]=c:state.clientes.push(c);save();novoCliente();};
function editCliente(id){const c=state.clientes.find(x=>x.id===id);$('clienteId').value=c.id;$('clienteNome').value=c.nome;$('clienteDoc').value=c.doc||'';$('clienteTel').value=c.tel||'';$('clienteDia').value=c.dia||'';$('clienteLimite').value=c.limite||'';$('clienteEmail').value=c.email||'';$('clienteObs').value=c.obs||'';show('clientes')}
function delCliente(id){if(confirm('Excluir cliente?')){state.clientes=state.clientes.filter(x=>x.id!==id);save();renderAll()}}

function novoProduto(){$('produtoForm').reset();$('produtoId').value='';show('produtos')}
$('produtoForm').onsubmit=e=>{e.preventDefault();const id=$('produtoId').value||uid(),old=state.produtos.find(x=>x.id===id),p={id,codigo:$('produtoCodigo').value.trim(),nome:$('produtoNome').value.trim(),categoria:$('produtoCategoria').value.trim(),preco:Number($('produtoPreco').value||0),custo:Number($('produtoCusto').value||0),estoque:old?old.estoque:Number($('produtoEstoque').value||0),minimo:Number($('produtoMinimo').value||0),unidade:$('produtoUnidade').value||'un',obs:$('produtoObs').value||''};const i=state.produtos.findIndex(x=>x.id===id);i>=0?state.produtos[i]=p:state.produtos.push(p);if(!old&&p.estoque)state.movimentos.push({id:uid(),produtoId:id,tipo:'entrada',quantidade:p.estoque,data:today()});save();novoProduto()}
function editProduto(id){const p=state.produtos.find(x=>x.id===id);$('produtoId').value=p.id;$('produtoCodigo').value=p.codigo||'';$('produtoNome').value=p.nome;$('produtoCategoria').value=p.categoria||'';$('produtoPreco').value=p.preco;$('produtoCusto').value=p.custo;$('produtoEstoque').value=p.estoque;$('produtoMinimo').value=p.minimo;$('produtoUnidade').value=p.unidade;$('produtoObs').value=p.obs||'';show('produtos')}
function ajustarEstoque(id){const p=state.produtos.find(x=>x.id===id),v=prompt(`Estoque atual de ${p.nome}: ${p.estoque}\nNovo estoque:`);if(v===null)return;const n=Number(v.replace(',','.'));if(Number.isNaN(n)||n<0)return alert('Estoque inválido.');state.movimentos.push({id:uid(),produtoId:id,tipo:'ajuste',quantidade:n-p.estoque,data:today()});p.estoque=n;save();renderAll()}
function delProduto(id){if(confirm('Excluir produto?')){state.produtos=state.produtos.filter(x=>x.id!==id);save();renderAll()}}

$('addItem').onclick=()=>addItem();
function addItem(){if(!state.produtos.length)return alert('Cadastre/importa produtos primeiro.');const d=document.createElement('div');d.className='sale-item';d.innerHTML=`<label>Produto<select class="item-prod">${state.produtos.map(p=>`<option value="${p.id}">${esc(p.nome)} — ${money(p.preco)} — est. ${p.estoque}</option>`).join('')}</select></label><label>Qtd<input class="item-qtd" type="number" min=".001" step=".001" value="1"></label><label>Preço<input class="item-preco" type="number" min="0" step=".01"></label><button type="button" class="danger">X</button>`;const s=d.querySelector('.item-prod'),pr=d.querySelector('.item-preco');const sync=()=>{pr.value=state.produtos.find(p=>p.id===s.value)?.preco||0;calcTotal()};s.onchange=sync;d.querySelector('.item-qtd').oninput=calcTotal;pr.oninput=calcTotal;d.querySelector('button').onclick=()=>{d.remove();calcTotal()};$('itens').appendChild(d);sync()}
function calcTotal(){let t=0;document.querySelectorAll('.sale-item').forEach(r=>t+=Number(r.querySelector('.item-qtd').value||0)*Number(r.querySelector('.item-preco').value||0));$('vendaTotal').textContent=money(t);return t}
$('vendaForm').onsubmit=e=>{e.preventDefault();const clienteId=$('vendaCliente').value,rows=[...document.querySelectorAll('.sale-item')];if(!clienteId)return alert('Selecione o cliente.');if(!rows.length)return alert('Adicione produtos.');const items=rows.map(r=>({produtoId:r.querySelector('.item-prod').value,quantidade:Number(r.querySelector('.item-qtd').value),preco:Number(r.querySelector('.item-preco').value)}));for(const it of items){const p=state.produtos.find(x=>x.id===it.produtoId);if(!p||p.estoque<it.quantidade)return alert(`Estoque insuficiente: ${p?.nome||''}`)}const total=items.reduce((a,i)=>a+i.quantidade*i.preco,0),entrada=Math.min(Number($('vendaEntrada').value||0),total),saldo=total-entrada,id=uid();state.vendas.push({id,clienteId,data:today(),total,entrada,saldo,forma:$('vendaForma').value});items.forEach(it=>{const p=state.produtos.find(x=>x.id===it.produtoId);p.estoque-=it.quantidade;state.itensVenda.push({vendaId:id,...it});state.movimentos.push({id:uid(),produtoId:p.id,tipo:'venda',quantidade:-it.quantidade,vendaId:id,data:today()})});const qtd=Math.max(1,Number($('vendaParcelas').value||1));if(saldo>0){const base=Math.floor(saldo/qtd*100)/100;for(let n=1;n<=qtd;n++){const valor=n===qtd?Number((saldo-base*(qtd-1)).toFixed(2)):base;const b=$('vendaPrimeiroVenc').value||addDays(today(),30),v=$('vendaIntervalo').value==='1'?addMonths(b,n-1):addDays(b,Number($('vendaIntervalo').value)*(n-1));state.parcelas.push({id:uid(),vendaId:id,clienteId,numero:n,totalParcelas:qtd,valor,valorPago:0,vencimento:v,status:'aberta'})}}save();e.target.reset();$('itens').innerHTML='';$('vendaPrimeiroVenc').value=addDays(today(),30);renderAll();alert('Venda registrada! Estoque atualizado e parcelas criadas.')}

function pagarParcela(id){const p=state.parcelas.find(x=>x.id===id),saldo=p.valor-p.valorPago,v=prompt(`Saldo: ${money(saldo)}\nValor recebido:`,saldo.toFixed(2).replace('.',','));if(v===null)return;const n=Number(v.replace(',','.'));if(n<=0||n>saldo+.001)return alert('Valor inválido.');p.valorPago=Number((p.valorPago+n).toFixed(2));p.status=p.valorPago>=p.valor?'paga':'parcial';p.pagoEm=p.status==='paga'?today():null;save();renderAll()}

function parseTable(txt){txt=txt.replace(/^\uFEFF/,'').trim();const lines=txt.split(/\r?\n/).filter(Boolean),sep=lines[0].includes(';')?';':',';return lines.map(line=>{let out=[],cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){q=!q}else if(c===sep&&!q){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out})}
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const num=s=>Number(String(s??'0').replace(/R\$|\s/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'))||0;
function importarMatriz(rows,tipo){if(rows.length<2)return 0;const headers=rows[0].map(norm),get=(r,...names)=>{for(const n of names){const i=headers.indexOf(norm(n));if(i>=0)return r[i]}return ''};let count=0;
if(tipo==='clientes'){for(const r of rows.slice(1)){const nome=get(r,'nome','cliente');if(!nome)continue;const doc=get(r,'documento','cpf','cnpj');let c=state.clientes.find(x=>doc&&x.doc===doc);const obj={id:c?.id||uid(),nome,doc,tel:get(r,'telefone','celular'),dia:Number(get(r,'dia','diapagamento')||0),limite:num(get(r,'limite','limitecredito')),email:get(r,'email'),obs:get(r,'observacoes','obs')};c?Object.assign(c,obj):state.clientes.push(obj);count++}}
else if(tipo==='produtos'){for(const r of rows.slice(1)){const nome=get(r,'nome','produto');if(!nome)continue;const codigo=get(r,'codigo','sku','cod');let p=state.produtos.find(x=>codigo&&x.codigo===codigo)||state.produtos.find(x=>x.nome.toLowerCase()===nome.toLowerCase());const estoque=num(get(r,'estoque','quantidade'));const obj={id:p?.id||uid(),codigo,nome,categoria:get(r,'categoria'),preco:num(get(r,'preco','precodevenda','valor')),custo:num(get(r,'custo','precocusto')),estoque:p?p.estoque:estoque,minimo:num(get(r,'minimo','estoqueminimo')),unidade:get(r,'unidade','und')||'un',obs:get(r,'observacoes','obs')};p?Object.assign(p,obj):state.produtos.push(obj);if(!p&&estoque)state.movimentos.push({id:uid(),produtoId:obj.id,tipo:'entrada',quantidade:estoque,data:today()});count++}}
else if(tipo==='precos'){for(const r of rows.slice(1)){const codigo=get(r,'codigo','sku','cod'),nome=get(r,'nome','produto'),p=state.produtos.find(x=>(codigo&&x.codigo===codigo)||(nome&&x.nome.toLowerCase()===nome.toLowerCase()));if(!p)continue;const old=p.preco;p.preco=num(get(r,'preco','valor','precodevenda'));if(get(r,'custo'))p.custo=num(get(r,'custo'));count++}}
else if(tipo==='estoque'){for(const r of rows.slice(1)){const codigo=get(r,'codigo','sku','cod'),nome=get(r,'nome','produto'),p=state.produtos.find(x=>(codigo&&x.codigo===codigo)||(nome&&x.nome.toLowerCase()===nome.toLowerCase()));if(!p)continue;const n=num(get(r,'estoque','quantidade'));state.movimentos.push({id:uid(),produtoId:p.id,tipo:'importacao',quantidade:n-p.estoque,data:today()});p.estoque=n;count++}}
save();return count}

// -------------------- DESPESAS / FORNECEDORES --------------------
function novoFornecedor(){ $('fornecedorForm').reset(); $('fornecedorId').value=''; show('despesas'); }
$('fornecedorForm').onsubmit=e=>{
  e.preventDefault(); const id=$('fornecedorId').value||uid();
  const f={id,nome:$('fornecedorNome').value.trim(),doc:$('fornecedorDoc').value.trim(),tel:$('fornecedorTel').value.trim(),email:$('fornecedorEmail').value.trim(),obs:$('fornecedorObs').value.trim()};
  const i=state.fornecedores.findIndex(x=>x.id===id); i>=0?state.fornecedores[i]=f:state.fornecedores.push(f); save(); novoFornecedor();
};
function editFornecedor(id){const f=state.fornecedores.find(x=>x.id===id); if(!f)return; $('fornecedorId').value=f.id;$('fornecedorNome').value=f.nome||'';$('fornecedorDoc').value=f.doc||'';$('fornecedorTel').value=f.tel||'';$('fornecedorEmail').value=f.email||'';$('fornecedorObs').value=f.obs||'';show('despesas')}
function delFornecedor(id){if(confirm('Excluir fornecedor? As despesas já lançadas serão mantidas.')){state.fornecedores=state.fornecedores.filter(x=>x.id!==id);save();renderAll()}}
function novaDespesa(){ $('despesaForm').reset(); $('despesaId').value=''; $('despesaData').value=today(); show('despesas'); }
$('despesaForm').onsubmit=e=>{
  e.preventDefault(); const valor=num($('despesaValor').value); if(valor<=0)return alert('Informe um valor maior que zero.');
  const id=$('despesaId').value||uid(); const d={id,data:$('despesaData').value||today(),descricao:$('despesaDescricao').value.trim(),categoria:$('despesaCategoria').value.trim(),fornecedorId:$('despesaFornecedor').value||'',valor,forma:$('despesaForma').value,obs:$('despesaObs').value.trim()};
  if(!d.descricao)return alert('Informe a descrição da despesa.'); const i=state.despesas.findIndex(x=>x.id===id); i>=0?state.despesas[i]=d:state.despesas.push(d); save(); novaDespesa();
};
function editDespesa(id){const d=state.despesas.find(x=>x.id===id);if(!d)return;$('despesaId').value=d.id;$('despesaData').value=d.data||today();$('despesaDescricao').value=d.descricao||'';$('despesaCategoria').value=d.categoria||'';$('despesaFornecedor').value=d.fornecedorId||'';$('despesaValor').value=d.valor||0;$('despesaForma').value=d.forma||'pix';$('despesaObs').value=d.obs||'';show('despesas')}
function delDespesa(id){if(confirm('Excluir esta despesa?')){state.despesas=state.despesas.filter(x=>x.id!==id);save();renderAll()}}

// -------------------- SOCIOS / PARTILHA --------------------
function novoSocio(){ $('socioForm').reset(); $('socioId').value=''; $('socioPercentual').value='0'; show('socios'); }
$('socioForm').onsubmit=e=>{
  e.preventDefault(); const id=$('socioId').value||uid(); const nome=$('socioNome').value.trim(); const percentual=Number($('socioPercentual').value||0);
  if(!nome)return alert('Informe o nome do sócio.'); if(percentual<0||percentual>100)return alert('A participação deve ficar entre 0 e 100%.');
  const s={id,nome,percentual,doc:$('socioDoc').value.trim(),obs:$('socioObs').value.trim()}; const i=state.socios.findIndex(x=>x.id===id); i>=0?state.socios[i]=s:state.socios.push(s); save(); novoSocio();
};
function editSocio(id){const s=state.socios.find(x=>x.id===id);if(!s)return;$('socioId').value=s.id;$('socioNome').value=s.nome||'';$('socioPercentual').value=s.percentual||0;$('socioDoc').value=s.doc||'';$('socioObs').value=s.obs||'';show('socios')}
function delSocio(id){if(confirm('Excluir sócio? Os lançamentos financeiros anteriores serão mantidos.')){state.socios=state.socios.filter(x=>x.id!==id);save();renderAll()}}
function novoMovSocio(){ $('movSocioForm').reset(); $('movSocioId').value=''; $('movSocioData').value=today(); $('movSocioTipo').value='retirada'; show('socios'); }
$('movSocioForm').onsubmit=e=>{
  e.preventDefault(); const socioId=$('movSocioSocio').value, valor=num($('movSocioValor').value); if(!socioId)return alert('Selecione um sócio.'); if(valor<=0)return alert('Informe um valor maior que zero.');
  const id=$('movSocioId').value||uid(); const m={id,socioId,data:$('movSocioData').value||today(),tipo:$('movSocioTipo').value,valor,descricao:$('movSocioDescricao').value.trim()};
  if(!m.descricao)return alert('Informe a descrição do lançamento.'); const i=state.movimentosSocios.findIndex(x=>x.id===id); i>=0?state.movimentosSocios[i]=m:state.movimentosSocios.push(m); save(); novoMovSocio();
};
function editMovSocio(id){const m=state.movimentosSocios.find(x=>x.id===id);if(!m)return;$('movSocioId').value=m.id;$('movSocioSocio').value=m.socioId||'';$('movSocioData').value=m.data||today();$('movSocioTipo').value=m.tipo||'retirada';$('movSocioValor').value=m.valor||0;$('movSocioDescricao').value=m.descricao||'';show('socios')}
function delMovSocio(id){if(confirm('Excluir este lançamento?')){state.movimentosSocios=state.movimentosSocios.filter(x=>x.id!==id);save();renderAll()}}
function socioSaldo(id){return state.movimentosSocios.filter(m=>m.socioId===id).reduce((a,m)=>a+(m.tipo==='credito'?m.valor:-m.valor),0)}
function totalDespesas(){return state.despesas.reduce((a,d)=>a+Number(d.valor||0),0)}

// -------------------- IMPORTAÇÃO FLEXÍVEL --------------------
// Aceita títulos de colunas com diversos sinônimos em português.
const ALIASES={
  codigo:['codigo','cod','sku','ref','referencia','referência','id produto','codigo produto','código produto','cod produto','cod. produto','referência produto'],
  nome:['nome','produto','produtos','item','itens','descricao','descrição','nome produto','produto nome','nome do produto','nome item','descrição produto','mercadoria','artigo'],
  categoria:['categoria','grupo','familia','família','tipo','classificacao','classificação','departamento','linha'],
  preco:['preco','preço','valor','valor venda','valor de venda','preco venda','preço venda','preco de venda','preço de venda','preço unitario','preço unitário','valor unitario','valor unitário','venda','vlr venda','vl venda','pv','preço final','valor final'],
  custo:['custo','preco custo','preço custo','valor custo','custo unitario','custo unitário','preco de custo','preço de custo','valor de custo'],
  estoque:['estoque','qtd estoque','quantidade estoque','saldo estoque','saldo','quantidade','qtd','qtde','existencia','existência','disponivel','disponível','saldo atual','estoque atual'],
  minimo:['minimo','mínimo','estoque minimo','estoque mínimo','qtd minima','qtd mínima','quantidade minima','quantidade mínima','estoque min'],
  unidade:['unidade','und','un','unid','medida','unidade medida'],
  observacoes:['observacoes','observações','obs','observacao','observação','comentarios','comentários','nota','notas'],
  documento:['documento','cpf','cnpj','cpf cnpj','cpf/cnpj','documento cliente','registro'],
  telefone:['telefone','tel','celular','fone','whatsapp','whats app','telefone celular','contato'],
  dia:['dia','dia pagamento','dia de pagamento','dia preferencial','dia preferencial pagamento','vencimento dia'],
  limite:['limite','limite credito','limite de credito','limite de crédito','credito','crédito','limite cliente'],
  email:['email','e mail','e-mail','correio eletronico','correio eletrônico'],
  cliente:['cliente','clientes','comprador','compradores','consumidor','consumidores','nome cliente','cliente nome','nome do cliente','nome comprador','comprador nome','razão social','razao social','pessoa','cliente/ comprador'],
  valor:['valor','preco','preço','valor total','total','valor venda','valor de venda','preco venda','preço venda','valor unitario','valor unitário']
};
const aliasMap=Object.fromEntries(Object.entries(ALIASES).flatMap(([k,arr])=>arr.map(a=>[norm(a),k])));
function canonicalHeader(h){const n=norm(h);return aliasMap[n]||n}
function getCol(headers,r,...keys){
  const canonical=headers.map(canonicalHeader);
  for(const key of keys){
    const wanted=canonicalHeader(key);
    let i=canonical.indexOf(wanted);
    if(i>=0)return r[i];
  }
  // fallback: correspondência parcial para títulos como "Preço de venda (R$)"
  for(let i=0;i<canonical.length;i++){
    const h=canonical[i];
    for(const key of keys){
      const k=canonicalHeader(key);
      if(h.includes(k)||k.includes(h)) return r[i];
    }
  }
  return '';
}
function parseTable(txt){
  txt=txt.replace(/^\uFEFF/,'').trim();
  const lines=txt.split(/\r?\n/).filter(Boolean),sep=lines[0]?.includes(';')?';':',';
  return lines.map(line=>{let out=[],cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){q=!q}else if(c===sep&&!q){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out})
}

async function unzipXlsx(arrayBuffer){
  const bytes=new Uint8Array(arrayBuffer),dv=new DataView(arrayBuffer);
  const u16=(o)=>dv.getUint16(o,true),u32=(o)=>dv.getUint32(o,true);
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(u32(i)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw new Error('Arquivo XLSX inválido: ZIP central não encontrado.');
  const count=u16(eocd+10),cdSize=u32(eocd+12),cdOffset=u32(eocd+16);
  const dec=new TextDecoder('utf-8');
  const entries={};let pos=cdOffset;
  for(let n=0;n<count;n++){
    if(u32(pos)!==0x02014b50)throw new Error('Estrutura XLSX inválida.');
    const method=u16(pos+10),compSize=u32(pos+20),nameLen=u16(pos+28),extraLen=u16(pos+30),commentLen=u16(pos+32),localOffset=u32(pos+42);
    const name=dec.decode(bytes.slice(pos+46,pos+46+nameLen));
    const localNameLen=u16(localOffset+26),localExtraLen=u16(localOffset+28),dataStart=localOffset+30+localNameLen+localExtraLen;
    const comp=bytes.slice(dataStart,dataStart+compSize);
    let data;
    if(method===0)data=comp;
    else if(method===8){
      if(!('DecompressionStream' in window))throw new Error('Seu navegador não suporta a leitura XLSX local. Use uma versão recente do Chrome/Edge.');
      const stream=new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data=new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error('Método de compactação XLSX não suportado.');
    entries[name]=data;
    pos+=46+nameLen+extraLen+commentLen;
  }
  return entries;
}
function xmlDoc(bytes){return new DOMParser().parseFromString(new TextDecoder('utf-8').decode(bytes),'application/xml')}
function xmlText(el){return el?.textContent??''}
async function xlsxToRows(arrayBuffer){
  const files=await unzipXlsx(arrayBuffer), workbook=xmlDoc(files['xl/workbook.xml']);
  const relDoc=xmlDoc(files['xl/_rels/workbook.xml.rels']);
  const rels={};
  [...relDoc.getElementsByTagName('Relationship')].forEach(x=>rels[x.getAttribute('Id')]=x.getAttribute('Target'));
  const sheet=workbook.getElementsByTagName('sheet')[0];
  if(!sheet)throw new Error('A planilha XLSX não possui abas.');
  const rid=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  let target=rels[rid];
  if(!target)throw new Error('Não foi possível localizar a primeira aba do XLSX.');
  target=target.replace(/^\//,'');
  if(!target.startsWith('xl/'))target='xl/'+target.replace(/^xl\//,'');
  const shared=[];
  if(files['xl/sharedStrings.xml']){
    const sd=xmlDoc(files['xl/sharedStrings.xml']);
    [...sd.getElementsByTagName('si')].forEach(si=>shared.push([...si.getElementsByTagName('t')].map(xmlText).join('')));
  }
  const sd=xmlDoc(files[target]);
  const rows=[];
  [...sd.getElementsByTagName('row')].forEach(row=>{
    const vals=[];let last=-1;
    [...row.getElementsByTagName('c')].forEach(c=>{
      const ref=c.getAttribute('r')||'';const m=ref.match(/([A-Z]+)\d+$/i);let idx=0;
      if(m){for(const ch of m[1].toUpperCase())idx=idx*26+(ch.charCodeAt(0)-64);idx--}
      const type=c.getAttribute('t');const v=c.getElementsByTagName('v')[0];let value=xmlText(v);
      if(type==='s')value=shared[Number(value)]??'';
      else if(type==='inlineStr')value=[...c.getElementsByTagName('t')].map(xmlText).join('');
      else if(type==='b')value=value==='1'?'SIM':'NÃO';
      vals[idx]=value;last=Math.max(last,idx);
    });
    while(vals.length<last+1)vals.push(''); rows.push(vals);
  });
  return rows;
}

async function lerArquivoTabela(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(ext==='xlsx')return await xlsxToRows(await file.arrayBuffer());
  return parseTable(await file.text());
}

function importarMatriz(rows,tipo){
  if(rows.length<2)return 0;
  const headers=rows[0];
  const get=(r,...names)=>getCol(headers,r,...names);
  let count=0;
  if(tipo==='clientes'){
    for(const r of rows.slice(1)){const nome=get(r,'nome','cliente','comprador','consumidor','nome cliente','nome comprador');if(!nome)continue;const doc=get(r,'documento','cpf','cnpj');let c=state.clientes.find(x=>doc&&x.doc===doc);const obj={id:c?.id||uid(),nome,doc,tel:get(r,'telefone','celular','fone','whatsapp'),dia:Number(get(r,'dia','dia pagamento','dia preferencial')||0),limite:num(get(r,'limite','limite credito','credito')),email:get(r,'email','e-mail'),obs:get(r,'observacoes','obs')};c?Object.assign(c,obj):state.clientes.push(obj);count++}
  } else if(tipo==='produtos'){
    for(const r of rows.slice(1)){const nome=get(r,'nome','produto','item','descricao','descrição','mercadoria');if(!nome)continue;const codigo=get(r,'codigo','sku','cod','referencia','ref');let p=state.produtos.find(x=>codigo&&x.codigo===codigo)||state.produtos.find(x=>x.nome.toLowerCase()===nome.toLowerCase());const estoque=num(get(r,'estoque','quantidade','qtd','saldo'));const obj={id:p?.id||uid(),codigo,nome,categoria:get(r,'categoria','grupo','familia','família'),preco:num(get(r,'preco','preço','valor','valor venda','preco venda','preço venda')),custo:num(get(r,'custo','preco custo','preço custo','valor custo')),estoque:p?p.estoque:estoque,minimo:num(get(r,'minimo','mínimo','estoque minimo','estoque mínimo')),unidade:get(r,'unidade','und','unid')||'un',obs:get(r,'observacoes','obs')};p?Object.assign(p,obj):state.produtos.push(obj);if(!p&&estoque)state.movimentos.push({id:uid(),produtoId:obj.id,tipo:'entrada',quantidade:estoque,data:today()});count++}
  } else if(tipo==='precos'){
    for(const r of rows.slice(1)){const codigo=get(r,'codigo','sku','cod','referencia'),nome=get(r,'nome','produto','item','descricao','descrição'),p=state.produtos.find(x=>(codigo&&x.codigo===codigo)||(nome&&x.nome.toLowerCase()===nome.toLowerCase()));if(!p)continue;const novoPreco=get(r,'preco','preço','valor','valor venda','preco venda','preço venda');if(novoPreco!=='')p.preco=num(novoPreco);const custo=get(r,'custo','preco custo','preço custo');if(custo!=='')p.custo=num(custo);count++}
  } else if(tipo==='estoque'){
    for(const r of rows.slice(1)){const codigo=get(r,'codigo','sku','cod','referencia'),nome=get(r,'nome','produto','item','descricao','descrição'),p=state.produtos.find(x=>(codigo&&x.codigo===codigo)||(nome&&x.nome.toLowerCase()===nome.toLowerCase()));if(!p)continue;const n=num(get(r,'estoque','quantidade','qtd','saldo'));state.movimentos.push({id:uid(),produtoId:p.id,tipo:'importacao',quantidade:n-p.estoque,data:today()});p.estoque=n;count++}
  }
  save();return count;
}
async function processarImportacao(){
  const f=$('importFile').files[0];if(!f)return alert('Escolha um arquivo .xlsx ou CSV.');
  try{const rows=await lerArquivoTabela(f);$('importPreview').textContent=rows.slice(0,8).map(r=>r.join(' | ')).join('\n');const n=importarMatriz(rows,$('importTipo').value);renderAll();alert(`${n} registro(s) importado(s) com sucesso.`)}catch(err){console.error(err);alert('Não foi possível ler a tabela.\n\n'+err.message)}
}
function importarTexto(){const txt=$('pasteTable').value;if(!txt.trim())return alert('Cole uma tabela primeiro.');try{const n=importarMatriz(parseTable(txt),$('importTipo').value);renderAll();alert(`${n} registro(s) importado(s).`)}catch(err){alert('Erro na importação: '+err.message)}}

function csv(rows){return rows.map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(';')).join('\n')}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function exportar(tipo){if(tipo==='produtos')download('produtos.csv',csv([['codigo','nome','categoria','preco','custo','estoque','minimo','unidade'],...state.produtos.map(p=>[p.codigo,p.nome,p.categoria,p.preco,p.custo,p.estoque,p.minimo,p.unidade])]));else download('clientes.csv',csv([['nome','documento','telefone','dia','limite','email','observacoes'],...state.clientes.map(c=>[c.nome,c.doc,c.tel,c.dia,c.limite,c.email,c.obs])]));}
function baixarModelos(){download('modelo_produtos.csv','codigo;nome;categoria;preco;custo;estoque;minimo;unidade\n001;Produto exemplo;Categoria;25,90;15,00;10;2;un');download('modelo_clientes.csv','nome;documento;telefone;dia;limite;email;observacoes\nCliente Exemplo;00000000000;(41)99999-9999;10;500;email@exemplo.com;');}
function renderClientes(){$('clientesLista').innerHTML=`<div class="table-wrap"><table><tr><th>Nome</th><th>Documento</th><th>Telefone</th><th>Dia</th><th>Limite</th><th>Ações</th></tr>${state.clientes.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.doc)}</td><td>${esc(c.tel)}</td><td>${c.dia||'—'}</td><td>${money(c.limite)}</td><td class="actions"><button onclick="editCliente('${c.id}')">Editar</button><button class="danger" onclick="delCliente('${c.id}')">Excluir</button></td></tr>`).join('')}</table></div>`}
function estoqueStatus(p){
  const estoque=Number(p.estoque||0), minimo=Number(p.minimo||0);
  if(minimo<=0) return {classe:'ok',texto:'Normal',icone:'✓'};
  if(estoque<=minimo) return estoque<=0?{classe:'critical',texto:'Esgotado',icone:'✕'}:{classe:'low',texto:'Repor estoque',icone:'⚠'};
  return {classe:'ok',texto:'Normal',icone:'✓'};
}
function renderProdutos(){
  $('produtosLista').innerHTML=`<div class="table-wrap"><table><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Situação</th><th>Ações</th></tr>${state.produtos.map(p=>{const st=estoqueStatus(p);return `<tr><td>${esc(p.codigo)}</td><td>${esc(p.nome)}</td><td>${esc(p.categoria)}</td><td>${money(p.preco)}</td><td class="${st.classe}"><b>${p.estoque}</b> ${esc(p.unidade)}<small> / mínimo ${p.minimo||0}</small></td><td><span class="stock-badge ${st.classe}">${st.icone} ${st.texto}</span></td><td class="actions"><button onclick="editProduto('${p.id}')">Editar</button><button class="secondary" onclick="ajustarEstoque('${p.id}')">Ajustar estoque</button><button class="danger" onclick="delProduto('${p.id}')">Excluir</button></td></tr>`}).join('')}</table></div>`
}
function renderVenda(){$('vendaCliente').innerHTML=state.clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');if(!document.querySelector('.sale-item')&&state.produtos.length)addItem();$('vendasLista').innerHTML=`<div class="table-wrap"><table><tr><th>Data</th><th>Cliente</th><th>Total</th><th>Entrada</th><th>Saldo</th><th>Forma</th></tr>${state.vendas.slice().reverse().map(v=>`<tr><td>${dateBR(v.data)}</td><td>${esc(state.clientes.find(c=>c.id===v.clienteId)?.nome||'')}</td><td>${money(v.total)}</td><td>${money(v.entrada)}</td><td>${money(v.saldo)}</td><td>${esc(v.forma)}</td></tr>`).join('')}</table></div>`}
function renderReceber(){const now=today();$('receberLista').innerHTML=`<div class="table-wrap"><table><tr><th>Cliente</th><th>Parcela</th><th>Vencimento</th><th>Saldo</th><th>Status</th><th>Ação</th></tr>${state.parcelas.slice().sort((a,b)=>a.vencimento.localeCompare(b.vencimento)).map(p=>{const st=p.status==='paga'?'Paga':p.vencimento<now?'Vencida':p.status==='parcial'?'Parcial':'Aberta';return `<tr><td>${esc(state.clientes.find(c=>c.id===p.clienteId)?.nome||'')}</td><td>${p.numero}/${p.totalParcelas}</td><td>${dateBR(p.vencimento)}</td><td>${money(p.valor-p.valorPago)}</td><td class="${st==='Paga'?'status-paid':st==='Vencida'?'status-overdue':'status-open'}">${st}</td><td>${st!=='Paga'?`<button onclick="pagarParcela('${p.id}')">Receber</button>`:''}</td></tr>`}).join('')}</table></div>`}

function renderDespesas(){
  $('despesaFornecedor').innerHTML='<option value="">Sem fornecedor</option>'+state.fornecedores.map(f=>`<option value="${f.id}">${esc(f.nome)}</option>`).join('');
  $('fornecedoresLista').innerHTML=`<div class="table-wrap"><table><tr><th>Fornecedor</th><th>Documento</th><th>Telefone</th><th>Ações</th></tr>${state.fornecedores.map(f=>`<tr><td>${esc(f.nome)}</td><td>${esc(f.doc||'')}</td><td>${esc(f.tel||'')}</td><td class="actions"><button onclick="editFornecedor('${f.id}')">Editar</button><button class="danger" onclick="delFornecedor('${f.id}')">Excluir</button></td></tr>`).join('')}</table></div>`;
  const total=totalDespesas(); const porCat={}; state.despesas.forEach(d=>porCat[d.categoria||'Sem categoria']=(porCat[d.categoria||'Sem categoria']||0)+Number(d.valor||0));
  $('despesasResumo').innerHTML=`<div class="cards mini-cards"><div class="card"><span>Total de despesas</span><b>${money(total)}</b></div><div class="card"><span>Lançamentos</span><b>${state.despesas.length}</b></div><div class="card"><span>Fornecedores</span><b>${state.fornecedores.length}</b></div></div><div class="table-wrap"><table><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Forma</th><th>Valor</th><th>Ações</th></tr>${state.despesas.slice().sort((a,b)=>b.data.localeCompare(a.data)).map(d=>`<tr><td>${dateBR(d.data)}</td><td>${esc(d.descricao)}</td><td>${esc(d.categoria||'—')}</td><td>${esc(state.fornecedores.find(f=>f.id===d.fornecedorId)?.nome||'—')}</td><td>${esc(d.forma||'—')}</td><td><b>${money(d.valor)}</b></td><td class="actions"><button onclick="editDespesa('${d.id}')">Editar</button><button class="danger" onclick="delDespesa('${d.id}')">Excluir</button></td></tr>`).join('')}</table></div>`;
}
function renderSocios(){
  $('movSocioSocio').innerHTML=state.socios.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('');
  $('sociosResumo').innerHTML=`<div class="table-wrap"><table><tr><th>Sócio</th><th>Participação</th><th>Créditos</th><th>Retiradas/Gastos</th><th>Saldo</th><th>Ações</th></tr>${state.socios.map(s=>{const ms=state.movimentosSocios.filter(m=>m.socioId===s.id),cr=ms.filter(m=>m.tipo==='credito').reduce((a,m)=>a+m.valor,0),db=ms.filter(m=>m.tipo!=='credito').reduce((a,m)=>a+m.valor,0),saldo=cr-db;return `<tr><td><b>${esc(s.nome)}</b></td><td>${Number(s.percentual||0).toLocaleString('pt-BR')}%</td><td>${money(cr)}</td><td>${money(db)}</td><td class="${saldo<0?'critical':saldo>0?'low':'ok'}"><b>${money(saldo)}</b></td><td class="actions"><button onclick="editSocio('${s.id}')">Editar</button><button class="danger" onclick="delSocio('${s.id}')">Excluir</button></td></tr>`}).join('')}</table></div>`;
  $('movSociosLista').innerHTML=`<div class="table-wrap"><table><tr><th>Data</th><th>Sócio</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Ações</th></tr>${state.movimentosSocios.slice().sort((a,b)=>b.data.localeCompare(a.data)).map(m=>`<tr><td>${dateBR(m.data)}</td><td>${esc(state.socios.find(s=>s.id===m.socioId)?.nome||'')}</td><td>${m.tipo==='credito'?'Crédito / partilha':'Retirada / gasto'}</td><td>${esc(m.descricao)}</td><td class="${m.tipo==='credito'?'ok':'critical'}"><b>${m.tipo==='credito'?'+':'-'} ${money(m.valor)}</b></td><td class="actions"><button onclick="editMovSocio('${m.id}')">Editar</button><button class="danger" onclick="delMovSocio('${m.id}')">Excluir</button></td></tr>`).join('')}</table></div>`;
}
function renderDashboard(){
  const baixos=state.produtos.filter(p=>Number(p.minimo||0)>0&&Number(p.estoque||0)<=Number(p.minimo||0));
  $('kpiClientes').textContent=state.clientes.length;
  $('kpiProdutos').textContent=state.produtos.length;
  $('kpiEstoqueBaixo').textContent=baixos.length;
  $('kpiAberto').textContent=money(state.parcelas.reduce((a,p)=>a+p.valor-p.valorPago,0));
  const kd=$('kpiDespesas'); if(kd) kd.textContent=money(totalDespesas());
  const ks=$('kpiSocios'); if(ks) ks.textContent=state.socios.length;
  $('dashboardEstoque').innerHTML=`${baixos.length?`<div class="stock-alert"><strong>⚠ Atenção: ${baixos.length} produto(s) precisam de reposição.</strong><span>O alerta aparece quando o estoque chega ao mínimo configurado.</span></div>`:''}<div class="table-wrap"><table><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th><th>Preço</th><th>Situação</th></tr>${state.produtos.slice(0,10).map(p=>{const st=estoqueStatus(p);return `<tr><td>${esc(p.nome)}</td><td class="${st.classe}"><b>${p.estoque}</b> ${esc(p.unidade)}</td><td>${p.minimo||0}</td><td>${money(p.preco)}</td><td><span class="stock-badge ${st.classe}">${st.icone} ${st.texto}</span></td></tr>`}).join('')}</table></div>`;
}
function renderAll(){renderClientes();renderProdutos();renderVenda();renderReceber();renderDespesas();renderSocios();renderDashboard()}
Object.assign(window,{show,novoCliente,editCliente,delCliente,novoProduto,editProduto,delProduto,ajustarEstoque,pagarParcela,processarImportacao,importarTexto,baixarModelos,exportar,novoFornecedor,editFornecedor,delFornecedor,novaDespesa,editDespesa,delDespesa,novoSocio,editSocio,delSocio,novoMovSocio,editMovSocio,delMovSocio});
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{initApp();renderAll();show('dashboard');});
}else{
  initApp();renderAll();show('dashboard');
}
