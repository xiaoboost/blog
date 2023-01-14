(()=>{var v={classes:{postAnchor:"post-anchor",postHeader:"post-header",postHeaderTitle:"post-header-title",postHeaderCreate:"post-header-create",postArticle:"post-article",postNoToc:"post-no-toc",postSoftBreak:"post-soft-break",noIndent:"no-indent",postDefault:"post-default"}};var a={classes:{menuListHeader:"menu-list-header",menuList:"menu-list",menuListArticle:"menu-list-article",menuItem:"menu-item",menuItemHighlight:"menu-item-highlight",menuListHighlight:"menu-list-highlight",menuLevel1:"menu-level1",menuLevel2:"menu-level2",menuIcon:"menu-icon",toContent:"to-content"}};var I={Lato:'"Lato"',Dancing:'"Dancing Script"',EMLora:'"EM-Lora"'};var K=I.Dancing,M=1e3;var S=20;var G=`@media only screen and (max-width: ${M}px)`,ee=`@media only screen and (min-width: ${M}px)`;function h(e){return typeof e=="string"}var He=window["__ModuleLoader"];var A=typeof window<"u",l=A&&window.navigator.userAgent.toLowerCase(),Ue=l&&/msie|trident/.test(l),Je=l&&l.indexOf("msie 9.0")>0,P=l&&l.indexOf("edge/")>0,Ve=l&&l.indexOf("android")>0,D=l&&/iphone|ipad|ipod|ios/.test(l),ze=l&&/chrome\/\d+/.test(l)&&!P,y=!1,_=!1;if(A){try{document.body.addEventListener("test",null,Object.defineProperty({},"passive",{get(){y=!0}}))}catch{}try{document.body.addEventListener("test",null,Object.defineProperty({},"once",{get(){_=!0}}))}catch{}}var k;(function(e){e[e.Left=0]="Left",e[e.Middle=1]="Middle",e[e.Right=2]="Right",e[e.Back=3]="Back",e[e.Forward=4]="Forward"})(k||(k={}));function C(e,o){var t;let r=o.trim(),n=((t=e.getAttribute("class"))!==null&&t!==void 0?t:"").split(/\s+/);if(n.includes(r))return;let s=n.concat(o.trim()).join(" ");e.setAttribute("class",s)}function T(e,o){var t;let r=o.trim(),n=((t=e.getAttribute("class"))!==null&&t!==void 0?t:"").split(/\s+/);if(!n.includes(r))return;let s=n.filter(i=>i!==r).join(" ");e.setAttribute("class",s)}function R(){let e=document.body.querySelector(`.${a.classes.toContent}`),o=e?.parentElement;if(!e||!o)return()=>{e=null,o=null};let t=Array.from(e.querySelectorAll(`.${a.classes.menuItem}`)),r=Array.from(e.querySelectorAll(`.${a.classes.menuList} .${a.classes.menuList}`)),n=o.offsetTop-S,s=y?{passive:!0,capture:!1}:!1,i=[],p=0,x=()=>{if(!e)return;let d=window.scrollY;d>n&&(p===2||p===0)?(p=1,e.style.position="fixed",e.style.top=`${S}px`):d<=n&&(p===1||p===0)&&(p=2,e.style.position="",e.style.top="");let c=i.find(u=>u.offsetTop<d),m=(c&&e.querySelector(`[href="#${c.title}"]`))?.parentElement,w=m?.parentElement;t.forEach(u=>{u===m?C(m,a.classes.menuItemHighlight):T(u,a.classes.menuItemHighlight)}),r.forEach(u=>{u===w?C(w,a.classes.menuListHighlight):T(u,a.classes.menuListHighlight)})},b=()=>{let d=document.querySelector(`.${v.classes.postDefault}`);i=Array.from(d?.querySelectorAll(`.${v.classes.postAnchor}`)??[]).map(c=>{let f=c.parentElement,m=f?.tagName.toLowerCase();return!m||!f?void 0:Number(m?.slice(1))<=2?f:void 0}).map(c=>({title:c?.getAttribute("id"),offsetTop:c?.offsetTop})).filter(c=>Boolean(c.title&&c.offsetTop)).sort((c,f)=>c.offsetTop>f.offsetTop?-1:1)};return b(),x(),window.addEventListener("scroll",x,s),window.addEventListener("resize",b,s),()=>{e=null,o=null,t.length=0,r.length=0,window.removeEventListener("scroll",x,s),window.removeEventListener("resize",b,s)}}R();var $={classes:{codeBlockLs:"code-block-ls",lsInfoBox:"ls-info-box"}};var q="ls",g=`${q}-info`;var O=class{el;pre;list=[];constructor(){let o=document.createElement("div"),t=document.createElement("pre");o.setAttribute("class",$.classes.lsInfoBox),o.appendChild(t),this.el=o,this.pre=t}setInfo(o){let{list:t,pre:r}=this;for(;this.list.length>o.length;)r.removeChild(this.list.pop());for(let n=0;n<o.length;n++){let s=o[n],i;t[n]?i=t[n]:(i=document.createElement("span"),t.push(i),r.appendChild(i)),h(s)?(i.removeAttribute("class"),i.textContent=s):(i.setAttribute("class",s[0]),i.textContent=s[1])}}hidden(){document.body.contains(this.el)&&document.body.removeChild(this.el)}show(o,t){document.body.contains(this.el)||document.body.appendChild(this.el),this.setInfo(t),this.el.setAttribute("style",`left: ${o.left}px; top: ${o.top+1}px`)}};function U(){let e=new O,o=document.querySelectorAll(`pre span[${g}]`),t=()=>e.hidden();for(let r of Array.from(o)){let n=r.getAttribute(g)??"",s=JSON.parse(decodeURI(n));if(r.setAttribute(g,""),!s)break;r.addEventListener("mouseenter",()=>{e.show(r.getBoundingClientRect(),s)}),r.addEventListener("mouseleave",t),document.addEventListener("scroll",t)}return()=>{e.hidden(),document.removeEventListener("scroll",t)}}U();})();
