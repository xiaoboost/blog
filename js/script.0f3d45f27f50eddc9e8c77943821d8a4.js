function i(e){return typeof e=="string"}function s(e){try{return JSON.parse(e)}catch(o){return}}function u(e){let r=`<div class="ls-info-box"><pre>${e.map(t=>i(t)?t:`<span class="${t[0]}">${t[1]}</span>`).join("")}</pre></div>`,n=document.createElement("div");return n.innerHTML=r,n.children[0]}Array.from(document.querySelectorAll("pre span[ls-info]")).forEach(e=>{let o=e.getAttribute("ls-info")??"",r=s(decodeURI(o));if(e.setAttribute("ls-info",""),!r)return;let n=u(r);e.addEventListener("mouseenter",()=>{let t=e.getBoundingClientRect();document.body.appendChild(n),n.style.left=`${t.left}px`,n.style.top=`${t.top}px`}),e.addEventListener("mouseleave",()=>{document.body.removeChild(n)})});console.log("to-content");console.log("goto-top");