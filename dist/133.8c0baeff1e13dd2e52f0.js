"use strict";(self.webpackChunktelegram_t=self.webpackChunktelegram_t||[]).push([[133],{1133:(e,t,a)=>{a.r(t),a.d(t,{AuthCode:()=>v,AuthPassword:()=>f,AuthRegister:()=>y});var n=a(4050),o=a(3555),r=a(7361),l=a(782),s=a(2340),i=a(6590),c=a(9107),d=a(7687),m=a(4288),u=a(3716),h=a(7324),Z=a(7799);const g=r.wB?u.qp:u.z7,p=(0,n.X$)((e=>{let{code:t,codeLength:a,trackingDirection:o,isTracking:r,isBig:l}=e;const[s,i]=(0,n.eJ)(),[c,d]=(0,n.eJ)(),[m,p]=(0,n.eJ)(!1),v=165/a;(0,n.d4)((()=>{s||(0,h.Z)("MonkeyIdle").then(i)}),[s]),(0,n.d4)((()=>{c||(0,h.Z)("MonkeyTracking").then(d)}),[c]);const P=(0,n.I4)((()=>p(!0)),[]);return n.ZP.createElement("div",{id:"monkey",className:l?"big":""},!m&&n.ZP.createElement("div",{className:"monkey-preview"}),s&&n.ZP.createElement(Z.Z,{id:"idleMonkey",size:l?u.K2:g,className:r?"hidden":void 0,animationData:s,play:!r,onLoad:P}),c&&n.ZP.createElement(Z.Z,{id:"trackingMonkey",size:l?u.K2:g,className:r?"shown":"hidden",animationData:c,playSegment:r?function(){const e=t&&t.length>1||o<0?15+v*(t.length-1):0,n=t.length===a?180:15+v*t.length;return o<1?[n,e]:[e,n]}():void 0,speed:2,noLoop:!0}))})),v=(0,n.X$)((0,o.c$)((e=>(0,l.ei)(e,["authPhoneNumber","authIsCodeViaApp","authIsLoading","authError"])))((e=>{let{authPhoneNumber:t,authIsCodeViaApp:a,authIsLoading:l,authError:u}=e;const{setAuthCode:h,returnToAuthPhoneNumber:Z,clearAuthError:g}=(0,o.Sv)(),v=(0,c.Z)(),P=(0,n.sO)(null),[E,f]=(0,n.eJ)(""),[b,N]=(0,n.eJ)(!1),[y,C]=(0,n.eJ)(1);(0,n.d4)((()=>{r.$b||P.current.focus()}),[]),(0,i.ZP)(!0,Z);const w=(0,n.I4)((e=>{u&&g();const{currentTarget:t}=e;t.value=t.value.replace(/[^\d]+/,"").substr(0,5),t.value!==E&&(f(t.value),b?t.value.length||N(!1):N(!0),E&&E.length>t.value.length?C(-1):C(1),5===t.value.length&&h({code:t.value}))}),[u,g,E,b,h]);return n.ZP.createElement("div",{id:"auth-code-form",className:"custom-scroll"},n.ZP.createElement("div",{className:"auth-form"},n.ZP.createElement(p,{code:E,codeLength:5,isTracking:b,trackingDirection:y}),n.ZP.createElement("h2",null,t,n.ZP.createElement("div",{className:"auth-number-edit",onClick:Z,role:"button",tabIndex:0,title:v("WrongNumber")},n.ZP.createElement("i",{className:"icon-edit"}))),n.ZP.createElement("p",{className:"note"},(0,s.Z)(v(a?"SentAppCode":"Login.JustSentSms"),["simple_markdown"])),n.ZP.createElement(d.Z,{ref:P,id:"sign-in-code",label:v("Code"),onInput:w,value:E,error:u&&v(u),autoComplete:"off",inputMode:"numeric"}),l&&n.ZP.createElement(m.Z,null)))})));var P=a(3490),E=a(9364);const f=(0,n.X$)((0,o.c$)((e=>(0,l.ei)(e,["authIsLoading","authError","authHint"])))((e=>{let{authIsLoading:t,authError:a,authHint:r}=e;const{setAuthPassword:l,clearAuthError:s}=(0,o.Sv)(),i=(0,c.Z)(),[d,m]=(0,n.eJ)(!1),u=(0,n.I4)((e=>{m(e)}),[]),h=(0,n.I4)((e=>{l({password:e})}),[l]);return n.ZP.createElement("div",{id:"auth-password-form",className:"custom-scroll"},n.ZP.createElement("div",{className:"auth-form"},n.ZP.createElement(P.Z,{isPasswordVisible:d}),n.ZP.createElement("h2",null,i("Login.Header.Password")),n.ZP.createElement("p",{className:"note"},i("Login.EnterPasswordDescription")),n.ZP.createElement(E.Z,{clearError:s,error:a&&i(a),hint:r,isLoading:t,isPasswordVisible:d,onChangePasswordVisibility:u,onSubmit:h})))})));var b=a(231),N=a(710);const y=(0,n.X$)((0,o.c$)((e=>(0,l.ei)(e,["authIsLoading","authError"])))((e=>{let{authIsLoading:t,authError:a}=e;const{signUp:r,clearAuthError:l,uploadProfilePhoto:s}=(0,o.Sv)(),i=(0,c.Z)(),[m,u]=(0,n.eJ)(!1),[h,Z]=(0,n.eJ)(),[g,p]=(0,n.eJ)(""),[v,P]=(0,n.eJ)(""),E=(0,n.I4)((e=>{a&&l();const{target:t}=e;p(t.value),u(t.value.length>0)}),[a,l]),f=(0,n.I4)((e=>{const{target:t}=e;P(t.value)}),[]);return n.ZP.createElement("div",{id:"auth-registration-form",className:"custom-scroll"},n.ZP.createElement("div",{className:"auth-form"},n.ZP.createElement("form",{action:"",method:"post",onSubmit:function(e){e.preventDefault(),r({firstName:g,lastName:v}),h&&s({file:h})}},n.ZP.createElement(N.Z,{onChange:Z}),n.ZP.createElement("h2",null,i("YourName")),n.ZP.createElement("p",{className:"note"},i("Login.Register.Desc")),n.ZP.createElement(d.Z,{id:"registration-first-name",label:i("Login.Register.FirstName.Placeholder"),onChange:E,value:g,error:a&&i(a),autoComplete:"given-name"}),n.ZP.createElement(d.Z,{id:"registration-last-name",label:i("Login.Register.LastName.Placeholder"),onChange:f,value:v,autoComplete:"family-name"}),m&&n.ZP.createElement(b.Z,{type:"submit",ripple:!0,isLoading:t},i("Next")))))})))},9364:(e,t,a)=>{a.d(t,{Z:()=>d});var n=a(4050),o=a(3716),r=a(7361),l=a(6752),s=a(9107),i=a(231);const c=r.wB?550:400,d=(0,n.X$)((e=>{let{isLoading:t=!1,isPasswordVisible:a,error:d,hint:m,placeholder:u="Password",submitLabel:h="Next",clearError:Z,onChangePasswordVisibility:g,onInputChange:p,onSubmit:v}=e;const P=(0,n.sO)(null),E=(0,s.Z)(),[f,b]=(0,n.eJ)(""),[N,y]=(0,n.eJ)(!1);return(0,n.d4)((()=>{r.$b||setTimeout((()=>{P.current.focus()}),c)}),[]),(0,n.d4)((()=>{d&&requestAnimationFrame((()=>{P.current.focus(),P.current.select()}))}),[d]),n.ZP.createElement("form",{action:"",onSubmit:function(e){e.preventDefault(),t||N&&v(f)},autoComplete:"off"},n.ZP.createElement("div",{className:(0,l.Z)("input-group password-input",f&&"touched",d&&"error"),dir:E.isRtl?"rtl":void 0},n.ZP.createElement("input",{ref:P,className:"form-control",type:a?"text":"password",id:"sign-in-password",value:f||"",autoComplete:"current-password",onChange:function(e){d&&Z();const{target:t}=e;b(t.value),y(t.value.length>=o.lo),p&&p(t.value)},dir:"auto"}),n.ZP.createElement("label",null,d||m||u),n.ZP.createElement("div",{className:"toggle-password",onClick:function(){g(!a)},role:"button",tabIndex:0,title:"Toggle password visibility"},n.ZP.createElement("i",{className:a?"icon-eye":"icon-eye-closed"}))),N&&n.ZP.createElement(i.Z,{type:"submit",ripple:!0,isLoading:t},h))}))},3490:(e,t,a)=>{a.d(t,{Z:()=>u});var n=a(4050),o=a(3716),r=a(7361),l=a(7324),s=a(7799);const i=[0,50],c=[0,20],d=[20,0],m=r.wB?o.qp:o.z7,u=(0,n.X$)((e=>{let{isPasswordVisible:t,isBig:a}=e;const[r,u]=(0,n.eJ)(),[h,Z]=(0,n.eJ)(),[g,p]=(0,n.eJ)(!1),[v,P]=(0,n.eJ)(!1);(0,n.d4)((()=>{r?setTimeout((()=>P(!0)),2e3):(0,l.Z)("MonkeyClose").then(u)}),[r]),(0,n.d4)((()=>{h||(0,l.Z)("MonkeyPeek").then(Z)}),[h]);const E=(0,n.I4)((()=>p(!0)),[]);return n.ZP.createElement("div",{id:"monkey",className:a?"big":""},!g&&n.ZP.createElement("div",{className:"monkey-preview"}),r&&n.ZP.createElement(s.Z,{id:"closeMonkey",size:a?o.K2:m,className:v?"hidden":"shown",animationData:r,playSegment:i,noLoop:!0,onLoad:E}),h&&n.ZP.createElement(s.Z,{id:"peekMonkey",size:a?o.K2:m,className:v?"shown":"hidden",animationData:h,playSegment:t?c:d,noLoop:!0}))}))},710:(e,t,a)=>{a.d(t,{Z:()=>p});var n=a(4050),o=a(6752),r=a(3716),l=a(1394),s=a(9107),i=a(231),c=a(3103),d=a(4288);const m={type:"blob",quality:1,format:"jpeg",circle:!1,size:{width:1024,height:1024}};let u,h,Z;const g=(0,n.X$)((e=>{let{file:t,onChange:o,onClose:g}=e;const[p,v]=(0,n.eJ)(!1);(0,n.d4)((()=>{t&&(p?async function(e){try{const t=document.getElementById("avatar-crop");if(!t)return;const{offsetWidth:a,offsetHeight:n}=t;Z=new u(t,{enableZoom:!0,boundary:{width:a,height:n},viewport:{width:a-16,height:n-16,type:"circle"}});const o=await(0,l.YJ)(e);await Z.bind({url:o})}catch(e){r.eM&&console.error(e)}}(t):async function(){return h||(h=Promise.all([a.e(99),a.e(472)]).then(a.bind(a,3472)),u=(await h).default),h}().then((()=>v(!0))))}),[t,p]);const P=(0,s.Z)(),E=(0,n.I4)((async()=>{if(!Z)return;const e=await Z.result(m),t="string"==typeof e?e:(0,l.hl)(e,"avatar.jpg");o(t)}),[o]);return n.ZP.createElement(c.Z,{isOpen:Boolean(t),onClose:g,title:"Drag to reposition",className:"CropModal",hasCloseButton:!0},p?n.ZP.createElement("div",{id:"avatar-crop"}):n.ZP.createElement(d.Z,null),n.ZP.createElement(i.Z,{className:"confirm-button",round:!0,color:"primary",onClick:E,ariaLabel:P("CropImage")},n.ZP.createElement("i",{className:"icon-check"})))})),p=(0,n.X$)((e=>{let{title:t="Change your profile picture",disabled:a,currentAvatarBlobUrl:r,onChange:l}=e;const[s,i]=(0,n.eJ)(),[c,d]=(0,n.eJ)(r);(0,n.d4)((()=>{d(r)}),[r]);const m=(0,n.I4)((e=>{i(void 0),l(e),c&&URL.revokeObjectURL(c),d(URL.createObjectURL(e))}),[c,l]),u=(0,n.I4)((()=>{i(void 0)}),[]),h=(0,o.Z)(c&&"filled",a&&"disabled");return n.ZP.createElement("div",{className:"AvatarEditable"},n.ZP.createElement("label",{className:h,role:"button",tabIndex:0,title:t},n.ZP.createElement("input",{type:"file",onChange:function(e){const t=e.target;t&&t.files&&t.files[0]&&(i(t.files[0]),t.value="")},accept:"image/png, image/jpeg"}),n.ZP.createElement("i",{className:"icon-camera-add"}),c&&n.ZP.createElement("img",{src:c,alt:"Avatar"})),n.ZP.createElement(g,{file:s,onClose:u,onChange:m}))}))},3103:(e,t,a)=>{a.d(t,{Z:()=>h});var n=a(4050),o=a(517),r=a(6752),l=a(8674),s=a(1212),i=a(274),c=a(9107),d=a(6590),m=a(231),u=a(2898);const h=e=>{let{dialogRef:t,title:a,className:h,isOpen:Z,header:g,hasCloseButton:p,noBackdrop:v,children:P,onClose:E,onCloseAnimationEnd:f,onEnter:b,shouldSkipHistoryAnimations:N}=e;const{shouldRender:y,transitionClassNames:C}=(0,s.Z)(Z,f,N,void 0,N),w=(0,n.sO)(null);(0,n.d4)((()=>Z?(0,o.Z)({onEsc:E,onEnter:b}):void 0),[Z,E,b]),(0,n.d4)((()=>Z&&w.current?function(e){function t(t){if("Tab"!==t.key)return;t.preventDefault(),t.stopPropagation();const a=Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));if(!a.length)return;const n=a.findIndex((e=>e.isSameNode(document.activeElement)));let o=0;n>=0&&(o=t.shiftKey?n>0?n-1:a.length-1:n<a.length-1?n+1:0),a[o].focus()}return document.addEventListener("keydown",t,!1),()=>{document.removeEventListener("keydown",t,!1)}}(w.current):void 0),[Z]);const{forceClose:k}=(0,d.ZP)(Z,E);(0,n.d4)((()=>()=>{Z&&k()}),[]),(0,i.Z)((e=>{let[t]=e;return document.body.classList.toggle("has-open-dialog",Z),(Z||!Z&&void 0!==t)&&(0,l.YW)(200),()=>{document.body.classList.remove("has-open-dialog")}}),[Z]);const L=(0,c.Z)();if(!y)return;const I=(0,r.Z)("Modal",h,C,v&&"transparent-backdrop");return n.ZP.createElement(u.Z,null,n.ZP.createElement("div",{ref:w,className:I,tabIndex:-1,role:"dialog"},n.ZP.createElement("div",{className:"modal-container"},n.ZP.createElement("div",{className:"modal-backdrop",onClick:E}),n.ZP.createElement("div",{className:"modal-dialog",ref:t},g||(a?n.ZP.createElement("div",{className:"modal-header"},p&&n.ZP.createElement(m.Z,{round:!0,color:"translucent",size:"smaller",ariaLabel:L("Close"),onClick:E},n.ZP.createElement("i",{className:"icon-close"})),n.ZP.createElement("div",{className:"modal-title"},a)):void 0),n.ZP.createElement("div",{className:"modal-content custom-scroll"},P)))))}},2898:(e,t,a)=>{a.d(t,{Z:()=>r});var n=a(4050),o=a(2916);const r=e=>{let{containerId:t,className:a,children:r}=e;const l=(0,n.sO)();return l.current||(l.current=document.createElement("div")),(0,n.bt)((()=>{const e=document.querySelector(t||"#portals");if(!e)return;const n=l.current;return a&&n.classList.add(a),e.appendChild(n),()=>{o.Z.render(void 0,n),e.removeChild(n)}}),[a,t]),o.Z.render(r,l.current)}}}]);
//# sourceMappingURL=133.8c0baeff1e13dd2e52f0.js.map