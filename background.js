const Y=async(_,to='zh-CN')=>{
	let o=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(_)}`
	o=await fetch(o)
	if(!o.ok)throw new Error('翻译请求失败，错误码: '+o.status)
	o=await o.json()
	return (o[0]||[]).map(_=>_[0]||'').join('')
}

chrome.runtime.onMessage.addListener((k,_,r)=>{
	if(k.t=='O')chrome.windows.create({url:'popup.html',type:'popup',width:420,height:560})
	else if(k.t=='Y'){
		(async()=>{
			try{
				let ix=false,xc='',xx=await Y(k.x.trim())
				const ls=k.o.split('\n'),m={},s=[]
				ls.forEach((v,i)=>{
					let x=v.match(/^(`{3,}|~{3,})/)
					if(!ix&&x){ix=true;xc=x[1];return}
					if(ix){if(v.startsWith(xc)&&v.trim()===xc)ix=false;return}
					if(/^\*http/.test(v))return // 元数据行
					x=v.trim()
					if(!x||!/[a-zA-Z]/.test(x))return
					x=v.match(/^(\s*(?:#{1,6} +|[-*+] +|\d+\. +|> *)+)/)
					const p=x?x[1]:''
					x=v.slice(p.length)
					if(!x.trim()||!/[a-zA-Z]/.test(x))return
					m[i]=[]
					x=x.replace(/(`+)(.+?)\1/g,_=>{m[i].push(_);return `\x00◎${m[i].length-1}\x00`})
					s.push({i,p,x})
				})
				if(s.length<1)r({ok:true,o:k.o,x:xx})
				else{
					const bs=[],os=new Array(ls.length).fill(null)
					for(let i=0;i<s.length;i+=30)bs.push(s.slice(i,i+30))
					ls.forEach((v,i)=>{if(!os.hasOwnProperty(i))os[i]=v})
					let oc=0
					for(let i=0;i<bs.length;i+=6){
						await Promise.all(bs.slice(i,i+6).map(async z=>{
							const zs=z.map(_=>_.x)
							if(!zs.length)return []
							let x=zs.length>0?await Y(zs.join('\n§§§\n')).then(_=>_.split(/\n?§§§\n?/)):[]
							if(x.length!==zs.length)x=await Promise.all(zs.map(async v=>{try{return await Y(v)}catch{return v}}))
							z.forEach((v,j)=>{
								const t=(x[j]||v.x).replace(/(\*\*)\s*([^*]+)\s*\1([^*])/g,'**$2** $3').replace(/(?<!\s)(\*\*)\s*([^*]+)\s*\1/g,' **$2**'),cs=m[v.i]||[]
								os[v.i]=v.p+t.replace(/◎(\d+)/g,(_,i)=>cs[+i]||'')
								oc++
							})
						}))
					}
					ls.forEach((v,i)=>{if(os[i]===null)os[i]=v})
					r({ok:true,o:os.join('\n'),x:xx})
				}
			}catch(e){r({ok:false,x:e.message||'翻译失败'})}
		})()
	}

	return true
})

