// 字符串转Dom树
String.prototype.html=function(){return(new DOMParser()).parseFromString(this,'text/html')}
// 节点筛选
Document.prototype.$=Element.prototype.$=function(_){return this.querySelector(_)}
Document.prototype.$$=Element.prototype.$$=function(_){
	if(_=='text'){
		const o=[],$=D.createNodeIterator(this,NodeFilter.SHOW_TEXT,_=>_.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT)
		_=$.nextNode()
		while(_){
			o.push(_)
			_=$.nextNode()
		}
		return o
	}
	return Array.from(this.querySelectorAll(_))
}
// 节点属性操作
Element.prototype.sa=function(){
	if(arguments.length<1)return this
	const x=arguments[0]
	if(typeof x=='object'){
		for(let k in x)if((k=k.trim()))this.setAttribute(k,x[k].toString())
		return this
	}
	let s=Array.from(arguments)
	if(s.find(_=>typeof _!='string'))return this
	s=s.map(_=>_.trim())
	for(let _ of s)this.setAttribute(_,'')
	return this
}
Element.prototype.ga=function(){
	if(arguments.length<1)return null
	const s=[...(new Set(arguments))].filter(_=>(typeof _=='string')&&_.trim()).map(_=>_.trim())
	if(s.length==1)return this.getAttribute(s[0])
	const o={}
	for(let k of s)o[k]=this.getAttribute(k)
	return o
}
Element.prototype.ha=function(){
	let a=arguments.length>0&&typeof arguments[0]=='string'?arguments[0].trim():''
	return a===''?false:this.hasAttribute(a)
}
Element.prototype.da=function(){
	if(arguments.length>0)(new Set(arguments)).forEach(_=>(typeof _=='string')&&(_=_.trim())&&this.hasAttribute(_)&&this.removeAttribute(_))
	return this
}
// ===============================
let D=document,I=0,CM=[],US=[],PN=''
const T=new TS({headingStyle:'atx',hr:'---',bulletListMarker:'-',codeBlockStyle:'fenced',emDelimiter:'*'})
T.addRule('removeNoise',{
	filter:['script','style','noscript','iframe','nav','footer','header','aside'],
	replacement:()=>''
})

// ===============================
;(()=>{
	const $=D.$(`.card #url`),lock=_=>{
		$.sa({value:($.defaultValue=_||''),readonly:'readonly'})
		try{
			Object.defineProperty($,'value',{get(){return _||''},set(){},configurable:false})
		}catch(e){}
	}
	if(typeof chrome!=='undefined'&&chrome.tabs){
		chrome.tabs.query({active:true,currentWindow:true},_=>lock(_&&_[0]&&_[0].url||''))
	}else lock(location.href||'')
})()

