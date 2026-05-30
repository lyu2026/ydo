(function(global){
	'use strict'

	function TS(o){
		this.options=Object.assign({headingStyle:'atx',hr:'---',bulletListMarker:'-',codeBlockStyle:'fenced',emDelimiter:'*',strongDelimiter:'**',linkStyle:'inlined'},o||{})
		this.rules=[]
	}
	TS.prototype.use=function(plugin){
		plugin(this)
		return this
	}
	TS.prototype.addRule=function(k,v){
		this.rules.unshift(v);
		return this
	}
	TS.prototype.turndown=function(x){
		if(!x)return ''
		const html=typeof x==='string'?x:x.outerHTML||''
		const doc=new DOMParser().parseFromString('<x-root>'+html+'</x-root>','text/html')
		const root=doc.querySelector('x-root')||doc.body
		const o=this._process(root).trim()
		return o.replace(/\n{3,}/g,'\n\n')
	}
	TS.prototype._process=function(node){
		let self=this,o=''
		node.childNodes.forEach(_=>{o+=self._convert(_)})
		return o
	}
	TS.prototype._convert=function(node){
		if(node.nodeType===3)return this._escape(node.nodeValue)
		if(node.nodeType!==1)return ''
		const tag=node.nodeName.toLowerCase()
		for(let i=0;i<this.rules.length;i++){
			const r=this.rules[i]
			if(this._matches(node,r.filter)){
				const content=this._process(node)
				const result=r.replacement(content,node,this.options)
				if(result!=null)return result
			}
		}
		return this._defaultRule(node,tag)
	}
	TS.prototype._matches=function(node,filter){
		if(typeof filter==='string')return node.nodeName.toLowerCase()===filter
		if(Array.isArray(filter))return filter.indexOf(node.nodeName.toLowerCase())>=0
		if(typeof filter==='function')return filter(node)
		return false
	}
	TS.prototype._escape=function(text){
		if(!text)return ''
		return text
			.replace(/\\/g,'\\\\').replace(/\*/g,'\\*').replace(/^-/gm,'\\-')
			.replace(/^\+/gm,'\\+').replace(/^=/gm,'\\=').replace(/^>/gm,'\\>')
			.replace(/^#/gm,'\\#').replace(/`/g,'\\`').replace(/\[/g,'\\[')
			.replace(/\]/g,'\\]').replace(/_/g,'\\_')
	}

	TS.prototype._defaultRule=function(node,tag){
		let content=this._process(node),opts=this.options
		switch(tag){
			case 'h1':case 'h2':case 'h3':case 'h4':case 'h5':case 'h6':
				let level=parseInt(tag[1])
				if(opts.headingStyle==='atx')return '\n\n'+'#'.repeat(level)+' '+content.trim()+'\n\n'
				let under=level<=1?'=':'-'
				return '\n\n'+content.trim()+'\n'+under.repeat(Math.max(content.trim().length,3))+'\n\n'
			case 'p':return '\n\n'+content.trim()+'\n\n'
			case 'br':return '  \n'
			case 'hr':return '\n\n'+opts.hr+'\n\n'
			case 'strong':case 'b':return opts.strongDelimiter+content+opts.strongDelimiter
			case 'em':case 'i':return opts.emDelimiter+content+opts.emDelimiter
			case 's':case 'del':case 'strike':return '~~'+content+'~~'
			case 'code':
				if(node.parentNode&&node.parentNode.nodeName.toLowerCase()==='pre')return content
				let tick=content.indexOf('`')>=0?'``':'`'
				return tick+content+tick
			case 'pre':
				let codeEl=node.querySelector('code')
				let lang=''
				if(codeEl){
					let cls=codeEl.className||''
					let m=cls.match(/language-(\S+)/)
					lang=m?m[1]:''
					content=codeEl.textContent||''
				}
				if(opts.codeBlockStyle==='fenced')return '\n\n```'+lang+'\n'+content.replace(/\n$/,'')+'\n```\n\n'
				return '\n\n'+content.split('\n').map(l=>`    ${l}`).join('\n')+'\n\n'
			case 'a':
				let href=node.getAttribute('href')||''
				if(!href||href.startsWith('javascript:'))return content
				let title=node.getAttribute('title'),t=title?' "'+title+'"':''
				return '['+content+']('+href+t+')'
			case 'img':
				let src=node.getAttribute('src')||''
				let alt=node.getAttribute('alt')||''
				let ititle=node.getAttribute('title')
				let it=ititle?' "'+ititle+'"':''
				return src?'!['+alt+']('+src+it+')':''
			case 'ul':case 'ol':
				let items=[],idx=1
				node.childNodes.forEach(function(child){
					if(child.nodeName.toLowerCase()!=='li')return
					let c=''
					child.childNodes.forEach(n=>{c+=this._convert(n)},this)
					c=c.trim().replace(/\n{2,}/g,'\n\n').replace(/\n/g,'\n    ')
					let bullet=tag==='ul'?opts.bulletListMarker+' ':(idx++)+'. '
					items.push(bullet+c)
				},this)
				return '\n\n'+items.join('\n')+'\n\n'
			case 'li':return this._process(node)
			case 'blockquote':return '\n\n'+content.trim().split('\n').map(l=>`> ${l}`).join('\n')+'\n\n'
			case 'table':return this._convertTable(node)
			case 'thead':case 'tbody':case 'tfoot':return content
			case 'tr':return content
			case 'th':case 'td':return content
			case 'script':case 'style':case 'noscript':case 'iframe':case 'nav':case 'footer':case 'header':case 'aside':return ''
			case 'div':case 'section':case 'article':case 'main':return /\n/.test(content)?'\n\n'+content.trim()+'\n\n':content
			default:return content
		}
	}
	TS.prototype._convertTable=function(table){
		let rows=Array.from(table.querySelectorAll('tr'))
		if(!rows.length)return ''
		let self=this

		function cellText(cell){
			return self._process(cell).trim().replace(/\n/g,' ').replace(/\|/g,'\\|')
		}
		let out=[]
		rows.forEach(function(row,ri){
			let cells=Array.from(row.querySelectorAll('th,td'))
			let line='| '+cells.map(cellText).join(' | ')+' |'
			out.push(line)
			if(ri===0){
				let sep='| '+cells.map(c=>(c.nodeName.toLowerCase()==='th'?':---:':'---')).join(' | ')+' |'
				out.push(sep)
			}
		})
		return '\n\n'+out.join('\n')+'\n\n'
	}
	global.TS=TS
})(typeof window!=='undefined'?window:self)