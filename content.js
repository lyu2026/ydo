let ig=false,ox,oy
const $=document.createElement('div')
$.id='trans-blade-panel'
$.innerHTML=`<div>译览刀</div>`
document.body.appendChild($)
$.addEventListener('click',e=>chrome.runtime.sendMessage({t:'O'}))
$.addEventListener('dblclick',e=>$.remove())
const ds=e=>{
	ig=true
	const p=e.touches?e.touches[0]:e
	ox=p.clientX-$.offsetLeft
	oy=p.clientY-$.offsetTop
}
const dm=e=>{
	if(!ig)return
	const p=e.touches?e.touches[0]:e
	$.style.left=(p.clientX-ox)+'px'
	$.style.top=(p.clientY-oy)+'px'
	$.style.right='auto'
}
const de=()=>ig=false
$.addEventListener('mousedown',ds)
$.addEventListener('touchstart',ds,{passive:false})
document.addEventListener('mousemove',dm)
document.addEventListener('touchmove',dm,{passive:false})
document.addEventListener('mouseup',de)
document.addEventListener('touchend',de)