// ===============================
const O={}
O.url=()=>{
	const $=D.$(`.card #url`)
	return $.ga('value')||$.defaultValue||''
}
O.close=()=>{
	D.$(`.modal`).sa('hide')
	D.body.style.overflow=''
}
O.error=_=>{
	const $=D.$(`.card .error`).da('hide')
	$.textContent=_
	setTimeout(()=>$.sa('hide'),6000)
}
O.toast=_=>{
	const $=D.createElement('div')
	$.className='toast';$.textContent=_
	D.body.appendChild($)
	setTimeout(()=>$.remove(),250000)
}
O.bg=(_,x=30000)=>new Promise((o,e)=>{
	const t=setTimeout(()=>e(new Error('后台响应超时')),x)
	try{
		chrome.runtime.sendMessage(_,r=>{
			clearTimeout(t)
			if(chrome.runtime.lastError){e(new Error('消息端口已关闭，请保持弹窗开启'));return}
			o(r)
		})
	}catch(z){
		clearTimeout(t)
		e(new Error('无法发送消息：'+z.message))
	}
})
O.submit=async()=>{ // 点击提交按钮
	const url=O.url()
	if(!url){O.error('无法获取当前页面链接');return}
	try{new URL(url)}catch{O.error('当前页面链接无效');return}

	const $bs=D.$('.card .submit').sa('disabled')
	const $pg=D.$('.card .progress').da('hide')
	const $tp=D.$('.card .tip')

	CM.length=US.length=I=0;PN=''
	const [[lf,la],[pf,pa]]=((D.$('#css').value.trim()||'@\n@').split('\n').filter(Boolean)||['@','@']).map(_=>_.split('@'))
	try{
		if(lf&&la){
			if(!pf||!pa){O.error('批处理器需要两行：列表选择器@属性 和 下一页选择器@属性');return}
			$tp.textContent='正在解析列表...'
			const [up,uh]=url.split('/').filter(Boolean)
			const {us,pn,e}=await fetch(url).then(_=>_.text()).then(_=>_.html()).then(_=>{
				let s=_.$$(lf).map(_=>{
					const u=_.ga(la)
					return u.startsWith('http')?u:(up+'//'+uh+u)
				}),n=_.$(pf)?.ga(pa)||''
				if(n!==''&&!n.startsWith('http'))n=up+'//'+uh+n
				return {us:s,pn:n}
			}).catch(e=>({e}))
			if(us===undefined)throw new Error(e||'列表解析失败')
			US=us;PN=pn
			await O.one(0)
			return
		}
		US=[url]
		await O.one(0)
	}catch(e){O.error(e.message||'发生未知错误')}finally{
		$tp.textContent=''
		$bs.da('disabled')
		$pg.sa('hide')
	}
}
O.one=async(i=0)=>{
	const $tt=D.$('.modal .title').sa('wait'),$cc=D.$('.modal pre').sa('wait')
	$tt.textContent=$cc.textContent=''

	const $pg=D.$('.card .progress').da('hide'),$tp=D.$('.card .tip')
	$tp.textContent=`正在处理 ${US[i]?new URL(US[i]).hostname:''}...`

	D.$('.modal .prev')[(US.length>1&&i>0)?'da':'sa']('hide')
	D.$('.modal .next')[(US.length>1&&i<US.length-1)?'da':'sa']('hide')

	const $er=D.$('.card .error'),url=US[(I=i)]
	try{
		new URL(url)
		let o=await fetch(url)
		if(!o.ok)throw new Error('请求失败，错误码: '+o.status)
		o=await o.text()
		o=o.html()
		o.$$('script,style,noscript,iframe,nav,footer,header,aside,.sidebar,.menu,.ad,.ads,.advertisement,.comments,.social,.related,.cookie-banner,.cookie,.popup,.modal,.overlay,.newsletter,.subscribe,.share,.social-share').forEach(_=>_.remove())
		const title=(o.$('h1')?.textContent||o.title||'无标题').split(/\s+[-|–—]\s+/)[0].trim()
		const s=[
			'article','main','[role="main"]',
			'.post-content','.article-content','.entry-content',
			'.content','#content','.post','.article','.story-body',
			'.article-body','.main-content','#main'
		]
		let n=null
		for(const f of s){
			const $=o.$(f)
			if($&&$.textContent.trim().length>100){n=$;break}
		}
		if(!n){
			let x=0
			o.$$('div,section').forEach(_=>{
				const z=_.textContent.trim().length
				if(z>x&&z>200){x=z;n=_}
			})
		}
		if(!n)n=o.body
		n.$$('*').forEach(_=>(!_.textContent.trim()&&!['IMG','BR','HR'].includes(_.tagName)&&!_.children.length)&&_.remove())
		if(!n)throw new Error('无法提取正文')
		let y=false,html=n.innerHTML||n.outerHTML,text=n.innerText.trim()
		o=T.turndown(html).replace(/\n{3,}/g,'\n\n').replace(/[ \t]{2,}/g,' ').replace(/([ \t]*\n[ \t]*){3,}/g,'\n\n').trim()
		o=[`# ${title}`,'',`*${url}*`,'','---','',o].join('\n')
		if(text&&text.length>=10){
			const z=text.replace(/[\s\d\W]/g,'')
			if(z.length)y=(z.match(/[a-zA-Z]/g)||[]).length/z.length>0.4
		}
		CM[I]={x:title,o}
		O.show(o,title,false,y)
	}catch(e){
		$tt.da('wait')
		$cc.da('wait')
		O.error(e.message||'转换失败')
	}finally{
		$pg.sa('hide')
		$tp.textContent=''
		D.$('.card .submit').da('disabled')
	}
}
O.show=(_,title,yo,ny)=>{
	const $o=D.$('.modal pre').da('wait')
	$o.textContent=_
	$o.scrollTop=0
	D.$('.modal .trans').da('disabled')[ny&&!yo?'da':'sa']('hide')
	D.$('.modal .title').da('wait').textContent=title||'MD 源码'
	D.$('.modal .tip')[yo?'da':'sa']('hide').textContent=''
	D.$('.modal').da('hide')
	D.body.style.overflow='hidden'
}
O.trans=async()=>{
	const $bt=D.$('.modal .trans').sa('disabled'),$cc=D.$('.modal pre')
	const $tp=D.$('.modal .tip').da('hide')
	$tp.textContent='翻译中...'
	try{
		const o=await O.bg({t:'Y',o:CM[I].o,x:CM[I].x},60000).catch(_=>O.error(_.message))
		if(!o||!o.ok)throw new Error(o&&o.x||'翻译失败')
		CM[I].x=D.$('.modal .title').textContent=o.x
		CM[I].o=$cc.textContent=o.o
		$bt.sa('hide')
		$tp.textContent='翻译完成'
		setTimeout(()=>$tp.sa('hide'),2500)
	}catch(e){
		const z=e.message||''
		if(z.includes('消息端口')||z.includes('port closed'))$tp.textContent='⚠️ 翻译被中断（请保持弹窗开启）'
		else $tp.textContent='❌ '+z
		$bt.da('disabled')
		setTimeout(()=>$tp.sa('hide'),3000)
	}
}
O.copy=async()=>{
	const o=CM[I]?.o||''
	try{await navigator.clipboard.writeText(o)}
	catch{
		const $=D.createElement('textarea')
		$.value=o;t.style.cssText='position:fixed;opacity:0'
		D.body.appendChild($);$.select()
		D.execCommand('copy')
		D.body.removeChild($)
	}
	O.toast('已复制到剪贴板')
}

// ===============================
D.addEventListener('DOMContentLoaded',()=>{
	D.$('.card .submit').addEventListener('click',O.submit)
	D.$('.modal .trans').addEventListener('click',O.trans)
	D.$('.modal .copy').addEventListener('click',O.copy)
	D.$('.modal .prev').addEventListener('click',()=>O.one(I-1))
	D.$('.modal .next').addEventListener('click',()=>O.one(I+1))
	D.$('.modal .close').addEventListener('click',O.close)
	D.addEventListener('keydown',e=>(e.key==='Escape'&&!D.$('.modal').ha('hide'))&&O.close())
})