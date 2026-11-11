(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))r(l);new MutationObserver(l=>{for(const c of l)if(c.type==="childList")for(const h of c.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&r(h)}).observe(document,{childList:!0,subtree:!0});function i(l){const c={};return l.integrity&&(c.integrity=l.integrity),l.referrerPolicy&&(c.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?c.credentials="include":l.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function r(l){if(l.ep)return;l.ep=!0;const c=i(l);fetch(l.href,c)}})();var ld={exports:{}},ol={};var av;function NM(){if(av)return ol;av=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function i(r,l,c){var h=null;if(c!==void 0&&(h=""+c),l.key!==void 0&&(h=""+l.key),"key"in l){c={};for(var d in l)d!=="key"&&(c[d]=l[d])}else c=l;return l=c.ref,{$$typeof:o,type:r,key:h,ref:l!==void 0?l:null,props:c}}return ol.Fragment=e,ol.jsx=i,ol.jsxs=i,ol}var rv;function LM(){return rv||(rv=1,ld.exports=NM()),ld.exports}var X=LM(),ud={exports:{}},fe={};var sv;function OM(){if(sv)return fe;sv=1;var o=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),i=Symbol.for("react.fragment"),r=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),c=Symbol.for("react.consumer"),h=Symbol.for("react.context"),d=Symbol.for("react.forward_ref"),g=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),_=Symbol.for("react.lazy"),m=Symbol.for("react.activity"),x=Symbol.for("react.view_transition"),S=Symbol.iterator;function E(P){return P===null||typeof P!="object"?null:(P=S&&P[S]||P["@@iterator"],typeof P=="function"?P:null)}var A={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},M=Object.assign,y={};function N(P,ht,Y){this.props=P,this.context=ht,this.refs=y,this.updater=Y||A}N.prototype.isReactComponent={},N.prototype.setState=function(P,ht){if(typeof P!="object"&&typeof P!="function"&&P!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,P,ht,"setState")},N.prototype.forceUpdate=function(P){this.updater.enqueueForceUpdate(this,P,"forceUpdate")};function L(){}L.prototype=N.prototype;function D(P,ht,Y){this.props=P,this.context=ht,this.refs=y,this.updater=Y||A}var F=D.prototype=new L;F.constructor=D,M(F,N.prototype),F.isPureReactComponent=!0;var I=Array.isArray;function O(){}var H={H:null,A:null,T:null,S:null},w=Object.prototype.hasOwnProperty;function R(P,ht,Y){var rt=Y.ref;return{$$typeof:o,type:P,key:ht,ref:rt!==void 0?rt:null,props:Y}}function V(P,ht){return R(P.type,ht,P.props)}function $(P){return typeof P=="object"&&P!==null&&P.$$typeof===o}function ft(P){var ht={"=":"=0",":":"=2"};return"$"+P.replace(/[=:]/g,function(Y){return ht[Y]})}var gt=/\/+/g;function lt(P,ht){return typeof P=="object"&&P!==null&&P.key!=null?ft(""+P.key):ht.toString(36)}function j(P){switch(P.status){case"fulfilled":return P.value;case"rejected":throw P.reason;default:switch(typeof P.status=="string"?P.then(O,O):(P.status="pending",P.then(function(ht){P.status==="pending"&&(P.status="fulfilled",P.value=ht)},function(ht){P.status==="pending"&&(P.status="rejected",P.reason=ht)})),P.status){case"fulfilled":return P.value;case"rejected":throw P.reason}}throw P}function ot(P,ht,Y,rt,bt){var Ot=typeof P;(Ot==="undefined"||Ot==="boolean")&&(P=null);var Dt=!1;if(P===null)Dt=!0;else switch(Ot){case"bigint":case"string":case"number":Dt=!0;break;case"object":switch(P.$$typeof){case o:case e:Dt=!0;break;case _:return Dt=P._init,ot(Dt(P._payload),ht,Y,rt,bt)}}if(Dt)return bt=bt(P),Dt=rt===""?"."+lt(P,0):rt,I(bt)?(Y="",Dt!=null&&(Y=Dt.replace(gt,"$&/")+"/"),ot(bt,ht,Y,"",function(B){return B})):bt!=null&&($(bt)&&(bt=V(bt,Y+(bt.key==null||P&&P.key===bt.key?"":(""+bt.key).replace(gt,"$&/")+"/")+Dt)),ht.push(bt)),1;Dt=0;var Tt=rt===""?".":rt+":";if(I(P))for(var qt=0;qt<P.length;qt++)rt=P[qt],Ot=Tt+lt(rt,qt),Dt+=ot(rt,ht,Y,Ot,bt);else if(qt=E(P),typeof qt=="function")for(P=qt.call(P),qt=0;!(rt=P.next()).done;)rt=rt.value,Ot=Tt+lt(rt,qt++),Dt+=ot(rt,ht,Y,Ot,bt);else if(Ot==="object"){if(typeof P.then=="function")return ot(j(P),ht,Y,rt,bt);throw ht=String(P),Error("Objects are not valid as a React child (found: "+(ht==="[object Object]"?"object with keys {"+Object.keys(P).join(", ")+"}":ht)+"). If you meant to render a collection of children, use an array instead.")}return Dt}function Q(P,ht,Y){if(P==null)return P;var rt=[],bt=0;return ot(P,rt,"","",function(Ot){return ht.call(Y,Ot,bt++)}),rt}function St(P){if(P._status===-1){var ht=P._result,Y=ht();Y.then(function(rt){(P._status===0||P._status===-1)&&(P._status=1,P._result=rt,Y.status===void 0&&(Y.status="fulfilled",Y.value=rt))},function(rt){(P._status===0||P._status===-1)&&(P._status=2,P._result=rt,Y.status===void 0&&(Y.status="rejected",Y.reason=rt))}),P._status===-1&&(P._status=0,P._result=Y)}if(P._status===1)return P._result.default;throw P._result}var xt=typeof reportError=="function"?reportError:function(P){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var ht=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof P=="object"&&P!==null&&typeof P.message=="string"?String(P.message):String(P),error:P});if(!window.dispatchEvent(ht))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",P);return}console.error(P)};function Gt(P){var ht=H.T,Y={};Y.types=ht!==null?ht.types:null,H.T=Y;try{var rt=P(),bt=H.S;bt!==null&&bt(Y,rt),typeof rt=="object"&&rt!==null&&typeof rt.then=="function"&&rt.then(O,xt)}catch(Ot){xt(Ot)}finally{ht!==null&&Y.types!==null&&(ht.types=Y.types),H.T=ht}}function ne(P){var ht=H.T;if(ht!==null){var Y=ht.types;Y===null?ht.types=[P]:Y.indexOf(P)===-1&&Y.push(P)}else Gt(ne.bind(null,P))}var ye={map:Q,forEach:function(P,ht,Y){Q(P,function(){ht.apply(this,arguments)},Y)},count:function(P){var ht=0;return Q(P,function(){ht++}),ht},toArray:function(P){return Q(P,function(ht){return ht})||[]},only:function(P){if(!$(P))throw Error("React.Children.only expected to receive a single React element child.");return P}};return fe.Activity=m,fe.Children=ye,fe.Component=N,fe.Fragment=i,fe.Profiler=l,fe.PureComponent=D,fe.StrictMode=r,fe.Suspense=g,fe.ViewTransition=x,fe.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=H,fe.__COMPILER_RUNTIME={__proto__:null,c:function(P){return H.H.useMemoCache(P)}},fe.addTransitionType=ne,fe.cache=function(P){return function(){return P.apply(null,arguments)}},fe.cacheSignal=function(){return null},fe.cloneElement=function(P,ht,Y){if(P==null)throw Error("The argument must be a React element, but you passed "+P+".");var rt=M({},P.props),bt=P.key;if(ht!=null)for(Ot in ht.key!==void 0&&(bt=""+ht.key),ht)!w.call(ht,Ot)||Ot==="key"||Ot==="__self"||Ot==="__source"||Ot==="ref"&&ht.ref===void 0||(rt[Ot]=ht[Ot]);var Ot=arguments.length-2;if(Ot===1)rt.children=Y;else if(1<Ot){for(var Dt=Array(Ot),Tt=0;Tt<Ot;Tt++)Dt[Tt]=arguments[Tt+2];rt.children=Dt}return R(P.type,bt,rt)},fe.createContext=function(P){return P={$$typeof:h,_currentValue:P,_currentValue2:P,_threadCount:0,Provider:null,Consumer:null},P.Provider=P,P.Consumer={$$typeof:c,_context:P},P},fe.createElement=function(P,ht,Y){var rt,bt={},Ot=null;if(ht!=null)for(rt in ht.key!==void 0&&(Ot=""+ht.key),ht)w.call(ht,rt)&&rt!=="key"&&rt!=="__self"&&rt!=="__source"&&(bt[rt]=ht[rt]);var Dt=arguments.length-2;if(Dt===1)bt.children=Y;else if(1<Dt){for(var Tt=Array(Dt),qt=0;qt<Dt;qt++)Tt[qt]=arguments[qt+2];bt.children=Tt}if(P&&P.defaultProps)for(rt in Dt=P.defaultProps,Dt)bt[rt]===void 0&&(bt[rt]=Dt[rt]);return R(P,Ot,bt)},fe.createRef=function(){return{current:null}},fe.forwardRef=function(P){return{$$typeof:d,render:P}},fe.isValidElement=$,fe.lazy=function(P){return{$$typeof:_,_payload:{_status:-1,_result:P},_init:St}},fe.memo=function(P,ht){return{$$typeof:p,type:P,compare:ht===void 0?null:ht}},fe.startTransition=Gt,fe.unstable_useCacheRefresh=function(){return H.H.useCacheRefresh()},fe.use=function(P){return H.H.use(P)},fe.useActionState=function(P,ht,Y){return H.H.useActionState(P,ht,Y)},fe.useCallback=function(P,ht){return H.H.useCallback(P,ht)},fe.useContext=function(P){return H.H.useContext(P)},fe.useDebugValue=function(){},fe.useDeferredValue=function(P,ht){return H.H.useDeferredValue(P,ht)},fe.useEffect=function(P,ht){return H.H.useEffect(P,ht)},fe.useEffectEvent=function(P){return H.H.useEffectEvent(P)},fe.useId=function(){return H.H.useId()},fe.useImperativeHandle=function(P,ht,Y){return H.H.useImperativeHandle(P,ht,Y)},fe.useInsertionEffect=function(P,ht){return H.H.useInsertionEffect(P,ht)},fe.useLayoutEffect=function(P,ht){return H.H.useLayoutEffect(P,ht)},fe.useMemo=function(P,ht){return H.H.useMemo(P,ht)},fe.useOptimistic=function(P,ht){return H.H.useOptimistic(P,ht)},fe.useReducer=function(P,ht,Y){return H.H.useReducer(P,ht,Y)},fe.useRef=function(P){return H.H.useRef(P)},fe.useState=function(P){return H.H.useState(P)},fe.useSyncExternalStore=function(P,ht,Y){return H.H.useSyncExternalStore(P,ht,Y)},fe.useTransition=function(){return H.H.useTransition()},fe.version="19.3.1",fe}var ov;function zp(){return ov||(ov=1,ud.exports=OM()),ud.exports}var Fe=zp(),cd={exports:{}},ll={},fd={exports:{}},hd={};var lv;function zM(){return lv||(lv=1,(function(o){function e(j,ot){var Q=j.length;j.push(ot);t:for(;0<Q;){var St=Q-1>>>1,xt=j[St];if(0<l(xt,ot))j[St]=ot,j[Q]=xt,Q=St;else break t}}function i(j){return j.length===0?null:j[0]}function r(j){if(j.length===0)return null;var ot=j[0],Q=j.pop();if(Q!==ot){j[0]=Q;t:for(var St=0,xt=j.length,Gt=xt>>>1;St<Gt;){var ne=2*(St+1)-1,ye=j[ne],P=ne+1,ht=j[P];if(0>l(ye,Q))P<xt&&0>l(ht,ye)?(j[St]=ht,j[P]=Q,St=P):(j[St]=ye,j[ne]=Q,St=ne);else if(P<xt&&0>l(ht,Q))j[St]=ht,j[P]=Q,St=P;else break t}}return ot}function l(j,ot){var Q=j.sortIndex-ot.sortIndex;return Q!==0?Q:j.id-ot.id}if(o.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var c=performance;o.unstable_now=function(){return c.now()}}else{var h=Date,d=h.now();o.unstable_now=function(){return h.now()-d}}var g=[],p=[],_=1,m=null,x=3,S=!1,E=!1,A=!1,M=!1,y=typeof setTimeout=="function"?setTimeout:null,N=typeof clearTimeout=="function"?clearTimeout:null,L=typeof setImmediate<"u"?setImmediate:null;function D(j){for(var ot=i(p);ot!==null;){if(ot.callback===null)r(p);else if(ot.startTime<=j)r(p),ot.sortIndex=ot.expirationTime,e(g,ot);else break;ot=i(p)}}function F(j){if(A=!1,D(j),!E)if(i(g)!==null)E=!0,I||(I=!0,$());else{var ot=i(p);ot!==null&&lt(F,ot.startTime-j)}}var I=!1,O=-1,H=5,w=-1;function R(){return M?!0:!(o.unstable_now()-w<H)}function V(){if(M=!1,I){var j=o.unstable_now();w=j;var ot=!0;try{t:{E=!1,A&&(A=!1,N(O),O=-1),S=!0;var Q=x;try{e:{for(D(j),m=i(g);m!==null&&!(m.expirationTime>j&&R());){var St=m.callback;if(typeof St=="function"){m.callback=null,x=m.priorityLevel;var xt=St(m.expirationTime<=j);if(j=o.unstable_now(),typeof xt=="function"){m.callback=xt,D(j),ot=!0;break e}m===i(g)&&r(g),D(j)}else r(g);m=i(g)}if(m!==null)ot=!0;else{var Gt=i(p);Gt!==null&&lt(F,Gt.startTime-j),ot=!1}}break t}finally{m=null,x=Q,S=!1}ot=void 0}}finally{ot?$():I=!1}}}var $;if(typeof L=="function")$=function(){L(V)};else if(typeof MessageChannel<"u"){var ft=new MessageChannel,gt=ft.port2;ft.port1.onmessage=V,$=function(){gt.postMessage(null)}}else $=function(){y(V,0)};function lt(j,ot){O=y(function(){j(o.unstable_now())},ot)}o.unstable_IdlePriority=5,o.unstable_ImmediatePriority=1,o.unstable_LowPriority=4,o.unstable_NormalPriority=3,o.unstable_Profiling=null,o.unstable_UserBlockingPriority=2,o.unstable_cancelCallback=function(j){j.callback=null},o.unstable_forceFrameRate=function(j){0>j||125<j?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):H=0<j?Math.floor(1e3/j):5},o.unstable_getCurrentPriorityLevel=function(){return x},o.unstable_next=function(j){switch(x){case 1:case 2:case 3:var ot=3;break;default:ot=x}var Q=x;x=ot;try{return j()}finally{x=Q}},o.unstable_requestPaint=function(){M=!0},o.unstable_runWithPriority=function(j,ot){switch(j){case 1:case 2:case 3:case 4:case 5:break;default:j=3}var Q=x;x=j;try{return ot()}finally{x=Q}},o.unstable_scheduleCallback=function(j,ot,Q){var St=o.unstable_now();switch(typeof Q=="object"&&Q!==null?(Q=Q.delay,Q=typeof Q=="number"&&0<Q?St+Q:St):Q=St,j){case 1:var xt=-1;break;case 2:xt=250;break;case 5:xt=1073741823;break;case 4:xt=1e4;break;default:xt=5e3}return xt=Q+xt,j={id:_++,callback:ot,priorityLevel:j,startTime:Q,expirationTime:xt,sortIndex:-1},Q>St?(j.sortIndex=Q,e(p,j),i(g)===null&&j===i(p)&&(A?(N(O),O=-1):A=!0,lt(F,Q-St))):(j.sortIndex=xt,e(g,j),E||S||(E=!0,I||(I=!0,$()))),j},o.unstable_shouldYield=R,o.unstable_wrapCallback=function(j){var ot=x;return function(){var Q=x;x=ot;try{return j.apply(this,arguments)}finally{x=Q}}}})(hd)),hd}var uv;function PM(){return uv||(uv=1,fd.exports=zM()),fd.exports}var dd={exports:{}},Nn={};var cv;function IM(){if(cv)return Nn;cv=1;var o=zp();function e(_){var m="https://react.dev/errors/"+_;if(1<arguments.length){m+="?args[]="+encodeURIComponent(arguments[1]);for(var x=2;x<arguments.length;x++)m+="&args[]="+encodeURIComponent(arguments[x])}return"Minified React error #"+_+"; visit "+m+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function i(){}var r={d:{f:i,r:function(){throw Error(e(522))},D:i,C:i,L:i,m:i,X:i,S:i,M:i},p:0,findDOMNode:null},l=Symbol.for("react.portal"),c=Symbol.for("react.recoverable"),h=Symbol.for("react.optimistic_key");function d(_,m,x){var S=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:l,key:S==null?null:S===h?h:""+S,children:_,containerInfo:m,implementation:x}}var g=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function p(_,m){if(_==="font")return"";if(typeof m=="string")return m==="use-credentials"?m:""}return Nn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=r,Nn.browser=function(_){return{$$typeof:c,_reason:_}},Nn.createPortal=function(_,m){var x=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!m||m.nodeType!==1&&m.nodeType!==9&&m.nodeType!==11)throw Error(e(299));return d(_,m,null,x)},Nn.flushSync=function(_){var m=g.T,x=r.p;try{if(g.T=null,r.p=2,_)return _()}finally{g.T=m,r.p=x,r.d.f()}},Nn.preconnect=function(_,m){typeof _=="string"&&(m?(m=m.crossOrigin,m=typeof m=="string"?m==="use-credentials"?m:"":void 0):m=null,r.d.C(_,m))},Nn.prefetchDNS=function(_){typeof _=="string"&&r.d.D(_)},Nn.preinit=function(_,m){if(typeof _=="string"&&m&&typeof m.as=="string"){var x=m.as,S=p(x,m.crossOrigin),E=typeof m.integrity=="string"?m.integrity:void 0,A=typeof m.fetchPriority=="string"?m.fetchPriority:void 0;x==="style"?r.d.S(_,typeof m.precedence=="string"?m.precedence:void 0,{crossOrigin:S,integrity:E,fetchPriority:A}):x==="script"&&r.d.X(_,{crossOrigin:S,integrity:E,fetchPriority:A,nonce:typeof m.nonce=="string"?m.nonce:void 0})}},Nn.preinitModule=function(_,m){if(typeof _=="string")if(typeof m=="object"&&m!==null){if(m.as==null||m.as==="script"){var x=p(m.as,m.crossOrigin);r.d.M(_,{crossOrigin:x,integrity:typeof m.integrity=="string"?m.integrity:void 0,nonce:typeof m.nonce=="string"?m.nonce:void 0,fetchPriority:typeof m.fetchPriority=="string"?m.fetchPriority:void 0})}}else m==null&&r.d.M(_)},Nn.preload=function(_,m){if(typeof _=="string"&&typeof m=="object"&&m!==null&&typeof m.as=="string"){var x=m.as,S=p(x,m.crossOrigin);r.d.L(_,x,{crossOrigin:S,integrity:typeof m.integrity=="string"?m.integrity:void 0,nonce:typeof m.nonce=="string"?m.nonce:void 0,type:typeof m.type=="string"?m.type:void 0,fetchPriority:typeof m.fetchPriority=="string"?m.fetchPriority:void 0,referrerPolicy:typeof m.referrerPolicy=="string"?m.referrerPolicy:void 0,imageSrcSet:typeof m.imageSrcSet=="string"?m.imageSrcSet:void 0,imageSizes:typeof m.imageSizes=="string"?m.imageSizes:void 0,media:typeof m.media=="string"?m.media:void 0})}},Nn.preloadModule=function(_,m){if(typeof _=="string")if(m){var x=p(m.as,m.crossOrigin);r.d.m(_,{as:typeof m.as=="string"&&m.as!=="script"?m.as:void 0,crossOrigin:x,integrity:typeof m.integrity=="string"?m.integrity:void 0,nonce:typeof m.nonce=="string"?m.nonce:void 0,fetchPriority:typeof m.fetchPriority=="string"?m.fetchPriority:void 0})}else r.d.m(_)},Nn.requestFormReset=function(_){r.d.r(_)},Nn.unstable_batchedUpdates=function(_,m){return _(m)},Nn.useFormState=function(_,m,x){return g.H.useFormState(_,m,x)},Nn.useFormStatus=function(){return g.H.useHostTransitionStatus()},Nn.version="19.3.1",Nn}var fv;function BM(){if(fv)return dd.exports;fv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),dd.exports=IM(),dd.exports}var hv;function FM(){if(hv)return ll;hv=1;var o=PM(),e=zp(),i=BM();function r(t){var n="https://react.dev/errors/"+t;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)n+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function l(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function c(t){for(var n=t,a=n;a&&!a.alternate;)n=a,(n.flags&4098)!==0&&(t=n.return),a=n.return;for(;n.return;)n=n.return;return n.tag===3?t:null}function h(t){if(t.tag===13){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function d(t){if(t.tag===31){var n=t.memoizedState;if(n===null&&(t=t.alternate,t!==null&&(n=t.memoizedState)),n!==null)return n.dehydrated}return null}function g(t){if(c(t)!==t)throw Error(r(188))}function p(t){var n=t.alternate;if(!n){if(n=c(t),n===null)throw Error(r(188));return n!==t?null:t}for(var a=t,s=n;;){var u=a.return;if(u===null)break;var f=u.alternate;if(f===null){if(s=u.return,s!==null){a=s;continue}break}if(u.child===f.child){for(f=u.child;f;){if(f===a)return g(u),t;if(f===s)return g(u),n;f=f.sibling}throw Error(r(188))}if(a.return!==s.return)a=u,s=f;else{for(var v=!1,T=u.child;T;){if(T===a){v=!0,a=u,s=f;break}if(T===s){v=!0,s=u,a=f;break}T=T.sibling}if(!v){for(T=f.child;T;){if(T===a){v=!0,a=f,s=u;break}if(T===s){v=!0,s=f,a=u;break}T=T.sibling}if(!v)throw Error(r(189))}}if(a.alternate!==s)throw Error(r(190))}if(a.tag!==3)throw Error(r(188));return a.stateNode.current===a?t:n}function _(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t;for(t=t.child;t!==null;){if(n=_(t),n!==null)return n;t=t.sibling}return null}function m(t,n,a,s,u,f){for(;t!==null;){if((t.tag===5||t.tag===27||t.tag===6)&&a(t,s,u,f)||(t.tag!==22||t.memoizedState===null)&&(n||t.tag!==5&&t.tag!==27)&&m(t.child,n,a,s,u,f))return!0;t=t.sibling}return!1}function x(t){for(t=t.return;t!==null;){if(t.tag===3||t.tag===5||t.tag===27)return t;t=t.return}return null}function S(t){var n=!1;for(t=t.return;t!==null&&(t.tag===4&&(n=!0),!(t.tag===3||t.tag===5||t.tag===27));)t=t.return;return n}function E(t){var n=[null,null],a=x(t);return a===null||A(n,t,a.child,{foundSelf:!1}),n}function A(t,n,a,s){for(;a!==null;){if(a===n)s.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(s.foundSelf)return t[1]=a,!0;t[0]=a}else if((a.tag!==22||a.memoizedState===null)&&A(t,n,a.child,s))return!0;a=a.sibling}return!1}function M(t){switch(t.tag){case 5:case 27:case 6:return t.stateNode;case 3:return t.stateNode.containerInfo;default:throw Error(r(559))}}var y=null,N=null;function L(t,n,a){return t===a?!0:t===n?(y=t,!0):!1}function D(t,n,a){return t===a?(N=t,!1):t===n?(N!==null&&(y=t),!0):!1}function F(t){if(t===null)return null;do t=t===null?null:t.return;while(t&&t.tag!==5&&t.tag!==27&&t.tag!==3);return t||null}function I(t,n,a){for(var s=0,u=t;u;u=a(u))s++;u=0;for(var f=n;f;f=a(f))u++;for(;0<s-u;)t=a(t),s--;for(;0<u-s;)n=a(n),u--;for(;s--;){if(t===n||n!==null&&t===n.alternate)return t;t=a(t),n=a(n)}return null}var O=Object.assign,H=Symbol.for("react.element"),w=Symbol.for("react.transitional.element"),R=Symbol.for("react.portal"),V=Symbol.for("react.fragment"),$=Symbol.for("react.strict_mode"),ft=Symbol.for("react.profiler"),gt=Symbol.for("react.consumer"),lt=Symbol.for("react.context"),j=Symbol.for("react.forward_ref"),ot=Symbol.for("react.suspense"),Q=Symbol.for("react.suspense_list"),St=Symbol.for("react.memo"),xt=Symbol.for("react.lazy"),Gt=Symbol.for("react.activity"),ne=Symbol.for("react.legacy_hidden"),ye=Symbol.for("react.memo_cache_sentinel"),P=Symbol.for("react.view_transition"),ht=Symbol.for("react.recoverable"),Y=Symbol.iterator;function rt(t){return t===null||typeof t!="object"?null:(t=Y&&t[Y]||t["@@iterator"],typeof t=="function"?t:null)}var bt=Symbol.for("react.client.reference");function Ot(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===bt?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case V:return"Fragment";case ft:return"Profiler";case $:return"StrictMode";case ot:return"Suspense";case Q:return"SuspenseList";case Gt:return"Activity";case P:return"ViewTransition"}if(typeof t=="object")switch(t.$$typeof){case R:return"Portal";case lt:return t.displayName||"Context";case gt:return(t._context.displayName||"Context")+".Consumer";case j:var n=t.render;return t=t.displayName,t||(t=n.displayName||n.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case St:return n=t.displayName||null,n!==null?n:Ot(t.type)||"Memo";case xt:n=t._payload,t=t._init;try{return Ot(t(n))}catch{}}return null}var Dt=Array.isArray,Tt=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,qt=i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,B={pending:!1,data:null,method:null,action:null},ze=[],le=-1;function Wt(t){return{current:t}}function G(t){0>le||(t.current=ze[le],ze[le]=null,le--)}function _t(t,n){le++,ze[le]=t.current,t.current=n}var Mt=Wt(null),Ht=Wt(null),oe=Wt(null),kt=Wt(null);function U(t,n){switch(_t(oe,n),_t(Ht,t),_t(Mt,null),n.nodeType){case 9:case 11:t=(t=n.documentElement)&&(t=t.namespaceURI)?d_(t):0;break;default:if(t=n.tagName,n=n.namespaceURI)n=d_(n),t=p_(n,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}G(Mt),_t(Mt,t)}function b(){G(Mt),G(Ht),G(oe)}function nt(t){var n=t.memoizedState;n!==null&&(Is._currentValue=n.memoizedState,_t(kt,t)),n=Mt.current;var a=p_(n,t.type);n!==a&&(_t(Ht,t),_t(Mt,a))}function dt(t){Ht.current===t&&(G(Mt),G(Ht)),kt.current===t&&(G(kt),Is._currentValue=B)}var Et,pt;function jt(t){if(Et===void 0)try{throw Error()}catch(a){var n=a.stack.trim().match(/\n( *(at )?)/);Et=n&&n[1]||"",pt=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Et+t+pt}var Ut=!1;function $t(t,n){if(!t||Ut)return"";Ut=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var s={DetermineComponentFrameRoot:function(){try{if(n){var vt=function(){throw Error()};if(Object.defineProperty(vt.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(vt,[])}catch(zt){var W=zt}Reflect.construct(t,[],vt)}else{try{vt.call()}catch(zt){W=zt}vt=!1;try{var at=Object.getOwnPropertyDescriptor(t.prototype,"props");Object.defineProperty(t.prototype,"props",{configurable:!0,set:function(){throw Error()}}),vt=!0,new t}finally{vt&&(at!==void 0?Object.defineProperty(t.prototype,"props",at):delete t.prototype.props)}}}else{try{throw Error()}catch(zt){W=zt}(vt=t())&&typeof vt.catch=="function"&&vt.catch(function(){})}}catch(zt){if(zt&&W&&typeof zt.stack=="string")return[zt.stack,W.stack]}return[null,null]}};s.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var u=Object.getOwnPropertyDescriptor(s.DetermineComponentFrameRoot,"name");u&&u.configurable&&Object.defineProperty(s.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var f=s.DetermineComponentFrameRoot(),v=f[0],T=f[1];if(v&&T){var z=v.split(`
`),K=T.split(`
`);for(u=s=0;s<z.length&&!z[s].includes("DetermineComponentFrameRoot");)s++;for(;u<K.length&&!K[u].includes("DetermineComponentFrameRoot");)u++;if(s===z.length||u===K.length)for(s=z.length-1,u=K.length-1;1<=s&&0<=u&&z[s]!==K[u];)u--;for(;1<=s&&0<=u;s--,u--)if(z[s]!==K[u]){if(s!==1||u!==1)do if(s--,u--,0>u||z[s]!==K[u]){var st=`
`+z[s].replace(" at new "," at ");return t.displayName&&st.includes("<anonymous>")&&(st=st.replace("<anonymous>",t.displayName)),st}while(1<=s&&0<=u);break}}}finally{Ut=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?jt(a):""}function ee(t,n){switch(t.tag){case 26:case 27:case 5:return jt(t.type);case 16:return jt("Lazy");case 13:return t.child!==n&&n!==null?jt("Suspense Fallback"):jt("Suspense");case 19:return jt("SuspenseList");case 0:case 15:return $t(t.type,!1);case 11:return $t(t.type.render,!1);case 1:return $t(t.type,!0);case 31:return jt("Activity");case 30:return jt("ViewTransition");default:return""}}function Ct(t){try{var n="",a=null;do n+=ee(t,a),a=t,t=t.return;while(t);return n}catch(s){return`
Error generating stack: `+s.message+`
`+s.stack}}var Pt=Object.prototype.hasOwnProperty,ue=o.unstable_scheduleCallback,te=o.unstable_cancelCallback,It=o.unstable_shouldYield,de=o.unstable_requestPaint,q=o.unstable_now,wt=o.unstable_getCurrentPriorityLevel,Lt=o.unstable_ImmediatePriority,Yt=o.unstable_UserBlockingPriority,At=o.unstable_NormalPriority,yt=o.unstable_LowPriority,Qt=o.unstable_IdlePriority,he=o.log,qe=o.unstable_setDisableYieldValue,be=null,en=null;function _n(t){if(typeof he=="function"&&qe(t),en&&typeof en.setStrictMode=="function")try{en.setStrictMode(be,t)}catch{}}var Ln=Math.clz32?Math.clz32:Rl,aa=Math.log,_o=Math.LN2;function Rl(t){return t>>>=0,t===0?32:31-(aa(t)/_o|0)|0}var gr=256,ra=262144,_r=4194304;function fi(t){var n=t&42;if(n!==0)return n;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&-t;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function vr(t,n,a){var s=t.pendingLanes;if(s===0)return 0;var u=0,f=t.suspendedLanes,v=t.pingedLanes;t=t.warmLanes;var T=s&134217727;return T!==0?(s=T&~f,s!==0?u=fi(s):(v&=T,v!==0?u=fi(v):a||(a=T&~t,a!==0&&(u=fi(a))))):(T=s&~f,T!==0?u=fi(T):v!==0?u=fi(v):a||(a=s&~t,a!==0&&(u=fi(a)))),u===0?0:n!==0&&n!==u&&(n&f)===0&&(f=u&-u,a=n&-n,f>=a||f===32&&(a&4194048)!==0)?n:u}function Da(t,n){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&n)===0}function Cl(t,n){(n&8)!==0&&(n|=n&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=n;0<a;){var s=31-Ln(a),u=1<<s;n|=t[s],a&=~u}return n}function zc(t,n){switch(t){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function wl(){var t=_r;return _r<<=1,(_r&62914560)===0&&(_r=4194304),t}function vo(t){for(var n=[],a=0;31>a;a++)n.push(t);return n}function xr(t,n){t.pendingLanes|=n,n!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function Pc(t,n,a,s,u,f){var v=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var T=t.entanglements,z=t.expirationTimes,K=t.hiddenUpdates;for(a=v&~a;0<a;){var st=31-Ln(a),vt=1<<st;T[st]=0,z[st]=-1;var W=K[st];if(W!==null)for(K[st]=null,st=0;st<W.length;st++){var at=W[st];at!==null&&(at.lane&=-536870913)}a&=~vt}s!==0&&C(t,s,0),f!==0&&u===0&&t.tag!==0&&(t.suspendedLanes|=f&~(v&~n))}function C(t,n,a){t.pendingLanes|=n,t.suspendedLanes&=~n;var s=31-Ln(n);t.entangledLanes|=n,t.entanglements[s]=t.entanglements[s]|1073741824|a&261930}function J(t,n){var a=t.entangledLanes|=n;for(t=t.entanglements;a;){var s=31-Ln(a),u=1<<s;u&n|t[s]&n&&(t[s]|=n),a&=~u}}function ut(t,n){var a=n&-n;return a=(a&42)!==0?1:ct(a),(a&(t.suspendedLanes|n))!==0?0:a}function ct(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function tt(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Rt(){var t=qt.p;return t!==0?t:(t=window.event,t===void 0?32:Q_(t.type))}function Bt(t,n){var a=qt.p;try{return qt.p=t,n()}finally{qt.p=a}}var Vt=Math.random().toString(36).slice(2),Nt="__reactFiber$"+Vt,Zt="__reactProps$"+Vt,se="__reactContainer$"+Vt,ae="__reactEvents$"+Vt,Se="__reactListeners$"+Vt,He="__reactHandles$"+Vt,$e="__reactResources$"+Vt,Pe="__reactMarker$"+Vt,Ue="__reactLoad$"+Vt;function re(t){delete t[Nt],delete t[Zt],delete t[Se],delete t[He]}function Ie(t){var n;if(n=t[Nt])return n;for(var a=t.parentNode;a;){if(n=a[se]||a[Nt]){if(a=n.alternate,n.child!==null||a!==null&&a.child!==null)for(t=U_(t);t!==null;){if(a=t[Nt])return a;t=U_(t)}return n}t=a,a=t.parentNode}return null}function ve(t){if(t=t[Nt]||t[se]){var n=t.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return t}return null}function vn(t){var n=t.tag;if(n===5||n===26||n===27||n===6)return t.stateNode;throw Error(r(33))}function ti(t){var n=t[$e];return n||(n=t[$e]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function Ne(t){t[Pe]=!0}function Ua(t){t[Ue]=void 0}var Ze=new Set,Bn={};function fn(t,n){rn(t,n),rn(t+"Capture",n)}function rn(t,n){for(Bn[t]=n,t=0;t<n.length;t++)Ze.add(n[t])}var On=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),ts={},Bi={};function Qx(t){return Pt.call(Bi,t)?!0:Pt.call(ts,t)?!1:On.test(t)?Bi[t]=!0:(ts[t]=!0,!1)}var Le=!1;function $p(){var t=Le;return Le=!1,t}function Dl(t,n,a){if(Qx(n))if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(n);return;case"boolean":var s=n.toLowerCase().slice(0,5);if(s!=="data-"&&s!=="aria-"){t.removeAttribute(n);return}}t.setAttribute(n,a)}}function Ul(t,n,a){if(a===null)t.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(n);return}t.setAttribute(n,a)}}function sa(t,n,a,s){if(s===null)t.removeAttribute(a);else{switch(typeof s){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(n,a,s)}}function ei(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function tm(t){var n=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function Jx(t,n,a){var s=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);if(!t.hasOwnProperty(n)&&typeof s<"u"&&typeof s.get=="function"&&typeof s.set=="function"){var u=s.get,f=s.set;return Object.defineProperty(t,n,{configurable:!0,get:function(){return u.call(this)},set:function(v){a=""+v,f.call(this,v)}}),Object.defineProperty(t,n,{enumerable:s.enumerable}),{getValue:function(){return a},setValue:function(v){a=""+v},stopTracking:function(){t._valueTracker=null,delete t[n]}}}}function Ic(t){if(!t._valueTracker){var n=tm(t)?"checked":"value";t._valueTracker=Jx(t,n,""+t[n])}}function em(t){if(!t)return!1;var n=t._valueTracker;if(!n)return!0;var a=n.getValue(),s="";return t&&(s=tm(t)?t.checked?"true":"false":t.value),t=s,t!==a?(n.setValue(t),!0):!1}var $x=/[\n"\\]/g;function hi(t){return t.replace($x,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function Bc(t,n,a,s,u,f,v,T){t.name="",v!=null&&typeof v!="function"&&typeof v!="symbol"&&typeof v!="boolean"?t.type=v:t.removeAttribute("type"),n!=null?v==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+ei(n)):t.value!==""+ei(n)&&(t.value=""+ei(n)):v!=="submit"&&v!=="reset"||t.removeAttribute("value"),n!=null?v==="number"&&t.value==n?Fc(t,ei(t.value)):Fc(t,ei(n)):a!=null?Fc(t,ei(a)):s!=null&&t.removeAttribute("value"),u==null&&f!=null&&(t.defaultChecked=!!f),u!=null&&(t.checked=u&&typeof u!="function"&&typeof u!="symbol"),T!=null&&typeof T!="function"&&typeof T!="symbol"&&typeof T!="boolean"?t.name=""+ei(T):t.removeAttribute("name")}function nm(t,n,a,s,u,f,v,T){if(f!=null&&typeof f!="function"&&typeof f!="symbol"&&typeof f!="boolean"&&(t.type=f),n!=null||a!=null){if(!(f!=="submit"&&f!=="reset"||n!=null)){Ic(t);return}a=a!=null?""+ei(a):"",n=n!=null?""+ei(n):a,T||n===t.value||(t.value=n),t.defaultValue=n}s=s??u,s=typeof s!="function"&&typeof s!="symbol"&&!!s,t.checked=T?t.checked:!!s,t.defaultChecked=!!s,v!=null&&typeof v!="function"&&typeof v!="symbol"&&typeof v!="boolean"&&(t.name=v),Ic(t)}function Fc(t,n){t.defaultValue!==""+n&&(t.defaultValue=""+n)}function es(t,n,a,s){if(t=t.options,n){n={};for(var u=0;u<a.length;u++)n["$"+a[u]]=!0;for(a=0;a<t.length;a++)u=n.hasOwnProperty("$"+t[a].value),t[a].selected!==u&&(t[a].selected=u),u&&s&&(t[a].defaultSelected=!0)}else{for(a=""+ei(a),n=null,u=0;u<t.length;u++){if(t[u].value===a){t[u].selected=!0,s&&(t[u].defaultSelected=!0);return}n!==null||t[u].disabled||(n=t[u])}n!==null&&(n.selected=!0)}}function im(t,n,a){if(n!=null&&(n=""+ei(n),n!==t.value&&(t.value=n),a==null)){t.defaultValue!==n&&(t.defaultValue=n);return}t.defaultValue=a!=null?""+ei(a):""}function am(t,n,a,s){if(n==null){if(s!=null){if(a!=null)throw Error(r(92));if(Dt(s)){if(1<s.length)throw Error(r(93));s=s[0]}a=s}a==null&&(a=""),n=a}a=ei(n),t.defaultValue=a,s=t.textContent,s===a&&s!==""&&s!==null&&(t.value=s),Ic(t)}function ns(t,n){if(n){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=n;return}}t.textContent=n}var ty=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function rm(t,n,a){var s=n.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?s?t.setProperty(n,""):n==="float"?t.cssFloat="":t[n]="":s?t.setProperty(n,a):typeof a!="number"||a===0||ty.has(n)?n==="float"?t.cssFloat=a:t[n]=(""+a).trim():t[n]=a+"px"}function sm(t,n,a){if(n!=null&&typeof n!="object")throw Error(r(62));if(t=t.style,a!=null){for(var s in a)!a.hasOwnProperty(s)||n!=null&&n.hasOwnProperty(s)||(s.indexOf("--")===0?t.setProperty(s,""):s==="float"?t.cssFloat="":t[s]="",Le=!0);for(var u in n)s=n[u],n.hasOwnProperty(u)&&a[u]!==s&&(rm(t,u,s),Le=!0)}else for(var f in n)n.hasOwnProperty(f)&&rm(t,f,n[f])}function Hc(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var ey=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),ny=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Nl(t){return ny.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function Fi(){}var Gc=null;function Vc(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var is=null,as=null;function om(t){var n=ve(t);if(n&&(t=n.stateNode)){var a=t[Zt]||null;t:switch(t=n.stateNode,n.type){case"input":if(Bc(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),n=a.name,a.type==="radio"&&n!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+hi(""+n)+'"][type="radio"]'),n=0;n<a.length;n++){var s=a[n];if(s!==t&&s.form===t.form){var u=s[Zt]||null;if(!u)throw Error(r(90));Bc(s,u.value,u.defaultValue,u.defaultValue,u.checked,u.defaultChecked,u.type,u.name)}}for(n=0;n<a.length;n++)s=a[n],s.form===t.form&&em(s)}break t;case"textarea":im(t,a.value,a.defaultValue);break t;case"select":n=a.value,n!=null&&es(t,!!a.multiple,n,!1)}}}var kc=!1;function lm(t,n,a){if(kc)return t(n,a);kc=!0;try{var s=t(n);return s}finally{if(kc=!1,(is!==null||as!==null)&&(Nu(),is&&(n=is,t=as,as=is=null,om(n),t)))for(n=0;n<t.length;n++)om(t[n])}}function xo(t,n){var a=t.stateNode;if(a===null)return null;var s=a[Zt]||null;if(s===null)return null;a=s[n];t:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(s=!s.disabled)||(t=t.type,s=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!s;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(r(231,n,typeof a));return a}var oa=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Xc=!1;if(oa)try{var yo={};Object.defineProperty(yo,"passive",{get:function(){Xc=!0}}),window.addEventListener("test",yo,yo),window.removeEventListener("test",yo,yo)}catch{Xc=!1}var Na=null,qc=null,Ll=null;function um(){if(Ll)return Ll;var t,n=qc,a=n.length,s,u="value"in Na?Na.value:Na.textContent,f=u.length;for(t=0;t<a&&n[t]===u[t];t++);var v=a-t;for(s=1;s<=v&&n[a-s]===u[f-s];s++);return Ll=u.slice(t,1<s?1-s:void 0)}function Ol(t){var n=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&n===13&&(t=13)):t=n,t===10&&(t=13),32<=t||t===13?t:0}function zl(){return!0}function cm(){return!1}function Fn(t){function n(a,s,u,f,v){this._reactName=a,this._targetInst=u,this.type=s,this.nativeEvent=f,this.target=v,this.currentTarget=null;for(var T in t)t.hasOwnProperty(T)&&(a=t[T],this[T]=a?a(f):f[T]);return this.isDefaultPrevented=(f.defaultPrevented!=null?f.defaultPrevented:f.returnValue===!1)?zl:cm,this.isPropagationStopped=cm,this}return O(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=zl)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=zl)},persist:function(){},isPersistent:zl}),n}var La={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Pl=Fn(La),So=O({},La,{view:0,detail:0}),iy=Fn(So),Yc,jc,Mo,Il=O({},So,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Zc,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Mo&&(Mo&&t.type==="mousemove"?(Yc=t.screenX-Mo.screenX,jc=t.screenY-Mo.screenY):jc=Yc=0,Mo=t),Yc)},movementY:function(t){return"movementY"in t?t.movementY:jc}}),fm=Fn(Il),ay=O({},Il,{dataTransfer:0}),ry=Fn(ay),sy=O({},So,{relatedTarget:0}),Wc=Fn(sy),oy=O({},La,{animationName:0,elapsedTime:0,pseudoElement:0}),ly=Fn(oy),uy=O({},La,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),cy=Fn(uy),fy=O({},La,{data:0}),hm=Fn(fy),hy={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},dy={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},py={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function my(t){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(t):(t=py[t])?!!n[t]:!1}function Zc(){return my}var gy=O({},So,{key:function(t){if(t.key){var n=hy[t.key]||t.key;if(n!=="Unidentified")return n}return t.type==="keypress"?(t=Ol(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?dy[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Zc,charCode:function(t){return t.type==="keypress"?Ol(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Ol(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),_y=Fn(gy),vy=O({},Il,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),dm=Fn(vy),xy=O({},La,{submitter:0}),yy=Fn(xy),Sy=O({},So,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Zc}),My=Fn(Sy),Ey=O({},La,{propertyName:0,elapsedTime:0,pseudoElement:0}),Ty=Fn(Ey),by=O({},Il,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),Ay=Fn(by),Ry=O({},La,{newState:0,oldState:0,source:0}),Cy=Fn(Ry),wy=[9,13,27,32],Kc=oa&&"CompositionEvent"in window,Eo=null;oa&&"documentMode"in document&&(Eo=document.documentMode);var Dy=oa&&"TextEvent"in window&&!Eo,pm=oa&&(!Kc||Eo&&8<Eo&&11>=Eo),mm=" ",gm=!1;function _m(t,n){switch(t){case"keyup":return wy.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function vm(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var rs=!1;function Uy(t,n){switch(t){case"compositionend":return vm(n);case"keypress":return n.which!==32?null:(gm=!0,mm);case"textInput":return t=n.data,t===mm&&gm?null:t;default:return null}}function Ny(t,n){if(rs)return t==="compositionend"||!Kc&&_m(t,n)?(t=um(),Ll=qc=Na=null,rs=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return pm&&n.locale!=="ko"?null:n.data;default:return null}}var Ly={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function xm(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n==="input"?!!Ly[t.type]:n==="textarea"}function ym(t,n,a,s){is?as?as.push(s):as=[s]:is=s,n=Bu(n,"onChange"),0<n.length&&(a=new Pl("onChange","change",null,a,s),t.push({event:a,listeners:n}))}var To=null,bo=null;function Oy(t){o_(t,0)}function Bl(t){var n=vn(t);if(em(n))return t}function Sm(t,n){if(t==="change")return n}var Mm=!1;if(oa){var Qc;if(oa){var Jc="oninput"in document;if(!Jc){var Em=document.createElement("div");Em.setAttribute("oninput","return;"),Jc=typeof Em.oninput=="function"}Qc=Jc}else Qc=!1;Mm=Qc&&(!document.documentMode||9<document.documentMode)}function Tm(){To&&(To.detachEvent("onpropertychange",bm),bo=To=null)}function bm(t){if(t.propertyName==="value"&&Bl(bo)){var n=[];ym(n,bo,t,Vc(t)),lm(Oy,n)}}function zy(t,n,a){t==="focusin"?(Tm(),To=n,bo=a,To.attachEvent("onpropertychange",bm)):t==="focusout"&&Tm()}function Py(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Bl(bo)}function Iy(t,n){if(t==="click")return Bl(n)}function By(t,n){if(t==="input"||t==="change")return Bl(n)}function Fy(t,n){return t===n&&(t!==0||1/t===1/n)||t!==t&&n!==n}var ni=typeof Object.is=="function"?Object.is:Fy;function Ao(t,n){if(ni(t,n))return!0;if(typeof t!="object"||t===null||typeof n!="object"||n===null)return!1;var a=Object.keys(t),s=Object.keys(n);if(a.length!==s.length)return!1;for(s=0;s<a.length;s++){var u=a[s];if(!Pt.call(n,u)||!ni(t[u],n[u]))return!1}return!0}function $c(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function Am(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function Rm(t,n){var a=Am(t);t=0;for(var s;a;){if(a.nodeType===3){if(s=t+a.textContent.length,t<=n&&s>=n)return{node:a,offset:n-t};t=s}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=Am(a)}}function Cm(t,n){return t&&n?t===n?!0:t&&t.nodeType===3?!1:n&&n.nodeType===3?Cm(t,n.parentNode):"contains"in t?t.contains(n):t.compareDocumentPosition?!!(t.compareDocumentPosition(n)&16):!1:!1}function wm(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var n=$c(t.document);n instanceof t.HTMLIFrameElement;){try{var a=typeof n.contentWindow.location.href=="string"}catch{a=!1}if(a)t=n.contentWindow;else break;n=$c(t.document)}return n}function tf(t){var n=t&&t.nodeName&&t.nodeName.toLowerCase();return n&&(n==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||n==="textarea"||t.contentEditable==="true")}var Hy=oa&&"documentMode"in document&&11>=document.documentMode,ss=null,ef=null,Ro=null,nf=!1;function Dm(t,n,a){var s=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;nf||ss==null||ss!==$c(s)||(s=ss,"selectionStart"in s&&tf(s)?s={start:s.selectionStart,end:s.selectionEnd}:(s=(s.ownerDocument&&s.ownerDocument.defaultView||window).getSelection(),s={anchorNode:s.anchorNode,anchorOffset:s.anchorOffset,focusNode:s.focusNode,focusOffset:s.focusOffset}),Ro&&Ao(Ro,s)||(Ro=s,s=Bu(ef,"onSelect"),0<s.length&&(n=new Pl("onSelect","select",null,n,a),t.push({event:n,listeners:s}),n.target=ss)))}function yr(t,n){var a={};return a[t.toLowerCase()]=n.toLowerCase(),a["Webkit"+t]="webkit"+n,a["Moz"+t]="moz"+n,a}var os={animationend:yr("Animation","AnimationEnd"),animationiteration:yr("Animation","AnimationIteration"),animationstart:yr("Animation","AnimationStart"),transitionrun:yr("Transition","TransitionRun"),transitionstart:yr("Transition","TransitionStart"),transitioncancel:yr("Transition","TransitionCancel"),transitionend:yr("Transition","TransitionEnd")},af={},Um={};oa&&(Um=document.createElement("div").style,"AnimationEvent"in window||(delete os.animationend.animation,delete os.animationiteration.animation,delete os.animationstart.animation),"TransitionEvent"in window||delete os.transitionend.transition);function Sr(t){if(af[t])return af[t];if(!os[t])return t;var n=os[t],a;for(a in n)if(n.hasOwnProperty(a)&&a in Um)return af[t]=n[a];return t}var Nm=Sr("animationend"),Lm=Sr("animationiteration"),Om=Sr("animationstart"),Gy=Sr("transitionrun"),Vy=Sr("transitionstart"),ky=Sr("transitioncancel"),zm=Sr("transitionend"),Pm=new Map,rf="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");rf.push("scrollEnd");function Ti(t,n){Pm.set(t,n),fn(n,[t])}var Xy=0;function la(t,n){if(t.name!=null&&t.name!=="auto")return t.name;if(n.autoName!==null)return n.autoName;t=Ci.identifierPrefix;var a=Xy++;return t="_"+t+"t_"+a.toString(32)+"_",n.autoName=t}function Im(t){if(t==null||typeof t=="string")return t;var n=null,a=Rs;if(a!==null)for(var s=0;s<a.length;s++){var u=t[a[s]];if(u!=null){if(u==="none")return"none";n=n==null?u:n+(" "+u)}}return n??t.default}function ua(t,n){return t=Im(t),n=Im(n),n==null?t==="auto"?null:t:n==="auto"?null:n}var Fl=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},di=[],ls=0,sf=0;function Hl(){for(var t=ls,n=sf=ls=0;n<t;){var a=di[n];di[n++]=null;var s=di[n];di[n++]=null;var u=di[n];di[n++]=null;var f=di[n];if(di[n++]=null,s!==null&&u!==null){var v=s.pending;v===null?u.next=u:(u.next=v.next,v.next=u),s.pending=u}f!==0&&Bm(a,u,f)}}function Gl(t,n,a,s){di[ls++]=t,di[ls++]=n,di[ls++]=a,di[ls++]=s,sf|=s,t.lanes|=s,t=t.alternate,t!==null&&(t.lanes|=s)}function of(t,n,a,s){return Gl(t,n,a,s),Vl(t)}function Mr(t,n){return Gl(t,null,null,n),Vl(t)}function Bm(t,n,a){t.lanes|=a;var s=t.alternate;s!==null&&(s.lanes|=a);for(var u=!1,f=t.return;f!==null;)f.childLanes|=a,s=f.alternate,s!==null&&(s.childLanes|=a),f.tag===22&&(t=f.stateNode,t===null||t._visibility&1||(u=!0)),t=f,f=f.return;return t.tag===3?(f=t.stateNode,u&&n!==null&&(u=31-Ln(a),t=f.hiddenUpdates,s=t[u],s===null?t[u]=[n]:s.push(n),n.lane=a|536870912),f):null}function Vl(t){if(50<Zo)throw Zo=0,Uu=null,Error(r(185));for(var n=t.return;n!==null;)t=n,n=t.return;return t.tag===3?t.stateNode:null}var us={};function qy(t,n,a,s){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=s,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function jn(t,n,a,s){return new qy(t,n,a,s)}function lf(t){return t=t.prototype,!(!t||!t.isReactComponent)}function ca(t,n){var a=t.alternate;return a===null?(a=jn(t.tag,n,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=n,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&1206910976,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,n=t.dependencies,a.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function Fm(t,n){t.flags&=1206910978;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=n,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,n=a.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),t}function kl(t,n,a,s,u,f){var v=0;if(s=t,typeof s=="function")lf(s)&&(v=1);else if(typeof s=="string")v=xM(t,a,Mt.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(s){case Gt:return t=jn(31,a,n,u),t.elementType=Gt,t.lanes=f,t;case V:return Er(a.children,u,f,n);case $:v=8,u|=24;break;case ft:return t=jn(12,a,n,u|2),t.elementType=ft,t.lanes=f,t;case ot:return t=jn(13,a,n,u),t.elementType=ot,t.lanes=f,t;case Q:return t=jn(19,a,n,u),t.elementType=Q,t.lanes=f,t;case ne:case P:return t=u|32,t=jn(30,a,n,t),t.elementType=P,t.lanes=f,t.stateNode={autoName:null,paired:null,clones:null,ref:null},t;default:if(typeof s=="object"&&s!==null)switch(s.$$typeof){case lt:v=10;break t;case gt:v=9;break t;case j:v=11;break t;case St:v=14;break t;case xt:v=16,s=null;break t}v=29,a=Error(r(130,t===null?"null":typeof t,"")),s=null}return n=jn(v,a,n,u),n.elementType=t,n.type=s,n.lanes=f,n}function Er(t,n,a,s){return t=jn(7,t,s,n),t.lanes=a,t}function uf(t,n,a){return t=jn(6,t,null,n),t.lanes=a,t}function Hm(t){var n=jn(18,null,null,0);return n.stateNode=t,n}function cf(t,n,a){return n=jn(4,t.children!==null?t.children:[],t.key,n),n.lanes=a,n.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},n}var Gm=new WeakMap;function pi(t,n){if(typeof t=="object"&&t!==null){var a=Gm.get(t);return a!==void 0?a:(n={value:t,source:n,stack:Ct(n)},Gm.set(t,n),n)}return{value:t,source:n,stack:Ct(n)}}var cs=[],fs=0,Xl=null,Co=0,mi=[],gi=0,Oa=null,Hi=1,Gi="";function fa(t,n){cs[fs++]=Co,cs[fs++]=Xl,Xl=t,Co=n}function Vm(t,n,a){mi[gi++]=Hi,mi[gi++]=Gi,mi[gi++]=Oa,Oa=t;var s=Hi;t=Gi;var u=32-Ln(s)-1;s&=~(1<<u),a+=1;var f=32-Ln(n)+u;if(30<f){var v=u-u%5;f=(s&(1<<v)-1).toString(32),s>>=v,u-=v,Hi=1<<32-Ln(n)+u|a<<u|s,Gi=f+t}else Hi=1<<f|a<<u|s,Gi=t}function ql(t){t.return!==null&&(fa(t,1),Vm(t,1,0))}function ff(t){for(;t===Xl;)Xl=cs[--fs],cs[fs]=null,Co=cs[--fs],cs[fs]=null;for(;t===Oa;)Oa=mi[--gi],mi[gi]=null,Gi=mi[--gi],mi[gi]=null,Hi=mi[--gi],mi[gi]=null}function km(t,n){mi[gi++]=Hi,mi[gi++]=Gi,mi[gi++]=Oa,Hi=n.id,Gi=n.overflow,Oa=t}var Mn=null,Ke=null,xe=!1,za=null,_i=!1,hf=Error(r(519));function Pa(t){var n=Error(r(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw wo(pi(n,t)),hf}function Xm(t){var n=t.stateNode,a=t.type,s=t.memoizedProps;switch(n[Nt]=t,n[Zt]=s,a){case"dialog":Ee("cancel",n),Ee("close",n);break;case"iframe":case"object":case"embed":Ee("load",n);break;case"video":case"audio":for(a=0;a<Qo.length;a++)Ee(Qo[a],n);break;case"source":Ee("error",n);break;case"img":case"image":case"link":Ee("error",n),Ee("load",n);break;case"details":Ee("toggle",n);break;case"input":Ee("invalid",n),nm(n,s.value,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name,!0);break;case"select":Ee("invalid",n);break;case"textarea":Ee("invalid",n),am(n,s.value,s.defaultValue,s.children)}a=s.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||n.textContent===""+a||s.suppressHydrationWarning===!0||f_(n.textContent,a)?(s.popover!=null&&(Ee("beforetoggle",n),Ee("toggle",n)),s.onScroll!=null&&Ee("scroll",n),s.onScrollEnd!=null&&Ee("scrollend",n),s.onClick!=null&&(n.onclick=Fi),n=!0):n=!1,n||Pa(t,!0)}function Yl(t){for(Mn=t.return;Mn;)switch(Mn.tag){case 5:case 31:case 13:_i=!1;return;case 27:case 3:_i=!0;return;default:Mn=Mn.return}}function hs(t){if(t!==Mn)return!1;if(!xe)return Yl(t),xe=!0,!1;var n=t.tag,a;if((a=n!==3&&n!==27)&&((a=n===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||Vh(t.type,t.memoizedProps)),a=!a),a&&Ke&&Pa(t),Yl(t),n===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(r(317));Ke=D_(t)}else if(n===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(r(317));Ke=D_(t)}else n===27?(n=Ke,Ja(t.type)?(t=Qh,Qh=null,Ke=t):Ke=n):Ke=Mn?xi(t.stateNode.nextSibling):null;return!0}function Tr(){Ke=Mn=null,xe=!1}function df(){var t=za;return t!==null&&(Kn===null?Kn=t:Kn.push.apply(Kn,t),za=null),t}function wo(t){za===null?za=[t]:za.push(t)}var pf=Wt(null),br=null,ha=null;function Ia(t,n,a){_t(pf,n._currentValue),n._currentValue=a}function da(t){t._currentValue=pf.current,G(pf)}function jl(t,n,a){for(;t!==null;){var s=t.alternate;if((t.childLanes&n)!==n?(t.childLanes|=n,s!==null&&(s.childLanes|=n)):s!==null&&(s.childLanes&n)!==n&&(s.childLanes|=n),t===a)break;t=t.return}}function mf(t,n,a,s){var u=t.child;for(u!==null&&(u.return=t);u!==null;){var f=u.dependencies;if(f!==null){var v=u.child;f=f.firstContext;t:for(;f!==null;){var T=f;f=u;for(var z=0;z<n.length;z++)if(T.context===n[z]){f.lanes|=a,T=f.alternate,T!==null&&(T.lanes|=a),jl(f.return,a,t),s||(v=null);break t}f=T.next}}else if(u.tag===18){if(v=u.return,v===null)throw Error(r(341));v.lanes|=a,f=v.alternate,f!==null&&(f.lanes|=a),jl(v,a,t),v=null}else u.tag===13&&u.memoizedState!==null&&u.memoizedState.dehydrated===null?(u.lanes|=a,v=u.alternate,v!==null&&(v.lanes|=a),jl(u.return,a,t),v=u.child,v=v!==null?v.sibling:null):v=u.child;if(v!==null)v.return=u;else for(v=u;v!==null;){if(v===t){v=null;break}if(u=v.sibling,u!==null){u.return=v.return,v=u;break}v=v.return}u=v}}function Ar(t,n,a,s){t=null;for(var u=n,f=!1;u!==null;){if(!f){if((u.flags&524288)!==0)f=!0;else if((u.flags&262144)!==0)break}if(u.tag===10){var v=u.alternate;if(v===null)throw Error(r(387));if(v=v.memoizedProps,v!==null){var T=u.type;ni(u.pendingProps.value,v.value)||(t!==null?t.push(T):t=[T])}}else if(u===kt.current){if(v=u.alternate,v===null)throw Error(r(387));v.memoizedState.memoizedState!==u.memoizedState.memoizedState&&(t!==null?t.push(Is):t=[Is])}u=u.return}return t!==null&&mf(n,t,a,s),n.flags|=262144,t!==null}function Wl(t){for(t=t.firstContext;t!==null;){if(!ni(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Rr(t){br=t,ha=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Rn(t){return qm(br,t)}function Zl(t,n){return br===null&&Rr(t),qm(t,n)}function qm(t,n){var a=n._currentValue;if(n={context:n,memoizedValue:a,next:null},ha===null){if(t===null)throw Error(r(308));ha=n,t.dependencies={lanes:0,firstContext:n},t.flags|=524288}else ha=ha.next=n;return a}var Yy=typeof AbortController<"u"?AbortController:function(){var t=[],n=this.signal={aborted:!1,addEventListener:function(a,s){t.push(s)}};this.abort=function(){n.aborted=!0,t.forEach(function(a){return a()})}},jy=o.unstable_scheduleCallback,Wy=o.unstable_NormalPriority,hn={$$typeof:lt,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function gf(){return{controller:new Yy,data:new Map,refCount:0}}function Do(t){t.refCount--,t.refCount===0&&jy(Wy,function(){t.controller.abort()})}function Ym(t,n){if((t.pendingLanes&4194048)!==0){var a=t.transitionTypes;for(a===null&&(a=t.transitionTypes=[]),t=0;t<n.length;t++){var s=n[t];a.indexOf(s)===-1&&a.push(s)}}}var Uo=null;function Zy(t){var n=t.transitionTypes;return t.transitionTypes=null,n}var No=null,_f=0,Cr=0,ds=null;function Ky(t,n){if(No===null){var a=No=[];_f=0,Cr=Lh(),ds={status:"pending",value:void 0,then:function(s){a.push(s)}}}return _f++,n.then(jm,jm),n}function jm(){if(--_f===0&&(Uo=null,No!==null)){ds!==null&&(ds.status="fulfilled");var t=No;No=null,Cr=0,ds=null;for(var n=0;n<t.length;n++)(0,t[n])()}}function Qy(t,n){var a=[],s={status:"pending",value:null,reason:null,then:function(u){a.push(u)}};return t.then(function(){s.status="fulfilled",s.value=n;for(var u=0;u<a.length;u++)(0,a[u])(n)},function(u){for(s.status="rejected",s.reason=u,u=0;u<a.length;u++)(0,a[u])(void 0)}),s}var Wm=Tt.S;Tt.S=function(t,n){if(H0=q(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&Ky(t,n),Uo!==null)for(var a=Us;a!==null;)Ym(a,Uo),a=a.next;if(a=t.types,a!==null){for(var s=Us;s!==null;)Ym(s,a),s=s.next;if(Cr!==0){s=Uo,s===null&&(s=Uo=[]);for(var u=0;u<a.length;u++){var f=a[u];s.indexOf(f)===-1&&s.push(f)}}}Wm!==null&&Wm(t,n)};var wr=Wt(null);function vf(){var t=wr.current;return t!==null?t:We.pooledCache}function Kl(t,n){n===null?_t(wr,wr.current):_t(wr,n.pool)}function Zm(){var t=vf();return t===null?null:{parent:hn._currentValue,pool:t}}var ps=Error(r(460)),xf=Error(r(474)),Ql=Error(r(542)),Jl={then:function(){}};function Km(t){return t=t.status,t==="fulfilled"||t==="rejected"}function Qm(t,n,a){switch(a=t[a],a===void 0?t.push(n):a!==n&&(n.then(Fi,Fi),n=a),n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,$m(t),t===void 0&&!("reason"in n)?Error(r(600)):t;default:if(typeof n.status=="string")n.then(Fi,Fi);else{if(t=We,t!==null&&100<t.shellSuspendCounter)throw Error(r(482));t=n,t.status="pending",t.then(function(s){if(n.status==="pending"){var u=n;u.status="fulfilled",u.value=s}},function(s){if(n.status==="pending"){var u=n;u.status="rejected",u.reason=s}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw t=n.reason,$m(t),t}throw Ur=n,ps}}function Dr(t){try{var n=t._init;return n(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(Ur=a,ps):a}}var Ur=null;function Jm(){if(Ur===null)throw Error(r(459));var t=Ur;return Ur=null,t}function $m(t){if(t===ps||t===Ql)throw Error(r(483))}var ms=null,Lo=0;function $l(t){var n=Lo;return Lo+=1,ms===null&&(ms=[]),Qm(ms,t,n)}function Ba(t,n){n=n.props.ref,t.ref=n!==void 0?n:null}function tu(t,n){throw n.$$typeof===H?Error(r(525)):(t=Object.prototype.toString.call(n),Error(r(31,t==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":t)))}function tg(t){function n(Z,k){if(t){var it=Z.deletions;it===null?(Z.deletions=[k],Z.flags|=16):it.push(k)}}function a(Z,k){if(!t)return null;for(;k!==null;)n(Z,k),k=k.sibling;return null}function s(Z){for(var k=new Map;Z!==null;)Z.key===null?k.set(Z.index,Z):k.set(Z.key,Z),Z=Z.sibling;return k}function u(Z,k){return Z=ca(Z,k),Z.index=0,Z.sibling=null,Z}function f(Z,k,it){return Z.index=it,t?(it=Z.alternate,it!==null?(it=it.index,it<k?(Z.flags|=2,k):it):(Z.flags|=134217730,k)):(Z.flags|=1048576,k)}function v(Z){return t&&Z.alternate===null&&(Z.flags|=134217730),Z}function T(Z,k,it,mt){return k===null||k.tag!==6?(k=uf(it,Z.mode,mt),k.return=Z,k):(k=u(k,it),k.return=Z,k)}function z(Z,k,it,mt){var Xt=it.type;return Xt===V?(Z=st(Z,k,it.props.children,mt,it.key),Ba(Z,it),Z):k!==null&&(k.elementType===Xt||typeof Xt=="object"&&Xt!==null&&Xt.$$typeof===xt&&Dr(Xt)===k.type)?(k=u(k,it.props),Ba(k,it),k.return=Z,k):(k=kl(it.type,it.key,it.props,null,Z.mode,mt),Ba(k,it),k.return=Z,k)}function K(Z,k,it,mt){return k===null||k.tag!==4||k.stateNode.containerInfo!==it.containerInfo||k.stateNode.implementation!==it.implementation?(k=cf(it,Z.mode,mt),k.return=Z,k):(k=u(k,it.children||[]),k.return=Z,k)}function st(Z,k,it,mt,Xt){return k===null||k.tag!==7?(k=Er(it,Z.mode,mt,Xt),k.return=Z,k):(k=u(k,it),k.return=Z,k)}function vt(Z,k,it){if(typeof k=="string"&&k!==""||typeof k=="number"||typeof k=="bigint")return k=uf(""+k,Z.mode,it),k.return=Z,k;if(typeof k=="object"&&k!==null){switch(k.$$typeof){case w:return it=kl(k.type,k.key,k.props,null,Z.mode,it),Ba(it,k),it.return=Z,it;case R:return k=cf(k,Z.mode,it),k.return=Z,k;case xt:return k=Dr(k),vt(Z,k,it)}if(Dt(k)||rt(k))return k=Er(k,Z.mode,it,null),k.return=Z,k;if(typeof k.then=="function")return vt(Z,$l(k),it);if(k.$$typeof===lt)return vt(Z,Zl(Z,k),it);tu(Z,k)}return null}function W(Z,k,it,mt){var Xt=k!==null?k.key:null;if(typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint")return Xt!==null?null:T(Z,k,""+it,mt);if(typeof it=="object"&&it!==null){switch(it.$$typeof){case w:return it.key===Xt?z(Z,k,it,mt):null;case R:return it.key===Xt?K(Z,k,it,mt):null;case xt:return it=Dr(it),W(Z,k,it,mt)}if(Dt(it)||rt(it))return Xt!==null?null:st(Z,k,it,mt,null);if(typeof it.then=="function")return W(Z,k,$l(it),mt);if(it.$$typeof===lt)return W(Z,k,Zl(Z,it),mt);tu(Z,it)}return null}function at(Z,k,it,mt,Xt){if(typeof mt=="string"&&mt!==""||typeof mt=="number"||typeof mt=="bigint")return Z=Z.get(it)||null,T(k,Z,""+mt,Xt);if(typeof mt=="object"&&mt!==null){switch(mt.$$typeof){case w:return Z=Z.get(mt.key===null?it:mt.key)||null,z(k,Z,mt,Xt);case R:return Z=Z.get(mt.key===null?it:mt.key)||null,K(k,Z,mt,Xt);case xt:return mt=Dr(mt),at(Z,k,it,mt,Xt)}if(Dt(mt)||rt(mt))return Z=Z.get(it)||null,st(k,Z,mt,Xt,null);if(typeof mt.then=="function")return at(Z,k,it,$l(mt),Xt);if(mt.$$typeof===lt)return at(Z,k,it,Zl(k,mt),Xt);tu(k,mt)}return null}function zt(Z,k,it,mt){for(var Xt=null,Re=null,ie=k,ce=k=0,mn=null;ie!==null&&ce<it.length;ce++){ie.index>ce?(mn=ie,ie=null):mn=ie.sibling;var De=W(Z,ie,it[ce],mt);if(De===null){ie===null&&(ie=mn);break}t&&ie&&De.alternate===null&&n(Z,ie),k=f(De,k,ce),Re===null?Xt=De:Re.sibling=De,Re=De,ie=mn}if(ce===it.length)return a(Z,ie),xe&&fa(Z,ce),Xt;if(ie===null){for(;ce<it.length;ce++)ie=vt(Z,it[ce],mt),ie!==null&&(k=f(ie,k,ce),Re===null?Xt=ie:Re.sibling=ie,Re=ie);return xe&&fa(Z,ce),Xt}for(ie=s(ie);ce<it.length;ce++)mn=at(ie,Z,ce,it[ce],mt),mn!==null&&(t&&(De=mn.alternate,De!==null&&ie.delete(De.key===null?ce:De.key)),k=f(mn,k,ce),Re===null?Xt=mn:Re.sibling=mn,Re=mn);return t&&ie.forEach(function(ir){return n(Z,ir)}),xe&&fa(Z,ce),Xt}function Kt(Z,k,it,mt){if(it==null)throw Error(r(151));for(var Xt=null,Re=null,ie=k,ce=k=0,mn=null,De=it.next();ie!==null&&!De.done;ce++,De=it.next()){ie.index>ce?(mn=ie,ie=null):mn=ie.sibling;var ir=W(Z,ie,De.value,mt);if(ir===null){ie===null&&(ie=mn);break}t&&ie&&ir.alternate===null&&n(Z,ie),k=f(ir,k,ce),Re===null?Xt=ir:Re.sibling=ir,Re=ir,ie=mn}if(De.done)return a(Z,ie),xe&&fa(Z,ce),Xt;if(ie===null){for(;!De.done;ce++,De=it.next())De=vt(Z,De.value,mt),De!==null&&(k=f(De,k,ce),Re===null?Xt=De:Re.sibling=De,Re=De);return xe&&fa(Z,ce),Xt}for(ie=s(ie);!De.done;ce++,De=it.next())De=at(ie,Z,ce,De.value,mt),De!==null&&(t&&(mn=De.alternate,mn!==null&&ie.delete(mn.key===null?ce:mn.key)),k=f(De,k,ce),Re===null?Xt=De:Re.sibling=De,Re=De);return t&&ie.forEach(function(UM){return n(Z,UM)}),xe&&fa(Z,ce),Xt}function me(Z,k,it,mt){if(typeof it=="object"&&it!==null&&it.type===V&&it.key===null&&it.props.ref===void 0&&(it=it.props.children),typeof it=="object"&&it!==null){switch(it.$$typeof){case w:t:{for(var Xt=it.key;k!==null;){if(k.key===Xt){if(Xt=it.type,Xt===V){if(k.tag===7){a(Z,k.sibling),mt=u(k,it.props.children),Ba(mt,it),mt.return=Z,Z=mt;break t}}else if(k.elementType===Xt||typeof Xt=="object"&&Xt!==null&&Xt.$$typeof===xt&&Dr(Xt)===k.type){a(Z,k.sibling),mt=u(k,it.props),Ba(mt,it),mt.return=Z,Z=mt;break t}a(Z,k);break}else n(Z,k);k=k.sibling}it.type===V?(mt=Er(it.props.children,Z.mode,mt,it.key),Ba(mt,it),mt.return=Z,Z=mt):(mt=kl(it.type,it.key,it.props,null,Z.mode,mt),Ba(mt,it),mt.return=Z,Z=mt)}return v(Z);case R:t:{for(Xt=it.key;k!==null;){if(k.key===Xt)if(k.tag===4&&k.stateNode.containerInfo===it.containerInfo&&k.stateNode.implementation===it.implementation){a(Z,k.sibling),mt=u(k,it.children||[]),mt.return=Z,Z=mt;break t}else{a(Z,k);break}else n(Z,k);k=k.sibling}mt=cf(it,Z.mode,mt),mt.return=Z,Z=mt}return v(Z);case xt:return it=Dr(it),me(Z,k,it,mt)}if(Dt(it))return zt(Z,k,it,mt);if(rt(it)){if(Xt=rt(it),typeof Xt!="function")throw Error(r(150));return it=Xt.call(it),Kt(Z,k,it,mt)}if(typeof it.then=="function")return me(Z,k,$l(it),mt);if(it.$$typeof===lt)return me(Z,k,Zl(Z,it),mt);tu(Z,it)}return typeof it=="string"&&it!==""||typeof it=="number"||typeof it=="bigint"?(it=""+it,k!==null&&k.tag===6?(a(Z,k.sibling),mt=u(k,it),mt.return=Z,Z=mt):(a(Z,k),mt=uf(it,Z.mode,mt),mt.return=Z,Z=mt),v(Z)):a(Z,k)}return function(Z,k,it,mt){try{Lo=0;var Xt=me(Z,k,it,mt);return ms=null,Xt}catch(ie){if(ie===ps||ie===Ql)throw ie;var Re=jn(29,ie,null,Z.mode);return Re.lanes=mt,Re.return=Z,Re}}}var Nr=tg(!0),eg=tg(!1),Fa=!1;function yf(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Sf(t,n){t=t.updateQueue,n.updateQueue===t&&(n.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function Ha(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function Ga(t,n,a){var s=t.updateQueue;if(s===null)return null;if(s=s.shared,(Be&2)!==0){var u=s.pending;return u===null?n.next=n:(n.next=u.next,u.next=n),s.pending=n,n=Vl(t),Bm(t,null,a),n}return Gl(t,s,n,a),Vl(t)}function Oo(t,n,a){if(n=n.updateQueue,n!==null&&(n=n.shared,(a&4194048)!==0)){var s=n.lanes;s&=t.pendingLanes,a|=s,n.lanes=a,J(t,a)}}function Mf(t,n){var a=t.updateQueue,s=t.alternate;if(s!==null&&(s=s.updateQueue,a===s)){var u=null,f=null;if(a=a.firstBaseUpdate,a!==null){do{var v={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};f===null?u=f=v:f=f.next=v,a=a.next}while(a!==null);f===null?u=f=n:f=f.next=n}else u=f=n;a={baseState:s.baseState,firstBaseUpdate:u,lastBaseUpdate:f,shared:s.shared,callbacks:s.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=n:t.next=n,a.lastBaseUpdate=n}var Ef=!1;function zo(){if(Ef){var t=ds;if(t!==null)throw t}}function Po(t,n,a,s){Ef=!1;var u=t.updateQueue;Fa=!1;var f=u.firstBaseUpdate,v=u.lastBaseUpdate,T=u.shared.pending;if(T!==null){u.shared.pending=null;var z=T,K=z.next;z.next=null,v===null?f=K:v.next=K,v=z;var st=t.alternate;st!==null&&(st=st.updateQueue,T=st.lastBaseUpdate,T!==v&&(T===null?st.firstBaseUpdate=K:T.next=K,st.lastBaseUpdate=z))}if(f!==null){var vt=u.baseState;v=0,st=K=z=null,T=f;do{var W=T.lane&-536870913,at=W!==T.lane;if(at?(Ae&W)===W:(s&W)===W){W!==0&&W===Cr&&(Ef=!0),st!==null&&(st=st.next={lane:0,tag:T.tag,payload:T.payload,callback:null,next:null});t:{var zt=t,Kt=T;W=n;var me=a;switch(Kt.tag){case 1:if(zt=Kt.payload,typeof zt=="function"){vt=zt.call(me,vt,W);break t}vt=zt;break t;case 3:zt.flags=zt.flags&-65537|128;case 0:if(zt=Kt.payload,W=typeof zt=="function"?zt.call(me,vt,W):zt,W==null)break t;vt=O({},vt,W);break t;case 2:Fa=!0}}W=T.callback,W!==null&&(t.flags|=64,at&&(t.flags|=8192),at=u.callbacks,at===null?u.callbacks=[W]:at.push(W))}else at={lane:W,tag:T.tag,payload:T.payload,callback:T.callback,next:null},st===null?(K=st=at,z=vt):st=st.next=at,v|=W;if(T=T.next,T===null){if(T=u.shared.pending,T===null)break;at=T,T=at.next,at.next=null,u.lastBaseUpdate=at,u.shared.pending=null}}while(!0);st===null&&(z=vt),u.baseState=z,u.firstBaseUpdate=K,u.lastBaseUpdate=st,f===null&&(u.shared.lanes=0),Wa|=v,t.lanes=v,t.memoizedState=vt}}function ng(t,n){if(typeof t!="function")throw Error(r(191,t));t.call(n)}function ig(t,n){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)ng(a[t],n)}var Va=Wt(null),eu=Wt(0);function ag(t,n){t=va,_t(eu,t),_t(Va,n),va=t|n.baseLanes}function Tf(){_t(eu,va),_t(Va,Va.current)}function bf(){va=eu.current,G(Va),G(eu)}var Cn=Wt(null),zn=null;function ka(t){var n=t.alternate;_t(wn,wn.current&1),_t(Cn,t),zn===null&&(n===null||Va.current!==null||n.memoizedState!==null)&&(zn=t)}function Af(t){_t(wn,wn.current),_t(Cn,t),zn===null&&(zn=t)}function rg(t){t.tag===22?(_t(wn,wn.current),_t(Cn,t),zn===null&&(zn=t)):Xa()}function Xa(){_t(wn,wn.current),_t(Cn,Cn.current)}function ii(t){G(Cn),zn===t&&(zn=null),G(wn)}var wn=Wt(0);function Io(t,n){_t(Cn,Cn.current),_t(wn,n)}function Rf(t){G(wn),G(Cn),zn===t&&(zn=null)}function nu(t){for(var n=t;n!==null;){if(n.tag===13){var a=n.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||Zh(a)||Kh(a)))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!=="independent"){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var pa=0,pe=null,Ye=null,dn=null,iu=!1,gs=!1,Lr=!1,au=0,Bo=0,_s=null,Jy=0;function sn(){throw Error(r(321))}function Cf(t,n){if(n===null)return!1;for(var a=0;a<n.length&&a<t.length;a++)if(!ni(t[a],n[a]))return!1;return!0}function wf(t,n,a,s,u,f){return pa=f,pe=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Tt.H=t===null||t.memoizedState===null?Vg:kg,Lr=!1,f=a(s,u),Lr=!1,gs&&(f=og(n,a,s,u)),sg(t),f}function sg(t){Tt.H=fu;var n=Ye!==null&&Ye.next!==null;if(pa=0,dn=Ye=pe=null,iu=!1,Bo=0,_s=null,n)throw Error(r(300));t===null||pn||(t=t.dependencies,t!==null&&Wl(t)&&(pn=!0))}function og(t,n,a,s){pe=t;var u=0;do{if(gs&&(_s=null),Bo=0,gs=!1,25<=u)throw Error(r(301));if(u+=1,dn=Ye=null,t.updateQueue!=null){var f=t.updateQueue;f.lastEffect=null,f.events=null,f.stores=null,f.memoCache!=null&&(f.memoCache.index=0)}Tt.H=sS,f=n(a,s)}while(gs);return f}function $y(){var t=Tt.H,n=t.useState()[0];return n=typeof n.then=="function"?Fo(n):n,t=t.useState()[0],(Ye!==null?Ye.memoizedState:null)!==t&&(pe.flags|=1024),n}function Df(){var t=au!==0;return au=0,t}function Uf(t,n,a){n.updateQueue=t.updateQueue,n.flags&=-2053,t.lanes&=~a}function Nf(t){if(iu){for(t=t.memoizedState;t!==null;){var n=t.queue;n!==null&&(n.pending=null),t=t.next}iu=!1}pa=0,dn=Ye=pe=null,gs=!1,Bo=au=0,_s=null}function Hn(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return dn===null?pe.memoizedState=dn=t:dn=dn.next=t,dn}function un(){if(Ye===null){var t=pe.alternate;t=t!==null?t.memoizedState:null}else t=Ye.next;var n=dn===null?pe.memoizedState:dn.next;if(n!==null)dn=n,Ye=t;else{if(t===null)throw pe.alternate===null?Error(r(467)):Error(r(310));Ye=t,t={memoizedState:Ye.memoizedState,baseState:Ye.baseState,baseQueue:Ye.baseQueue,queue:Ye.queue,next:null},dn===null?pe.memoizedState=dn=t:dn=dn.next=t}return dn}function ru(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Fo(t){var n=Bo;return Bo+=1,_s===null&&(_s=[]),t=Qm(_s,t,n),n=pe,(dn===null?n.memoizedState:dn.next)===null&&(n=n.alternate,Tt.H=n===null||n.memoizedState===null?Vg:kg),t}function su(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return Fo(t);if(t.$$typeof===ht)return;if(t.$$typeof===lt)return Rn(t)}throw Error(r(438,String(t)))}function Lf(t){var n=null,a=pe.updateQueue;if(a!==null&&(n=a.memoCache),n==null){var s=pe.alternate;s!==null&&(s=s.updateQueue,s!==null&&(s=s.memoCache,s!=null&&(n={data:s.data.map(function(u){return u.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),a===null&&(a=ru(),pe.updateQueue=a),a.memoCache=n,a=n.data[n.index],a===void 0)for(a=n.data[n.index]=Array(t),s=0;s<t;s++)a[s]=ye;return n.index++,a}function ma(t,n){return typeof n=="function"?n(t):n}function ou(t){var n=un();return Of(n,Ye,t)}function Of(t,n,a){var s=t.queue;if(s===null)throw Error(r(311));s.lastRenderedReducer=a;var u=t.baseQueue,f=s.pending;if(f!==null){if(u!==null){var v=u.next;u.next=f.next,f.next=v}n.baseQueue=u=f,s.pending=null}if(f=t.baseState,u===null)t.memoizedState=f;else{n=u.next;var T=v=null,z=null,K=n,st=!1;do{var vt=K.lane&-536870913;if(vt!==K.lane?(Ae&vt)===vt:(pa&vt)===vt){var W=K.revertLane;if(W===0)z!==null&&(z=z.next={lane:0,revertLane:0,gesture:null,action:K.action,hasEagerState:K.hasEagerState,eagerState:K.eagerState,next:null}),vt===Cr&&(st=!0);else if((pa&W)===W){K=K.next,W===Cr&&(st=!0);continue}else vt={lane:0,revertLane:K.revertLane,gesture:null,action:K.action,hasEagerState:K.hasEagerState,eagerState:K.eagerState,next:null},z===null?(T=z=vt,v=f):z=z.next=vt,pe.lanes|=W,Wa|=W;vt=K.action,Lr&&a(f,vt),f=K.hasEagerState?K.eagerState:a(f,vt)}else W={lane:vt,revertLane:K.revertLane,gesture:K.gesture,action:K.action,hasEagerState:K.hasEagerState,eagerState:K.eagerState,next:null},z===null?(T=z=W,v=f):z=z.next=W,pe.lanes|=vt,Wa|=vt;K=K.next}while(K!==null&&K!==n);if(z===null?v=f:z.next=T,!ni(f,t.memoizedState)&&(pn=!0,st&&(a=ds,a!==null)))throw a;t.memoizedState=f,t.baseState=v,t.baseQueue=z,s.lastRenderedState=f}return u===null&&(s.lanes=0),[t.memoizedState,s.dispatch]}function zf(t){var n=un(),a=n.queue;if(a===null)throw Error(r(311));a.lastRenderedReducer=t;var s=a.dispatch,u=a.pending,f=n.memoizedState;if(u!==null){a.pending=null;var v=u=u.next;do f=t(f,v.action),v=v.next;while(v!==u);ni(f,n.memoizedState)||(pn=!0),n.memoizedState=f,n.baseQueue===null&&(n.baseState=f),a.lastRenderedState=f}return[f,s]}function lg(t,n,a){var s=pe,u=un(),f=xe;if(f){if(a===void 0)throw Error(r(407));a=a()}else a=n();var v=!ni((Ye||u).memoizedState,a);if(v&&(u.memoizedState=a,pn=!0),u=u.queue,Bf(fg.bind(null,s,u,t),[t]),t=u.getSnapshot!==n||v||dn!==null&&(dn.memoizedState.tag&1)!==0,vs(t?9:8,{destroy:void 0},cg.bind(null,s,u,a,n),null),t){if(s.flags|=2048,We===null)throw Error(r(349));f||(pa&127)!==0||ug(s,n,a)}return a}function ug(t,n,a){t.flags|=16384,t={getSnapshot:n,value:a},n=pe.updateQueue,n===null?(n=ru(),pe.updateQueue=n,n.stores=[t]):(a=n.stores,a===null?n.stores=[t]:a.push(t))}function cg(t,n,a,s){n.value=a,n.getSnapshot=s,hg(n)&&dg(t)}function fg(t,n,a){return a(function(){hg(n)&&dg(t)})}function hg(t){var n=t.getSnapshot;t=t.value;try{var a=n();return!ni(t,a)}catch{return!0}}function dg(t){var n=Mr(t,2);n!==null&&Qn(n,t,2)}function Pf(t){var n=Hn();if(typeof t=="function"){var a=t;if(t=a(),Lr){_n(!0);try{a()}finally{_n(!1)}}}return n.memoizedState=n.baseState=t,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ma,lastRenderedState:t},n}function pg(t,n,a,s){return t.baseState=a,Of(t,Ye,typeof s=="function"?s:ma)}function tS(t,n,a,s,u){if(cu(t))throw Error(r(485));if(t=n.action,t!==null){var f={payload:u,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(v){f.listeners.push(v)}};Tt.T!==null?a(!0):f.isTransition=!1,s(f),a=n.pending,a===null?(f.next=n.pending=f,mg(n,f)):(f.next=a.next,n.pending=a.next=f)}}function mg(t,n){var a=n.action,s=n.payload,u=t.state;if(n.isTransition){var f=Tt.T,v={};v.types=f!==null?f.types:null,Tt.T=v;try{var T=a(u,s),z=Tt.S;z!==null&&z(v,T),gg(t,n,T)}catch(K){If(t,n,K)}finally{f!==null&&v.types!==null&&(f.types=v.types),Tt.T=f}}else try{f=a(u,s),gg(t,n,f)}catch(K){If(t,n,K)}}function gg(t,n,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(s){_g(t,n,s)},function(s){return If(t,n,s)}):_g(t,n,a)}function _g(t,n,a){n.status="fulfilled",n.value=a,vg(n),t.state=a,n=t.pending,n!==null&&(a=n.next,a===n?t.pending=null:(a=a.next,n.next=a,mg(t,a)))}function If(t,n,a){var s=t.pending;if(t.pending=null,s!==null){s=s.next;do n.status="rejected",n.reason=a,vg(n),n=n.next;while(n!==s)}t.action=null}function vg(t){t=t.listeners;for(var n=0;n<t.length;n++)(0,t[n])()}function xg(t,n){return n}function yg(t,n){if(xe){var a=We.formState;if(a!==null){t:{var s=pe;if(xe){if(Ke){e:{for(var u=Ke,f=_i;u.nodeType!==8;){if(!f){u=null;break e}if(u=xi(u.nextSibling),u===null){u=null;break e}}f=u.data,u=f==="F!"||f==="F"?u:null}if(u){Ke=xi(u.nextSibling),s=u.data==="F!";break t}}Pa(s)}s=!1}s&&(n=a[0])}}return a=Hn(),a.memoizedState=a.baseState=n,s={pending:null,lanes:0,dispatch:null,lastRenderedReducer:xg,lastRenderedState:n},a.queue=s,a=Fg.bind(null,pe,s),s.dispatch=a,s=Pf(!1),f=kf.bind(null,pe,!1,s.queue),s=Hn(),u={state:n,dispatch:null,action:t,pending:null},s.queue=u,a=tS.bind(null,pe,u,f,a),u.dispatch=a,s.memoizedState=t,[n,a,!1]}function Sg(t){var n=un();return Mg(n,Ye,t)}function Mg(t,n,a){if(n=Of(t,n,xg)[0],t=ou(ma)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var s=Fo(n)}catch(v){throw v===ps?Ql:v}else s=n;n=un();var u=n.queue,f=u.dispatch;return a!==n.memoizedState&&(pe.flags|=2048,vs(9,{destroy:void 0},eS.bind(null,u,a),null)),[s,f,t]}function eS(t,n){t.action=n}function Eg(t){var n=un(),a=Ye;if(a!==null)return Mg(n,a,t);un(),n=n.memoizedState,a=un();var s=a.queue.dispatch;return a.memoizedState=t,[n,s,!1]}function vs(t,n,a,s){return t={tag:t,create:a,deps:s,inst:n,next:null},n=pe.updateQueue,n===null&&(n=ru(),pe.updateQueue=n),a=n.lastEffect,a===null?n.lastEffect=t.next=t:(s=a.next,a.next=t,t.next=s,n.lastEffect=t),t}function Tg(){return un().memoizedState}function lu(t,n,a,s){var u=Hn();pe.flags|=t,u.memoizedState=vs(1|n,{destroy:void 0},a,s===void 0?null:s)}function uu(t,n,a,s){var u=un();s=s===void 0?null:s;var f=u.memoizedState.inst;Ye!==null&&s!==null&&Cf(s,Ye.memoizedState.deps)?u.memoizedState=vs(n,f,a,s):(pe.flags|=t,u.memoizedState=vs(1|n,f,a,s))}function bg(t,n){lu(8390656,8,t,n)}function Bf(t,n){uu(2048,8,t,n)}function nS(t){pe.flags|=4;var n=pe.updateQueue;if(n===null)n=ru(),pe.updateQueue=n,n.events=[t];else{var a=n.events;a===null?n.events=[t]:a.push(t)}}function Ag(t){var n=un().memoizedState;return nS({ref:n,nextImpl:t}),function(){if((Be&2)!==0)throw Error(r(440));return n.impl.apply(void 0,arguments)}}function Rg(t,n){return uu(4,2,t,n)}function Cg(t,n){return uu(4,4,t,n)}function wg(t,n){if(typeof n=="function"){t=t();var a=n(t);return function(){typeof a=="function"?a():n(null)}}if(n!=null)return t=t(),n.current=t,function(){n.current=null}}function Dg(t,n,a){a=a!=null?a.concat([t]):null,uu(4,4,wg.bind(null,n,t),a)}function Ff(){}function Ug(t,n){var a=un();n=n===void 0?null:n;var s=a.memoizedState;return n!==null&&Cf(n,s[1])?s[0]:(a.memoizedState=[t,n],t)}function Ng(t,n){var a=un();n=n===void 0?null:n;var s=a.memoizedState;if(n!==null&&Cf(n,s[1]))return s[0];if(s=t(),Lr){_n(!0);try{t()}finally{_n(!1)}}return a.memoizedState=[s,n],s}function Hf(t,n,a){return a===void 0||(pa&1073741824)!==0&&(Ae&261930)===0?t.memoizedState=n:(t.memoizedState=a,t=V0(),pe.lanes|=t,Wa|=t,a)}function Lg(t,n,a,s){return ni(a,n)?a:Va.current!==null?(t=Hf(t,a,s),ni(t,n)||(pn=!0),t):(pa&106)===0||(pa&1073741824)!==0&&(Ae&261930)===0?(pn=!0,t.memoizedState=a):(t=V0(),pe.lanes|=t,Wa|=t,n)}function Og(t,n,a,s,u){var f=qt.p;qt.p=f!==0&&8>f?f:8;var v=Tt.T,T={};T.types=v!==null?v.types:null,Tt.T=T,kf(t,!1,n,a);try{var z=u(),K=Tt.S;if(K!==null&&K(T,z),z!==null&&typeof z=="object"&&typeof z.then=="function"){var st=Qy(z,s);Ho(t,n,st,oi(t))}else Ho(t,n,s,oi(t))}catch(vt){Ho(t,n,{then:function(){},status:"rejected",reason:vt},oi())}finally{qt.p=f,v!==null&&T.types!==null&&(v.types=T.types),Tt.T=v}}function iS(){}function Gf(t,n,a,s){if(t.tag!==5)throw Error(r(476));var u=zg(t).queue;Og(t,u,n,B,a===null?iS:function(){return Pg(t),a(s)})}function zg(t){var n=t.memoizedState;if(n!==null)return n;n={memoizedState:B,baseState:B,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ma,lastRenderedState:B},next:null};var a={};return n.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ma,lastRenderedState:a},next:null},t.memoizedState=n,t=t.alternate,t!==null&&(t.memoizedState=n),n}function Pg(t){var n=zg(t);n.next===null&&(n=t.alternate.memoizedState),Ho(t,n.next.queue,{},oi())}function Vf(){return Rn(Is)}function Ig(){return un().memoizedState}function Bg(){return un().memoizedState}function aS(t){for(var n=t.return;n!==null;){switch(n.tag){case 24:case 3:var a=oi();t=Ha(a);var s=Ga(n,t,a);s!==null&&(Qn(s,n,a),Oo(s,n,a)),n={cache:gf()},t.payload=n;return}n=n.return}}function rS(t,n,a){var s=oi();a={lane:s,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},cu(t)?Hg(n,a):(a=of(t,n,a,s),a!==null&&(Qn(a,t,s),Gg(a,n,s)))}function Fg(t,n,a){var s=oi();Ho(t,n,a,s)}function Ho(t,n,a,s){var u={lane:s,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(cu(t))Hg(n,u);else{var f=t.alternate;if(t.lanes===0&&(f===null||f.lanes===0)&&(f=n.lastRenderedReducer,f!==null))try{var v=n.lastRenderedState,T=f(v,a);if(u.hasEagerState=!0,u.eagerState=T,ni(T,v))return Gl(t,n,u,0),We===null&&Hl(),!1}catch{}if(a=of(t,n,u,s),a!==null)return Qn(a,t,s),Gg(a,n,s),!0}return!1}function kf(t,n,a,s){if(s={lane:2,revertLane:Lh(),gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null},cu(t)){if(n)throw Error(r(479))}else n=of(t,a,s,2),n!==null&&Qn(n,t,2)}function cu(t){var n=t.alternate;return t===pe||n!==null&&n===pe}function Hg(t,n){gs=iu=!0;var a=t.pending;a===null?n.next=n:(n.next=a.next,a.next=n),t.pending=n}function Gg(t,n,a){if((a&4194048)!==0){var s=n.lanes;s&=t.pendingLanes,a|=s,n.lanes=a,J(t,a)}}var fu={readContext:Rn,use:su,useCallback:sn,useContext:sn,useEffect:sn,useImperativeHandle:sn,useLayoutEffect:sn,useInsertionEffect:sn,useMemo:sn,useReducer:sn,useRef:sn,useState:sn,useDebugValue:sn,useDeferredValue:sn,useTransition:sn,useSyncExternalStore:sn,useId:sn,useHostTransitionStatus:sn,useFormState:sn,useActionState:sn,useOptimistic:sn,useMemoCache:sn,useCacheRefresh:sn,useEffectEvent:sn},Vg={readContext:Rn,use:su,useCallback:function(t,n){return Hn().memoizedState=[t,n===void 0?null:n],t},useContext:Rn,useEffect:bg,useImperativeHandle:function(t,n,a){a=a!=null?a.concat([t]):null,lu(4194308,4,wg.bind(null,n,t),a)},useLayoutEffect:function(t,n){return lu(4194308,4,t,n)},useInsertionEffect:function(t,n){lu(4,2,t,n)},useMemo:function(t,n){var a=Hn();n=n===void 0?null:n;var s=t();if(Lr){_n(!0);try{t()}finally{_n(!1)}}return a.memoizedState=[s,n],s},useReducer:function(t,n,a){var s=Hn();if(a!==void 0){var u=a(n);if(Lr){_n(!0);try{a(n)}finally{_n(!1)}}}else u=n;return s.memoizedState=s.baseState=u,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:u},s.queue=t,t=t.dispatch=rS.bind(null,pe,t),[s.memoizedState,t]},useRef:function(t){var n=Hn();return t={current:t},n.memoizedState=t},useState:function(t){t=Pf(t);var n=t.queue,a=Fg.bind(null,pe,n);return n.dispatch=a,[t.memoizedState,a]},useDebugValue:Ff,useDeferredValue:function(t,n){var a=Hn();return Hf(a,t,n)},useTransition:function(){var t=Pf(!1);return t=Og.bind(null,pe,t.queue,!0,!1),Hn().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,n,a){var s=pe,u=Hn();if(xe){if(a===void 0)throw Error(r(407));a=a()}else{if(a=n(),We===null)throw Error(r(349));(Ae&127)!==0||ug(s,n,a)}u.memoizedState=a;var f={value:a,getSnapshot:n};return u.queue=f,bg(fg.bind(null,s,f,t),[t]),s.flags|=2048,vs(9,{destroy:void 0},cg.bind(null,s,f,a,n),null),a},useId:function(){var t=Hn(),n=We.identifierPrefix;if(xe){var a=Gi,s=Hi;a=(s&~(1<<32-Ln(s)-1)).toString(32)+a,n="_"+n+"R_"+a,a=au++,0<a&&(n+="H"+a.toString(32)),n+="_"}else a=Jy++,n="_"+n+"r_"+a.toString(32)+"_";return t.memoizedState=n},useHostTransitionStatus:Vf,useFormState:yg,useActionState:yg,useOptimistic:function(t){var n=Hn();n.memoizedState=n.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=a,n=kf.bind(null,pe,!0,a),a.dispatch=n,[t,n]},useMemoCache:Lf,useCacheRefresh:function(){return Hn().memoizedState=aS.bind(null,pe)},useEffectEvent:function(t){var n=Hn(),a={impl:t};return n.memoizedState=a,function(){if((Be&2)!==0)throw Error(r(440));return a.impl.apply(void 0,arguments)}}},kg={readContext:Rn,use:su,useCallback:Ug,useContext:Rn,useEffect:Bf,useImperativeHandle:Dg,useInsertionEffect:Rg,useLayoutEffect:Cg,useMemo:Ng,useReducer:ou,useRef:Tg,useState:function(){return ou(ma)},useDebugValue:Ff,useDeferredValue:function(t,n){var a=un();return Lg(a,Ye.memoizedState,t,n)},useTransition:function(){var t=ou(ma)[0],n=un().memoizedState;return[typeof t=="boolean"?t:Fo(t),n]},useSyncExternalStore:lg,useId:Ig,useHostTransitionStatus:Vf,useFormState:Sg,useActionState:Sg,useOptimistic:function(t,n){var a=un();return pg(a,Ye,t,n)},useMemoCache:Lf,useCacheRefresh:Bg,useEffectEvent:Ag},sS={readContext:Rn,use:su,useCallback:Ug,useContext:Rn,useEffect:Bf,useImperativeHandle:Dg,useInsertionEffect:Rg,useLayoutEffect:Cg,useMemo:Ng,useReducer:zf,useRef:Tg,useState:function(){return zf(ma)},useDebugValue:Ff,useDeferredValue:function(t,n){var a=un();return Ye===null?Hf(a,t,n):Lg(a,Ye.memoizedState,t,n)},useTransition:function(){var t=zf(ma)[0],n=un().memoizedState;return[typeof t=="boolean"?t:Fo(t),n]},useSyncExternalStore:lg,useId:Ig,useHostTransitionStatus:Vf,useFormState:Eg,useActionState:Eg,useOptimistic:function(t,n){var a=un();return Ye!==null?pg(a,Ye,t,n):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:Lf,useCacheRefresh:Bg,useEffectEvent:Ag};function Xf(t,n,a,s){n=t.memoizedState,a=a(s,n),a=a==null?n:O({},n,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var qf={enqueueSetState:function(t,n,a){t=t._reactInternals;var s=oi(),u=Ha(s);u.payload=n,a!=null&&(u.callback=a),n=Ga(t,u,s),n!==null&&(Qn(n,t,s),Oo(n,t,s))},enqueueReplaceState:function(t,n,a){t=t._reactInternals;var s=oi(),u=Ha(s);u.tag=1,u.payload=n,a!=null&&(u.callback=a),n=Ga(t,u,s),n!==null&&(Qn(n,t,s),Oo(n,t,s))},enqueueForceUpdate:function(t,n){t=t._reactInternals;var a=oi(),s=Ha(a);s.tag=2,n!=null&&(s.callback=n),n=Ga(t,s,a),n!==null&&(Qn(n,t,a),Oo(n,t,a))}};function Xg(t,n,a,s,u,f,v){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(s,f,v):n.prototype&&n.prototype.isPureReactComponent?!Ao(a,s)||!Ao(u,f):!0}function qg(t,n,a,s){t=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(a,s),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(a,s),n.state!==t&&qf.enqueueReplaceState(n,n.state,null)}function Or(t,n){var a=n;if("ref"in n){a={};for(var s in n)s!=="ref"&&(a[s]=n[s])}if(t=t.defaultProps){a===n&&(a=O({},a));for(var u in t)a[u]===void 0&&(a[u]=t[u])}return a}function Yg(t){Fl(t)}function jg(t){console.error(t)}function Wg(t){Fl(t)}function hu(t,n){try{var a=t.onUncaughtError;a(n.value,{componentStack:n.stack})}catch(s){setTimeout(function(){throw s})}}function Zg(t,n,a){try{var s=t.onCaughtError;s(a.value,{componentStack:a.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(u){setTimeout(function(){throw u})}}function Yf(t,n,a){return a=Ha(a),a.tag=3,a.payload={element:null},a.callback=function(){hu(t,n)},a}function Kg(t){return t=Ha(t),t.tag=3,t}function Qg(t,n,a,s){var u=a.type.getDerivedStateFromError;if(typeof u=="function"){var f=s.value;t.payload=function(){return u(f)},t.callback=function(){Zg(n,a,s)}}var v=a.stateNode;v!==null&&typeof v.componentDidCatch=="function"&&(t.callback=function(){Zg(n,a,s),typeof u!="function"&&(Za===null?Za=new Set([this]):Za.add(this));var T=s.stack;this.componentDidCatch(s.value,{componentStack:T!==null?T:""})})}function oS(t,n,a,s,u){if(a.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){if(n=a.alternate,n!==null&&Ar(n,a,u,!0),a=Cn.current,a!==null){switch(a.tag){case 31:case 13:case 19:return zn===null?Lu():a.alternate===null&&on===0&&(on=3),a.flags&=-257,a.flags|=65536,a.lanes=u,s===Jl?a.flags|=16384:(n=a.updateQueue,n===null?a.updateQueue=new Set([s]):n.add(s),Dh(t,s,u)),!1;case 22:return a.flags|=65536,s===Jl?a.flags|=16384:(n=a.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([s])},a.updateQueue=n):(a=n.retryQueue,a===null?n.retryQueue=new Set([s]):a.add(s)),Dh(t,s,u)),!1}throw Error(r(435,a.tag))}return Dh(t,s,u),Lu(),!1}if(xe)return n=Cn.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=u,s!==hf&&(t=Error(r(422),{cause:s}),wo(pi(t,a)))):(s!==hf&&(n=Error(r(423),{cause:s}),wo(pi(n,a))),t=t.current.alternate,t.flags|=65536,u&=-u,t.lanes|=u,s=pi(s,a),u=Yf(t.stateNode,s,u),Mf(t,u),on!==4&&(on=2)),!1;var f=Error(r(520),{cause:s});if(f=pi(f,a),Wo===null?Wo=[f]:Wo.push(f),on!==4&&(on=2),n===null)return!0;s=pi(s,a),a=n;do{switch(a.tag){case 3:return a.flags|=65536,t=u&-u,a.lanes|=t,t=Yf(a.stateNode,s,t),Mf(a,t),!1;case 1:if(n=a.type,f=a.stateNode,(a.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||f!==null&&typeof f.componentDidCatch=="function"&&(Za===null||!Za.has(f))))return a.flags|=65536,u&=-u,a.lanes|=u,u=Kg(u),Qg(u,t,a,s),Mf(a,u),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var jf=Error(r(461)),pn=!1;function xn(t,n,a,s){n.child=t===null?eg(n,null,a,s):Nr(n,t.child,a,s)}function Jg(t,n,a,s,u){a=a.render;var f=n.ref;if("ref"in s){var v={};for(var T in s)T!=="ref"&&(v[T]=s[T])}else v=s;return Rr(n),s=wf(t,n,a,v,f,u),T=Df(),t!==null&&!pn?(Uf(t,n,u),ga(t,n,u)):(xe&&T&&ql(n),n.flags|=1,xn(t,n,s,u),n.child)}function $g(t,n,a,s,u){if(t===null){var f=a.type;return typeof f=="function"&&!lf(f)&&f.defaultProps===void 0&&a.compare===null?(n.tag=15,n.type=f,t0(t,n,f,s,u)):(t=kl(a.type,null,s,n,n.mode,u),t.ref=n.ref,t.return=n,n.child=t)}if(f=t.child,!eh(t,u)){var v=f.memoizedProps;if(a=a.compare,a=a!==null?a:Ao,a(v,s)&&t.ref===n.ref)return ga(t,n,u)}return n.flags|=1,t=ca(f,s),t.ref=n.ref,t.return=n,n.child=t}function t0(t,n,a,s,u){if(t!==null){var f=t.memoizedProps;if(Ao(f,s)&&t.ref===n.ref)if(pn=!1,n.pendingProps=s=f,eh(t,u))(t.flags&131072)!==0&&(pn=!0);else return n.lanes=t.lanes,ga(t,n,u)}return Wf(t,n,a,s,u)}function e0(t,n,a,s){var u=s.children,f=t!==null?t.memoizedState:null;if(t===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),s.mode==="hidden"){if((n.flags&128)!==0){if(f=f!==null?f.baseLanes|a:a,t!==null){for(s=n.child=t.child,u=0;s!==null;)u=u|s.lanes|s.childLanes,s=s.sibling;s=u&~f}else s=0,n.child=null;return n0(t,n,f,a,s)}if((a&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},t!==null&&Kl(n,f!==null?f.cachePool:null),f!==null?ag(n,f):Tf(),rg(n);else return s=n.lanes=536870912,n0(t,n,f!==null?f.baseLanes|a:a,a,s)}else f!==null?(Kl(n,f.cachePool),ag(n,f),Xa(),n.memoizedState=null):(t!==null&&Kl(n,null),Tf(),Xa());return xn(t,n,u,a),n.child}function Go(t,n){return t!==null&&t.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function n0(t,n,a,s,u){var f=vf();return f=f===null?null:{parent:hn._currentValue,pool:f},n.memoizedState={baseLanes:a,cachePool:f},t!==null&&Kl(n,null),Tf(),rg(n),t!==null&&Ar(t,n,s,!0),n.childLanes=u,null}function du(t,n){return n=pu({mode:n.mode,children:n.children},t.mode),n.ref=t.ref,t.child=n,n.return=t,n}function i0(t,n,a){return Nr(n,t.child,null,a),t=du(n,n.pendingProps),t.flags|=2,ii(n),n.memoizedState=null,t}function lS(t,n,a){var s=n.pendingProps,u=(n.flags&128)!==0;if(n.flags&=-129,t===null){if(xe){if(s.mode==="hidden")return t=du(n,s),n.lanes=536870912,t.memoizedState={baseLanes:0,cachePool:null},Go(null,t);if(Af(n),(t=Ke)?(t=w_(t,_i),t=t!==null&&t.data==="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Oa!==null?{id:Hi,overflow:Gi}:null,retryLane:536870912,hydrationErrors:null},a=Hm(t),a.return=n,n.child=a,Mn=n,Ke=null)):t=null,t===null)throw Pa(n);return n.lanes=536870912,null}return du(n,s)}var f=t.memoizedState;if(f!==null){var v=f.dehydrated;if(Af(n),u)if(n.flags&256)n.flags&=-257,n=i0(t,n,a);else if(n.memoizedState!==null)n.child=t.child,n.flags|=128,n=null;else throw Error(r(558));else if(pn||Ar(t,n,a,!1),u=(a&t.childLanes)!==0,pn||u){if(Va.current===null){if(s=We,s!==null&&(v=ut(s,a),v!==0&&v!==f.retryLane))throw f.retryLane=v,Mr(t,v),Qn(s,t,v),jf;Lu()}n=i0(t,n,a)}else t=f.treeContext,Ke=xi(v.nextSibling),Mn=n,xe=!0,za=null,_i=!1,t!==null&&km(n,t),n=du(n,s),n.flags|=134221824;return n}return t=ca(t.child,{mode:s.mode,children:s.children}),t.ref=n.ref,n.child=t,t.return=n,t}function xs(t,n){var a=n.ref;if(a===null)t!==null&&t.ref!==null&&(n.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(r(284));(t===null||t.ref!==a)&&(n.flags|=4194816)}}function Wf(t,n,a,s,u){return Rr(n),a=wf(t,n,a,s,void 0,u),s=Df(),t!==null&&!pn?(Uf(t,n,u),ga(t,n,u)):(xe&&s&&ql(n),n.flags|=1,xn(t,n,a,u),n.child)}function a0(t,n,a,s,u,f){return Rr(n),n.updateQueue=null,a=og(n,s,a,u),sg(t),s=Df(),t!==null&&!pn?(Uf(t,n,f),ga(t,n,f)):(xe&&s&&ql(n),n.flags|=1,xn(t,n,a,f),n.child)}function r0(t,n,a,s,u){if(Rr(n),n.stateNode===null){var f=us,v=a.contextType;typeof v=="object"&&v!==null&&(f=Rn(v)),f=new a(s,f),n.memoizedState=f.state!==null&&f.state!==void 0?f.state:null,f.updater=qf,n.stateNode=f,f._reactInternals=n,f=n.stateNode,f.props=s,f.state=n.memoizedState,f.refs={},yf(n),v=a.contextType,f.context=typeof v=="object"&&v!==null?Rn(v):us,f.state=n.memoizedState,v=a.getDerivedStateFromProps,typeof v=="function"&&(Xf(n,a,v,s),f.state=n.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof f.getSnapshotBeforeUpdate=="function"||typeof f.UNSAFE_componentWillMount!="function"&&typeof f.componentWillMount!="function"||(v=f.state,typeof f.componentWillMount=="function"&&f.componentWillMount(),typeof f.UNSAFE_componentWillMount=="function"&&f.UNSAFE_componentWillMount(),v!==f.state&&qf.enqueueReplaceState(f,f.state,null),Po(n,s,f,u),zo(),f.state=n.memoizedState),typeof f.componentDidMount=="function"&&(n.flags|=4194308),s=!0}else if(t===null){f=n.stateNode;var T=n.memoizedProps,z=Or(a,T);f.props=z;var K=f.context,st=a.contextType;v=us,typeof st=="object"&&st!==null&&(v=Rn(st));var vt=a.getDerivedStateFromProps;st=typeof vt=="function"||typeof f.getSnapshotBeforeUpdate=="function",T=n.pendingProps!==T,st||typeof f.UNSAFE_componentWillReceiveProps!="function"&&typeof f.componentWillReceiveProps!="function"||(T||K!==v)&&qg(n,f,s,v),Fa=!1;var W=n.memoizedState;f.state=W,Po(n,s,f,u),zo(),K=n.memoizedState,T||W!==K||Fa?(typeof vt=="function"&&(Xf(n,a,vt,s),K=n.memoizedState),(z=Fa||Xg(n,a,z,s,W,K,v))?(st||typeof f.UNSAFE_componentWillMount!="function"&&typeof f.componentWillMount!="function"||(typeof f.componentWillMount=="function"&&f.componentWillMount(),typeof f.UNSAFE_componentWillMount=="function"&&f.UNSAFE_componentWillMount()),typeof f.componentDidMount=="function"&&(n.flags|=4194308)):(typeof f.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=s,n.memoizedState=K),f.props=s,f.state=K,f.context=v,s=z):(typeof f.componentDidMount=="function"&&(n.flags|=4194308),s=!1)}else{f=n.stateNode,Sf(t,n),v=n.memoizedProps,st=Or(a,v),f.props=st,vt=n.pendingProps,W=f.context,K=a.contextType,z=us,typeof K=="object"&&K!==null&&(z=Rn(K)),T=a.getDerivedStateFromProps,(K=typeof T=="function"||typeof f.getSnapshotBeforeUpdate=="function")||typeof f.UNSAFE_componentWillReceiveProps!="function"&&typeof f.componentWillReceiveProps!="function"||(v!==vt||W!==z)&&qg(n,f,s,z),Fa=!1,W=n.memoizedState,f.state=W,Po(n,s,f,u),zo();var at=n.memoizedState;v!==vt||W!==at||Fa||t!==null&&t.dependencies!==null&&Wl(t.dependencies)?(typeof T=="function"&&(Xf(n,a,T,s),at=n.memoizedState),(st=Fa||Xg(n,a,st,s,W,at,z)||t!==null&&t.dependencies!==null&&Wl(t.dependencies))?(K||typeof f.UNSAFE_componentWillUpdate!="function"&&typeof f.componentWillUpdate!="function"||(typeof f.componentWillUpdate=="function"&&f.componentWillUpdate(s,at,z),typeof f.UNSAFE_componentWillUpdate=="function"&&f.UNSAFE_componentWillUpdate(s,at,z)),typeof f.componentDidUpdate=="function"&&(n.flags|=4),typeof f.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof f.componentDidUpdate!="function"||v===t.memoizedProps&&W===t.memoizedState||(n.flags|=4),typeof f.getSnapshotBeforeUpdate!="function"||v===t.memoizedProps&&W===t.memoizedState||(n.flags|=1024),n.memoizedProps=s,n.memoizedState=at),f.props=s,f.state=at,f.context=z,s=st):(typeof f.componentDidUpdate!="function"||v===t.memoizedProps&&W===t.memoizedState||(n.flags|=4),typeof f.getSnapshotBeforeUpdate!="function"||v===t.memoizedProps&&W===t.memoizedState||(n.flags|=1024),s=!1)}return f=s,xs(t,n),s=(n.flags&128)!==0,f||s?(f=n.stateNode,a=s&&typeof a.getDerivedStateFromError!="function"?null:f.render(),n.flags|=1,t!==null&&s?(n.child=Nr(n,t.child,null,u),n.child=Nr(n,null,a,u)):xn(t,n,a,u),n.memoizedState=f.state,t=n.child):t=ga(t,n,u),t}function s0(t,n,a,s){return Tr(),n.flags|=256,xn(t,n,a,s),n.child}var Zf={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Kf(t){return{baseLanes:t,cachePool:Zm()}}function Qf(t,n,a){return t=t!==null?t.childLanes&~a:0,n&&(t|=si),t}function o0(t,n,a){var s=n.pendingProps,u=!1,f=(n.flags&128)!==0,v;if((v=f)||(v=t!==null&&t.memoizedState===null?!1:(wn.current&2)!==0),v&&(u=!0,n.flags&=-129),v=(n.flags&32)!==0,n.flags&=-33,t===null){if(xe){if(u?ka(n):Xa(),(t=Ke)?(t=w_(t,_i),t=t!==null&&t.data!=="&"?t:null,t!==null&&(n.memoizedState={dehydrated:t,treeContext:Oa!==null?{id:Hi,overflow:Gi}:null,retryLane:536870912,hydrationErrors:null},a=Hm(t),a.return=n,n.child=a,Mn=n,Ke=null)):t=null,t===null)throw Pa(n);return Kh(t)?n.lanes=32:n.lanes=536870912,null}return f=s.children,s=s.fallback,u?(Xa(),u=n.mode,f=pu({mode:"hidden",children:f},u),s=Er(s,u,a,null),f.return=n,s.return=n,f.sibling=s,n.child=f,s=n.child,s.memoizedState=Kf(a),s.childLanes=Qf(t,v,a),n.memoizedState=Zf,Go(null,s)):(ka(n),Jf(n,f))}var T=t.memoizedState;if(T!==null){var z=T.dehydrated;if(z!==null)return uS(t,n,f,v,s,z,T,a)}return u?(Xa(),u=s.fallback,f=n.mode,T=t.child,z=T.sibling,s=ca(T,{mode:"hidden",children:s.children}),s.subtreeFlags=T.subtreeFlags&1206910976,z!==null?u=ca(z,u):(u=Er(u,f,a,null),u.flags|=2),u.return=n,s.return=n,s.sibling=u,n.child=s,Go(null,s),s=n.child,u=t.child.memoizedState,u===null?u=Kf(a):(f=u.cachePool,f!==null?(T=hn._currentValue,f=f.parent!==T?{parent:T,pool:T}:f):f=Zm(),u={baseLanes:u.baseLanes|a,cachePool:f}),s.memoizedState=u,s.childLanes=Qf(t,v,a),n.memoizedState=Zf,Go(t.child,s)):(ka(n),a=t.child,t=a.sibling,a=ca(a,{mode:"visible",children:s.children}),a.return=n,a.sibling=null,t!==null&&(v=n.deletions,v===null?(n.deletions=[t],n.flags|=16):v.push(t)),n.child=a,n.memoizedState=null,a)}function Jf(t,n){return n=pu({mode:"visible",children:n},t.mode),n.return=t,t.child=n}function pu(t,n){return t=jn(22,t,null,n),t.lanes=0,t}function mu(t,n,a){return Nr(n,t.child,null,a),t=Jf(n,n.pendingProps.children),t.flags|=2,n.memoizedState=null,t}function uS(t,n,a,s,u,f,v,T){if(a)return n.flags&256?(ka(n),n.flags&=-257,mu(t,n,T)):n.memoizedState!==null?(Xa(),n.child=t.child,n.flags|=128,null):(Xa(),f=u.fallback,v=n.mode,u=pu({mode:"visible",children:u.children},v),f=Er(f,v,T,null),f.flags|=2,u.return=n,f.return=n,u.sibling=f,n.child=u,Nr(n,t.child,null,T),u=n.child,u.memoizedState=Kf(T),u.childLanes=Qf(t,s,T),n.memoizedState=Zf,Go(null,u));if(ka(n),Kh(f)){if(s=f.nextSibling&&f.nextSibling.dataset,s)var z=s.dgst;return s=z,s!==""&&(u=Error(r(419)),u.stack="",u.digest=s,wo({value:u,source:null,stack:null})),mu(t,n,T)}if(pn||Ar(t,n,T,!1),s=(T&t.childLanes)!==0,pn||s){if(Va.current!==null)return mu(t,n,T);if(s=We,s!==null&&(u=ut(s,T),u!==0&&u!==v.retryLane))throw v.retryLane=u,Mr(t,u),Qn(s,t,u),jf;return Zh(f)||Lu(),mu(t,n,T)}return Zh(f)?(n.flags|=192,n.child=t.child,null):(t=v.treeContext,Ke=xi(f.nextSibling),Mn=n,xe=!0,za=null,_i=!1,t!==null&&km(n,t),n=Jf(n,u.children),n.flags|=134221824,n)}function l0(t,n,a){t.lanes|=n;var s=t.alternate;s!==null&&(s.lanes|=n),jl(t.return,n,a)}function u0(t){for(var n=null;t!==null;){var a=t.alternate;a!==null&&nu(a)===null&&(n=t),t=t.sibling}return n}function gu(t,n,a,s,u,f){var v=t.memoizedState;v===null?t.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:s,tail:a,tailMode:u,treeForkCount:f}:(v.isBackwards=n,v.rendering=null,v.renderingStartTime=0,v.last=s,v.tail=a,v.tailMode=u,v.treeForkCount=f)}function $f(t){var n=t.child;for(t.child=null;n!==null;){var a=n.sibling;n.sibling=t.child,t.child=n,n=a}}function th(t,n,a){var s=n.pendingProps,u=s.revealOrder,f=s.tail;s=s.children;var v=wn.current;if(n.flags&128)return Io(n,v),null;var T=(v&2)!==0;if(T?(v=v&1|2,n.flags|=128):v&=1,Io(n,v),u==="backwards"&&t!==null?($f(t),xn(t,n,s,a),$f(t)):xn(t,n,s,a),s=xe?Co:0,!T&&t!==null&&(t.flags&128)!==0)t:for(t=n.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&l0(t,a,n);else if(t.tag===19)l0(t,a,n);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break t;for(;t.sibling===null;){if(t.return===null||t.return===n)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(u){case"backwards":a=u0(n.child),a===null?(u=n.child,n.child=null):(u=a.sibling,a.sibling=null,$f(n)),gu(n,!0,u,null,f,s);break;case"unstable_legacy-backwards":for(a=null,u=n.child,n.child=null;u!==null;){if(t=u.alternate,t!==null&&nu(t)===null){n.child=u;break}t=u.sibling,u.sibling=a,a=u,u=t}gu(n,!0,a,null,f,s);break;case"together":gu(n,!1,null,null,void 0,s);break;case"independent":n.memoizedState=null;break;default:a=u0(n.child),a===null?(u=n.child,n.child=null):(u=a.sibling,a.sibling=null),gu(n,!1,u,a,f,s)}return n.child}function c0(t,n,a){var s=n.pendingProps;return Ia(n,n.type,s.value),xn(t,n,s.children,a),n.child}function ga(t,n,a){if(t!==null&&(n.dependencies=t.dependencies),Wa|=n.lanes,(a&n.childLanes)===0)if(t!==null){if(Ar(t,n,a,!1),(a&n.childLanes)===0)return null}else return null;if(t!==null&&n.child!==t.child)throw Error(r(153));if(n.child!==null){for(t=n.child,a=ca(t,t.pendingProps),n.child=a,a.return=n;t.sibling!==null;)t=t.sibling,a=a.sibling=ca(t,t.pendingProps),a.return=n;a.sibling=null}return n.child}function eh(t,n){return(t.lanes&n)!==0?!0:(t=t.dependencies,!!(t!==null&&Wl(t)))}function cS(t,n,a){switch(n.tag){case 3:U(n,n.stateNode.containerInfo),Ia(n,hn,t.memoizedState.cache),Tr();break;case 27:case 5:nt(n);break;case 4:U(n,n.stateNode.containerInfo);break;case 10:Ia(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,Af(n),null;break;case 13:var s=n.memoizedState;if(s!==null){if(s.dehydrated!==null)return ka(n),n.flags|=128,null;s=Ar(t,n,a,!1);var u=n.child.childLanes;return s||(a&u)!==0?o0(t,n,a):(ka(n),t=ga(t,n,a),t!==null?t.sibling:null)}ka(n);break;case 19:if(n.flags&128)return th(t,n,a);if(u=(t.flags&128)!==0,s=(a&n.childLanes)!==0,s||(Ar(t,n,a,!1),s=(a&n.childLanes)!==0),u){if(s)return th(t,n,a);n.flags|=128}if(u=n.memoizedState,u!==null&&(u.rendering=null,u.tail=null,u.lastEffect=null),Io(n,wn.current),s)break;return null;case 22:return n.lanes=0,e0(t,n,a,n.pendingProps);case 24:Ia(n,hn,t.memoizedState.cache)}return ga(t,n,a)}function f0(t,n,a){if(t!==null)if(t.memoizedProps!==n.pendingProps)pn=!0;else{if(!eh(t,a)&&(n.flags&128)===0)return pn=!1,cS(t,n,a);pn=(t.flags&131072)!==0}else pn=!1,xe&&(n.flags&1048576)!==0&&Vm(n,Co,n.index);switch(n.lanes=0,n.tag){case 16:t:{var s=n.pendingProps;if(t=Dr(n.elementType),n.type=t,typeof t=="function")lf(t)?(s=Or(t,s),n.tag=1,n=r0(null,n,t,s,a)):(n.tag=0,n=Wf(null,n,t,s,a));else{if(t!=null){var u=t.$$typeof;if(u===j){n.tag=11,n=Jg(null,n,t,s,a);break t}else if(u===St){n.tag=14,n=$g(null,n,t,s,a);break t}else if(u===lt){n.tag=10,n.type=t,n=c0(null,n,a);break t}}throw n=Ot(t)||t,Error(r(306,n,""))}}return n;case 0:return Wf(t,n,n.type,n.pendingProps,a);case 1:return s=n.type,u=Or(s,n.pendingProps),r0(t,n,s,u,a);case 3:t:{if(U(n,n.stateNode.containerInfo),t===null)throw Error(r(387));s=n.pendingProps;var f=n.memoizedState;u=f.element,Sf(t,n),Po(n,s,null,a);var v=n.memoizedState;if(s=v.cache,Ia(n,hn,s),s!==f.cache&&mf(n,[hn],a,!0),zo(),s=v.element,f.isDehydrated)if(f={element:s,isDehydrated:!1,cache:v.cache},n.updateQueue.baseState=f,n.memoizedState=f,n.flags&256){n=s0(t,n,s,a);break t}else if(s!==u){u=pi(Error(r(424)),n),wo(u),n=s0(t,n,s,a);break t}else for(t=n.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,Ke=xi(t.firstChild),Mn=n,xe=!0,za=null,_i=!0,a=eg(n,null,s,a),n.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(Tr(),s===u){n=ga(t,n,a);break t}xn(t,n,s,a)}n=n.child}return n;case 26:return xs(t,n),t===null?(a=P_(n.type,null,n.pendingProps,null))?n.memoizedState=a:xe||(n.stateNode=m_(n.type,n.pendingProps,oe.current,n)):n.memoizedState=P_(n.type,t.memoizedProps,n.pendingProps,t.memoizedState),null;case 27:return nt(n),t===null&&xe&&(s=n.stateNode=N_(n.type,n.pendingProps,oe.current),Mn=n,_i=!0,u=Ke,Ja(n.type)?(Qh=u,Ke=xi(s.firstChild)):Ke=u),xn(t,n,n.pendingProps.children,a),xs(t,n),t===null&&(n.flags|=4194304),n.child;case 5:return t===null&&xe&&((u=s=Ke)&&(s=aM(s,n.type,n.pendingProps,_i),s!==null?(n.stateNode=s,Mn=n,Ke=xi(s.firstChild),_i=!1,u=!0):u=!1),u||Pa(n)),nt(n),u=n.type,f=n.pendingProps,v=t!==null?t.memoizedProps:null,s=f.children,Vh(u,f)?s=null:v!==null&&Vh(u,v)&&(n.flags|=32),n.memoizedState!==null&&(u=wf(t,n,$y,null,null,a),Is._currentValue=u),xs(t,n),xn(t,n,s,a),n.child;case 6:return t===null&&xe&&((t=a=Ke)&&(a=rM(a,n.pendingProps,_i),a!==null?(n.stateNode=a,Mn=n,Ke=null,t=!0):t=!1),t||Pa(n)),null;case 13:return o0(t,n,a);case 4:return U(n,n.stateNode.containerInfo),s=n.pendingProps,t===null?n.child=Nr(n,null,s,a):xn(t,n,s,a),n.child;case 11:return Jg(t,n,n.type,n.pendingProps,a);case 7:return s=n.pendingProps,xs(t,n),xn(t,n,s,a),n.child;case 8:return xn(t,n,n.pendingProps.children,a),n.child;case 12:return xn(t,n,n.pendingProps.children,a),n.child;case 10:return c0(t,n,a);case 9:return u=n.type._context,s=n.pendingProps.children,Rr(n),u=Rn(u),s=s(u),n.flags|=1,xn(t,n,s,a),n.child;case 14:return $g(t,n,n.type,n.pendingProps,a);case 15:return t0(t,n,n.type,n.pendingProps,a);case 19:return th(t,n,a);case 31:return lS(t,n,a);case 22:return e0(t,n,a,n.pendingProps);case 24:return Rr(n),s=Rn(hn),t===null?(u=vf(),u===null&&(u=We,f=gf(),u.pooledCache=f,f.refCount++,f!==null&&(u.pooledCacheLanes|=a),u=f),n.memoizedState={parent:s,cache:u},yf(n),Ia(n,hn,u)):((t.lanes&a)!==0&&(Sf(t,n),Po(n,null,null,a),zo()),u=t.memoizedState,f=n.memoizedState,u.parent!==s?(u={parent:s,cache:s},n.memoizedState=u,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=u),Ia(n,hn,s)):(s=f.cache,Ia(n,hn,s),s!==u.cache&&mf(n,[hn],a,!0))),xn(t,n,n.pendingProps.children,a),n.child;case 30:return n.stateNode===null&&(n.stateNode={autoName:null,paired:null,clones:null,ref:null}),s=n.pendingProps,s.name!=null&&s.name!=="auto"?n.flags|=t===null?18882560:18874368:xe&&ql(n),t!==null&&t.memoizedProps.name!==s.name?n.flags|=4194816:xs(t,n),xn(t,n,s.children,a),n.child;case 29:throw n.pendingProps}throw Error(r(156,n.tag))}function _a(t){t.flags|=4}function nh(t,n,a,s,u){var f;if((f=(t.mode&32)!==0)&&(f=a===null?H_(n,s):H_(n,s)&&(s.src!==a.src||s.srcSet!==a.srcSet)),f){if(t.flags|=16777216,(u&335544128)===u)if(t.stateNode.complete)t.flags|=8192;else if(Y0())t.flags|=8192;else throw Ur=Jl,xf}else t.flags&=-16777217}function h0(t,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!G_(n))if(Y0())t.flags|=8192;else throw Ur=Jl,xf}function _u(t,n){n!==null&&(t.flags|=4),t.flags&16384&&(n=t.tag!==22?wl():536870912,t.lanes|=n,Ts|=n)}function Vo(t,n){if(!xe)switch(t.tailMode){case"visible":break;case"collapsed":for(var a=t.tail,s=null;a!==null;)a.alternate!==null&&(s=a),a=a.sibling;s===null?n||t.tail===null?t.tail=null:t.tail.sibling=null:s.sibling=null;break;default:for(n=t.tail,a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t.tail=null:a.sibling=null}}function Qe(t){var n=t.alternate!==null&&t.alternate.child===t.child,a=0,s=0;if(n)for(var u=t.child;u!==null;)a|=u.lanes|u.childLanes,s|=u.subtreeFlags&1206910976,s|=u.flags&1206910976,u.return=t,u=u.sibling;else for(u=t.child;u!==null;)a|=u.lanes|u.childLanes,s|=u.subtreeFlags,s|=u.flags,u.return=t,u=u.sibling;return t.subtreeFlags|=s,t.childLanes=a,n}function fS(t,n,a){var s=n.pendingProps;switch(ff(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Qe(n),null;case 1:return Qe(n),null;case 3:return a=n.stateNode,s=null,t!==null&&(s=t.memoizedState.cache),n.memoizedState.cache!==s&&(n.flags|=2048),da(hn),b(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(hs(n)?_a(n):t===null||t.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,df())),Qe(n),null;case 26:var u=n.type,f=n.memoizedState;return t===null?(_a(n),f!==null?(Qe(n),h0(n,f)):(Qe(n),nh(n,u,null,s,a))):f?f!==t.memoizedState?(_a(n),Qe(n),h0(n,f)):(Qe(n),n.flags&=-16777217):(t=t.memoizedProps,t!==s&&_a(n),Qe(n),nh(n,u,t,s,a)),null;case 27:if(dt(n),a=oe.current,u=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==s&&_a(n);else{if(!s){if(n.stateNode===null)throw Error(r(166));return Qe(n),n.subtreeFlags&=-33554433,null}t=Mt.current,hs(n)?Xm(n):(t=N_(u,s,a),n.stateNode=t,_a(n))}return Qe(n),n.subtreeFlags&=-33554433,null;case 5:if(dt(n),u=n.type,t!==null&&n.stateNode!=null)t.memoizedProps!==s&&_a(n);else{if(!s){if(n.stateNode===null)throw Error(r(166));return Qe(n),n.subtreeFlags&=-33554433,null}if(f=Mt.current,hs(n))Xm(n);else{var v=$o(oe.current);switch(f){case 1:f=v.createElementNS("http://www.w3.org/2000/svg",u);break;case 2:f=v.createElementNS("http://www.w3.org/1998/Math/MathML",u);break;default:switch(u){case"svg":f=v.createElementNS("http://www.w3.org/2000/svg",u);break;case"math":f=v.createElementNS("http://www.w3.org/1998/Math/MathML",u);break;case"script":f=v.createElement("div"),f.innerHTML="<script><\/script>",f=f.removeChild(f.firstChild);break;case"select":f=typeof s.is=="string"?v.createElement("select",{is:s.is}):v.createElement("select"),s.multiple?f.multiple=!0:s.size&&(f.size=s.size);break;default:f=typeof s.is=="string"?v.createElement(u,{is:s.is}):v.createElement(u)}}f[Nt]=n,f[Zt]=s;t:for(v=n.child;v!==null;){if(v.tag===5||v.tag===6)f.appendChild(v.stateNode);else if(v.tag!==4&&v.tag!==27&&v.child!==null){v.child.return=v,v=v.child;continue}if(v===n)break t;for(;v.sibling===null;){if(v.return===null||v.return===n)break t;v=v.return}v.sibling.return=v.return,v=v.sibling}n.stateNode=f;t:switch(Un(f,u,s),u){case"button":case"input":case"select":case"textarea":s=!!s.autoFocus;break t;case"img":s=!0;break t;default:s=!1}s&&_a(n)}}return Qe(n),n.subtreeFlags&=-33554433,nh(n,n.type,t===null?null:t.memoizedProps,n.pendingProps,a),null;case 6:if(t&&n.stateNode!=null)t.memoizedProps!==s&&_a(n);else{if(typeof s!="string"&&n.stateNode===null)throw Error(r(166));if(t=oe.current,hs(n)){if(t=n.stateNode,a=n.memoizedProps,s=null,u=Mn,u!==null)switch(u.tag){case 27:case 5:s=u.memoizedProps}t[Nt]=n,t=!!(t.nodeValue===a||s!==null&&s.suppressHydrationWarning===!0||f_(t.nodeValue,a)),t||Pa(n,!0)}else t=$o(t).createTextNode(s),t[Nt]=n,n.stateNode=t}return Qe(n),null;case 31:if(a=n.memoizedState,t===null||t.memoizedState!==null){if(s=hs(n),a!==null){if(t===null){if(!s)throw Error(r(318));if(t=n.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(r(557));t[Nt]=n}else Tr(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Qe(n),t=!1}else a=df(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return n.flags&256?(ii(n),n):(ii(n),null);if((n.flags&128)!==0)throw Error(r(558))}return Qe(n),null;case 13:if(s=n.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(u=hs(n),s!==null&&s.dehydrated!==null){if(t===null){if(!u)throw Error(r(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(r(317));u[Nt]=n}else Tr(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Qe(n),u=!1}else u=df(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=u),u=!0;if(!u)return n.flags&256?(ii(n),n):(ii(n),null)}return ii(n),(n.flags&128)!==0?(n.lanes=a,n):(a=s!==null,t=t!==null&&t.memoizedState!==null,a&&(s=n.child,u=null,s.alternate!==null&&s.alternate.memoizedState!==null&&s.alternate.memoizedState.cachePool!==null&&(u=s.alternate.memoizedState.cachePool.pool),f=null,s.memoizedState!==null&&s.memoizedState.cachePool!==null&&(f=s.memoizedState.cachePool.pool),f!==u&&(s.flags|=2048)),a!==t&&a&&(n.child.flags|=8192),_u(n,n.updateQueue),Qe(n),null);case 4:return b(),t===null&&Ih(n.stateNode.containerInfo),n.flags|=67108864,Qe(n),null;case 10:return da(n.type),Qe(n),null;case 19:if(Rf(n),s=n.memoizedState,s===null)return Qe(n),null;if(u=(n.flags&128)!==0,f=s.rendering,f===null)if(u)Vo(s,!1);else{if(on!==0||t!==null&&(t.flags&128)!==0)for(t=n.child;t!==null;){if(f=nu(t),f!==null){for(n.flags|=128,Vo(s,!1),t=f.updateQueue,n.updateQueue=t,_u(n,t),n.subtreeFlags=0,t=a,a=n.child;a!==null;)Fm(a,t),a=a.sibling;return Io(n,wn.current&1|2),xe&&fa(n,s.treeForkCount),n.child}t=t.sibling}s.tail!==null&&q()>wu&&(n.flags|=128,u=!0,Vo(s,!1),n.lanes=4194304)}else{if(!u)if(t=nu(f),t!==null){if(n.flags|=128,u=!0,t=t.updateQueue,n.updateQueue=t,_u(n,t),Vo(s,!0),s.tail===null&&s.tailMode!=="collapsed"&&s.tailMode!=="visible"&&!f.alternate&&!xe)return Qe(n),null}else 2*q()-s.renderingStartTime>wu&&a!==536870912&&(n.flags|=128,u=!0,Vo(s,!1),n.lanes=4194304);s.isBackwards?(f.sibling=n.child,n.child=f):(t=s.last,t!==null?t.sibling=f:n.child=f,s.last=f)}if(s.tail!==null){t=s.tail;t:{for(a=t;a!==null;){if(a.alternate!==null){a=!1;break t}a=a.sibling}a=!0}return s.rendering=t,s.tail=t.sibling,s.renderingStartTime=q(),t.sibling=null,f=wn.current,f=u?f&1|2:f&1,s.tailMode==="visible"||s.tailMode==="collapsed"||!a||xe?Io(n,f):(a=f,_t(Cn,n),_t(wn,a),zn===null&&(zn=n)),xe&&fa(n,s.treeForkCount),t}return Qe(n),null;case 22:case 23:return ii(n),bf(),s=n.memoizedState!==null,t!==null?t.memoizedState!==null!==s&&(n.flags|=8192):s&&(n.flags|=8192),s?(a&536870912)!==0&&(n.flags&128)===0&&(Qe(n),n.subtreeFlags&6&&(n.flags|=8192)):Qe(n),a=n.updateQueue,a!==null&&_u(n,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),s=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(s=n.memoizedState.cachePool.pool),s!==a&&(n.flags|=2048),t!==null&&G(wr),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),n.memoizedState.cache!==a&&(n.flags|=2048),da(hn),Qe(n),null;case 25:return null;case 30:return n.flags|=33554432,Qe(n),null}throw Error(r(156,n.tag))}function hS(t,n){switch(ff(n),n.tag){case 1:return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 3:return da(hn),b(),t=n.flags,(t&65536)!==0&&(t&128)===0?(n.flags=t&-65537|128,n):null;case 26:case 27:case 5:return dt(n),null;case 31:if(n.memoizedState!==null){if(ii(n),n.alternate===null)throw Error(r(340));Tr()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 13:if(ii(n),t=n.memoizedState,t!==null&&t.dehydrated!==null){if(n.alternate===null)throw Error(r(340));Tr()}return t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 19:return Rf(n),t=n.flags,t&65536?(n.flags=t&-65537|128,t=n.memoizedState,t!==null&&(t.rendering=null,t.tail=null),n.flags|=4,n):null;case 4:return b(),null;case 10:return da(n.type),null;case 22:case 23:return ii(n),bf(),t!==null&&G(wr),t=n.flags,t&65536?(n.flags=t&-65537|128,n):null;case 24:return da(hn),null;case 25:return null;default:return null}}function d0(t,n){switch(ff(n),n.tag){case 3:da(hn),b();break;case 26:case 27:case 5:dt(n);break;case 4:b();break;case 31:n.memoizedState!==null&&ii(n);break;case 13:ii(n);break;case 19:Rf(n);break;case 10:da(n.type);break;case 22:case 23:ii(n),bf(),t!==null&&G(wr);break;case 24:da(hn)}}function ko(t,n){try{var a=n.updateQueue,s=a!==null?a.lastEffect:null;if(s!==null){var u=s.next;a=u;do{if((a.tag&t)===t){s=void 0;var f=a.create,v=a.inst;s=f(),v.destroy=s}a=a.next}while(a!==u)}}catch(T){ke(n,n.return,T)}}function qa(t,n,a){try{var s=n.updateQueue,u=s!==null?s.lastEffect:null;if(u!==null){var f=u.next;s=f;do{if((s.tag&t)===t){var v=s.inst,T=v.destroy;if(T!==void 0){v.destroy=void 0,u=n;var z=a,K=T;try{K()}catch(st){ke(u,z,st)}}}s=s.next}while(s!==f)}}catch(st){ke(n,n.return,st)}}function p0(t){var n=t.updateQueue;if(n!==null){var a=t.stateNode;try{ig(n,a)}catch(s){ke(t,t.return,s)}}}function m0(t,n,a){a.props=Or(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(s){ke(t,n,s)}}function Vi(t,n){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var s=t.stateNode;break;case 30:var u=t.stateNode,f=la(t.memoizedProps,u);(u.ref===null||u.ref.name!==f)&&(u.ref=M_(f)),s=u.ref;break;case 7:if(t.stateNode===null){var v=new li(t);m(t.child,!1,nM,v,void 0,void 0),t.stateNode=v}s=t.stateNode;break;default:s=t.stateNode}typeof a=="function"?t.refCleanup=a(s):a.current=s}}catch(T){ke(t,n,T)}}function Dn(t,n){var a=t.ref,s=t.refCleanup;if(a!==null)if(typeof s=="function")try{s()}catch(u){ke(t,n,u)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(u){ke(t,n,u)}else a.current=null}function vu(t,n){if((t.tag===5||t.tag===27||t.tag===6)&&t.alternate===null&&n!==null)for(var a=0;a<n.length;a++)C_(t.stateNode,n[a])}function g0(t){for(var n=t.return;n!==null&&(ah(n)&&C_(t.stateNode,n.stateNode),!ih(n));)n=n.return}function Xo(t){for(var n=t.return;n!==null&&(ah(n)&&iM(t.stateNode,n.stateNode),!ih(n));)n=n.return}function ih(t){return t.tag===5||t.tag===3||t.tag===27}function ah(t){return t&&t.tag===7&&t.stateNode!==null}function rh(t){var n=t.type,a=t.memoizedProps,s=t.stateNode;try{t:switch(n){case"button":case"input":case"select":case"textarea":a.autoFocus&&s.focus();break t;case"img":a.src?s.src=a.src:a.srcSet&&(s.srcset=a.srcSet)}}catch(u){ke(t,t.return,u)}}function sh(t,n,a){try{var s=t.stateNode;BS(s,t.type,a,n),s[Zt]=n}catch(u){ke(t,t.return,u)}}function _0(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&Ja(t.type)||t.tag===4}function oh(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||_0(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&Ja(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function lh(t,n,a,s){var u=t.tag;if(u===5||u===6)u=t.stateNode,n?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(u,n):(n=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,n.appendChild(u),a=a._reactRootContainer,a!=null||n.onclick!==null||(n.onclick=Fi)),vu(t,s),Le=!0;else if(u!==4&&(u===27&&(vu(t,s),s=null,Ja(t.type)&&(a=t.stateNode,n=null)),t=t.child,t!==null))for(lh(t,n,a,s),t=t.sibling;t!==null;)lh(t,n,a,s),t=t.sibling}function xu(t,n,a,s){var u=t.tag;if(u===5||u===6)u=t.stateNode,n?a.insertBefore(u,n):a.appendChild(u),vu(t,s),Le=!0;else if(u!==4&&(u===27&&(vu(t,s),s=null,Ja(t.type)&&(a=t.stateNode)),t=t.child,t!==null))for(xu(t,n,a,s),t=t.sibling;t!==null;)xu(t,n,a,s),t=t.sibling}function v0(t){var n=t.stateNode,a=t.memoizedProps;try{for(var s=t.type,u=n.attributes;u.length;)n.removeAttributeNode(u[0]);Un(n,s,a),n[Nt]=t,n[Zt]=a}catch(f){ke(t,t.return,f)}}var yu=!1,ai=null;function x0(t){(t.tag===30||(t.subtreeFlags&33554432)!==0)&&(yu=!0)}var ki=null;function y0(){var t=ki;return ki=null,t}var Wn=0;function ys(t,n,a,s,u){return Wn=0,S0(t.child,n,a,s,u)}function S0(t,n,a,s,u){for(var f=!1;t!==null;){if(t.tag===5){var v=t.stateNode;if(s!==null){var T=qh(v);s.push(T),T.view&&(f=!0)}else f||qh(v).view&&(f=!0);yu=!0,y_(v,Wn===0?n:n+"_"+Wn,a),Wn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&u||S0(t.child,n,a,s,u)&&(f=!0));t=t.sibling}return f}function Xi(t,n){for(;t!==null;)t.tag===5?S_(t.stateNode,t.memoizedProps):(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&n||Xi(t.child,n)),t=t.sibling}function Su(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if((t.tag!==22||t.memoizedState===null)&&(Su(t),t.tag===30&&(t.flags&18874368)!==0&&t.stateNode.paired)){var n=t.memoizedProps;if(n.name==null||n.name==="auto")throw Error(r(544));var a=n.name;n=ua(n.default,n.share),n!=="none"&&(ys(t,a,n,null,!1)||Xi(t.child,!1))}t=t.sibling}}function uh(t,n){if(t.tag===30){var a=t.stateNode,s=t.memoizedProps,u=la(s,a),f=ua(s.default,a.paired?s.share:s.enter);f!=="none"?ys(t,u,f,null,!1)?(Su(t),a.paired||n||Cs(t,s.onEnter)):Xi(t.child,!1):Su(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)uh(t,n),t=t.sibling;else Su(t)}function ch(t){if(ai!==null&&ai.size!==0){var n=ai;if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var a=t.memoizedProps,s=a.name;if(s!=null&&s!=="auto"){var u=n.get(s);if(u!==void 0){var f=ua(a.default,a.share);if(f!=="none"&&(ys(t,s,f,null,!1)?(f=t.stateNode,u.paired=f,f.paired=u,Cs(t,a.onShare)):Xi(t.child,!1)),n.delete(s),n.size===0)break}}}ch(t)}t=t.sibling}}}function fh(t){if(t.tag===30){var n=t.memoizedProps,a=la(n,t.stateNode),s=ai!==null?ai.get(a):void 0,u=ua(n.default,s!==void 0?n.share:n.exit);u!=="none"&&(ys(t,a,u,null,!1)?s!==void 0?(u=t.stateNode,s.paired=u,u.paired=s,ai.delete(a),Cs(t,n.onShare)):Cs(t,n.onExit):Xi(t.child,!1)),ai!==null&&ch(t)}else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)fh(t),t=t.sibling;else ai!==null&&ch(t)}function M0(t){for(t=t.child;t!==null;){if(t.tag===30){var n=t.memoizedProps,a=la(n,t.stateNode);n=ua(n.default,n.update),t.flags&=-5,n!=="none"&&ys(t,a,n,t.memoizedState=[],!1)}else(t.subtreeFlags&33554432)!==0&&M0(t);t=t.sibling}}function hh(t){if((t.subtreeFlags&18874368)!==0)for(t=t.child;t!==null;){if(t.tag!==22||t.memoizedState===null){if(t.tag===30&&(t.flags&18874368)!==0){var n=t.stateNode;n.paired!==null&&(n.paired=null,Xi(t.child,!1))}hh(t)}t=t.sibling}}function Mu(t){if(t.tag===30)t.stateNode.paired=null,Xi(t.child,!1),hh(t);else if((t.subtreeFlags&33554432)!==0)for(t=t.child;t!==null;)Mu(t),t=t.sibling;else hh(t)}function E0(t){for(t=t.child;t!==null;)t.tag===30?Xi(t.child,!1):(t.subtreeFlags&33554432)!==0&&E0(t),t=t.sibling}function dh(t,n,a,s,u,f,v){for(var T=!1;n!==null;){if(n.tag===5){var z=n.stateNode;if(f!==null&&Wn<f.length){var K=f[Wn],st=qh(z);(K.view||st.view)&&(T=!0);var vt;if(vt=(t.flags&4)===0)if(st.clip)vt=!0;else{vt=K.rect;var W=st.rect;vt=vt.y!==W.y||vt.x!==W.x||vt.height!==W.height||vt.width!==W.width}vt&&(t.flags|=4),st.abs?st=!K.abs:(K=K.rect,st=st.rect,st=K.height!==st.height||K.width!==st.width),st&&(t.flags|=32)}else t.flags|=32;(t.flags&4)!==0&&y_(z,Wn===0?a:a+"_"+Wn,u),T&&(t.flags&4)!==0||(ki===null&&(ki=[]),ki.push(z,Wn===0?s:s+"_"+Wn,n.memoizedProps)),Wn++}else(n.tag!==22||n.memoizedState===null)&&(n.tag===30&&v?t.flags|=n.flags&32:dh(t,n.child,a,s,u,f,v)&&(T=!0));n=n.sibling}return T}function T0(t,n){for(t=t.child;t!==null;){if(t.tag===30){var a=t.memoizedProps,s=t.stateNode,u=la(a,s),f=ua(a.default,a.update),v;v=t.memoizedState,t.memoizedState=null,s=t;var T=t.child;Wn=0,u=dh(s,T,u,u,f,v,!1),(t.flags&4)!==0&&u&&Cs(t,a.onUpdate)}else(t.subtreeFlags&33554432)!==0&&T0(t);t=t.sibling}}var En=!1,Ge=!1,qi=!1,ph=!1,b0=typeof WeakSet=="function"?WeakSet:Set,Tn=null,Yi=!1,qo=!1,Eu=!1,mh=!1;function dS(t,n,a){if(t=t.containerInfo,Hh=Bs,t=wm(t),tf(t)){if("selectionStart"in t)var s={start:t.selectionStart,end:t.selectionEnd};else t:{s=(s=t.ownerDocument)&&s.defaultView||window;var u=s.getSelection&&s.getSelection();if(u&&u.rangeCount!==0){s=u.anchorNode;var f=u.anchorOffset,v=u.focusNode;u=u.focusOffset;try{s.nodeType,v.nodeType}catch{s=null;break t}var T=0,z=-1,K=-1,st=0,vt=0,W=t,at=null;e:for(;;){for(var zt;W!==s||f!==0&&W.nodeType!==3||(z=T+f),W!==v||u!==0&&W.nodeType!==3||(K=T+u),W.nodeType===3&&(T+=W.nodeValue.length),(zt=W.firstChild)!==null;)at=W,W=zt;for(;;){if(W===t)break e;if(at===s&&++st===f&&(z=T),at===v&&++vt===u&&(K=T),(zt=W.nextSibling)!==null)break;W=at,at=W.parentNode}W=zt}s=z===-1||K===-1?null:{start:z,end:K}}else s=null}s=s||{start:0,end:0}}else s=null;for(Gh={focusedElem:t,selectionRange:s},Bs=!1,a=(a&335544064)===a,Tn=n,n=a?9270:1024;Tn!==null;){if(t=Tn,a&&(s=t.deletions,s!==null))for(f=0;f<s.length;f++)a&&fh(s[f]);if(t.alternate===null&&(t.flags&2)!==0)a&&x0(t),Tu(a);else{if(t.tag===22){if(s=t.alternate,t.memoizedState!==null){s!==null&&s.memoizedState===null&&a&&fh(s),Tu(a);continue}else if(s!==null&&s.memoizedState!==null){a&&x0(t),Tu(a);continue}}s=t.child,(t.subtreeFlags&n)!==0&&s!==null?(s.return=t,Tn=s):(a&&M0(t),Tu(a))}}ai=null}function Tu(t){for(;Tn!==null;){var n=Tn,a=t,s=n.alternate,u=n.flags;switch(n.tag){case 0:case 11:case 15:break;case 1:if((u&1024)!==0&&s!==null){a=void 0,u=s.memoizedProps,s=s.memoizedState;var f=n.stateNode;try{var v=Or(n.type,u);a=f.getSnapshotBeforeUpdate(v,s),f.__reactInternalSnapshotBeforeUpdate=a}catch(T){ke(n,n.return,T)}}break;case 3:if((u&1024)!==0){if(s=n.stateNode.containerInfo,a=s.nodeType,a===9)Wh(s);else if(a===1)switch(s.nodeName){case"HEAD":case"HTML":case"BODY":Wh(s);break;default:s.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&s!==null&&(a=la(s.memoizedProps,s.stateNode),u=n.memoizedProps,u=ua(u.default,u.update),u!=="none"&&ys(s,a,u,s.memoizedState=[],!0));break;default:if((u&1024)!==0)throw Error(r(163))}if(s=n.sibling,s!==null){s.return=n.return,Tn=s;break}Tn=n.return}}function A0(t,n,a){var s=a.flags;switch(a.tag){case 0:case 11:case 15:ji(t,a),s&4&&ko(5,a);break;case 1:if(ji(t,a),s&4)if(t=a.stateNode,n===null)try{t.componentDidMount()}catch(v){ke(a,a.return,v)}else{var u=Or(a.type,n.memoizedProps);n=n.memoizedState;try{t.componentDidUpdate(u,n,t.__reactInternalSnapshotBeforeUpdate)}catch(v){ke(a,a.return,v)}}s&64&&p0(a),s&512&&Vi(a,a.return);break;case 3:if(ji(t,a),s&64&&(t=a.updateQueue,t!==null)){if(n=null,a.child!==null)switch(a.child.tag){case 27:case 5:n=a.child.stateNode;break;case 1:n=a.child.stateNode}try{ig(t,n)}catch(v){ke(a,a.return,v)}}break;case 27:n===null&&s&4&&v0(a);case 26:case 5:ji(t,a),n===null&&s&4&&rh(a),s&512&&Vi(a,a.return);break;case 12:ji(t,a);break;case 31:ji(t,a),s&4&&D0(t,a);break;case 13:ji(t,a),s&4&&U0(t,a),s&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=bS.bind(null,a),sM(t,a))));break;case 22:if(s=a.memoizedState!==null||En,!s){var f=n!==null&&n.memoizedState!==null||Ge;n=En,u=Ge,En=s,(Ge=f)&&!u?(s=2,(a.subtreeFlags&8772)!==0&&(s|=1),Ri(t,a,s)):ji(t,a),En=n,Ge=u}break;case 30:ji(t,a),s&512&&Vi(a,a.return);break;case 7:s&512&&Vi(a,a.return);default:ji(t,a)}}function gh(t,n){for(t=t.child;t!==null;)R0(t,n),t=t.sibling}function R0(t,n){switch(t.tag){case 5:case 26:try{var a=t.stateNode;if(n){var s=a.style;typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"}else{var u=t.stateNode,f=t.memoizedProps.style,v=f!=null&&f.hasOwnProperty("display")?f.display:null;u.style.display=v==null||typeof v=="boolean"?"":(""+v).trim()}}catch(z){ke(t,t.return,z)}_h(t,n);break;case 6:try{t.stateNode.nodeValue=n?"":t.memoizedProps,Le=!0}catch(z){ke(t,t.return,z)}break;case 18:try{var T=t.stateNode;n?x_(T,!0):x_(t.stateNode,!1)}catch(z){ke(t,t.return,z)}break;case 22:case 23:t.memoizedState===null&&gh(t,n);break;default:gh(t,n)}}function _h(t,n){if(t.subtreeFlags&67108864)for(t=t.child;t!==null;){t:{var a=t,s=n;switch(a.tag){case 4:R0(a,s);break t;case 22:a.memoizedState===null&&_h(a,s);break t;default:_h(a,s)}}t=t.sibling}}function C0(t){var n=t.alternate;n!==null&&(t.alternate=null,C0(n)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(n=t.stateNode,n!==null&&re(n)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var tn=null,Zn=!1;function bi(t,n,a){for(a=a.child;a!==null;)w0(t,n,a),a=a.sibling}function w0(t,n,a){if(en&&typeof en.onCommitFiberUnmount=="function")try{en.onCommitFiberUnmount(be,a)}catch{}switch(a.tag){case 26:Ge||Dn(a,n),bi(t,n,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!Ge&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:Ge||Dn(a,n),Xo(a);var s=tn,u=Zn;Ja(a.type)&&(tn=a.stateNode,Zn=!1),bi(t,n,a),L_(a.stateNode,a.type,a.memoizedProps),tn=s,Zn=u;break;case 5:Ge||Dn(a,n),Xo(a);case 6:if(a.tag===6&&Xo(a),s=tn,u=Zn,tn=null,bi(t,n,a),tn=s,Zn=u,tn!==null)if(Zn)try{(tn.nodeType===9?tn.body:tn.nodeName==="HTML"?tn.ownerDocument.body:tn).removeChild(a.stateNode),Le=!0}catch(f){ke(a,n,f)}else try{tn.removeChild(a.stateNode),Le=!0}catch(f){ke(a,n,f)}break;case 18:tn!==null&&(Zn?(t=tn,v_(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),Fs(t)):v_(tn,a.stateNode));break;case 4:s=tn,u=Zn,tn=a.stateNode.containerInfo,Zn=!0,bi(t,n,a),tn=s,Zn=u;break;case 0:case 11:case 14:case 15:qa(2,a,n),Ge||qa(4,a,n),bi(t,n,a);break;case 1:Ge||(Dn(a,n),s=a.stateNode,typeof s.componentWillUnmount=="function"&&m0(a,n,s)),bi(t,n,a);break;case 21:bi(t,n,a);break;case 22:Ge=(s=Ge)||a.memoizedState!==null,bi(t,n,a),Ge=s;break;case 30:Dn(a,n),bi(t,n,a);break;case 7:Ge||Dn(a,n),bi(t,n,a);break;default:bi(t,n,a)}}function D0(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{Fs(t)}catch(a){ke(n,n.return,a)}}}function U0(t,n){if(n.memoizedState===null&&(t=n.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{Fs(t)}catch(a){ke(n,n.return,a)}}function pS(t){switch(t.tag){case 31:case 13:case 19:var n=t.stateNode;return n===null&&(n=t.stateNode=new b0),n;case 22:return t=t.stateNode,n=t._retryCache,n===null&&(n=t._retryCache=new b0),n;default:throw Error(r(435,t.tag))}}function bu(t,n){var a=pS(t);n.forEach(function(s){if(!a.has(s)){a.add(s);var u=AS.bind(null,t,s);s.then(u,u)}})}function Gn(t,n,a){var s=n.deletions;if(s!==null)for(var u=0;u<s.length;u++){var f=s[u],v=t,T=n,z=T;t:for(;z!==null;){switch(z.tag){case 27:if(Ja(z.type)){tn=z.stateNode,Zn=!1;break t}break;case 5:tn=z.stateNode,Zn=!1;break t;case 3:case 4:tn=z.stateNode.containerInfo,Zn=!0;break t}z=z.return}if(tn===null)throw Error(r(160));w0(v,T,f),tn=null,Zn=!1,v=f.alternate,v!==null&&(v.return=null),f.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)N0(n,t,a),n=n.sibling}var Ai=null;function N0(t,n,a){var s=t.alternate,u=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(u&4&&(s=t.updateQueue,s=s!==null?s.events:null,s!==null))for(var f=0;f<s.length;f++){var v=s[f];v.ref.impl=v.nextImpl}Gn(n,t,a),Vn(t),u&4&&(qa(3,t,t.return),ko(3,t),qa(5,t,t.return));break;case 1:Gn(n,t,a),Vn(t),u&512&&(Ge||s===null||Dn(s,s.return)),u&64&&En&&(t=t.updateQueue,t!==null&&(n=t.callbacks,n!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?n:a.concat(n))));break;case 26:if(f=Ai,Gn(n,t,a),Vn(t),u&512&&(Ge||s===null||Dn(s,s.return)),u&4)if(u=s!==null?s.memoizedState:null,a=t.memoizedState,s===null)if(a===null)if(t.stateNode===null)if(En)t.stateNode=m_(t.type,t.memoizedProps,n.containerInfo,t);else{t:{n=t.type,a=t.memoizedProps,u=f.ownerDocument||f;e:switch(n){case"title":s=u.getElementsByTagName("title")[0],(!s||s[Pe]||s[Nt]||s.namespaceURI==="http://www.w3.org/2000/svg"||s.hasAttribute("itemprop"))&&(s=u.createElement(n),u.head.insertBefore(s,u.querySelector("head > title"))),Un(s,n,a),s[Nt]=t,Ne(s),n=s;break t;case"link":if(f=F_("link","href",u).get(n+(a.href||""))){for(v=0;v<f.length;v++)if(s=f[v],s.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&s.getAttribute("rel")===(a.rel==null?null:a.rel)&&s.getAttribute("title")===(a.title==null?null:a.title)&&s.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){f.splice(v,1);break e}}s=u.createElement(n),Un(s,n,a),u.head.appendChild(s);break;case"meta":if(f=F_("meta","content",u).get(n+(a.content||""))){for(v=0;v<f.length;v++)if(s=f[v],s.getAttribute("content")===(a.content==null?null:""+a.content)&&s.getAttribute("name")===(a.name==null?null:a.name)&&s.getAttribute("property")===(a.property==null?null:a.property)&&s.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&s.getAttribute("charset")===(a.charSet==null?null:a.charSet)){f.splice(v,1);break e}}s=u.createElement(n),Un(s,n,a),u.head.appendChild(s);break;default:throw Error(r(468,n))}s[Nt]=t,Ne(s),n=s}t.stateNode=n}else En||ed(f,t.type,t.stateNode);else t.stateNode=B_(f,a,t.memoizedProps);else u!==a?(u===null?(n=s.stateNode,n===null||Ge||n.parentNode.removeChild(n)):u.count--,a===null?En||ed(f,t.type,t.stateNode):B_(f,a,t.memoizedProps)):a===null&&t.stateNode!==null&&sh(t,t.memoizedProps,s.memoizedProps);break;case 27:Gn(n,t,a),Vn(t),u&512&&(Ge||s===null||Dn(s,s.return)),s!==null&&u&4&&sh(t,t.memoizedProps,s.memoizedProps);break;case 5:if(f=qi,qi=!1,Gn(n,t,a),qi=f,Vn(t),u&512&&(Ge||s===null||Dn(s,s.return)),t.flags&32){n=t.stateNode;try{ns(n,""),Le=!0}catch(st){ke(t,t.return,st)}}u&4&&t.stateNode!=null&&(n=t.memoizedProps,sh(t,n,s!==null?s.memoizedProps:n)),u&1024&&(ph=!0);break;case 6:if(Gn(n,t,a),Vn(t),u&4){if(t.stateNode===null)throw Error(r(162));n=t.memoizedProps,a=t.stateNode;try{a.nodeValue=n,Le=!0}catch(st){ke(t,t.return,st)}}break;case 3:if(Le=!1,Hu=null,f=Ai,Ai=tl(n.containerInfo),Gn(n,t,a),Ai=f,Vn(t),u&4&&s!==null&&s.memoizedState.isDehydrated)try{Fs(n.containerInfo)}catch(st){ke(t,t.return,st)}ph&&(ph=!1,L0(t)),Le=!1;break;case 4:u=qi,qi=En,s=$p(),f=Ai,Ai=tl(t.stateNode.containerInfo),Gn(n,t,a),Vn(t),Ai=f,Le&&qo&&(Eu=!0),Le=s,qi=u;break;case 12:Gn(n,t,a),Vn(t);break;case 31:Gn(n,t,a),Vn(t),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,bu(t,n)));break;case 13:Gn(n,t,a),Vn(t),t.child.flags&8192&&t.memoizedState!==null!=(s!==null&&s.memoizedState!==null)&&(Cu=q()),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,bu(t,n)));break;case 22:f=t.memoizedState!==null,v=s!==null&&s.memoizedState!==null;var T=En,z=Ge,K=qi;En=T||f,qi=K||f,Ge=z||v,Gn(n,t,a),Ge=z,qi=K,En=T,Vn(t),u&8192&&(n=t.stateNode,n._visibility=f?n._visibility&-2:n._visibility|1,!f||s===null||v||En||Ge||(n=v||Ge,a=En,s=Ge,En=f||En,Ge=n,Ya(t,2),En=a,Ge=s),!f&&qi||gh(t,f)),u&4&&(n=t.updateQueue,n!==null&&(a=n.retryQueue,a!==null&&(n.retryQueue=null,bu(t,a))));break;case 19:Gn(n,t,a),Vn(t),u&4&&(n=t.updateQueue,n!==null&&(t.updateQueue=null,bu(t,n)));break;case 30:u&512&&(Ge||s===null||Dn(s,s.return)),u=$p(),f=qo,v=(a&335544064)===a,T=t.memoizedProps,qo=v&&ua(T.default,T.update)!=="none",Gn(n,t,a),Vn(t),v&&s!==null&&Le&&(t.flags|=4),qo=f,Le=u;break;case 21:break;case 7:u&512&&(Ge||s===null||Dn(s,s.return)),s&&s.stateNode!==null&&(s.stateNode._fragmentFiber=t);default:Gn(n,t,a),Vn(t)}}function Vn(t){var n=t.flags;if(n&2){try{for(var a,s=t.return;s!==null;){if(_0(s)){a=s;break}s=s.return}s=null;for(var u=t.return;u!==null;){if(ah(u)){var f=u.stateNode;s===null?s=[f]:s.push(f)}if(ih(u))break;u=u.return}var v=s;if(a==null)throw Error(r(160));switch(a.tag){case 27:var T=a.stateNode,z=oh(t);xu(t,z,T,v);break;case 5:var K=a.stateNode;a.flags&32&&(ns(K,""),a.flags&=-33);var st=oh(t);xu(t,st,K,v);break;case 3:case 4:var vt=a.stateNode.containerInfo,W=oh(t);lh(t,W,vt,v);break;default:throw Error(r(161))}}catch(at){ke(t,t.return,at)}t.flags&=-3}n&4096&&(t.flags&=-4097)}function L0(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var n=t;L0(n),n.tag===5&&n.flags&1024&&(n=n.stateNode,Bs=!0,n.reset(),Bs=!1),t=t.sibling}}function Ss(t,n){if(n.subtreeFlags&9270)for(n=n.child;n!==null;)O0(n,t),n=n.sibling;else T0(n)}function O0(t,n){var a=t.alternate;if(a===null)uh(t,!1);else switch(t.tag){case 3:if(mh=Yi=!1,y0(),Ss(n,t),!Yi&&!Eu){if(t=ki,t!==null)for(var s=0;s<t.length;s+=3){a=t[s];var u=t[s+1];S_(a,t[s+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+u+")"})}t=n.containerInfo,t=t.nodeType===9?t.documentElement:t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName===""&&(t.style.viewTransitionName="none",t.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),t.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),mh=!0}ki=null;break;case 5:Ss(n,t);break;case 4:s=Yi,Yi=!1,Ss(n,t),Yi&&(Eu=!0),Yi=s;break;case 22:t.memoizedState===null&&(a.memoizedState!==null?uh(t,!1):Ss(n,t));break;case 30:s=Yi,u=y0(),Yi=!1,Ss(n,t),Yi&&(t.flags|=4);var f=t.memoizedProps,v=t.stateNode;n=la(f,v),v=la(a.memoizedProps,v);var T=ua(f.default,f.update);T==="none"?n=!1:(f=a.memoizedState,a.memoizedState=null,a=t.child,Wn=0,n=dh(t,a,n,v,T,f,!0),Wn!==(f===null?0:f.length)&&(t.flags|=32)),(t.flags&4)!==0&&n?(Cs(t,t.memoizedProps.onUpdate),ki=u):u!==null&&(u.push.apply(u,ki),ki=u),Yi=(t.flags&32)!==0?!0:s;break;default:Ss(n,t)}}function ji(t,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)A0(t,n.alternate,n),n=n.sibling}function Ya(t,n){for(t=t.child;t!==null;){var a=t,s=n;switch(a.tag){case 0:case 11:case 14:case 15:qa(4,a,a.return),Ya(a,s);break;case 1:Dn(a,a.return);var u=a.stateNode;typeof u.componentWillUnmount=="function"&&m0(a,a.return,u),Ya(a,s);break;case 27:(s&2)!==0&&L_(a.stateNode,a.type,a.memoizedProps);case 5:Dn(a,a.return),a.tag!==5&&a.tag!==27||Xo(a),Ya(a,s);break;case 6:Xo(a);break;case 26:Dn(a,a.return),u=a.stateNode,a.memoizedState!==null||u===null||Ge||u.parentNode.removeChild(u),Ya(a,s);break;case 22:a.memoizedState===null&&Ya(a,s);break;case 30:Dn(a,a.return),Ya(a,s);break;case 7:Dn(a,a.return);default:Ya(a,s)}t=t.sibling}}function Ri(t,n,a){for(a=(n.subtreeFlags&8772)!==0?a:a&-2,n=n.child;n!==null;){var s=n.alternate,u=t,f=n,v=f.flags,T=(a&1)!==0;switch(f.tag){case 0:case 11:case 15:Ri(u,f,a),ko(4,f);break;case 1:if(Ri(u,f,a),s=f,u=s.stateNode,typeof u.componentDidMount=="function")try{u.componentDidMount()}catch(st){ke(s,s.return,st)}if(s=f,u=s.updateQueue,u!==null){var z=s.stateNode;try{var K=u.shared.hiddenCallbacks;if(K!==null)for(u.shared.hiddenCallbacks=null,u=0;u<K.length;u++)ng(K[u],z)}catch(st){ke(s,s.return,st)}}T&&v&64&&p0(f),Vi(f,f.return);break;case 27:(a&2)!==0&&v0(f);case 5:f.tag!==5&&f.tag!==27||g0(f),Ri(u,f,a),T&&s===null&&v&4&&rh(f),Vi(f,f.return);break;case 6:g0(f);break;case 26:z=f.stateNode,f.memoizedState!==null||z===null||En||ed(tl(z.ownerDocument),f.type,z),Ri(u,f,a),T&&s===null&&v&4&&rh(f),Vi(f,f.return);break;case 12:Ri(u,f,a);break;case 31:Ri(u,f,a),T&&v&4&&D0(u,f);break;case 13:Ri(u,f,a),T&&v&4&&U0(u,f);break;case 22:f.memoizedState===null&&Ri(u,f,a),Vi(f,f.return);break;case 30:Ri(u,f,a),Vi(f,f.return);break;case 7:Vi(f,f.return);default:Ri(u,f,a)}n=n.sibling}}function vh(t,n){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(t=n.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&Do(a))}function xh(t,n){t=null,n.alternate!==null&&(t=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==t&&(n.refCount++,t!=null&&Do(t))}function vi(t,n,a,s){var u=(a&335544064)===a;if(n.subtreeFlags&(u?10262:10256))for(n=n.child;n!==null;)z0(t,n,a,s),n=n.sibling;else u&&E0(n)}function z0(t,n,a,s){var u=(a&335544064)===a;u&&n.alternate===null&&n.return!==null&&n.return.alternate!==null&&Mu(n);var f=n.flags;switch(n.tag){case 0:case 11:case 15:vi(t,n,a,s),f&2048&&ko(9,n);break;case 1:vi(t,n,a,s);break;case 3:vi(t,n,a,s),u&&mh&&(t=t.containerInfo,t=t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,t.style.viewTransitionName==="root"&&(t.style.viewTransitionName=""),t=t.ownerDocument.documentElement,t!==null&&t.style.viewTransitionName==="none"&&(t.style.viewTransitionName="")),f&2048&&(f=null,n.alternate!==null&&(f=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==f&&(n.refCount++,f!=null&&Do(f)));break;case 12:if(f&2048){vi(t,n,a,s),f=n.stateNode;try{var v=n.memoizedProps,T=v.id,z=v.onPostCommit;typeof z=="function"&&z(T,n.alternate===null?"mount":"update",f.passiveEffectDuration,-0)}catch(K){ke(n,n.return,K)}}else vi(t,n,a,s);break;case 31:vi(t,n,a,s);break;case 13:vi(t,n,a,s);break;case 23:break;case 22:v=n.stateNode,T=n.alternate,n.memoizedState!==null?(u&&T!==null&&T.memoizedState===null&&Mu(T),v._visibility&2?vi(t,n,a,s):Yo(t,n)):(u&&T!==null&&T.memoizedState!==null&&Mu(n),v._visibility&2?vi(t,n,a,s):(v._visibility|=2,Ms(t,n,a,s,(n.subtreeFlags&10256)!==0||!1))),f&2048&&vh(T,n);break;case 24:vi(t,n,a,s),f&2048&&xh(n.alternate,n);break;case 30:u&&(f=n.alternate,f!==null&&(Xi(f.child,!0),Xi(n.child,!0))),vi(t,n,a,s);break;default:vi(t,n,a,s)}}function Ms(t,n,a,s,u){for(u=u&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var f=t,v=n,T=a,z=s,K=v.flags;switch(v.tag){case 0:case 11:case 15:Ms(f,v,T,z,u),ko(8,v);break;case 23:break;case 22:var st=v.stateNode;v.memoizedState!==null?st._visibility&2?Ms(f,v,T,z,u):Yo(f,v):(st._visibility|=2,Ms(f,v,T,z,u)),u&&K&2048&&vh(v.alternate,v);break;case 24:Ms(f,v,T,z,u),u&&K&2048&&xh(v.alternate,v);break;default:Ms(f,v,T,z,u)}n=n.sibling}}function Yo(t,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var a=t,s=n,u=s.flags;switch(s.tag){case 22:Yo(a,s),u&2048&&vh(s.alternate,s);break;case 24:Yo(a,s),u&2048&&xh(s.alternate,s);break;default:Yo(a,s)}n=n.sibling}}var zr=8192;function Pr(t,n,a){if(t.subtreeFlags&zr)for(t=t.child;t!==null;)P0(t,n,a),t=t.sibling}function P0(t,n,a){switch(t.tag){case 26:Pr(t,n,a),t.flags&zr&&(t.memoizedState!==null?yM(a,Ai,t.memoizedState,t.memoizedProps):(t=t.stateNode,(n&335544128)===n&&k_(a,t)));break;case 5:Pr(t,n,a),t.flags&zr&&(t=t.stateNode,(n&335544128)===n&&k_(a,t));break;case 3:case 4:var s=Ai;Ai=tl(t.stateNode.containerInfo),Pr(t,n,a),Ai=s;break;case 22:t.memoizedState===null&&(s=t.alternate,s!==null&&s.memoizedState!==null?(s=zr,zr=16777216,Pr(t,n,a),zr=s):Pr(t,n,a));break;case 30:if((t.flags&zr)!==0&&(s=t.memoizedProps.name,s!=null&&s!=="auto")){var u=t.stateNode;u.paired=null,ai===null&&(ai=new Map),ai.set(s,u)}Pr(t,n,a);break;default:Pr(t,n,a)}}function I0(t){var n=t.alternate;if(n!==null&&(t=n.child,t!==null)){n.child=null;do n=t.sibling,t.sibling=null,t=n;while(t!==null)}}function jo(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var s=n[a];Tn=s,F0(s,t)}I0(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)B0(t),t=t.sibling}function B0(t){switch(t.tag){case 0:case 11:case 15:jo(t),t.flags&2048&&qa(9,t,t.return);break;case 3:jo(t);break;case 12:jo(t);break;case 22:var n=t.stateNode;t.memoizedState!==null&&n._visibility&2&&(t.return===null||t.return.tag!==13)?(n._visibility&=-3,Au(t)):jo(t);break;default:jo(t)}}function Au(t){var n=t.deletions;if((t.flags&16)!==0){if(n!==null)for(var a=0;a<n.length;a++){var s=n[a];Tn=s,F0(s,t)}I0(t)}for(t=t.child;t!==null;){switch(n=t,n.tag){case 0:case 11:case 15:qa(8,n,n.return),Au(n);break;case 22:a=n.stateNode,a._visibility&2&&(a._visibility&=-3,Au(n));break;default:Au(n)}t=t.sibling}}function F0(t,n){for(;Tn!==null;){var a=Tn;switch(a.tag){case 0:case 11:case 15:qa(8,a,n);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var s=a.memoizedState.cachePool.pool;s!=null&&s.refCount++}break;case 24:Do(a.memoizedState.cache)}if(s=a.child,s!==null)s.return=a,Tn=s;else t:for(a=t;Tn!==null;){s=Tn;var u=s.sibling,f=s.return;if(C0(s),s===a){Tn=null;break t}if(u!==null){u.return=f,Tn=u;break t}Tn=f}}}var mS={getCacheForType:function(t){var n=Rn(hn),a=n.data.get(t);return a===void 0&&(a=t(),n.data.set(t,a)),a},cacheSignal:function(){return Rn(hn).controller.signal}},gS=typeof WeakMap=="function"?WeakMap:Map,Be=0,We=null,Me=null,Ae=0,Ve=0,ri=null,ja=!1,Es=!1,yh=!1,va=0,on=0,Wa=0,Ir=0,Ru=0,si=0,Ts=0,Wo=null,Kn=null,Sh=!1,Cu=0,H0=0,wu=1/0,Du=null,Za=null,nn=0,Ci=null,Br=null,Wi=0,Mh=0,Eh=null,G0=null,bs=null,As=null,Rs=null,Zo=0,Uu=null;function oi(){return(Be&2)!==0&&Ae!==0?Ae&-Ae:Tt.T!==null?Lh():Rt()}function V0(){if(si===0)if((Ae&536870912)===0||xe){var t=ra;ra<<=1,(ra&3932160)===0&&(ra=262144),si=t}else si=536870912;return t=Cn.current,t!==null&&(t.flags|=32),si}function Cs(t,n){if(n!=null){var a=t.stateNode,s=a.ref;s===null&&(s=a.ref=M_(la(t.memoizedProps,a))),As===null&&(As=[]),As.push(n.bind(null,s))}}function Qn(t,n,a){(t===We&&(Ve===2||Ve===9)||t.cancelPendingCommit!==null)&&(ws(t,0),Ka(t,Ae,si,!1)),xr(t,a),((Be&2)===0||t!==We)&&(t===We&&((Be&2)===0&&(Ir|=a),on===4&&Ka(t,Ae,si,!1)),Zi(t))}function k0(t,n,a){if((Be&6)!==0)throw Error(r(327));var s=!a&&(n&127)===0&&(n&t.expiredLanes)===0||Da(t,n),u=s?xS(t,n):bh(t,n,!0),f=s;do{if(u===0){Es&&!s&&Ka(t,n,0,!1);break}else{if(a=t.current.alternate,f&&!_S(a)){u=bh(t,n,!1),f=!1;continue}if(u===2){if(f=n,t.errorRecoveryDisabledLanes&f)var v=0;else v=t.pendingLanes&-536870913,v=v!==0?v:v&536870912?536870912:0;if(v!==0){n=v;t:{var T=t;u=Wo;var z=T.current.memoizedState.isDehydrated;if(z&&(ws(T,v).flags|=256),v=bh(T,v,!1),v!==2&&v!==6){if(yh&&!z){T.errorRecoveryDisabledLanes|=f,Ir|=f,u=4;break t}f=Kn,Kn=u,f!==null&&(Kn===null?Kn=f:Kn.push.apply(Kn,f))}u=v}if(f=!1,u!==2)continue}}if(u===1){ws(t,0),Ka(t,n,0,!0);break}t:{switch(s=t,f=u,f){case 0:case 1:throw Error(r(345));case 4:if((n&4194048)!==n&&(n&62914560)!==n)break;case 6:Ka(s,n,si,!ja);break t;case 2:Kn=null;break;case 3:case 5:break;default:throw Error(r(329))}if((n&62914560)===n&&(u=Cu+300-q(),10<u)){if(Ka(s,n,si,!ja),vr(s,0,!0)!==0)break t;Wi=n,s.timeoutHandle=Xh(X0.bind(null,s,a,Kn,Du,Sh,n,si,Ir,Ts,ja,f,"Throttled",-0,0),u);break t}X0(s,a,Kn,Du,Sh,n,si,Ir,Ts,ja,f,null,-0,0)}}break}while(!0);Zi(t)}function X0(t,n,a,s,u,f,v,T,z,K,st,vt,W,at){t.timeoutHandle=-1;var zt=n.subtreeFlags,Kt=(f&335544064)===f;if(vt=null,(Kt||zt&8192||(zt&16785408)===16785408)&&(vt={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Fi},ai=null,P0(n,f,vt),Kt&&(zt=vt,Kt=t.containerInfo,Kt=(Kt.nodeType===9?Kt:Kt.ownerDocument).__reactViewTransition,Kt!=null&&(zt.count++,zt.waitingForViewTransition=!0,zt=il.bind(zt),Kt.finished.then(zt,zt))),zt=(f&62914560)===f?Cu-q():(f&4194048)===f?H0-q():0,zt=SM(vt,zt),zt!==null)){Wi=f,t.cancelPendingCommit=zt(J0.bind(null,t,n,f,a,s,u,v,T,z,K,st,vt,null,W,at)),Ka(t,f,v,!K);return}J0(t,n,f,a,s,u,v,T,z,K,st,vt)}function _S(t){for(var n=t;;){var a=n.tag;if((a===0||a===11||a===15)&&n.flags&16384&&(a=n.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var s=0;s<a.length;s++){var u=a[s],f=u.getSnapshot;u=u.value;try{if(!ni(f(),u))return!1}catch{return!1}}if(a=n.child,n.subtreeFlags&16384&&a!==null)a.return=n,n=a;else{if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Ka(t,n,a,s){n=Cl(t,n),n&=~Ru,n&=~Ir,t.suspendedLanes|=n,t.pingedLanes&=~n,s&&(t.warmLanes|=n),s=t.expirationTimes;for(var u=n;0<u;){var f=31-Ln(u),v=1<<f;s[f]=-1,u&=~v}a!==0&&C(t,a,n)}function Nu(){return(Be&6)===0?(Ko(0),!1):!0}function Th(){if(Me!==null){if(Ve===0)var t=Me.return;else t=Me,ha=br=null,Nf(t),ms=null,Lo=0,t=Me;for(;t!==null;)d0(t.alternate,t),t=t.return;Me=null}}function ws(t,n){var a=t.timeoutHandle;return a!==-1&&(t.timeoutHandle=-1,GS(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),Wi=0,Th(),We=t,Me=a=ca(t.current,null),Ae=n,Ve=0,ri=null,ja=!1,Es=Da(t,n),yh=!1,Ts=si=Ru=Ir=Wa=on=0,Kn=Wo=null,Sh=!1,va=Cl(t,n),Hl(),a}function q0(t,n){pe=null,Tt.H=fu,n===ps||n===Ql?(n=Jm(),Ve=3):n===xf?(n=Jm(),Ve=4):Ve=n===jf?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,ri=n,Me===null&&(on=1,hu(t,pi(n,t.current)))}function Y0(){var t=Cn.current;return t===null?!0:(Ae&4194048)===Ae?zn===null:(Ae&62914560)===Ae||(Ae&536870912)!==0?t===zn:!1}function j0(){var t=Tt.H;return Tt.H=fu,t===null?fu:t}function W0(){var t=Tt.A;return Tt.A=mS,t}function Lu(){on=4,ja||(Ae&4194048)!==Ae&&Cn.current!==null||(Es=!0),(Wa&134217727)===0&&(Ir&134217727)===0||We===null||Ka(We,Ae,si,!1)}function bh(t,n,a){var s=Be;Be|=2;var u=j0(),f=W0();(We!==t||Ae!==n)&&(Du=null,ws(t,n)),n=!1;var v=on;t:do try{if(Ve!==0&&Me!==null){var T=Me,z=ri;switch(Ve){case 8:Th(),v=6;break t;case 3:case 2:case 9:case 6:Cn.current===null&&(n=!0);var K=Ve;if(Ve=0,ri=null,Ds(t,T,z,K),a&&Es){v=0;break t}break;default:K=Ve,Ve=0,ri=null,Ds(t,T,z,K)}}vS(),v=on;break}catch(st){q0(t,st)}while(!0);return n&&t.shellSuspendCounter++,ha=br=null,Be=s,Tt.H=u,Tt.A=f,Me===null&&(We=null,Ae=0,Hl()),v}function vS(){for(;Me!==null;)Z0(Me)}function xS(t,n){var a=Be;Be|=2;var s=j0(),u=W0();We!==t||Ae!==n?(Du=null,wu=q()+500,ws(t,n)):Es=Da(t,n);t:do try{if(Ve!==0&&Me!==null){n=Me;var f=ri;e:switch(Ve){case 1:Ve=0,ri=null,Ds(t,n,f,1);break;case 2:case 9:if(Km(f)){Ve=0,ri=null,K0(n);break}n=function(){Ve!==2&&Ve!==9||We!==t||(Ve=7),Zi(t)},f.then(n,n);break t;case 3:Ve=7;break t;case 4:Ve=5;break t;case 7:Km(f)?(Ve=0,ri=null,K0(n)):(Ve=0,ri=null,Ds(t,n,f,7));break;case 5:var v=null;switch(Me.tag){case 26:v=Me.memoizedState;case 5:case 27:var T=Me;if(v?G_(v):T.stateNode.complete){Ve=0,ri=null;var z=T.sibling;if(z!==null)Me=z;else{var K=T.return;K!==null?(Me=K,Ou(K)):Me=null}break e}}Ve=0,ri=null,Ds(t,n,f,5);break;case 6:Ve=0,ri=null,Ds(t,n,f,6);break;case 8:Th(),on=6;break t;default:throw Error(r(462))}}yS();break}catch(st){q0(t,st)}while(!0);return ha=br=null,Tt.H=s,Tt.A=u,Be=a,Me!==null?0:(We=null,Ae=0,Hl(),on)}function yS(){for(;Me!==null&&!It();)Z0(Me)}function Z0(t){var n=f0(t.alternate,t,va);t.memoizedProps=t.pendingProps,n===null?Ou(t):Me=n}function K0(t){var n=t,a=n.alternate;switch(n.tag){case 15:case 0:n=a0(a,n,n.pendingProps,n.type,void 0,Ae);break;case 11:n=a0(a,n,n.pendingProps,n.type.render,n.ref,Ae);break;case 5:Nf(n);var s=n;s===Mn&&(xe?(Yl(s),s.tag===5&&s.stateNode!=null&&(Ke=s.stateNode)):(Yl(s),xe=!0));default:d0(a,n),n=Me=Fm(n,va),n=f0(a,n,va)}t.memoizedProps=t.pendingProps,n===null?Ou(t):Me=n}function Ds(t,n,a,s){ha=br=null,Nf(n),ms=null,Lo=0;var u=n.return;try{if(oS(t,u,n,a,Ae)){on=1,hu(t,pi(a,t.current)),Me=null;return}}catch(f){if(u!==null)throw Me=u,f;on=1,hu(t,pi(a,t.current)),Me=null;return}n.flags&32768?(xe||s===1?t=!0:Es||(Ae&536870912)!==0?t=!1:(ja=t=!0,(s===2||s===9||s===3||s===6)&&(s=Cn.current,s!==null&&s.tag===13&&(s.flags|=16384))),Q0(n,t)):Ou(n)}function Ou(t){var n=t;do{if((n.flags&32768)!==0){Q0(n,ja);return}t=n.return;var a=fS(n.alternate,n,va);if(a!==null){Me=a;return}if(n=n.sibling,n!==null){Me=n;return}Me=n=t}while(n!==null);on===0&&(on=5)}function Q0(t,n){do{var a=hS(t.alternate,t);if(a!==null){a.flags&=32767,Me=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!n&&(t=t.sibling,t!==null)){Me=t;return}Me=t=a}while(t!==null);on=6,Me=null}function J0(t,n,a,s,u,f,v,T,z,K,st,vt){t.cancelPendingCommit=null;do zu();while(nn!==0);if((Be&6)!==0)throw Error(r(327));if(n!==null){if(n===t.current)throw Error(r(177));t===We&&(Me=We=null,Ae=0),Br=n,Ci=t,Wi=a,Eh=u,G0=s,SS(t,n,a,v,T,z,vt)}}function SS(t,n,a,s,u,f,v){var T=n.lanes|n.childLanes;if(Mh=T,T|=sf,Pc(t,a,T,s,u,f),As=null,(a&335544064)===a?(Rs=Zy(t),s=10262):(Rs=null,s=10256),(n.subtreeFlags&s)!==0||(n.flags&s)!==0?(t.callbackNode=null,t.callbackPriority=0,RS(At,function(){return wh(),null})):(t.callbackNode=null,t.callbackPriority=0),yu=!1,s=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||s){s=Tt.T,Tt.T=null,u=qt.p,qt.p=2,f=Be,Be|=4;try{dS(t,n,a)}finally{Be=f,qt.p=u,Tt.T=s}}nn=1,yu?bs=jS(v,t.containerInfo,Rs,Ah,Rh,ES,Ch,wh,MS):(Ah(),Rh(),Ch())}function MS(t){if(nn!==0){var n=Ci.onRecoverableError;n(t,{componentStack:null})}}function ES(){nn===3&&(nn=0,O0(Br,Ci),nn=4)}function Ah(){if(nn===1){nn=0;var t=Ci,n=Br,a=Wi,s=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||s){s=Tt.T,Tt.T=null;var u=qt.p;qt.p=2;var f=Be;Be|=4;try{qo=Eu=!1,N0(n,t,a),a=Gh;var v=wm(t.containerInfo),T=a.focusedElem,z=a.selectionRange;if(v!==T&&T&&T.ownerDocument&&Cm(T.ownerDocument.documentElement,T)){if(z!==null&&tf(T)){var K=z.start,st=z.end;if(st===void 0&&(st=K),"selectionStart"in T)T.selectionStart=K,T.selectionEnd=Math.min(st,T.value.length);else{var vt=T.ownerDocument||document,W=vt&&vt.defaultView||window;if(W.getSelection){var at=W.getSelection(),zt=T.textContent.length,Kt=Math.min(z.start,zt),me=z.end===void 0?Kt:Math.min(z.end,zt);!at.extend&&Kt>me&&(v=me,me=Kt,Kt=v);var Z=Rm(T,Kt),k=Rm(T,me);if(Z&&k&&(at.rangeCount!==1||at.anchorNode!==Z.node||at.anchorOffset!==Z.offset||at.focusNode!==k.node||at.focusOffset!==k.offset)){var it=vt.createRange();it.setStart(Z.node,Z.offset),at.removeAllRanges(),Kt>me?(at.addRange(it),at.extend(k.node,k.offset)):(it.setEnd(k.node,k.offset),at.addRange(it))}}}}for(vt=[],at=T;at=at.parentNode;)at.nodeType===1&&vt.push({element:at,left:at.scrollLeft,top:at.scrollTop});for(typeof T.focus=="function"&&T.focus(),T=0;T<vt.length;T++){var mt=vt[T];mt.element.scrollLeft=mt.left,mt.element.scrollTop=mt.top}}Bs=!!Hh,Gh=Hh=null}finally{Be=f,qt.p=u,Tt.T=s}}t.current=n,nn=2}}function Rh(){if(nn===2){nn=0;var t=Ci,n=Br,a=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||a){a=Tt.T,Tt.T=null;var s=qt.p;qt.p=2;var u=Be;Be|=4;try{A0(t,n.alternate,n)}finally{Be=u,qt.p=s,Tt.T=a}}nn=3}}function Ch(){if(nn===4||nn===3){nn=0;var t=bs;bs=null,de();var n=Ci,a=Br,s=Wi,u=G0,f=(s&335544064)===s?10262:10256;if((a.subtreeFlags&f)!==0||(a.flags&f)!==0?nn=5:(nn=0,Br=Ci=null,$0(n,n.pendingLanes)),f=n.pendingLanes,f===0&&(Za=null),tt(s),a=a.stateNode,en&&typeof en.onCommitFiberRoot=="function")try{en.onCommitFiberRoot(be,a,void 0,(a.current.flags&128)===128)}catch{}if(u!==null){a=Tt.T,f=qt.p,qt.p=2,Tt.T=null;try{for(var v=n.onRecoverableError,T=0;T<u.length;T++){var z=u[T];v(z.value,{componentStack:z.stack})}}finally{Tt.T=a,qt.p=f}}if(u=As,v=Rs,Rs=null,u!==null&&(As=null,v===null&&(v=[]),t!==null))for(z=0;z<u.length;z++)a=(0,u[z])(v),a!==void 0&&t.finished.finally(a);(Wi&3)!==0&&zu(),Zi(n),f=n.pendingLanes,(s&261930)!==0&&(f&42)!==0?n===Uu?Zo++:(Zo=0,Uu=n):(Zo=0,Uu=null),Ko(0)}}function $0(t,n){(t.pooledCacheLanes&=n)===0&&(n=t.pooledCache,n!=null&&(t.pooledCache=null,Do(n)))}function zu(){return bs!==null&&(bs.skipTransition(),bs=null),Ah(),Rh(),Ch(),wh()}function wh(){if(nn!==5)return!1;var t=Ci,n=Mh;Mh=0;var a=tt(Wi),s=Tt.T,u=qt.p;try{qt.p=32>a?32:a,Tt.T=null,a=Eh,Eh=null;var f=Ci,v=Wi;if(nn=0,Br=Ci=null,Wi=0,(Be&6)!==0)throw Error(r(331));var T=Be;if(Be|=4,B0(f.current),z0(f,f.current,v,a),Be=T,Ko(0,!1),en&&typeof en.onPostCommitFiberRoot=="function")try{en.onPostCommitFiberRoot(be,f)}catch{}return!0}finally{qt.p=u,Tt.T=s,$0(t,n)}}function t_(t,n,a){n=pi(a,n),n=Yf(t.stateNode,n,2),t=Ga(t,n,2),t!==null&&(xr(t,2),Zi(t))}function ke(t,n,a){if(t.tag===3)t_(t,t,a);else for(;n!==null;){if(n.tag===3){t_(n,t,a);break}else if(n.tag===1){var s=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof s.componentDidCatch=="function"&&(Za===null||!Za.has(s))){t=pi(a,t),a=Kg(2),s=Ga(n,a,2),s!==null&&(Qg(a,s,n,t),xr(s,2),Zi(s));break}}n=n.return}}function Dh(t,n,a){var s=t.pingCache;if(s===null){s=t.pingCache=new gS;var u=new Set;s.set(n,u)}else u=s.get(n),u===void 0&&(u=new Set,s.set(n,u));u.has(a)||(yh=!0,u.add(a),t=TS.bind(null,t,n,a),n.then(t,t))}function TS(t,n,a){var s=t.pingCache;s!==null&&s.delete(n),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,We===t&&(Ae&a)===a&&((on===4||on===3&&(Ae&62914560)===Ae&&300>q()-Cu)&&(Be&2)===0?ws(t,0):Ru|=a,Ts===Ae&&(Ts=0)),Zi(t)}function e_(t,n){n===0&&(n=wl()),t=Mr(t,n),t!==null&&(xr(t,n),Zi(t))}function bS(t){var n=t.memoizedState,a=0;n!==null&&(a=n.retryLane),e_(t,a)}function AS(t,n){var a=0;switch(t.tag){case 31:case 13:var s=t.stateNode,u=t.memoizedState;u!==null&&(a=u.retryLane);break;case 19:s=t.stateNode;break;case 22:s=t.stateNode._retryCache;break;default:throw Error(r(314))}s!==null&&s.delete(n),e_(t,a)}function RS(t,n){return ue(t,n)}var Us=null,Ns=null,Uh=!1,Pu=!1,Nh=!1,Qa=0;function Zi(t){t!==Ns&&t.next===null&&(Ns===null?Us=Ns=t:Ns=Ns.next=t),Pu=!0,Uh||(Uh=!0,wS())}function Ko(t,n){if(!Nh&&Pu){Nh=!0;do for(var a=!1,s=Us;s!==null;){if(t!==0){var u=s.pendingLanes;if(u===0)var f=0;else{var v=s.suspendedLanes,T=s.pingedLanes;f=(1<<31-Ln(42|t)+1)-1,f&=u&~(v&~T),f=f&201326741?f&201326741|1:f?f|2:0}f!==0&&(a=!0,r_(s,f))}else f=Ae,f=vr(s,s===We?f:0,s.cancelPendingCommit!==null||s.timeoutHandle!==-1),(f&3)===0||Da(s,f)||(a=!0,r_(s,f));s=s.next}while(a);Nh=!1}}function CS(){n_()}function n_(){Pu=Uh=!1;var t=0;Qa!==0&&HS()&&(t=Qa);for(var n=q(),a=null,s=Us;s!==null;){var u=s.next,f=i_(s,n);f===0?(s.next=null,a===null?Us=u:a.next=u,u===null&&(Ns=a)):(a=s,(t!==0||(f&3)!==0)&&(Pu=!0)),s=u}nn!==0&&nn!==5||Ko(t),Qa!==0&&(Qa=0)}function i_(t,n){for(var a=t.suspendedLanes,s=t.pingedLanes,u=t.expirationTimes,f=t.pendingLanes&-62914561;0<f;){var v=31-Ln(f),T=1<<v,z=u[v];z===-1?((T&a)===0||(T&s)!==0)&&(u[v]=zc(T,n)):z<=n&&(t.expiredLanes|=T),f&=~T}if(n=We,a=Ae,a=vr(t,t===n?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),s=t.callbackNode,a===0||t===n&&(Ve===2||Ve===9)||t.cancelPendingCommit!==null)return s!==null&&s!==null&&te(s),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||Da(t,a)){if(n=a&-a,n===t.callbackPriority)return n;switch(s!==null&&te(s),tt(a)){case 2:case 8:a=Yt;break;case 32:a=At;break;case 268435456:a=Qt;break;default:a=At}return s=a_.bind(null,t),a=ue(a,s),t.callbackPriority=n,t.callbackNode=a,n}return s!==null&&s!==null&&te(s),t.callbackPriority=2,t.callbackNode=null,2}function a_(t,n){if(nn!==0&&nn!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(zu()&&t.callbackNode!==a)return null;var s=Ae;return s=vr(t,t===We?s:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),s===0?null:(k0(t,s,n),i_(t,q()),t.callbackNode!=null&&t.callbackNode===a?a_.bind(null,t):null)}function r_(t,n){if(zu())return null;k0(t,n,!0)}function wS(){VS(function(){(Be&6)!==0?ue(Lt,CS):n_()})}function Lh(){if(Qa===0){var t=Cr;t===0&&(t=gr,gr<<=1,(gr&261888)===0&&(gr=256)),Qa=t}return Qa}function s_(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:Nl(t)}function DS(t,n,a,s,u){if(n==="submit"&&a&&a.stateNode===u){var f=s_((u[Zt]||null).action),v=s.submitter;v&&(n=(n=v[Zt]||null)?s_(n.formAction):v.getAttribute("formAction"),n!==null&&(f=n,v=null));var T=new Pl("action","action",null,s,u);t.push({event:T,listeners:[{instance:null,listener:function(){if(s.defaultPrevented){if(Qa!==0){var z=new FormData(u,v);Gf(a,{pending:!0,data:z,method:u.method,action:f},null,z)}}else typeof f=="function"&&(T.preventDefault(),z=new FormData(u,v),Gf(a,{pending:!0,data:z,method:u.method,action:f},f,z))},currentTarget:u}]})}}for(var Oh=0;Oh<rf.length;Oh++){var zh=rf[Oh],US=zh.toLowerCase(),NS=zh[0].toUpperCase()+zh.slice(1);Ti(US,"on"+NS)}Ti(Nm,"onAnimationEnd"),Ti(Lm,"onAnimationIteration"),Ti(Om,"onAnimationStart"),Ti("dblclick","onDoubleClick"),Ti("focusin","onFocus"),Ti("focusout","onBlur"),Ti(Gy,"onTransitionRun"),Ti(Vy,"onTransitionStart"),Ti(ky,"onTransitionCancel"),Ti(zm,"onTransitionEnd"),rn("onMouseEnter",["mouseout","mouseover"]),rn("onMouseLeave",["mouseout","mouseover"]),rn("onPointerEnter",["pointerout","pointerover"]),rn("onPointerLeave",["pointerout","pointerover"]),fn("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),fn("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),fn("onBeforeInput",["compositionend","keypress","textInput","paste"]),fn("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),fn("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),fn("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Qo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),LS=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Qo));function o_(t,n){n=(n&4)!==0;for(var a=0;a<t.length;a++){var s=t[a],u=s.event;s=s.listeners;t:{var f=void 0;if(n)for(var v=s.length-1;0<=v;v--){var T=s[v],z=T.instance,K=T.currentTarget;if(T=T.listener,z!==f&&u.isPropagationStopped())break t;f=T,u.currentTarget=K;try{f(u)}catch(st){Fl(st)}u.currentTarget=null,f=z}else for(v=0;v<s.length;v++){if(T=s[v],z=T.instance,K=T.currentTarget,T=T.listener,z!==f&&u.isPropagationStopped())break t;f=T,u.currentTarget=K;try{f(u)}catch(st){Fl(st)}u.currentTarget=null,f=z}}}}function Ee(t,n){var a=n[ae];a===void 0&&(a=n[ae]=new Set);var s=t+"__bubble";a.has(s)||(l_(n,t,2,!1),a.add(s))}function Ph(t,n,a){var s=0;n&&(s|=4),l_(a,t,s,n)}var Iu="_reactListening"+Math.random().toString(36).slice(2);function Ih(t){if(!t[Iu]){t[Iu]=!0,Ze.forEach(function(a){a!=="selectionchange"&&(LS.has(a)||Ph(a,!1,t),Ph(a,!0,t))});var n=t.nodeType===9?t:t.ownerDocument;n===null||n[Iu]||(n[Iu]=!0,Ph("selectionchange",!1,n))}}function l_(t,n,a,s){switch(Q_(n)){case 2:var u=bM;break;case 8:u=AM;break;default:u=id}a=u.bind(null,n,a,t),u=void 0,!Xc||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(u=!0),s?u!==void 0?t.addEventListener(n,a,{capture:!0,passive:u}):t.addEventListener(n,a,!0):u!==void 0?t.addEventListener(n,a,{passive:u}):t.addEventListener(n,a,!1)}function Bh(t,n,a,s,u){var f=s;if((n&1)===0&&(n&2)===0&&s!==null)t:for(;;){if(s===null)return;var v=s.tag;if(v===3||v===4){var T=s.stateNode.containerInfo;if(T===u)break;if(v===4)for(v=s.return;v!==null;){var z=v.tag;if((z===3||z===4)&&v.stateNode.containerInfo===u)return;v=v.return}for(;T!==null;){if(v=Ie(T),v===null)return;if(z=v.tag,z===5||z===6||z===26||z===27){s=f=v;continue t}T=T.parentNode}}s=s.return}lm(function(){var K=f,st=Vc(a),vt=[];t:{var W=Pm.get(t);if(W!==void 0){var at=Pl,zt=t;switch(t){case"keypress":if(Ol(a)===0)break t;case"keydown":case"keyup":at=_y;break;case"focusin":zt="focus",at=Wc;break;case"focusout":zt="blur",at=Wc;break;case"beforeblur":case"afterblur":at=Wc;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":at=fm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":at=ry;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":at=My;break;case Nm:case Lm:case Om:at=ly;break;case zm:at=Ty;break;case"scroll":case"scrollend":at=iy;break;case"wheel":at=Ay;break;case"copy":case"cut":case"paste":at=cy;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":at=dm;break;case"submit":at=yy;break;case"toggle":case"beforetoggle":at=Cy}var Kt=(n&4)!==0,me=!Kt&&(t==="scroll"||t==="scrollend"),Z=Kt?W!==null?W+"Capture":null:W;Kt=[];for(var k=K,it;k!==null;){var mt=k;if(it=mt.stateNode,mt=mt.tag,mt!==5&&mt!==26&&mt!==27||it===null||Z===null||(mt=xo(k,Z),mt!=null&&Kt.push(Jo(k,mt,it))),me)break;k=k.return}0<Kt.length&&(W=new at(W,zt,null,a,st),vt.push({event:W,listeners:Kt}))}}if((n&7)===0){t:{if(at=t==="mouseover"||t==="pointerover",W=t==="mouseout"||t==="pointerout",at&&a!==Gc&&(zt=a.relatedTarget||a.fromElement)&&(Ie(zt)||zt[se]))break t;(W||at)&&(zt=st.window===st?st:(at=st.ownerDocument)?at.defaultView||at.parentWindow:window,W?(at=a.relatedTarget||a.toElement,W=K,at=at?Ie(at):null,at!==null&&(me=c(at),Kt=at.tag,at!==me||Kt!==5&&Kt!==27&&Kt!==6)&&(at=null)):(W=null,at=K),W!==at&&(Kt=fm,mt="onMouseLeave",Z="onMouseEnter",k="mouse",(t==="pointerout"||t==="pointerover")&&(Kt=dm,mt="onPointerLeave",Z="onPointerEnter",k="pointer"),me=W==null?zt:vn(W),it=at==null?zt:vn(at),zt=new Kt(mt,k+"leave",W,a,st),zt.target=me,zt.relatedTarget=it,mt=null,Ie(st)===K&&(Kt=new Kt(Z,k+"enter",at,a,st),Kt.target=it,Kt.relatedTarget=me,mt=Kt),me=mt,Kt=W&&at?I(W,at,OS):null,W!==null&&u_(vt,zt,W,Kt,!1),at!==null&&me!==null&&u_(vt,me,at,Kt,!0)))}t:{if(W=K?vn(K):window,at=W.nodeName&&W.nodeName.toLowerCase(),at==="select"||at==="input"&&W.type==="file")var Xt=Sm;else if(xm(W))if(Mm)Xt=By;else{Xt=Py;var Re=zy}else at=W.nodeName,!at||at.toLowerCase()!=="input"||W.type!=="checkbox"&&W.type!=="radio"?K&&Hc(K.elementType)&&(Xt=Sm):Xt=Iy;if(Xt&&(Xt=Xt(t,K))){ym(vt,Xt,a,st);break t}Re&&Re(t,W,K)}switch(Re=K?vn(K):window,t){case"focusin":(xm(Re)||Re.contentEditable==="true")&&(ss=Re,ef=K,Ro=null);break;case"focusout":Ro=ef=ss=null;break;case"mousedown":nf=!0;break;case"contextmenu":case"mouseup":case"dragend":nf=!1,Dm(vt,a,st);break;case"selectionchange":if(Hy)break;case"keydown":case"keyup":Dm(vt,a,st)}var ie;if(Kc)t:{switch(t){case"compositionstart":var ce="onCompositionStart";break t;case"compositionend":ce="onCompositionEnd";break t;case"compositionupdate":ce="onCompositionUpdate";break t}ce=void 0}else rs?_m(t,a)&&(ce="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(ce="onCompositionStart");ce&&(pm&&a.locale!=="ko"&&(rs||ce!=="onCompositionStart"?ce==="onCompositionEnd"&&rs&&(ie=um()):(Na=st,qc="value"in Na?Na.value:Na.textContent,rs=!0)),Re=Bu(K,ce),0<Re.length&&(ce=new hm(ce,t,null,a,st),vt.push({event:ce,listeners:Re}),ie?ce.data=ie:(ie=vm(a),ie!==null&&(ce.data=ie)))),(ie=Dy?Uy(t,a):Ny(t,a))&&(ce=Bu(K,"onBeforeInput"),0<ce.length&&(Re=new hm("onBeforeInput","beforeinput",null,a,st),vt.push({event:Re,listeners:ce}),Re.data=ie)),DS(vt,t,K,a,st)}o_(vt,n)})}function Jo(t,n,a){return{instance:t,listener:n,currentTarget:a}}function Bu(t,n){for(var a=n+"Capture",s=[];t!==null;){var u=t,f=u.stateNode;if(u=u.tag,u!==5&&u!==26&&u!==27||f===null||(u=xo(t,a),u!=null&&s.unshift(Jo(t,u,f)),u=xo(t,n),u!=null&&s.push(Jo(t,u,f))),t.tag===3)return s;t=t.return}return[]}function OS(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function u_(t,n,a,s,u){for(var f=n._reactName,v=[];a!==null&&a!==s;){var T=a,z=T.alternate,K=T.stateNode;if(T=T.tag,z!==null&&z===s)break;T!==5&&T!==26&&T!==27||K===null||(z=K,u?(K=xo(a,f),K!=null&&v.unshift(Jo(a,K,z))):u||(K=xo(a,f),K!=null&&v.push(Jo(a,K,z)))),a=a.return}v.length!==0&&t.push({event:n,listeners:v})}var zS=/\r\n?/g,PS=/\u0000|\uFFFD/g;function c_(t){return(typeof t=="string"?t:""+t).replace(zS,`
`).replace(PS,"")}function f_(t,n){return n=c_(n),c_(t)===n}function Xe(t,n,a,s,u,f){switch(a){case"children":if(typeof s=="string")n==="body"||n==="textarea"&&s===""||ns(t,s);else if(typeof s=="number"||typeof s=="bigint")n!=="body"&&ns(t,""+s);else return;break;case"className":Ul(t,"class",s);break;case"tabIndex":Ul(t,"tabindex",s);break;case"dir":case"role":case"viewBox":case"width":case"height":Ul(t,a,s);break;case"style":sm(t,s,f);return;case"data":if(n!=="object"){Ul(t,"data",s);break}case"src":case"href":if(s===""&&(n!=="a"||a!=="href")){t.removeAttribute(a);break}if(s==null||typeof s=="function"||typeof s=="symbol"||typeof s=="boolean"){t.removeAttribute(a);break}s=Nl(s),t.setAttribute(a,s);break;case"action":case"formAction":if(typeof s=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof f=="function"&&(a==="formAction"?(n!=="input"&&Xe(t,n,"name",u.name,u,null),Xe(t,n,"formEncType",u.formEncType,u,null),Xe(t,n,"formMethod",u.formMethod,u,null),Xe(t,n,"formTarget",u.formTarget,u,null)):(Xe(t,n,"encType",u.encType,u,null),Xe(t,n,"method",u.method,u,null),Xe(t,n,"target",u.target,u,null)));if(s==null||typeof s=="symbol"||typeof s=="boolean"){t.removeAttribute(a);break}s=Nl(s),t.setAttribute(a,s);break;case"onClick":s!=null&&(t.onclick=Fi);return;case"onScroll":s!=null&&Ee("scroll",t);return;case"onScrollEnd":s!=null&&Ee("scrollend",t);return;case"dangerouslySetInnerHTML":if(s!=null){if(typeof s!="object"||!("__html"in s))throw Error(r(61));if(a=s.__html,a!=null){if(u.children!=null)throw Error(r(60));f?.__html!==a&&(t.innerHTML=a)}}break;case"multiple":t.multiple=s&&typeof s!="function"&&typeof s!="symbol";break;case"muted":t.muted=s&&typeof s!="function"&&typeof s!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(s==null||typeof s=="function"||typeof s=="boolean"||typeof s=="symbol"){t.removeAttribute("xlink:href");break}a=Nl(s),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":s!=null&&typeof s!="function"&&typeof s!="symbol"?t.setAttribute(a,s):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":s&&typeof s!="function"&&typeof s!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":s===!0?t.setAttribute(a,""):s!==!1&&s!=null&&typeof s!="function"&&typeof s!="symbol"?t.setAttribute(a,s):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":s!=null&&typeof s!="function"&&typeof s!="symbol"&&!isNaN(s)&&1<=s?t.setAttribute(a,s):t.removeAttribute(a);break;case"rowSpan":case"start":s==null||typeof s=="function"||typeof s=="symbol"||isNaN(s)?t.removeAttribute(a):t.setAttribute(a,s);break;case"popover":Ee("beforetoggle",t),Ee("toggle",t),Dl(t,"popover",s);break;case"xlinkActuate":sa(t,"http://www.w3.org/1999/xlink","xlink:actuate",s);break;case"xlinkArcrole":sa(t,"http://www.w3.org/1999/xlink","xlink:arcrole",s);break;case"xlinkRole":sa(t,"http://www.w3.org/1999/xlink","xlink:role",s);break;case"xlinkShow":sa(t,"http://www.w3.org/1999/xlink","xlink:show",s);break;case"xlinkTitle":sa(t,"http://www.w3.org/1999/xlink","xlink:title",s);break;case"xlinkType":sa(t,"http://www.w3.org/1999/xlink","xlink:type",s);break;case"xmlBase":sa(t,"http://www.w3.org/XML/1998/namespace","xml:base",s);break;case"xmlLang":sa(t,"http://www.w3.org/XML/1998/namespace","xml:lang",s);break;case"xmlSpace":sa(t,"http://www.w3.org/XML/1998/namespace","xml:space",s);break;case"is":Dl(t,"is",s);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=ey.get(a)||a,Dl(t,a,s);else return}Le=!0}function Fh(t,n,a,s,u,f){switch(a){case"style":sm(t,s,f);return;case"dangerouslySetInnerHTML":if(s!=null){if(typeof s!="object"||!("__html"in s))throw Error(r(61));if(a=s.__html,a!=null){if(u.children!=null)throw Error(r(60));f?.__html!==a&&(t.innerHTML=a)}}break;case"children":if(typeof s=="string")ns(t,s);else if(typeof s=="number"||typeof s=="bigint")ns(t,""+s);else return;break;case"onScroll":s!=null&&Ee("scroll",t);return;case"onScrollEnd":s!=null&&Ee("scrollend",t);return;case"onClick":s!=null&&(t.onclick=Fi);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!Bn.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(u=a.endsWith("Capture"),f=a.slice(2,u?a.length-7:void 0),n=t[Zt]||null,n=n!=null?n[a]:null,typeof n=="function"&&t.removeEventListener(f,n,u),typeof s=="function")){typeof n!="function"&&n!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(f,s,u);break t}Le=!0,a in t?t[a]=s:s===!0?t.setAttribute(a,""):Dl(t,a,s)}return}Le=!0}function Un(t,n,a){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Ee("error",t),Ee("load",t);var s=!1,u=!1,f;for(f in a)if(a.hasOwnProperty(f)){var v=a[f];if(v!=null)switch(f){case"src":s=!0;break;case"srcSet":u=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(r(137,n));default:Xe(t,n,f,v,a,null)}}u&&Xe(t,n,"srcSet",a.srcSet,a,null),s&&Xe(t,n,"src",a.src,a,null);return;case"input":Ee("invalid",t);var T=f=v=u=null,z=null,K=null;for(s in a)if(a.hasOwnProperty(s)){var st=a[s];if(st!=null)switch(s){case"name":u=st;break;case"type":v=st;break;case"checked":z=st;break;case"defaultChecked":K=st;break;case"value":f=st;break;case"defaultValue":T=st;break;case"children":case"dangerouslySetInnerHTML":if(st!=null)throw Error(r(137,n));break;default:Xe(t,n,s,st,a,null)}}nm(t,f,T,z,K,v,u,!1);return;case"select":Ee("invalid",t),s=v=f=null;for(u in a)if(a.hasOwnProperty(u)&&(T=a[u],T!=null))switch(u){case"value":f=T;break;case"defaultValue":v=T;break;case"multiple":s=T;default:Xe(t,n,u,T,a,null)}n=f,a=v,t.multiple=!!s,n!=null?es(t,!!s,n,!1):a!=null&&es(t,!!s,a,!0);return;case"textarea":Ee("invalid",t),f=u=s=null;for(v in a)if(a.hasOwnProperty(v)&&(T=a[v],T!=null))switch(v){case"value":s=T;break;case"defaultValue":u=T;break;case"children":f=T;break;case"dangerouslySetInnerHTML":if(T!=null)throw Error(r(91));break;default:Xe(t,n,v,T,a,null)}am(t,s,u,f);return;case"option":for(z in a)a.hasOwnProperty(z)&&(s=a[z],s!=null)&&(z==="selected"?t.selected=s&&typeof s!="function"&&typeof s!="symbol":Xe(t,n,z,s,a,null));return;case"dialog":Ee("beforetoggle",t),Ee("toggle",t),Ee("cancel",t),Ee("close",t);break;case"iframe":case"object":Ee("load",t);break;case"video":case"audio":for(s=0;s<Qo.length;s++)Ee(Qo[s],t);break;case"image":Ee("error",t),Ee("load",t);break;case"details":Ee("toggle",t);break;case"embed":case"source":case"link":Ee("error",t),Ee("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(K in a)if(a.hasOwnProperty(K)&&(s=a[K],s!=null))switch(K){case"children":case"dangerouslySetInnerHTML":throw Error(r(137,n));default:Xe(t,n,K,s,a,null)}return;default:if(Hc(n)){for(st in a)a.hasOwnProperty(st)&&(s=a[st],s!==void 0&&Fh(t,n,st,s,a,void 0));return}}for(T in a)a.hasOwnProperty(T)&&(s=a[T],s!=null&&Xe(t,n,T,s,a,null))}var IS={};function BS(t,n,a,s){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var u=null,f=null,v=null,T=null,z=null,K=null,st=null;for(at in a){var vt=a[at];if(a.hasOwnProperty(at)&&vt!=null)switch(at){case"checked":break;case"value":break;case"defaultValue":z=vt;default:s.hasOwnProperty(at)||Xe(t,n,at,null,s,vt)}}for(var W in s){var at=s[W];if(vt=a[W],s.hasOwnProperty(W)&&(at!=null||vt!=null))switch(W){case"type":at!==vt&&(Le=!0),f=at;break;case"name":at!==vt&&(Le=!0),u=at;break;case"checked":at!==vt&&(Le=!0),K=at;break;case"defaultChecked":at!==vt&&(Le=!0),st=at;break;case"value":at!==vt&&(Le=!0),v=at;break;case"defaultValue":at!==vt&&(Le=!0),T=at;break;case"children":case"dangerouslySetInnerHTML":if(at!=null)throw Error(r(137,n));break;default:at!==vt&&Xe(t,n,W,at,s,vt)}}Bc(t,v,T,z,K,st,f,u);return;case"select":at=v=T=W=null;for(f in a)if(z=a[f],a.hasOwnProperty(f)&&z!=null)switch(f){case"value":break;case"multiple":at=z;default:s.hasOwnProperty(f)||Xe(t,n,f,null,s,z)}for(u in s)if(f=s[u],z=a[u],s.hasOwnProperty(u)&&(f!=null||z!=null))switch(u){case"value":f!==z&&(Le=!0),W=f;break;case"defaultValue":f!==z&&(Le=!0),T=f;break;case"multiple":f!==z&&(Le=!0),v=f;default:f!==z&&Xe(t,n,u,f,s,z)}n=T,a=v,s=at,W!=null?es(t,!!a,W,!1):!!s!=!!a&&(n!=null?es(t,!!a,n,!0):es(t,!!a,a?[]:"",!1));return;case"textarea":at=W=null;for(T in a)if(u=a[T],a.hasOwnProperty(T)&&u!=null&&!s.hasOwnProperty(T))switch(T){case"value":break;case"children":break;default:Xe(t,n,T,null,s,u)}for(v in s)if(u=s[v],f=a[v],s.hasOwnProperty(v)&&(u!=null||f!=null))switch(v){case"value":u!==f&&(Le=!0),W=u;break;case"defaultValue":u!==f&&(Le=!0),at=u;break;case"children":break;case"dangerouslySetInnerHTML":if(u!=null)throw Error(r(91));break;default:u!==f&&Xe(t,n,v,u,s,f)}im(t,W,at);return;case"option":for(var zt in a)W=a[zt],a.hasOwnProperty(zt)&&W!=null&&!s.hasOwnProperty(zt)&&(zt==="selected"?t.selected=!1:Xe(t,n,zt,null,s,W));for(z in s)W=s[z],at=a[z],s.hasOwnProperty(z)&&W!==at&&(W!=null||at!=null)&&(z==="selected"?(W!==at&&(Le=!0),t.selected=W&&typeof W!="function"&&typeof W!="symbol"):Xe(t,n,z,W,s,at));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Kt in a)W=a[Kt],a.hasOwnProperty(Kt)&&W!=null&&!s.hasOwnProperty(Kt)&&Xe(t,n,Kt,null,s,W);for(K in s)if(W=s[K],at=a[K],s.hasOwnProperty(K)&&W!==at&&(W!=null||at!=null))switch(K){case"children":case"dangerouslySetInnerHTML":if(W!=null)throw Error(r(137,n));break;default:Xe(t,n,K,W,s,at)}return;default:if(Hc(n)){for(var me in a)W=a[me],a.hasOwnProperty(me)&&W!==void 0&&!s.hasOwnProperty(me)&&Fh(t,n,me,void 0,s,W);for(st in s)W=s[st],at=a[st],!s.hasOwnProperty(st)||W===at||W===void 0&&at===void 0||Fh(t,n,st,W,s,at);return}}for(var Z in a)W=a[Z],a.hasOwnProperty(Z)&&W!=null&&!s.hasOwnProperty(Z)&&Xe(t,n,Z,null,s,W);for(vt in s)W=s[vt],at=a[vt],!s.hasOwnProperty(vt)||W===at||W==null&&at==null||Xe(t,n,vt,W,s,at)}function h_(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function FS(){if(typeof performance.getEntriesByType=="function"){for(var t=0,n=0,a=performance.getEntriesByType("resource"),s=0;s<a.length;s++){var u=a[s],f=u.transferSize,v=u.initiatorType,T=u.duration;if(f&&T&&h_(v)){for(v=0,T=u.responseEnd,s+=1;s<a.length;s++){var z=a[s],K=z.startTime;if(K>T)break;var st=z.transferSize,vt=z.initiatorType;st&&h_(vt)&&(z=z.responseEnd,v+=st*(z<T?1:(T-K)/(z-K)))}if(--s,n+=8*(f+v)/(u.duration/1e3),t++,10<t)break}}if(0<t)return n/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var Hh=null,Gh=null;function $o(t){return t.nodeType===9?t:t.ownerDocument}function d_(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function p_(t,n){if(t===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&n==="foreignObject"?0:t}function m_(t,n,a,s){return a=$o(a).createElement(t),a[Nt]=s,a[Zt]=n,Un(a,t,n),Ne(a),a}function Vh(t,n){return t==="textarea"||t==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var kh=null;function HS(){var t=window.event;return t&&t.type==="popstate"?t===kh?!1:(kh=t,!0):(kh=null,!1)}var Xh=typeof setTimeout=="function"?setTimeout:void 0,GS=typeof clearTimeout=="function"?clearTimeout:void 0,g_=typeof Promise=="function"?Promise:void 0,__=typeof requestAnimationFrame=="function"?requestAnimationFrame:Xh,VS=typeof queueMicrotask=="function"?queueMicrotask:typeof g_<"u"?function(t){return g_.resolve(null).then(t).catch(kS)}:Xh;function kS(t){setTimeout(function(){throw t})}function Ja(t){return t==="head"}function v_(t,n){var a=n,s=0;do{var u=a.nextSibling;if(t.removeChild(a),u&&u.nodeType===8)if(a=u.data,a==="/$"||a==="/&"){if(s===0){t.removeChild(u),Fs(n);return}s--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")s++;else if(a==="html")Jh(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,Jh(a);for(var f=a.firstChild;f;){var v=f.nextSibling,T=f.nodeName;f[Pe]||T==="SCRIPT"||T==="STYLE"||T==="LINK"&&f.rel.toLowerCase()==="stylesheet"||a.removeChild(f),f=v}}else a==="body"&&Jh(t.ownerDocument.body);a=u}while(a);Fs(n)}function x_(t,n){var a=t;t=0;do{var s=a.nextSibling;if(a.nodeType===1?n?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(n?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),s&&s.nodeType===8)if(a=s.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=s}while(a)}function y_(t,n,a){if(n=CSS.escape(n)!==n?"r-"+btoa(n).replace(/=/g,""):n,t.style.viewTransitionName=n,a!=null&&(t.style.viewTransitionClass=a),a=getComputedStyle(t),a.display==="inline"){if(n=t.getClientRects(),n.length===1)var s=1;else for(var u=s=0;u<n.length;u++){var f=n[u];0<f.width&&0<f.height&&s++}s===1&&(t=t.style,t.display=n.length===1?"inline-block":"block",t.marginTop="-"+a.paddingTop,t.marginBottom="-"+a.paddingBottom)}}function S_(t,n){t=t.style,n=n.style;var a=n!=null?n.hasOwnProperty("viewTransitionName")?n.viewTransitionName:n.hasOwnProperty("view-transition-name")?n["view-transition-name"]:null:null;t.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=n!=null?n.hasOwnProperty("viewTransitionClass")?n.viewTransitionClass:n.hasOwnProperty("view-transition-class")?n["view-transition-class"]:null:null,t.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),t.display==="inline-block"&&(n==null?t.display=t.margin="":(a=n.display,t.display=a==null||typeof a=="boolean"?"":a,a=n.margin,a!=null?t.margin=a:(a=n.hasOwnProperty("marginTop")?n.marginTop:n["margin-top"],t.marginTop=a==null||typeof a=="boolean"?"":a,n=n.hasOwnProperty("marginBottom")?n.marginBottom:n["margin-bottom"],t.marginBottom=n==null||typeof n=="boolean"?"":n)))}function XS(t,n,a){return a=a.ownerDocument.defaultView,{rect:t,abs:n.position==="absolute"||n.position==="fixed",clip:n.clipPath!=="none"||n.overflow!=="visible"||n.filter!=="none"||n.mask!=="none"||n.mask!=="none"||n.borderRadius!=="0px",view:0<=t.bottom&&0<=t.right&&t.top<=a.innerHeight&&t.left<=a.innerWidth}}function qh(t){var n=t.getBoundingClientRect(),a=getComputedStyle(t);return XS(n,a,t)}function qS(t){return t.documentElement.clientHeight}function YS(t){this.addEventListener("load",t),this.addEventListener("error",t)}function jS(t,n,a,s,u,f,v,T,z){var K=n.nodeType===9?n:n.ownerDocument;try{var st=K.startViewTransition({update:function(){var W=K.defaultView,at=W.navigation&&W.navigation.transition,zt=K.fonts.status;s();var Kt=[];if(zt==="loaded"&&(qS(K),K.fonts.status==="loading"&&Kt.push(K.fonts.ready)),zt=Kt.length,t!==null)for(var me=t.suspenseyImages,Z=0,k=0;k<me.length;k++){var it=me[k];if(!it.complete){var mt=it.getBoundingClientRect();if(0<mt.bottom&&0<mt.right&&mt.top<W.innerHeight&&mt.left<W.innerWidth){if(Z+=V_(it),Z>Gu){Kt.length=zt;break}it=new Promise(YS.bind(it)),Kt.push(it)}}}if(0<Kt.length)return W=Promise.race([Promise.all(Kt),new Promise(function(Xt){return setTimeout(Xt,500)})]).then(u,u),(at?Promise.allSettled([at.finished,W]):W).then(f,f);if(u(),at)return at.finished.then(f,f);f()},types:a});K.__reactViewTransition=st;var vt=[];return st.ready.then(function(){for(var W=K.documentElement.getAnimations({subtree:!0}),at=0;at<W.length;at++){var zt=W[at],Kt=zt.effect,me=Kt.pseudoElement;if(me!=null&&me.startsWith("::view-transition")){vt.push(zt),zt=Kt.getKeyframes();for(var Z=me=void 0,k=!0,it=0;it<zt.length;it++){var mt=zt[it],Xt=mt.width;if(me===void 0)me=Xt;else if(me!==Xt){k=!1;break}if(Xt=mt.height,Z===void 0)Z=Xt;else if(Z!==Xt){k=!1;break}delete mt.width,delete mt.height,mt.transform==="none"&&delete mt.transform}k&&me!==void 0&&Z!==void 0&&(Kt.setKeyframes(zt),k=getComputedStyle(Kt.target,Kt.pseudoElement),k.width!==me||k.height!==Z)&&(k=zt[0],k.width=me,k.height=Z,k=zt[zt.length-1],k.width=me,k.height=Z,Kt.setKeyframes(zt))}}v()},function(W){K.__reactViewTransition===st&&(K.__reactViewTransition=null);try{typeof W=="object"&&W!==null&&W.name==="InvalidStateError"&&(W.message==="View transition was skipped because document visibility state is hidden."||W.message==="Skipping view transition because document visibility state has become hidden."||W.message==="Skipping view transition because viewport size changed."||W.message==="Transition was aborted because of invalid state")&&(W=null),W!==null&&z(W)}finally{s(),u(),v()}}),st.finished.finally(function(){for(var W=0;W<vt.length;W++)vt[W].cancel();K.__reactViewTransition===st&&(K.__reactViewTransition=null),T()}),st}catch{return s(),u(),v(),null}}function Fr(t,n){this._scope=document.documentElement,this._selector="::view-transition-"+t+"("+n+")"}Fr.prototype.animate=function(t,n){return n=typeof n=="number"?{duration:n}:O({},n),n.pseudoElement=this._selector,this._scope.animate(t,n)},Fr.prototype.getAnimations=function(){for(var t=this._scope,n=this._selector,a=t.getAnimations({subtree:!0}),s=[],u=0;u<a.length;u++){var f=a[u].effect;f!==null&&f.target===t&&f.pseudoElement===n&&s.push(a[u])}return s},Fr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function M_(t){return{name:t,group:new Fr("group",t),imagePair:new Fr("image-pair",t),old:new Fr("old",t),new:new Fr("new",t)}}function li(t){this._fragmentFiber=t,this._observers=this._eventListeners=null}li.prototype.addEventListener=function(t,n,a){var s=null,u=null;if(!(a!=null&&typeof a!="boolean"&&(s=a.signal||null,s!==null&&s.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var f=this._eventListeners;if(T_(f,t,n,a)===-1){var v=this,T=n;a!=null&&typeof a!="boolean"&&a.once===!0&&(T=function(z){v.removeEventListener(t,n,a),typeof n=="function"?n.call(this,z):n.handleEvent(z)}),s!==null&&(u=v.removeEventListener.bind(v,t,n,a),s.addEventListener("abort",u,{once:!0}),u=s.removeEventListener.bind(s,"abort",u)),s=Ls(a),f.push({type:t,listener:n,optionsOrUseCapture:a,attachedListener:T,cleanup:u}),m(this._fragmentFiber.child,!1,WS,t,T,s)}this._eventListeners=f}};function WS(t,n,a,s){return M(t).addEventListener(n,a,s),!1}li.prototype.removeEventListener=function(t,n,a){var s=this._eventListeners;if(s!==null&&(n=T_(s,t,n,a),n!==-1)){var u=s[n];a=u.attachedListener;var f=u.cleanup;u=Ls(u.optionsOrUseCapture),m(this._fragmentFiber.child,!1,ZS,t,a,u),s.splice(n,1),f!==null&&f()}};function ZS(t,n,a,s){return M(t).removeEventListener(n,a,s),!1}function Ls(t){return t!=null&&typeof t!="boolean"&&(t.once===!0||t.signal instanceof AbortSignal)?{capture:t.capture,passive:t.passive}:t}function E_(t){return t==null?"c=0":typeof t=="boolean"?"c="+(t?"1":"0"):"c="+(t.capture?"1":"0")}function T_(t,n,a,s){if(t.length===0)return-1;s=E_(s);for(var u=0;u<t.length;u++){var f=t[u];if(f.type===n&&f.listener===a&&E_(f.optionsOrUseCapture)===s)return u}return-1}li.prototype.dispatchEvent=function(t){var n=x(this._fragmentFiber);if(n===null)return!0;n=M(n);var a=this._eventListeners;if(a!==null&&0<a.length||!t.bubbles){var s=n.nodeType===9?n.createComment(""):document.createTextNode("");if(a)for(var u=0;u<a.length;u++){var f=a[u];s.addEventListener(f.type,f.attachedListener,Ls(f.optionsOrUseCapture))}if(n.appendChild(s),t=s.dispatchEvent(t),a)for(u=0;u<a.length;u++)f=a[u],s.removeEventListener(f.type,f.attachedListener,Ls(f.optionsOrUseCapture));return n.removeChild(s),t}return n.dispatchEvent(t)},li.prototype.focus=function(t){m(this._fragmentFiber.child,!0,b_,t,void 0,void 0)};function b_(t,n){return t.tag===6?!1:(t=M(t),oM(t,n))}li.prototype.focusLast=function(t){var n=[];m(this._fragmentFiber.child,!0,Yh,n,void 0,void 0);for(var a=n.length-1;0<=a&&!b_(n[a],t);a--);};function Yh(t,n){return n.push(t),!1}li.prototype.blur=function(){var t=x(this._fragmentFiber);t!==null&&(t=M(t),t=$o(t).activeElement,t!==null&&m(this._fragmentFiber.child,!1,KS,t,void 0,void 0))};function KS(t,n){return t.tag===6?!1:(t=M(t),t===n||t.contains(n)?(n.blur(),!0):!1)}li.prototype.observeUsing=function(t){this._observers===null&&(this._observers=new Set),this._observers.add(t),m(this._fragmentFiber.child,!1,QS,t,void 0,void 0)};function QS(t,n){return t.tag===6||(t=M(t),n.observe(t)),!1}li.prototype.unobserveUsing=function(t){var n=this._observers;if(n!==null&&n.has(t)){n.delete(t),m(this._fragmentFiber.child,!1,JS,t,void 0,void 0);for(var a=n=0;a<wi.length;a++){var s=wi[a];s.fragmentInstance===this&&s.observer===t?t.unobserve(s.instance):wi[n++]=s}wi.length=n}};function JS(t,n){return t.tag===6||(t=M(t),n.unobserve(t)),!1}var wi=[],jh=!1;function $S(t,n,a){wi.push({fragmentInstance:t,observer:n,instance:a}),jh||(jh=!0,lM(function(){jh=!1;var s=wi;wi=[];for(var u=0;u<s.length;u++){var f=s[u];f.observer.unobserve(f.instance)}}))}li.prototype.getClientRects=function(){var t=[];return m(this._fragmentFiber.child,!1,tM,t,void 0,void 0),t};function tM(t,n){if(t.tag===6){t=t.stateNode;var a=t.ownerDocument.createRange();a.selectNodeContents(t),n.push.apply(n,a.getClientRects())}else t=M(t),n.push.apply(n,t.getClientRects());return!1}li.prototype.getRootNode=function(t){var n=x(this._fragmentFiber);return n===null?this:M(n).getRootNode(t)},li.prototype.compareDocumentPosition=function(t){var n=x(this._fragmentFiber);if(n===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];m(this._fragmentFiber.child,!1,Yh,a,void 0,void 0);var s=M(n);if(a.length===0){if(a=s,S(this._fragmentFiber)){t:{for(n=this._fragmentFiber.return;n!==null;){if(n.tag===4){n=n.stateNode.containerInfo;break t}if(n.tag===3||n.tag===5||n.tag===27)break;n=n.return}n=null}n!=null&&(a=n)}n=this._fragmentFiber;var u=s=a.compareDocumentPosition(t);return a===t?u=Node.DOCUMENT_POSITION_CONTAINS:s&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=E(n)[1],a===null?u=Node.DOCUMENT_POSITION_PRECEDING:(t=M(a).compareDocumentPosition(t),u=t===0||t&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),u|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}n=M(a[0]),u=M(a[a.length-1]);var f=S(this._fragmentFiber)?n.parentElement:s;if(f==null)return Node.DOCUMENT_POSITION_DISCONNECTED;s=f.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY,f=f.compareDocumentPosition(u)&Node.DOCUMENT_POSITION_CONTAINED_BY;var v=n.compareDocumentPosition(t),T=u.compareDocumentPosition(t),z=v&Node.DOCUMENT_POSITION_CONTAINED_BY||T&Node.DOCUMENT_POSITION_CONTAINED_BY;return T=s&&f&&v&Node.DOCUMENT_POSITION_FOLLOWING&&T&Node.DOCUMENT_POSITION_PRECEDING,n=s&&n===t||f&&u===t||z||T?Node.DOCUMENT_POSITION_CONTAINED_BY:!s&&n===t||!f&&u===t?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:v,n&Node.DOCUMENT_POSITION_DISCONNECTED||n&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||eM(n,this._fragmentFiber,a[0],a[a.length-1],t)?n:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function eM(t,n,a,s,u){var f=Ie(u);if(t&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!f)t:{for(;f!==null;){if(f.tag===7&&(f===n||f.alternate===n)){a=!0;break t}f=f.return}a=!1}return a}if(t&Node.DOCUMENT_POSITION_CONTAINS){if(f===null)return f=u.ownerDocument,u===f||u===f.documentElement||u===f.body;t:{for(f=n,n=x(n);f!==null;){if(!(f.tag!==5&&f.tag!==3&&f.tag!==27||f!==n&&f.alternate!==n)){f=!0;break t}f=f.return}f=!1}return f}return t&Node.DOCUMENT_POSITION_PRECEDING?((n=!!f)&&!(n=f===a)&&(n=I(a,f,F),n===null?n=!1:(m(n,!0,L,f,a),f=y,y=null,n=f!==null)),n):t&Node.DOCUMENT_POSITION_FOLLOWING?((n=!!f)&&!(n=f===s)&&(n=I(s,f,F),n===null?n=!1:(m(n,!0,D,f,s),f=y,N=y=null,n=f!==null)),n):!1}function A_(t,n){var a=t.ownerDocument.createRange();a.selectNodeContents(t),t=a.getBoundingClientRect(),window.scrollTo(window.scrollX+t.left,n?window.scrollY+t.top:window.scrollY+t.bottom-window.innerHeight)}li.prototype.scrollIntoView=function(t){if(typeof t=="object")throw Error(r(566));var n=[];m(this._fragmentFiber.child,!1,Yh,n,void 0,void 0);var a=t!==!1;if(n.length===0){var s=E(this._fragmentFiber);if(s=a?s[1]||s[0]||x(this._fragmentFiber):s[0]||s[1],s===null)return;if(s.tag===6){t=M(s),A_(t,a);return}if(s=M(s),s.nodeType!==9){if(s.nodeType===11){a="host"in s?s.host:null,a!==null&&a.scrollIntoView(t);return}s.scrollIntoView(t)}}for(s=a?n.length-1:0;s!==(a?-1:n.length);){var u=n[s];u.tag===6?(u=M(u),A_(u,a)):M(u).scrollIntoView(t),s+=a?-1:1}};function nM(t,n){return t=M(t),R_(t,n),!1}function R_(t,n){t.reactFragments==null&&(t.reactFragments=new Set),t.reactFragments.add(n)}function C_(t,n){var a=n._eventListeners;if(a!==null)for(var s=0;s<a.length;s++){var u=a[s];t.addEventListener(u.type,u.attachedListener,Ls(u.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(f){for(var v=0,T=0;T<wi.length;T++){var z=wi[T];(z.fragmentInstance!==n||z.observer!==f||z.instance!==t)&&(wi[v++]=z)}wi.length=v,f.observe(t)}),R_(t,n))}function iM(t,n){var a=n._eventListeners;if(a!==null)for(var s=0;s<a.length;s++){var u=a[s];t.removeEventListener(u.type,u.attachedListener,Ls(u.optionsOrUseCapture))}t.nodeType!==3&&(a=n._observers,a!==null&&a.forEach(function(f){typeof f.rootMargin=="string"?$S(n,f,t):f.unobserve(t)}),t.reactFragments!=null&&t.reactFragments.delete(n))}function Wh(t){var n=t.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var a=n;switch(n=n.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Wh(a),re(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function aM(t,n,a,s){for(;t.nodeType===1;){var u=a;if(t.nodeName.toLowerCase()!==n.toLowerCase()){if(!s&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(s){if(!t[Pe])switch(n){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(f=t.getAttribute("rel"),f==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(f!==u.rel||t.getAttribute("href")!==(u.href==null||u.href===""?null:u.href)||t.getAttribute("crossorigin")!==(u.crossOrigin==null?null:u.crossOrigin)||t.getAttribute("title")!==(u.title==null?null:u.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(f=t.getAttribute("src"),(f!==(u.src==null?null:u.src)||t.getAttribute("type")!==(u.type==null?null:u.type)||t.getAttribute("crossorigin")!==(u.crossOrigin==null?null:u.crossOrigin))&&f&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(n==="input"&&t.type==="hidden"){var f=u.name==null?null:""+u.name;if(u.type==="hidden"&&t.getAttribute("name")===f)return t}else return t;if(t=xi(t.nextSibling),t===null)break}return null}function rM(t,n,a){if(n==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=xi(t.nextSibling),t===null))return null;return t}function w_(t,n){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!n||(t=xi(t.nextSibling),t===null))return null;return t}function Zh(t){return t.data==="$?"||t.data==="$~"}function Kh(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function sM(t,n){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=n;else if(t.data!=="$?"||a.readyState!=="loading")n();else{var s=function(){n(),a.removeEventListener("DOMContentLoaded",s)};a.addEventListener("DOMContentLoaded",s),t._reactRetry=s}}function xi(t){for(;t!=null;t=t.nextSibling){var n=t.nodeType;if(n===1||n===3)break;if(n===8){if(n=t.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return t}var Qh=null;function D_(t){t=t.nextSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(n===0)return xi(t.nextSibling);n--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||n++}t=t.nextSibling}return null}function U_(t){t=t.previousSibling;for(var n=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(n===0)return t;n--}else a!=="/$"&&a!=="/&"||n++}t=t.previousSibling}return null}function oM(t,n){function a(){s=!0}if(t.ownerDocument.activeElement===t)return!0;var s=!1;try{t.ownerDocument.addEventListener("focus",a,!0),(t.focus||HTMLElement.prototype.focus).call(t,n)}finally{t.ownerDocument.removeEventListener("focus",a,!0)}return s}function lM(t){__(function(){__(function(n){return t(n)})})}function N_(t,n,a){switch(n=$o(a),t){case"html":if(t=n.documentElement,!t)throw Error(r(452));return t;case"head":if(t=n.head,!t)throw Error(r(453));return t;case"body":if(t=n.body,!t)throw Error(r(454));return t;default:throw Error(r(451))}}function L_(t,n,a){for(var s in a){var u=a[s];a.hasOwnProperty(s)&&u!=null&&Xe(t,n,s,null,IS,u)}a.dangerouslySetInnerHTML!=null&&(t.textContent=""),t.onclick===Fi&&(t.onclick=null),re(t)}function Jh(t){for(var n=t.attributes;n.length;)t.removeAttributeNode(n[0]);re(t)}var yi=new Map,O_=new Set;function tl(t){if(typeof t.getRootNode=="function"){var n=t.getRootNode();if(n.nodeType===9||n.nodeType===11)return n}return t.nodeType===9?t:t.ownerDocument}var xa=qt.d;qt.d={f:uM,r:cM,D:fM,C:hM,L:dM,m:pM,X:gM,S:mM,M:_M};function uM(){var t=xa.f(),n=Nu();return t||n}function cM(t){var n=ve(t);n!==null&&n.tag===5&&n.type==="form"?Pg(n):xa.r(t)}var Os=typeof document>"u"?null:document;function z_(t,n,a){var s=Os;if(s&&typeof n=="string"&&n){var u=hi(n);u='link[rel="'+t+'"][href="'+u+'"]',typeof a=="string"&&(u+='[crossorigin="'+a+'"]'),O_.has(u)||(O_.add(u),t={rel:t,crossOrigin:a,href:n},s.querySelector(u)===null&&(n=s.createElement("link"),Un(n,"link",t),Ne(n),s.head.appendChild(n)))}}function fM(t){xa.D(t),z_("dns-prefetch",t,null)}function hM(t,n){xa.C(t,n),z_("preconnect",t,n)}function dM(t,n,a){xa.L(t,n,a);var s=Os;if(s&&t&&n){var u='link[rel="preload"][as="'+hi(n)+'"]';n==="image"&&a&&a.imageSrcSet?(u+='[imagesrcset="'+hi(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(u+='[imagesizes="'+hi(a.imageSizes)+'"]')):u+='[href="'+hi(t)+'"]';var f=u;switch(n){case"style":f=zs(t);break;case"script":f=Ps(t)}if(!(yi.has(f)||(t=O({rel:"preload",href:n==="image"&&a&&a.imageSrcSet?void 0:t,as:n},a),yi.set(f,t),s.querySelector(u)!==null||n==="style"&&s.querySelector(el(f))||n==="script"&&s.querySelector(nl(f))))){var v=s.createElement("link");Un(v,"link",t),n==="style"&&(v[Ue]=!0,v.onload=v.onerror=function(){Ua(v)}),Ne(v),s.head.appendChild(v)}}}function pM(t,n){xa.m(t,n);var a=Os;if(a&&t){var s=n&&typeof n.as=="string"?n.as:"script",u='link[rel="modulepreload"][as="'+hi(s)+'"][href="'+hi(t)+'"]',f=u;switch(s){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":f=Ps(t)}if(!yi.has(f)&&(t=O({rel:"modulepreload",href:t},n),yi.set(f,t),a.querySelector(u)===null)){switch(s){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(nl(f)))return}s=a.createElement("link"),Un(s,"link",t),Ne(s),a.head.appendChild(s)}}}function mM(t,n,a){xa.S(t,n,a);var s=Os;if(s&&t){var u=ti(s).hoistableStyles,f=zs(t);n=n||"default";var v=u.get(f);if(!v){var T={loading:0,preload:null};if(v=s.querySelector(el(f)))T.loading=5;else{t=O({rel:"stylesheet",href:t,"data-precedence":n},a),(a=yi.get(f))&&$h(t,a);var z=v=s.createElement("link");Ne(z),Un(z,"link",t),z._p=new Promise(function(K,st){z.onload=K,z.onerror=st}),z.addEventListener("load",function(){T.loading|=1}),z.addEventListener("error",function(){T.loading|=2}),T.loading|=4,Fu(v,n,s)}v={type:"stylesheet",instance:v,count:1,state:T},u.set(f,v)}}}function gM(t,n){xa.X(t,n);var a=Os;if(a&&t){var s=ti(a).hoistableScripts,u=Ps(t),f=s.get(u);f||(f=a.querySelector(nl(u)),f||(t=O({src:t,async:!0},n),(n=yi.get(u))&&td(t,n),f=a.createElement("script"),Ne(f),Un(f,"link",t),a.head.appendChild(f)),f={type:"script",instance:f,count:1,state:null},s.set(u,f))}}function _M(t,n){xa.M(t,n);var a=Os;if(a&&t){var s=ti(a).hoistableScripts,u=Ps(t),f=s.get(u);f||(f=a.querySelector(nl(u)),f||(t=O({src:t,async:!0,type:"module"},n),(n=yi.get(u))&&td(t,n),f=a.createElement("script"),Ne(f),Un(f,"link",t),a.head.appendChild(f)),f={type:"script",instance:f,count:1,state:null},s.set(u,f))}}function P_(t,n,a,s){var u=(u=oe.current)?tl(u):null;if(!u)throw Error(r(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=zs(a.href),n=ti(u).hoistableStyles,s=n.get(a),s||(s={type:"style",instance:null,count:0,state:null},n.set(a,s)),s):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=zs(a.href);var f=ti(u).hoistableStyles,v=f.get(t);if(v||(u=u.ownerDocument||u,v={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},f.set(t,v),(f=u.querySelector(el(t)))?f._p||(v.instance=f,v.state.loading=5):(f=yi.get(t),f||(f={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},yi.set(t,f)),vM(u,t,f,v.state))),n&&s===null)throw Error(r(528,""));return v}if(n&&s!==null)throw Error(r(529,""));return null;case"script":return n=a.async,a=a.src,typeof a=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(a=Ps(a),n=ti(u).hoistableScripts,s=n.get(a),s||(s={type:"script",instance:null,count:0,state:null},n.set(a,s)),s):{type:"void",instance:null,count:0,state:null};default:throw Error(r(444,t))}}function zs(t){return'href="'+hi(t)+'"'}function el(t){return'link[rel="stylesheet"]['+t+"]"}function I_(t){return O({},t,{"data-precedence":t.precedence,precedence:null})}function vM(t,n,a,s){if(n=t.querySelector('link[rel="preload"][as="style"]['+n+"]")){if(n[Ue]!==!0){s.loading=1;return}}else n=t.createElement("link"),n[Ue]=!0,n.onload=n.onerror=Ua.bind(null,n),Un(n,"link",a),Ne(n),t.head.appendChild(n);s.preload=n,n.addEventListener("load",function(){return s.loading|=1}),n.addEventListener("error",function(){return s.loading|=2})}function Ps(t){return'[src="'+hi(t)+'"]'}function nl(t){return"script[async]"+t}function B_(t,n,a){if(n.count++,n.instance===null)switch(n.type){case"style":var s=t.querySelector('style[data-href~="'+hi(a.href)+'"]');if(s)return n.instance=s,Ne(s),s;var u=O({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return s=(t.ownerDocument||t).createElement("style"),Ne(s),Un(s,"style",u),Fu(s,a.precedence,t),n.instance=s;case"stylesheet":u=zs(a.href);var f=t.querySelector(el(u));if(f)return n.state.loading|=4,n.instance=f,Ne(f),f;s=I_(a),(u=yi.get(u))&&$h(s,u),f=(t.ownerDocument||t).createElement("link"),Ne(f);var v=f;return v._p=new Promise(function(T,z){v.onload=T,v.onerror=z}),Un(f,"link",s),n.state.loading|=4,Fu(f,a.precedence,t),n.instance=f;case"script":return f=Ps(a.src),(u=t.querySelector(nl(f)))?(n.instance=u,Ne(u),u):(s=a,(u=yi.get(f))&&(s=O({},a),td(s,u)),t=t.ownerDocument||t,u=t.createElement("script"),Ne(u),Un(u,"link",s),t.head.appendChild(u),n.instance=u);case"void":return null;default:throw Error(r(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(s=n.instance,n.state.loading|=4,Fu(s,a.precedence,t));return n.instance}function Fu(t,n,a){for(var s=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),u=s.length?s[s.length-1]:null,f=u,v=0;v<s.length;v++){var T=s[v];if(T.dataset.precedence===n)f=T;else if(f!==u)break}f?f.parentNode.insertBefore(t,f.nextSibling):(n=a.nodeType===9?a.head:a,n.insertBefore(t,n.firstChild))}function $h(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.title==null&&(t.title=n.title)}function td(t,n){t.crossOrigin==null&&(t.crossOrigin=n.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=n.referrerPolicy),t.integrity==null&&(t.integrity=n.integrity)}var Hu=null;function F_(t,n,a){if(Hu===null){var s=new Map,u=Hu=new Map;u.set(a,s)}else u=Hu,s=u.get(a),s||(s=new Map,u.set(a,s));if(s.has(t))return s;for(s.set(t,null),a=a.getElementsByTagName(t),u=0;u<a.length;u++){var f=a[u];if(!(f[Pe]||f[Nt]||t==="link"&&f.getAttribute("rel")==="stylesheet")&&f.namespaceURI!=="http://www.w3.org/2000/svg"){var v=f.getAttribute(n)||"";v=t+v;var T=s.get(v);T?T.push(f):s.set(v,[f])}}return s}function ed(t,n,a){t=t.ownerDocument||t,t.head.insertBefore(a,n==="title"?t.querySelector("head > title"):null)}function xM(t,n,a){if(a===1||n.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(t=n.disabled,typeof n.precedence=="string"&&t==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function H_(t,n){return t==="img"&&n.src!=null&&n.src!==""&&n.onLoad==null&&n.loading!=="lazy"}function G_(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function V_(t){return(t.width||100)*(t.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function k_(t,n){typeof n.decode=="function"&&(t.imgCount++,n.complete||(t.imgBytes+=V_(n),t.suspenseyImages.push(n)),t=MM.bind(t),n.decode().then(t,t))}function yM(t,n,a,s){if(a.type==="stylesheet"&&(typeof s.media!="string"||matchMedia(s.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var u=zs(s.href),f=n.querySelector(el(u));if(f){n=f._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(t.count++,t=il.bind(t),n.then(t,t)),a.state.loading|=4,a.instance=f,Ne(f);return}f=n.ownerDocument||n,s=I_(s),(u=yi.get(u))&&$h(s,u),f=f.createElement("link"),Ne(f);var v=f;v._p=new Promise(function(T,z){v.onload=T,v.onerror=z}),Un(f,"link",s),a.instance=f}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,n),(n=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=il.bind(t),n.addEventListener("load",a),n.addEventListener("error",a))}}var Gu=0;function SM(t,n){return t.stylesheets&&t.count===0&&ku(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var s=setTimeout(function(){if(t.stylesheets&&ku(t,t.stylesheets),t.unsuspend){var f=t.unsuspend;t.unsuspend=null,f()}},6e4+n);0<t.imgBytes&&Gu===0&&(Gu=62500*FS());var u=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&ku(t,t.stylesheets),t.unsuspend)){var f=t.unsuspend;t.unsuspend=null,f()}},(t.imgBytes>Gu?50:800)+n);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(s),clearTimeout(u)}}:null}function X_(t){if(t.count===0&&(t.imgCount===0||!t.waitingForImages)){if(t.stylesheets)ku(t,t.stylesheets);else if(t.unsuspend){var n=t.unsuspend;t.unsuspend=null,n()}}}function il(){this.count--,X_(this)}function MM(){this.imgCount--,X_(this)}var Vu=null;function ku(t,n){t.stylesheets=null,t.unsuspend!==null&&(t.count++,Vu=new Map,n.forEach(EM,t),Vu=null,il.call(t))}function EM(t,n){if(!(n.state.loading&4)){var a=Vu.get(t);if(a)var s=a.get(null);else{a=new Map,Vu.set(t,a);for(var u=t.querySelectorAll("link[data-precedence],style[data-precedence]"),f=0;f<u.length;f++){var v=u[f];(v.nodeName==="LINK"||v.getAttribute("media")!=="not all")&&(a.set(v.dataset.precedence,v),s=v)}s&&a.set(null,s)}u=n.instance,v=u.getAttribute("data-precedence"),f=a.get(v)||s,f===s&&a.set(null,u),a.set(v,u),this.count++,s=il.bind(this),u.addEventListener("load",s),u.addEventListener("error",s),f?f.parentNode.insertBefore(u,f.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(u,t.firstChild)),n.state.loading|=4}}var Is={$$typeof:lt,Provider:null,Consumer:null,_currentValue:B,_currentValue2:B,_threadCount:0};function TM(t,n,a,s,u,f,v,T,z){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=vo(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=vo(0),this.hiddenUpdates=vo(null),this.identifierPrefix=s,this.onUncaughtError=u,this.onCaughtError=f,this.onRecoverableError=v,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=z,this.transitionTypes=null,this.incompleteTransitions=new Map}function q_(t,n,a,s,u,f,v,T,z,K,st,vt){return t=new TM(t,n,a,v,z,K,st,vt,T),n=1,f===!0&&(n|=24),f=jn(3,null,null,n),t.current=f,f.stateNode=t,n=gf(),n.refCount++,t.pooledCache=n,n.refCount++,f.memoizedState={element:s,isDehydrated:a,cache:n},yf(f),t}function Y_(t){return t?(t=us,t):us}function j_(t,n,a,s,u,f){u=Y_(u),s.context===null?s.context=u:s.pendingContext=u,s=Ha(n),s.payload={element:a},f=f===void 0?null:f,f!==null&&(s.callback=f),a=Ga(t,s,n),a!==null&&(Qn(a,t,n),Oo(a,t,n))}function W_(t,n){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<n?a:n}}function nd(t,n){W_(t,n),(t=t.alternate)&&W_(t,n)}function Z_(t){if(t.tag===13||t.tag===31){var n=Mr(t,67108864);n!==null&&Qn(n,t,67108864),nd(t,67108864)}}function K_(t){if(t.tag===13||t.tag===31){var n=oi();n=ct(n);var a=Mr(t,n);a!==null&&Qn(a,t,n),nd(t,n)}}var Bs=!0;function bM(t,n,a,s){var u=Tt.T;Tt.T=null;var f=qt.p;try{qt.p=2,id(t,n,a,s)}finally{qt.p=f,Tt.T=u}}function AM(t,n,a,s){var u=Tt.T;Tt.T=null;var f=qt.p;try{qt.p=8,id(t,n,a,s)}finally{qt.p=f,Tt.T=u}}function id(t,n,a,s){if(Bs){var u=ad(s);if(u===null)Bh(t,n,s,Xu,a),J_(t,s);else if(CM(u,t,n,a,s))s.stopPropagation();else if(J_(t,s),n&4&&-1<RM.indexOf(t)){for(;u!==null;){var f=ve(u);if(f!==null)switch(f.tag){case 3:if(f=f.stateNode,f.current.memoizedState.isDehydrated){var v=fi(f.pendingLanes);if(v!==0){var T=f;for(T.pendingLanes|=2,T.entangledLanes|=2;v;){var z=1<<31-Ln(v);T.entanglements[1]|=z,v&=~z}Zi(f),(Be&6)===0&&(wu=q()+500,Ko(0))}}break;case 31:case 13:T=Mr(f,2),T!==null&&Qn(T,f,2),Nu(),nd(f,2)}if(f=ad(s),f===null&&Bh(t,n,s,Xu,a),f===u)break;u=f}u!==null&&s.stopPropagation()}else Bh(t,n,s,null,a)}}function ad(t){return t=Vc(t),rd(t)}var Xu=null;function rd(t){if(Xu=null,t=Ie(t),t!==null){var n=c(t);if(n===null)t=null;else{var a=n.tag;if(a===13){if(t=h(n),t!==null)return t;t=null}else if(a===31){if(t=d(n),t!==null)return t;t=null}else if(a===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;t=null}else n!==t&&(t=null)}}return Xu=t,null}function Q_(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(wt()){case Lt:return 2;case Yt:return 8;case At:case yt:return 32;case Qt:return 268435456;default:return 32}default:return 32}}var sd=!1,$a=null,tr=null,er=null,al=new Map,rl=new Map,nr=[],RM="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function J_(t,n){switch(t){case"focusin":case"focusout":$a=null;break;case"dragenter":case"dragleave":tr=null;break;case"mouseover":case"mouseout":er=null;break;case"pointerover":case"pointerout":al.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":rl.delete(n.pointerId)}}function sl(t,n,a,s,u,f){return t===null||t.nativeEvent!==f?(t={blockedOn:n,domEventName:a,eventSystemFlags:s,nativeEvent:f,targetContainers:[u]},n!==null&&(n=ve(n),n!==null&&Z_(n)),t):(t.eventSystemFlags|=s,n=t.targetContainers,u!==null&&n.indexOf(u)===-1&&n.push(u),t)}function CM(t,n,a,s,u){switch(n){case"focusin":return $a=sl($a,t,n,a,s,u),!0;case"dragenter":return tr=sl(tr,t,n,a,s,u),!0;case"mouseover":return er=sl(er,t,n,a,s,u),!0;case"pointerover":var f=u.pointerId;return al.set(f,sl(al.get(f)||null,t,n,a,s,u)),!0;case"gotpointercapture":return f=u.pointerId,rl.set(f,sl(rl.get(f)||null,t,n,a,s,u)),!0}return!1}function $_(t){var n=Ie(t.target);if(n!==null){var a=c(n);if(a!==null){if(n=a.tag,n===13){if(n=h(a),n!==null){t.blockedOn=n,Bt(t.priority,function(){K_(a)});return}}else if(n===31){if(n=d(a),n!==null){t.blockedOn=n,Bt(t.priority,function(){K_(a)});return}}else if(n===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function qu(t){if(t.blockedOn!==null)return!1;for(var n=t.targetContainers;0<n.length;){var a=ad(t.nativeEvent);if(a===null){a=t.nativeEvent;var s=new a.constructor(a.type,a);Gc=s,a.target.dispatchEvent(s),Gc=null}else return n=ve(a),n!==null&&Z_(n),t.blockedOn=a,!1;n.shift()}return!0}function tv(t,n,a){qu(t)&&a.delete(n)}function wM(){sd=!1,$a!==null&&qu($a)&&($a=null),tr!==null&&qu(tr)&&(tr=null),er!==null&&qu(er)&&(er=null),al.forEach(tv),rl.forEach(tv)}function Yu(t,n){t.blockedOn===n&&(t.blockedOn=null,sd||(sd=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,wM)))}var ju=null;function ev(t){ju!==t&&(ju=t,o.unstable_scheduleCallback(o.unstable_NormalPriority,function(){ju===t&&(ju=null);for(var n=0;n<t.length;n+=3){var a=t[n],s=t[n+1],u=t[n+2];if(typeof s!="function"){if(rd(s||a)===null)continue;break}var f=ve(a);f!==null&&(t.splice(n,3),n-=3,Gf(f,{pending:!0,data:u,method:a.method,action:s},s,u))}}))}function Fs(t){function n(z){return Yu(z,t)}$a!==null&&Yu($a,t),tr!==null&&Yu(tr,t),er!==null&&Yu(er,t),al.forEach(n),rl.forEach(n);for(var a=0;a<nr.length;a++){var s=nr[a];s.blockedOn===t&&(s.blockedOn=null)}for(;0<nr.length&&(a=nr[0],a.blockedOn===null);)$_(a),a.blockedOn===null&&nr.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(s=0;s<a.length;s+=3){var u=a[s],f=a[s+1],v=u[Zt]||null;if(typeof f=="function")v||ev(a);else if(v){var T=null;if(f&&f.hasAttribute("formAction")){if(u=f,v=f[Zt]||null)T=v.formAction;else if(rd(u)!==null)continue}else T=v.action;typeof T=="function"?a[s+1]=T:(a.splice(s,3),s-=3),ev(a)}}}function nv(){function t(f){f.canIntercept&&f.info==="react-transition"&&f.intercept({handler:function(){return new Promise(function(v){return u=v})},focusReset:"manual",scroll:"manual"})}function n(){u!==null&&(u(),u=null),s||setTimeout(a,20)}function a(){if(!s&&!navigation.transition){var f=navigation.currentEntry;f&&f.url!=null&&navigation.navigate(f.url,{state:f.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var s=!1,u=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(a,100),function(){s=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),u!==null&&(u(),u=null)}}}function od(t){this._internalRoot=t}Wu.prototype.render=od.prototype.render=function(t){var n=this._internalRoot;if(n===null)throw Error(r(409));var a=n.current,s=oi();j_(a,s,t,n,null,null)},Wu.prototype.unmount=od.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var n=t.containerInfo;j_(t.current,2,null,t,null,null),Nu(),n[se]=null}};function Wu(t){this._internalRoot=t}Wu.prototype.unstable_scheduleHydration=function(t){if(t){var n=Rt();t={blockedOn:null,target:t,priority:n};for(var a=0;a<nr.length&&n!==0&&n<nr[a].priority;a++);nr.splice(a,0,t),a===0&&$_(t)}};var iv=e.version;if(iv!=="19.3.1")throw Error(r(527,iv,"19.3.1"));qt.findDOMNode=function(t){var n=t._reactInternals;if(n===void 0)throw typeof t.render=="function"?Error(r(188)):(t=Object.keys(t).join(","),Error(r(268,t)));return t=p(n),t=t!==null?_(t):null,t=t===null?null:t.stateNode,t};var DM={bundleType:0,version:"19.3.1",rendererPackageName:"react-dom",currentDispatcherRef:Tt,reconcilerVersion:"19.3.1"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Zu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Zu.isDisabled&&Zu.supportsFiber)try{be=Zu.inject(DM),en=Zu}catch{}}return ll.createRoot=function(t,n){if(!l(t))throw Error(r(299));var a=!1,s="",u=Yg,f=jg,v=Wg;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onUncaughtError!==void 0&&(u=n.onUncaughtError),n.onCaughtError!==void 0&&(f=n.onCaughtError),n.onRecoverableError!==void 0&&(v=n.onRecoverableError)),n=q_(t,1,!1,null,null,a,s,null,u,f,v,nv),t[se]=n.current,Ih(t),new od(n)},ll.hydrateRoot=function(t,n,a){if(!l(t))throw Error(r(299));var s=!1,u="",f=Yg,v=jg,T=Wg,z=null;return a!=null&&(a.unstable_strictMode===!0&&(s=!0),a.identifierPrefix!==void 0&&(u=a.identifierPrefix),a.onUncaughtError!==void 0&&(f=a.onUncaughtError),a.onCaughtError!==void 0&&(v=a.onCaughtError),a.onRecoverableError!==void 0&&(T=a.onRecoverableError),a.formState!==void 0&&(z=a.formState)),n=q_(t,1,!0,n,a??null,s,u,z,f,v,T,nv),n.context=Y_(null),a=n.current,s=oi(),s=ct(s),u=Ha(s),u.callback=null,Ga(a,u,s),a=s,n.current.lanes=a,xr(n,a),Zi(n),t[se]=n.current,Ih(t),new Wu(n)},ll.version="19.3.1",ll}var dv;function HM(){if(dv)return cd.exports;dv=1;function o(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(o)}catch(e){console.error(e)}}return o(),cd.exports=FM(),cd.exports}var GM=HM();const Jt={core:{name:"Core Relay",organic:"Heartgrove",ore:340,flux:0,hp:1600,time:260,supply:0,speed:0,range:10,damage:13,period:22,radius:3,building:!0},worker:{name:"Fabricator",organic:"Tender",ore:50,flux:0,hp:85,time:60,supply:1,speed:4,range:2,damage:3,period:22,radius:.55},scout:{name:"Kestrel",organic:"Glimmerwing",ore:65,flux:0,hp:100,time:70,supply:1,speed:8,range:6,damage:4,period:18,radius:.65},soldier:{name:"Bulwark",organic:"Thornling",ore:70,flux:0,hp:190,time:80,supply:2,speed:4.8,range:8,damage:16,period:20,radius:.75,prereq:"bay"},lancer:{name:"Arc Lancer",organic:"Sporecaster",ore:100,flux:25,hp:230,time:110,supply:3,speed:3.8,range:11,damage:34,period:30,radius:.85,prereq:"tech"},siege:{name:"Mortar Crawler",organic:"Rift Stag",ore:160,flux:60,hp:280,time:145,supply:4,speed:3,range:15,damage:75,period:60,radius:1.1,prereq:"tech"},bay:{name:"Assembly Bay",organic:"Brood Hollow",ore:150,flux:0,hp:650,time:160,supply:0,speed:0,range:0,damage:0,period:0,radius:2.4,building:!0},pylon:{name:"Grid Pylon",organic:"Root Node",ore:90,flux:0,hp:360,time:100,supply:0,speed:0,range:0,damage:0,period:0,radius:1.3,building:!0},tap:{name:"Flux Tap",organic:"Flux Tap",ore:100,flux:0,hp:420,time:130,supply:0,speed:0,range:0,damage:0,period:0,radius:1.5,building:!0},tech:{name:"Signal Foundry",organic:"Memory Bloom",ore:170,flux:40,hp:550,time:180,supply:0,speed:0,range:0,damage:0,period:0,radius:2,building:!0,prereq:"bay"},turret:{name:"Sentry Arc",organic:"Needle Pod",ore:120,flux:15,hp:500,time:140,supply:0,speed:0,range:12,damage:24,period:25,radius:1.2,building:!0,prereq:"bay"}},Ki=(o,e)=>e==="helix"?Jt[o].name:Jt[o].organic,$i={spawns:[{x:18,z:66},{x:94,z:22}],bridges:[22,44,66],vents:[{x:12,z:53},{x:100,z:35},{x:30,z:17},{x:82,z:71}],pylons:[{x:47,z:24},{x:65,z:64}]};function jr(o,e){return o>3&&o<109&&e>3&&e<85&&!(o>52&&o<60&&!$i.bridges.some(i=>Math.abs(e-i)<5))}function VM(o,e,i,r){const d=Math.floor(e/2)*56+Math.floor(o/2),g=Math.floor(r/2)*56+Math.floor(i/2);if(!jr(i,r))return[];const p=[d],_=new Map([[d,0]]),m=new Map;let x=0;const S=E=>Math.abs(E%56-g%56)+Math.abs(Math.floor(E/56)-Math.floor(g/56));for(;p.length&&x++<2500;){p.sort((A,M)=>_.get(A)+S(A)-(_.get(M)+S(M)));const E=p.shift();if(E===g){const A=[{x:i,z:r}];let M=E;for(;m.has(M);)A.push({x:M%56*2+1,z:Math.floor(M/56)*2+1}),M=m.get(M);return A.reverse()}for(const A of[-1,1,-56,56]){const M=E+A,y=M%56,N=Math.floor(M/56);if(y<1||y>=55||N<1||N>=43||!jr(y*2+1,N*2+1))continue;const L=_.get(E)+1;L<(_.get(M)??1/0)&&(_.set(M,L),m.set(M,E),p.includes(M)||p.push(M))}}return[]}class pv{tick=0;nextId=1;entities=[];resources=[];ore=[420,420];flux=[0,0];upgrades=[0,0];factions;winner=null;events=[];effects=[];seen=[new Set,new Set];explored=[new Set,new Set];collected=[0,0];created=[0,0];lost=[0,0];message="";commandLog=[];difficulty;aiEnabled=!0;watch=[{owner:-1,progress:0},{owner:-1,progress:0}];constructor(e="helix",i=1){this.factions=[e,e==="helix"?"verdant":"helix"],this.difficulty=i;for(let r=0;r<2;r++){const l=$i.spawns[r];this.spawn("core",r,l.x,l.z);for(let c=0;c<6;c++){const h=this.spawn("worker",r,l.x-5+c%3*2,l.z+5+Math.floor(c/3)*2);h.orders=[{type:"gather",x:r?100:12,z:r?13:75}]}this.spawn("scout",r,l.x+(r?-7:7),l.z)}for(const[r,l]of[[12,76],[100,12],[26,35],[86,53],[25,13],[87,75],[47,44],[65,44]])for(let c=0;c<5;c++)this.resources.push({id:1e4+this.resources.length,x:r+c%3*2.3,z:l+Math.floor(c/3)*2.4,amount:1400});this.vision()}spawn(e,i,r,l){const c={id:this.nextId++,team:i,kind:e,x:r,z:l,hp:Jt[e].hp,progress:1,orders:[],path:[],cool:0,cargo:0,harvest:0,queue:[],train:0,ability:0,angle:0};return this.entities.push(c),this.created[i]++,c}supply(e){return this.entities.filter(i=>i.team===e&&!Jt[i.kind].building).reduce((i,r)=>i+Jt[r.kind].supply,0)}cap(e){return this.entities.filter(i=>i.team===e&&i.progress===1).reduce((i,r)=>i+(r.kind==="core"?18:r.kind==="pylon"?12:0),0)}has(e,i){return this.entities.some(r=>r.team===e&&r.kind===i&&r.progress===1)}pay(e,i){const r=Jt[i];return this.ore[e]<r.ore||this.flux[e]<r.flux?(this.message="Insufficient resources",!1):r.prereq&&!this.has(e,r.prereq)?(this.message="Requires "+Jt[r.prereq].name,!1):(this.ore[e]-=r.ore,this.flux[e]-=r.flux,!0)}canPlace(e,i,r){const l=Jt[e];return jr(i,r)&&jr(i-l.radius,r-l.radius)&&jr(i+l.radius,r+l.radius)&&!this.entities.some(c=>Jt[c.kind].building&&Math.hypot(c.x-i,c.z-r)<Jt[c.kind].radius+l.radius+1)&&!this.resources.some(c=>c.amount>0&&Math.hypot(c.x-i,c.z-r)<l.radius+1)&&(e!=="tap"||$i.vents.some(c=>Math.hypot(c.x-i,c.z-r)<3))}command(e){if(this.winner!==null)return!1;const i=e.ids.slice(0,250),r=this.entities.filter(h=>i.includes(h.id)&&h.team===e.team);if(!r.length)return!1;const l=e.team;let c=!1;if(e.kind==="build"&&e.unit&&Jt[e.unit].building&&r.some(h=>h.kind==="worker")&&Number.isFinite(e.x)&&Number.isFinite(e.z)){const h=e.x,d=e.z;if(this.canPlace(e.unit,h,d)&&this.entities.some(g=>g.team===l&&Jt[g.kind].building&&Math.hypot(g.x-h,g.z-d)<30)&&this.pay(l,e.unit)){const g=this.spawn(e.unit,l,h,d);g.progress=.01,g.hp=Jt[e.unit].hp*.01,c=!0,this.events.push({tick:this.tick,text:Jt[e.unit].name+" founded"})}else this.message="Placement blocked, too far from base, or prerequisites missing"}if(e.kind==="train"&&e.unit&&!Jt[e.unit].building){const h=r.find(d=>d.kind==="core"&&["worker","scout"].includes(e.unit)||d.kind==="bay"&&["soldier","lancer","siege"].includes(e.unit));h&&h.progress===1&&h.queue.length<8&&this.pay(l,e.unit)&&(h.queue.push(e.unit),c=!0)}if(e.kind==="order"&&Number.isFinite(e.x)&&Number.isFinite(e.z)){let h=e.target?this.entities.find(d=>d.id===e.target):void 0;if(h&&h.team!==l&&!this.seen[l].has(h.id))return!1;for(const d of r){if(Jt[d.kind].building){d.rally={x:e.x,z:e.z};continue}const g={type:e.order??"move",x:Math.max(4,Math.min(108,e.x)),z:Math.max(4,Math.min(84,e.z)),target:h?.id};e.append?d.orders.push(g):(d.orders=[g],d.path=[]),c=!0}}if(e.kind==="stop"&&(r.forEach(h=>{h.orders=[],h.path=[]}),c=!0),e.kind==="ability")for(const h of r)!Jt[h.kind].building&&h.kind!=="worker"&&h.ability<=this.tick&&this.flux[l]>=10&&(this.flux[l]-=10,h.ability=this.tick+400,h.hp=Math.min(Jt[h.kind].hp,h.hp+65),h.cool=-80,c=!0);if(e.kind==="upgrade"&&r.some(h=>h.kind==="tech"&&h.progress===1)&&!this.upgrades[l]&&this.ore[l]>=150&&this.flux[l]>=60&&(this.ore[l]-=150,this.flux[l]-=60,this.upgrades[l]=1,c=!0),e.kind==="cancel"){for(const h of r)if(h.queue.length){const d=h.queue.pop();this.ore[l]+=Jt[d].ore*.75,this.flux[l]+=Jt[d].flux*.75,c=!0}}return c&&this.commandLog.push({tick:this.tick,command:structuredClone(e)}),c}visible(e,i,r){return this.entities.some(l=>l.team===e&&l.progress===1&&Math.hypot(l.x-i,l.z-r)<(l.kind==="scout"?24:Jt[l.kind].building?19:15))||$i.pylons.some((l,c)=>this.watch[c].owner===e&&Math.hypot(l.x-i,l.z-r)<22)}vision(){for(let e=0;e<2;e++){this.seen[e].clear();for(const i of this.entities)(i.team===e||this.visible(e,i.x,i.z))&&this.seen[e].add(i.id);for(let i=0;i<88;i+=4)for(let r=0;r<112;r+=4)this.visible(e,r,i)&&this.explored[e].add(i*112+r)}}step(){if(this.winner!==null)return;this.tick++,this.effects=this.effects.filter(i=>--i.life>0),this.tick%10===0&&this.vision(),this.aiEnabled&&this.tick%40===0&&this.ai();for(const i of this.entities){const r=Jt[i.kind];if(i.progress<1){this.entities.some(d=>d.team===i.team&&d.kind==="worker"&&Math.hypot(d.x-i.x,d.z-i.z)<32)&&(i.progress=Math.min(1,i.progress+1/r.time),i.hp=Math.min(r.hp,i.hp+r.hp/r.time));continue}if(i.queue.length){const h=i.queue[0];if(this.supply(i.team)+Jt[h].supply<=this.cap(i.team)&&(i.train++,i.train>=Jt[h].time)){const d=this.spawn(h,i.team,i.x+3.5,i.z+3);d.orders=[h==="worker"?{type:"gather",x:i.x,z:i.z}:{type:"attack",x:i.rally?.x??i.x+5,z:i.rally?.z??i.z+5}],i.train=0,i.queue.shift()}}if(i.kind==="tap"&&this.tick%20===0&&(this.flux[i.team]+=4),i.kind==="worker"){this.worker(i);continue}const l=i.orders[0];let c=l?.target?this.entities.find(h=>h.id===l.target&&h.team!==i.team):void 0;if(c&&!this.seen[i.team].has(c.id)&&(c=void 0),(!l||l.type==="attack")&&!c&&r.damage>0&&(c=this.entities.filter(h=>h.team!==i.team&&this.seen[i.team].has(h.id)&&Math.hypot(h.x-i.x,h.z-i.z)<r.range+3).sort((h,d)=>Math.hypot(h.x-i.x,h.z-i.z)-Math.hypot(d.x-i.x,d.z-i.z))[0]),c&&Math.hypot(c.x-i.x,c.z-i.z)<=r.range){if(i.angle=Math.atan2(c.x-i.x,c.z-i.z),i.cool<=0){const h=i.kind==="lancer"&&Jt[c.kind].building?1.4:i.kind==="siege"&&Jt[c.kind].building?1.9:1;c.hp-=r.damage*h*(1+this.upgrades[i.team]*.1),i.cool=r.period,this.effects.push({x:i.x,z:i.z,tx:c.x,tz:c.z,team:i.team,life:8,siege:i.kind==="siege"})}}else r.building||(c&&(!l||l.type==="attack")?this.move(i,c.x,c.z):l&&this.move(i,l.x,l.z));i.cool--,this.factions[i.team]==="verdant"&&this.tick%60===0&&(i.hp=Math.min(r.hp,i.hp+2))}const e=this.entities.filter(i=>!Jt[i.kind].building&&i.hp>0);for(let i=0;i<e.length;i++)for(let r=i+1;r<e.length;r++){const l=e[i],c=e[r],h=c.x-l.x,d=c.z-l.z,g=Math.hypot(h,d),p=(Jt[l.kind].radius+Jt[c.kind].radius)*.9;if(g<p){const _=g?h/g:1,m=g?d/g:0,x=(p-g)*.35;for(const[S,E]of[[l,-1],[c,1]])jr(S.x+_*x*E,S.z+m*x*E)&&(S.x+=_*x*E,S.z+=m*x*E)}}for(let i=0;i<2;i++){const r=$i.pylons[i],l=[0,1].filter(c=>e.some(h=>h.team===c&&Math.hypot(h.x-r.x,h.z-r.z)<4));l.length===1?(this.watch[i].progress++,this.watch[i].progress>=60&&(this.watch[i].owner=l[0])):this.watch[i].progress=0}for(const i of this.entities)i.hp<=0&&(this.lost[i.team]++,i.kind==="core"&&!this.entities.some(r=>r.id!==i.id&&r.team===i.team&&r.kind==="core"&&r.hp>0)&&(this.winner=1-i.team,this.events.push({tick:this.tick,text:"Core Relay destroyed"})));this.entities=this.entities.filter(i=>i.hp>0)}move(e,i,r){if(Math.hypot(i-e.x,r-e.z)<1.2){e.orders.shift(),e.path=[];return}e.path.length||(e.path=VM(e.x,e.z,i,r));let l=e.path[0];if(!l)return;const c=l.x-e.x,h=l.z-e.z,d=Math.hypot(c,h),g=Jt[e.kind].speed/20*(this.factions[e.team]==="verdant"?1.08:1);if(d<g+.2){e.path.shift();return}e.angle=Math.atan2(c,h);const p=e.x+c/d*g,_=e.z+h/d*g;jr(p,_)?(e.x=Math.round(p*1e3)/1e3,e.z=Math.round(_*1e3)/1e3):e.path=[]}worker(e){const i=e.orders[0];if(i?.type!=="gather"){i&&this.move(e,i.x,i.z);return}const r=this.entities.filter(d=>d.team===e.team&&d.kind==="core").sort((d,g)=>Math.hypot(d.x-e.x,d.z-e.z)-Math.hypot(g.x-e.x,g.z-e.z))[0];if(!r)return;const l=this.resources.filter(d=>d.amount>0).sort((d,g)=>Math.hypot(d.x-i.x,d.z-i.z)-Math.hypot(g.x-i.x,g.z-i.z))[0];if(!l)return;const c=e.cargo?r:l,h=e.cargo?4:1.7;Math.hypot(c.x-e.x,c.z-e.z)>h?this.move(e,c.x,c.z):(e.path=[],e.cargo?(this.ore[e.team]+=e.cargo,this.collected[e.team]+=e.cargo,e.cargo=0):++e.harvest>=32&&(e.cargo=Math.min(12,l.amount),l.amount-=e.cargo,e.harvest=0))}ai(){const i=this.entities.filter(_=>_.team===1),r=i.filter(_=>_.kind==="worker"),l=i.find(_=>_.kind==="core");if(!l)return;const c=(_,m,x,S,E)=>this.command({team:1,kind:_,ids:m,unit:x,x:S,z:E});r.length<10&&l.queue.length<1&&c("train",[l.id],"worker");const h=(_,m,x)=>{!this.has(1,_)&&!i.some(S=>S.kind===_)&&r[0]&&c("build",[r[0].id],_,l.x+m,l.z+x)};if(h("bay",-8,1),h("tap",6,13),this.cap(1)-this.supply(1)<6&&r[0]){const _=i.filter(m=>m.kind==="pylon").length;c("build",[r[0].id],"pylon",89-_%4*4,8+Math.floor(_/4)*5)}h("tech",-1,9);for(const _ of i.filter(m=>m.kind==="bay"))_.queue.length<2&&c("train",[_.id],this.has(1,"tech")&&this.flux[1]>35?this.tick%3?"lancer":"siege":"soldier");const d=i.filter(_=>!Jt[_.kind].building&&_.kind!=="worker"),g=this.entities.find(_=>_.team===0&&this.seen[1].has(_.id)&&Math.hypot(_.x-l.x,_.z-l.z)<25),p=this.entities.find(_=>_.team===0&&_.kind==="core"&&this.seen[1].has(_.id));if(g||d.length>=8+(2-this.difficulty)*3||this.tick>11e3)for(const _ of d)(!_.orders.length||this.tick%200===0)&&this.command({team:1,kind:"order",ids:[_.id],order:"attack",x:g?.x??p?.x??18,z:g?.z??p?.z??66});else if(this.tick>1200){const _=d.find(m=>m.kind==="scout");_&&!_.orders.length&&this.command({team:1,kind:"order",ids:[_.id],order:"attack",x:24,z:66})}}hash(){return JSON.stringify([this.tick,this.ore,this.flux,this.entities.map(e=>[e.id,e.kind,e.x,e.z,e.hp,e.queue,e.train]),this.winner])}}const Pp="180",kM=0,mv=1,XM=2,yx=1,Sx=2,ba=3,pr=0,$n=1,Li=2,hr=0,ao=1,gv=2,_v=3,vv=4,qM=5,Wr=100,YM=101,jM=102,WM=103,ZM=104,KM=200,QM=201,JM=202,$M=203,qd=204,Yd=205,tE=206,eE=207,nE=208,iE=209,aE=210,rE=211,sE=212,oE=213,lE=214,jd=0,Wd=1,Zd=2,so=3,Kd=4,Qd=5,Jd=6,$d=7,Mx=0,uE=1,cE=2,dr=0,fE=1,hE=2,dE=3,pE=4,mE=5,gE=6,_E=7,Ex=300,oo=301,lo=302,tp=303,ep=304,Uc=306,np=1e3,Kr=1001,ip=1002,Ii=1003,vE=1004,Ku=1005,zi=1006,pd=1007,Qr=1008,na=1009,Tx=1010,bx=1011,vl=1012,Ip=1013,Jr=1014,Ca=1015,Tl=1016,Bp=1017,Fp=1018,xl=1020,Ax=35902,Rx=35899,Cx=1021,wx=1022,Pi=1023,yl=1026,Sl=1027,Dx=1028,Hp=1029,Ux=1030,Gp=1031,Vp=1033,xc=33776,yc=33777,Sc=33778,Mc=33779,ap=35840,rp=35841,sp=35842,op=35843,lp=36196,up=37492,cp=37496,fp=37808,hp=37809,dp=37810,pp=37811,mp=37812,gp=37813,_p=37814,vp=37815,xp=37816,yp=37817,Sp=37818,Mp=37819,Ep=37820,Tp=37821,bp=36492,Ap=36494,Rp=36495,Cp=36283,wp=36284,Dp=36285,Up=36286,xE=3200,yE=3201,Nx=0,SE=1,fr="",Mi="srgb",uo="srgb-linear",Tc="linear",je="srgb",Hs=7680,xv=519,ME=512,EE=513,TE=514,Lx=515,bE=516,AE=517,RE=518,CE=519,yv=35044,Sv="300 es",ta=2e3,bc=2001;class ho{addEventListener(e,i){this._listeners===void 0&&(this._listeners={});const r=this._listeners;r[e]===void 0&&(r[e]=[]),r[e].indexOf(i)===-1&&r[e].push(i)}hasEventListener(e,i){const r=this._listeners;return r===void 0?!1:r[e]!==void 0&&r[e].indexOf(i)!==-1}removeEventListener(e,i){const r=this._listeners;if(r===void 0)return;const l=r[e];if(l!==void 0){const c=l.indexOf(i);c!==-1&&l.splice(c,1)}}dispatchEvent(e){const i=this._listeners;if(i===void 0)return;const r=i[e.type];if(r!==void 0){e.target=this;const l=r.slice(0);for(let c=0,h=l.length;c<h;c++)l[c].call(this,e);e.target=null}}}const Pn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Mv=1234567;const ml=Math.PI/180,Ml=180/Math.PI;function po(){const o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Pn[o&255]+Pn[o>>8&255]+Pn[o>>16&255]+Pn[o>>24&255]+"-"+Pn[e&255]+Pn[e>>8&255]+"-"+Pn[e>>16&15|64]+Pn[e>>24&255]+"-"+Pn[i&63|128]+Pn[i>>8&255]+"-"+Pn[i>>16&255]+Pn[i>>24&255]+Pn[r&255]+Pn[r>>8&255]+Pn[r>>16&255]+Pn[r>>24&255]).toLowerCase()}function Ce(o,e,i){return Math.max(e,Math.min(i,o))}function kp(o,e){return(o%e+e)%e}function wE(o,e,i,r,l){return r+(o-e)*(l-r)/(i-e)}function DE(o,e,i){return o!==e?(i-o)/(e-o):0}function gl(o,e,i){return(1-i)*o+i*e}function UE(o,e,i,r){return gl(o,e,1-Math.exp(-i*r))}function NE(o,e=1){return e-Math.abs(kp(o,e*2)-e)}function LE(o,e,i){return o<=e?0:o>=i?1:(o=(o-e)/(i-e),o*o*(3-2*o))}function OE(o,e,i){return o<=e?0:o>=i?1:(o=(o-e)/(i-e),o*o*o*(o*(o*6-15)+10))}function zE(o,e){return o+Math.floor(Math.random()*(e-o+1))}function PE(o,e){return o+Math.random()*(e-o)}function IE(o){return o*(.5-Math.random())}function BE(o){o!==void 0&&(Mv=o);let e=Mv+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function FE(o){return o*ml}function HE(o){return o*Ml}function GE(o){return(o&o-1)===0&&o!==0}function VE(o){return Math.pow(2,Math.ceil(Math.log(o)/Math.LN2))}function kE(o){return Math.pow(2,Math.floor(Math.log(o)/Math.LN2))}function XE(o,e,i,r,l){const c=Math.cos,h=Math.sin,d=c(i/2),g=h(i/2),p=c((e+r)/2),_=h((e+r)/2),m=c((e-r)/2),x=h((e-r)/2),S=c((r-e)/2),E=h((r-e)/2);switch(l){case"XYX":o.set(d*_,g*m,g*x,d*p);break;case"YZY":o.set(g*x,d*_,g*m,d*p);break;case"ZXZ":o.set(g*m,g*x,d*_,d*p);break;case"XZX":o.set(d*_,g*E,g*S,d*p);break;case"YXY":o.set(g*S,d*_,g*E,d*p);break;case"ZYZ":o.set(g*E,g*S,d*_,d*p);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+l)}}function to(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("Invalid component type.")}}function kn(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("Invalid component type.")}}const Ev={DEG2RAD:ml,RAD2DEG:Ml,generateUUID:po,clamp:Ce,euclideanModulo:kp,mapLinear:wE,inverseLerp:DE,lerp:gl,damp:UE,pingpong:NE,smoothstep:LE,smootherstep:OE,randInt:zE,randFloat:PE,randFloatSpread:IE,seededRandom:BE,degToRad:FE,radToDeg:HE,isPowerOfTwo:GE,ceilPowerOfTwo:VE,floorPowerOfTwo:kE,setQuaternionFromProperEuler:XE,normalize:kn,denormalize:to};class Te{constructor(e=0,i=0){Te.prototype.isVector2=!0,this.x=e,this.y=i}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,i){return this.x=e,this.y=i,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const i=this.x,r=this.y,l=e.elements;return this.x=l[0]*i+l[3]*r+l[6],this.y=l[1]*i+l[4]*r+l[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this}clampLength(e,i){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Ce(r,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const r=this.dot(e)/i;return Math.acos(Ce(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,r=this.y-e.y;return i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this}lerpVectors(e,i,r){return this.x=e.x+(i.x-e.x)*r,this.y=e.y+(i.y-e.y)*r,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this}rotateAround(e,i){const r=Math.cos(i),l=Math.sin(i),c=this.x-e.x,h=this.y-e.y;return this.x=c*r-h*l+e.x,this.y=c*l+h*r+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class bl{constructor(e=0,i=0,r=0,l=1){this.isQuaternion=!0,this._x=e,this._y=i,this._z=r,this._w=l}static slerpFlat(e,i,r,l,c,h,d){let g=r[l+0],p=r[l+1],_=r[l+2],m=r[l+3];const x=c[h+0],S=c[h+1],E=c[h+2],A=c[h+3];if(d===0){e[i+0]=g,e[i+1]=p,e[i+2]=_,e[i+3]=m;return}if(d===1){e[i+0]=x,e[i+1]=S,e[i+2]=E,e[i+3]=A;return}if(m!==A||g!==x||p!==S||_!==E){let M=1-d;const y=g*x+p*S+_*E+m*A,N=y>=0?1:-1,L=1-y*y;if(L>Number.EPSILON){const F=Math.sqrt(L),I=Math.atan2(F,y*N);M=Math.sin(M*I)/F,d=Math.sin(d*I)/F}const D=d*N;if(g=g*M+x*D,p=p*M+S*D,_=_*M+E*D,m=m*M+A*D,M===1-d){const F=1/Math.sqrt(g*g+p*p+_*_+m*m);g*=F,p*=F,_*=F,m*=F}}e[i]=g,e[i+1]=p,e[i+2]=_,e[i+3]=m}static multiplyQuaternionsFlat(e,i,r,l,c,h){const d=r[l],g=r[l+1],p=r[l+2],_=r[l+3],m=c[h],x=c[h+1],S=c[h+2],E=c[h+3];return e[i]=d*E+_*m+g*S-p*x,e[i+1]=g*E+_*x+p*m-d*S,e[i+2]=p*E+_*S+d*x-g*m,e[i+3]=_*E-d*m-g*x-p*S,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,i,r,l){return this._x=e,this._y=i,this._z=r,this._w=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,i=!0){const r=e._x,l=e._y,c=e._z,h=e._order,d=Math.cos,g=Math.sin,p=d(r/2),_=d(l/2),m=d(c/2),x=g(r/2),S=g(l/2),E=g(c/2);switch(h){case"XYZ":this._x=x*_*m+p*S*E,this._y=p*S*m-x*_*E,this._z=p*_*E+x*S*m,this._w=p*_*m-x*S*E;break;case"YXZ":this._x=x*_*m+p*S*E,this._y=p*S*m-x*_*E,this._z=p*_*E-x*S*m,this._w=p*_*m+x*S*E;break;case"ZXY":this._x=x*_*m-p*S*E,this._y=p*S*m+x*_*E,this._z=p*_*E+x*S*m,this._w=p*_*m-x*S*E;break;case"ZYX":this._x=x*_*m-p*S*E,this._y=p*S*m+x*_*E,this._z=p*_*E-x*S*m,this._w=p*_*m+x*S*E;break;case"YZX":this._x=x*_*m+p*S*E,this._y=p*S*m+x*_*E,this._z=p*_*E-x*S*m,this._w=p*_*m-x*S*E;break;case"XZY":this._x=x*_*m-p*S*E,this._y=p*S*m-x*_*E,this._z=p*_*E+x*S*m,this._w=p*_*m+x*S*E;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+h)}return i===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,i){const r=i/2,l=Math.sin(r);return this._x=e.x*l,this._y=e.y*l,this._z=e.z*l,this._w=Math.cos(r),this._onChangeCallback(),this}setFromRotationMatrix(e){const i=e.elements,r=i[0],l=i[4],c=i[8],h=i[1],d=i[5],g=i[9],p=i[2],_=i[6],m=i[10],x=r+d+m;if(x>0){const S=.5/Math.sqrt(x+1);this._w=.25/S,this._x=(_-g)*S,this._y=(c-p)*S,this._z=(h-l)*S}else if(r>d&&r>m){const S=2*Math.sqrt(1+r-d-m);this._w=(_-g)/S,this._x=.25*S,this._y=(l+h)/S,this._z=(c+p)/S}else if(d>m){const S=2*Math.sqrt(1+d-r-m);this._w=(c-p)/S,this._x=(l+h)/S,this._y=.25*S,this._z=(g+_)/S}else{const S=2*Math.sqrt(1+m-r-d);this._w=(h-l)/S,this._x=(c+p)/S,this._y=(g+_)/S,this._z=.25*S}return this._onChangeCallback(),this}setFromUnitVectors(e,i){let r=e.dot(i)+1;return r<1e-8?(r=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=r):(this._x=0,this._y=-e.z,this._z=e.y,this._w=r)):(this._x=e.y*i.z-e.z*i.y,this._y=e.z*i.x-e.x*i.z,this._z=e.x*i.y-e.y*i.x,this._w=r),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ce(this.dot(e),-1,1)))}rotateTowards(e,i){const r=this.angleTo(e);if(r===0)return this;const l=Math.min(1,i/r);return this.slerp(e,l),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,i){const r=e._x,l=e._y,c=e._z,h=e._w,d=i._x,g=i._y,p=i._z,_=i._w;return this._x=r*_+h*d+l*p-c*g,this._y=l*_+h*g+c*d-r*p,this._z=c*_+h*p+r*g-l*d,this._w=h*_-r*d-l*g-c*p,this._onChangeCallback(),this}slerp(e,i){if(i===0)return this;if(i===1)return this.copy(e);const r=this._x,l=this._y,c=this._z,h=this._w;let d=h*e._w+r*e._x+l*e._y+c*e._z;if(d<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,d=-d):this.copy(e),d>=1)return this._w=h,this._x=r,this._y=l,this._z=c,this;const g=1-d*d;if(g<=Number.EPSILON){const S=1-i;return this._w=S*h+i*this._w,this._x=S*r+i*this._x,this._y=S*l+i*this._y,this._z=S*c+i*this._z,this.normalize(),this}const p=Math.sqrt(g),_=Math.atan2(p,d),m=Math.sin((1-i)*_)/p,x=Math.sin(i*_)/p;return this._w=h*m+this._w*x,this._x=r*m+this._x*x,this._y=l*m+this._y*x,this._z=c*m+this._z*x,this._onChangeCallback(),this}slerpQuaternions(e,i,r){return this.copy(e).slerp(i,r)}random(){const e=2*Math.PI*Math.random(),i=2*Math.PI*Math.random(),r=Math.random(),l=Math.sqrt(1-r),c=Math.sqrt(r);return this.set(l*Math.sin(e),l*Math.cos(e),c*Math.sin(i),c*Math.cos(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,i=0){return this._x=e[i],this._y=e[i+1],this._z=e[i+2],this._w=e[i+3],this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._w,e}fromBufferAttribute(e,i){return this._x=e.getX(i),this._y=e.getY(i),this._z=e.getZ(i),this._w=e.getW(i),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class et{constructor(e=0,i=0,r=0){et.prototype.isVector3=!0,this.x=e,this.y=i,this.z=r}set(e,i,r){return r===void 0&&(r=this.z),this.x=e,this.y=i,this.z=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,i){return this.x=e.x*i.x,this.y=e.y*i.y,this.z=e.z*i.z,this}applyEuler(e){return this.applyQuaternion(Tv.setFromEuler(e))}applyAxisAngle(e,i){return this.applyQuaternion(Tv.setFromAxisAngle(e,i))}applyMatrix3(e){const i=this.x,r=this.y,l=this.z,c=e.elements;return this.x=c[0]*i+c[3]*r+c[6]*l,this.y=c[1]*i+c[4]*r+c[7]*l,this.z=c[2]*i+c[5]*r+c[8]*l,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const i=this.x,r=this.y,l=this.z,c=e.elements,h=1/(c[3]*i+c[7]*r+c[11]*l+c[15]);return this.x=(c[0]*i+c[4]*r+c[8]*l+c[12])*h,this.y=(c[1]*i+c[5]*r+c[9]*l+c[13])*h,this.z=(c[2]*i+c[6]*r+c[10]*l+c[14])*h,this}applyQuaternion(e){const i=this.x,r=this.y,l=this.z,c=e.x,h=e.y,d=e.z,g=e.w,p=2*(h*l-d*r),_=2*(d*i-c*l),m=2*(c*r-h*i);return this.x=i+g*p+h*m-d*_,this.y=r+g*_+d*p-c*m,this.z=l+g*m+c*_-h*p,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const i=this.x,r=this.y,l=this.z,c=e.elements;return this.x=c[0]*i+c[4]*r+c[8]*l,this.y=c[1]*i+c[5]*r+c[9]*l,this.z=c[2]*i+c[6]*r+c[10]*l,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this.z=Ce(this.z,e.z,i.z),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this.z=Ce(this.z,e,i),this}clampLength(e,i){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Ce(r,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this}lerpVectors(e,i,r){return this.x=e.x+(i.x-e.x)*r,this.y=e.y+(i.y-e.y)*r,this.z=e.z+(i.z-e.z)*r,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,i){const r=e.x,l=e.y,c=e.z,h=i.x,d=i.y,g=i.z;return this.x=l*g-c*d,this.y=c*h-r*g,this.z=r*d-l*h,this}projectOnVector(e){const i=e.lengthSq();if(i===0)return this.set(0,0,0);const r=e.dot(this)/i;return this.copy(e).multiplyScalar(r)}projectOnPlane(e){return md.copy(this).projectOnVector(e),this.sub(md)}reflect(e){return this.sub(md.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const i=Math.sqrt(this.lengthSq()*e.lengthSq());if(i===0)return Math.PI/2;const r=this.dot(e)/i;return Math.acos(Ce(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const i=this.x-e.x,r=this.y-e.y,l=this.z-e.z;return i*i+r*r+l*l}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,i,r){const l=Math.sin(i)*e;return this.x=l*Math.sin(r),this.y=Math.cos(i)*e,this.z=l*Math.cos(r),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,i,r){return this.x=e*Math.sin(i),this.y=r,this.z=e*Math.cos(i),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this}setFromMatrixScale(e){const i=this.setFromMatrixColumn(e,0).length(),r=this.setFromMatrixColumn(e,1).length(),l=this.setFromMatrixColumn(e,2).length();return this.x=i,this.y=r,this.z=l,this}setFromMatrixColumn(e,i){return this.fromArray(e.elements,i*4)}setFromMatrix3Column(e,i){return this.fromArray(e.elements,i*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,i=Math.random()*2-1,r=Math.sqrt(1-i*i);return this.x=r*Math.cos(e),this.y=i,this.z=r*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const md=new et,Tv=new bl;class ge{constructor(e,i,r,l,c,h,d,g,p){ge.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,i,r,l,c,h,d,g,p)}set(e,i,r,l,c,h,d,g,p){const _=this.elements;return _[0]=e,_[1]=l,_[2]=d,_[3]=i,_[4]=c,_[5]=g,_[6]=r,_[7]=h,_[8]=p,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const i=this.elements,r=e.elements;return i[0]=r[0],i[1]=r[1],i[2]=r[2],i[3]=r[3],i[4]=r[4],i[5]=r[5],i[6]=r[6],i[7]=r[7],i[8]=r[8],this}extractBasis(e,i,r){return e.setFromMatrix3Column(this,0),i.setFromMatrix3Column(this,1),r.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const i=e.elements;return this.set(i[0],i[4],i[8],i[1],i[5],i[9],i[2],i[6],i[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const r=e.elements,l=i.elements,c=this.elements,h=r[0],d=r[3],g=r[6],p=r[1],_=r[4],m=r[7],x=r[2],S=r[5],E=r[8],A=l[0],M=l[3],y=l[6],N=l[1],L=l[4],D=l[7],F=l[2],I=l[5],O=l[8];return c[0]=h*A+d*N+g*F,c[3]=h*M+d*L+g*I,c[6]=h*y+d*D+g*O,c[1]=p*A+_*N+m*F,c[4]=p*M+_*L+m*I,c[7]=p*y+_*D+m*O,c[2]=x*A+S*N+E*F,c[5]=x*M+S*L+E*I,c[8]=x*y+S*D+E*O,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[3]*=e,i[6]*=e,i[1]*=e,i[4]*=e,i[7]*=e,i[2]*=e,i[5]*=e,i[8]*=e,this}determinant(){const e=this.elements,i=e[0],r=e[1],l=e[2],c=e[3],h=e[4],d=e[5],g=e[6],p=e[7],_=e[8];return i*h*_-i*d*p-r*c*_+r*d*g+l*c*p-l*h*g}invert(){const e=this.elements,i=e[0],r=e[1],l=e[2],c=e[3],h=e[4],d=e[5],g=e[6],p=e[7],_=e[8],m=_*h-d*p,x=d*g-_*c,S=p*c-h*g,E=i*m+r*x+l*S;if(E===0)return this.set(0,0,0,0,0,0,0,0,0);const A=1/E;return e[0]=m*A,e[1]=(l*p-_*r)*A,e[2]=(d*r-l*h)*A,e[3]=x*A,e[4]=(_*i-l*g)*A,e[5]=(l*c-d*i)*A,e[6]=S*A,e[7]=(r*g-p*i)*A,e[8]=(h*i-r*c)*A,this}transpose(){let e;const i=this.elements;return e=i[1],i[1]=i[3],i[3]=e,e=i[2],i[2]=i[6],i[6]=e,e=i[5],i[5]=i[7],i[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const i=this.elements;return e[0]=i[0],e[1]=i[3],e[2]=i[6],e[3]=i[1],e[4]=i[4],e[5]=i[7],e[6]=i[2],e[7]=i[5],e[8]=i[8],this}setUvTransform(e,i,r,l,c,h,d){const g=Math.cos(c),p=Math.sin(c);return this.set(r*g,r*p,-r*(g*h+p*d)+h+e,-l*p,l*g,-l*(-p*h+g*d)+d+i,0,0,1),this}scale(e,i){return this.premultiply(gd.makeScale(e,i)),this}rotate(e){return this.premultiply(gd.makeRotation(-e)),this}translate(e,i){return this.premultiply(gd.makeTranslation(e,i)),this}makeTranslation(e,i){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,i,0,0,1),this}makeRotation(e){const i=Math.cos(e),r=Math.sin(e);return this.set(i,-r,0,r,i,0,0,0,1),this}makeScale(e,i){return this.set(e,0,0,0,i,0,0,0,1),this}equals(e){const i=this.elements,r=e.elements;for(let l=0;l<9;l++)if(i[l]!==r[l])return!1;return!0}fromArray(e,i=0){for(let r=0;r<9;r++)this.elements[r]=e[r+i];return this}toArray(e=[],i=0){const r=this.elements;return e[i]=r[0],e[i+1]=r[1],e[i+2]=r[2],e[i+3]=r[3],e[i+4]=r[4],e[i+5]=r[5],e[i+6]=r[6],e[i+7]=r[7],e[i+8]=r[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const gd=new ge;function Ox(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}function Ac(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function qE(){const o=Ac("canvas");return o.style.display="block",o}const bv={};function El(o){o in bv||(bv[o]=!0,console.warn(o))}function YE(o,e,i){return new Promise(function(r,l){function c(){switch(o.clientWaitSync(e,o.SYNC_FLUSH_COMMANDS_BIT,0)){case o.WAIT_FAILED:l();break;case o.TIMEOUT_EXPIRED:setTimeout(c,i);break;default:r()}}setTimeout(c,i)})}const Av=new ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rv=new ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function jE(){const o={enabled:!0,workingColorSpace:uo,spaces:{},convert:function(l,c,h){return this.enabled===!1||c===h||!c||!h||(this.spaces[c].transfer===je&&(l.r=wa(l.r),l.g=wa(l.g),l.b=wa(l.b)),this.spaces[c].primaries!==this.spaces[h].primaries&&(l.applyMatrix3(this.spaces[c].toXYZ),l.applyMatrix3(this.spaces[h].fromXYZ)),this.spaces[h].transfer===je&&(l.r=ro(l.r),l.g=ro(l.g),l.b=ro(l.b))),l},workingToColorSpace:function(l,c){return this.convert(l,this.workingColorSpace,c)},colorSpaceToWorking:function(l,c){return this.convert(l,c,this.workingColorSpace)},getPrimaries:function(l){return this.spaces[l].primaries},getTransfer:function(l){return l===fr?Tc:this.spaces[l].transfer},getToneMappingMode:function(l){return this.spaces[l].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(l,c=this.workingColorSpace){return l.fromArray(this.spaces[c].luminanceCoefficients)},define:function(l){Object.assign(this.spaces,l)},_getMatrix:function(l,c,h){return l.copy(this.spaces[c].toXYZ).multiply(this.spaces[h].fromXYZ)},_getDrawingBufferColorSpace:function(l){return this.spaces[l].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(l=this.workingColorSpace){return this.spaces[l].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(l,c){return El("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(l,c)},toWorkingColorSpace:function(l,c){return El("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(l,c)}},e=[.64,.33,.3,.6,.15,.06],i=[.2126,.7152,.0722],r=[.3127,.329];return o.define({[uo]:{primaries:e,whitePoint:r,transfer:Tc,toXYZ:Av,fromXYZ:Rv,luminanceCoefficients:i,workingColorSpaceConfig:{unpackColorSpace:Mi},outputColorSpaceConfig:{drawingBufferColorSpace:Mi}},[Mi]:{primaries:e,whitePoint:r,transfer:je,toXYZ:Av,fromXYZ:Rv,luminanceCoefficients:i,outputColorSpaceConfig:{drawingBufferColorSpace:Mi}}}),o}const Oe=jE();function wa(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function ro(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}let Gs;class WE{static getDataURL(e,i="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let r;if(e instanceof HTMLCanvasElement)r=e;else{Gs===void 0&&(Gs=Ac("canvas")),Gs.width=e.width,Gs.height=e.height;const l=Gs.getContext("2d");e instanceof ImageData?l.putImageData(e,0,0):l.drawImage(e,0,0,e.width,e.height),r=Gs}return r.toDataURL(i)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const i=Ac("canvas");i.width=e.width,i.height=e.height;const r=i.getContext("2d");r.drawImage(e,0,0,e.width,e.height);const l=r.getImageData(0,0,e.width,e.height),c=l.data;for(let h=0;h<c.length;h++)c[h]=wa(c[h]/255)*255;return r.putImageData(l,0,0),i}else if(e.data){const i=e.data.slice(0);for(let r=0;r<i.length;r++)i instanceof Uint8Array||i instanceof Uint8ClampedArray?i[r]=Math.floor(wa(i[r]/255)*255):i[r]=wa(i[r]);return{data:i,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let ZE=0;class Xp{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ZE++}),this.uuid=po(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const i=this.data;return typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement?e.set(i.videoWidth,i.videoHeight,0):i instanceof VideoFrame?e.set(i.displayHeight,i.displayWidth,0):i!==null?e.set(i.width,i.height,i.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const r={uuid:this.uuid,url:""},l=this.data;if(l!==null){let c;if(Array.isArray(l)){c=[];for(let h=0,d=l.length;h<d;h++)l[h].isDataTexture?c.push(_d(l[h].image)):c.push(_d(l[h]))}else c=_d(l);r.url=c}return i||(e.images[this.uuid]=r),r}}function _d(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?WE.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let KE=0;const vd=new et;class qn extends ho{constructor(e=qn.DEFAULT_IMAGE,i=qn.DEFAULT_MAPPING,r=Kr,l=Kr,c=zi,h=Qr,d=Pi,g=na,p=qn.DEFAULT_ANISOTROPY,_=fr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:KE++}),this.uuid=po(),this.name="",this.source=new Xp(e),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=r,this.wrapT=l,this.magFilter=c,this.minFilter=h,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=g,this.offset=new Te(0,0),this.repeat=new Te(1,1),this.center=new Te(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=_,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(vd).x}get height(){return this.source.getSize(vd).y}get depth(){return this.source.getSize(vd).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const i in e){const r=e[i];if(r===void 0){console.warn(`THREE.Texture.setValues(): parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){console.warn(`THREE.Texture.setValues(): property '${i}' does not exist.`);continue}l&&r&&l.isVector2&&r.isVector2||l&&r&&l.isVector3&&r.isVector3||l&&r&&l.isMatrix3&&r.isMatrix3?l.copy(r):this[i]=r}}toJSON(e){const i=e===void 0||typeof e=="string";if(!i&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const r={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(r.userData=this.userData),i||(e.textures[this.uuid]=r),r}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ex)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case np:e.x=e.x-Math.floor(e.x);break;case Kr:e.x=e.x<0?0:1;break;case ip:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case np:e.y=e.y-Math.floor(e.y);break;case Kr:e.y=e.y<0?0:1;break;case ip:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}qn.DEFAULT_IMAGE=null;qn.DEFAULT_MAPPING=Ex;qn.DEFAULT_ANISOTROPY=1;class ln{constructor(e=0,i=0,r=0,l=1){ln.prototype.isVector4=!0,this.x=e,this.y=i,this.z=r,this.w=l}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,i,r,l){return this.x=e,this.y=i,this.z=r,this.w=l,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,i){switch(e){case 0:this.x=i;break;case 1:this.y=i;break;case 2:this.z=i;break;case 3:this.w=i;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,i){return this.x=e.x+i.x,this.y=e.y+i.y,this.z=e.z+i.z,this.w=e.w+i.w,this}addScaledVector(e,i){return this.x+=e.x*i,this.y+=e.y*i,this.z+=e.z*i,this.w+=e.w*i,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,i){return this.x=e.x-i.x,this.y=e.y-i.y,this.z=e.z-i.z,this.w=e.w-i.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const i=this.x,r=this.y,l=this.z,c=this.w,h=e.elements;return this.x=h[0]*i+h[4]*r+h[8]*l+h[12]*c,this.y=h[1]*i+h[5]*r+h[9]*l+h[13]*c,this.z=h[2]*i+h[6]*r+h[10]*l+h[14]*c,this.w=h[3]*i+h[7]*r+h[11]*l+h[15]*c,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const i=Math.sqrt(1-e.w*e.w);return i<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/i,this.y=e.y/i,this.z=e.z/i),this}setAxisAngleFromRotationMatrix(e){let i,r,l,c;const g=e.elements,p=g[0],_=g[4],m=g[8],x=g[1],S=g[5],E=g[9],A=g[2],M=g[6],y=g[10];if(Math.abs(_-x)<.01&&Math.abs(m-A)<.01&&Math.abs(E-M)<.01){if(Math.abs(_+x)<.1&&Math.abs(m+A)<.1&&Math.abs(E+M)<.1&&Math.abs(p+S+y-3)<.1)return this.set(1,0,0,0),this;i=Math.PI;const L=(p+1)/2,D=(S+1)/2,F=(y+1)/2,I=(_+x)/4,O=(m+A)/4,H=(E+M)/4;return L>D&&L>F?L<.01?(r=0,l=.707106781,c=.707106781):(r=Math.sqrt(L),l=I/r,c=O/r):D>F?D<.01?(r=.707106781,l=0,c=.707106781):(l=Math.sqrt(D),r=I/l,c=H/l):F<.01?(r=.707106781,l=.707106781,c=0):(c=Math.sqrt(F),r=O/c,l=H/c),this.set(r,l,c,i),this}let N=Math.sqrt((M-E)*(M-E)+(m-A)*(m-A)+(x-_)*(x-_));return Math.abs(N)<.001&&(N=1),this.x=(M-E)/N,this.y=(m-A)/N,this.z=(x-_)/N,this.w=Math.acos((p+S+y-1)/2),this}setFromMatrixPosition(e){const i=e.elements;return this.x=i[12],this.y=i[13],this.z=i[14],this.w=i[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,i){return this.x=Ce(this.x,e.x,i.x),this.y=Ce(this.y,e.y,i.y),this.z=Ce(this.z,e.z,i.z),this.w=Ce(this.w,e.w,i.w),this}clampScalar(e,i){return this.x=Ce(this.x,e,i),this.y=Ce(this.y,e,i),this.z=Ce(this.z,e,i),this.w=Ce(this.w,e,i),this}clampLength(e,i){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Ce(r,e,i))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,i){return this.x+=(e.x-this.x)*i,this.y+=(e.y-this.y)*i,this.z+=(e.z-this.z)*i,this.w+=(e.w-this.w)*i,this}lerpVectors(e,i,r){return this.x=e.x+(i.x-e.x)*r,this.y=e.y+(i.y-e.y)*r,this.z=e.z+(i.z-e.z)*r,this.w=e.w+(i.w-e.w)*r,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,i=0){return this.x=e[i],this.y=e[i+1],this.z=e[i+2],this.w=e[i+3],this}toArray(e=[],i=0){return e[i]=this.x,e[i+1]=this.y,e[i+2]=this.z,e[i+3]=this.w,e}fromBufferAttribute(e,i){return this.x=e.getX(i),this.y=e.getY(i),this.z=e.getZ(i),this.w=e.getW(i),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class QE extends ho{constructor(e=1,i=1,r={}){super(),r=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:zi,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},r),this.isRenderTarget=!0,this.width=e,this.height=i,this.depth=r.depth,this.scissor=new ln(0,0,e,i),this.scissorTest=!1,this.viewport=new ln(0,0,e,i);const l={width:e,height:i,depth:r.depth},c=new qn(l);this.textures=[];const h=r.count;for(let d=0;d<h;d++)this.textures[d]=c.clone(),this.textures[d].isRenderTargetTexture=!0,this.textures[d].renderTarget=this;this._setTextureOptions(r),this.depthBuffer=r.depthBuffer,this.stencilBuffer=r.stencilBuffer,this.resolveDepthBuffer=r.resolveDepthBuffer,this.resolveStencilBuffer=r.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=r.depthTexture,this.samples=r.samples,this.multiview=r.multiview}_setTextureOptions(e={}){const i={minFilter:zi,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(i.mapping=e.mapping),e.wrapS!==void 0&&(i.wrapS=e.wrapS),e.wrapT!==void 0&&(i.wrapT=e.wrapT),e.wrapR!==void 0&&(i.wrapR=e.wrapR),e.magFilter!==void 0&&(i.magFilter=e.magFilter),e.minFilter!==void 0&&(i.minFilter=e.minFilter),e.format!==void 0&&(i.format=e.format),e.type!==void 0&&(i.type=e.type),e.anisotropy!==void 0&&(i.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(i.colorSpace=e.colorSpace),e.flipY!==void 0&&(i.flipY=e.flipY),e.generateMipmaps!==void 0&&(i.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(i.internalFormat=e.internalFormat);for(let r=0;r<this.textures.length;r++)this.textures[r].setValues(i)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,i,r=1){if(this.width!==e||this.height!==i||this.depth!==r){this.width=e,this.height=i,this.depth=r;for(let l=0,c=this.textures.length;l<c;l++)this.textures[l].image.width=e,this.textures[l].image.height=i,this.textures[l].image.depth=r,this.textures[l].isArrayTexture=this.textures[l].image.depth>1;this.dispose()}this.viewport.set(0,0,e,i),this.scissor.set(0,0,e,i)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,r=e.textures.length;i<r;i++){this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;const l=Object.assign({},e.textures[i].image);this.textures[i].source=new Xp(l)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class $r extends QE{constructor(e=1,i=1,r={}){super(e,i,r),this.isWebGLRenderTarget=!0}}class zx extends qn{constructor(e=null,i=1,r=1,l=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:i,height:r,depth:l},this.magFilter=Ii,this.minFilter=Ii,this.wrapR=Kr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class JE extends qn{constructor(e=null,i=1,r=1,l=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:i,height:r,depth:l},this.magFilter=Ii,this.minFilter=Ii,this.wrapR=Kr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Al{constructor(e=new et(1/0,1/0,1/0),i=new et(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=i}set(e,i){return this.min.copy(e),this.max.copy(i),this}setFromArray(e){this.makeEmpty();for(let i=0,r=e.length;i<r;i+=3)this.expandByPoint(Di.fromArray(e,i));return this}setFromBufferAttribute(e){this.makeEmpty();for(let i=0,r=e.count;i<r;i++)this.expandByPoint(Di.fromBufferAttribute(e,i));return this}setFromPoints(e){this.makeEmpty();for(let i=0,r=e.length;i<r;i++)this.expandByPoint(e[i]);return this}setFromCenterAndSize(e,i){const r=Di.copy(i).multiplyScalar(.5);return this.min.copy(e).sub(r),this.max.copy(e).add(r),this}setFromObject(e,i=!1){return this.makeEmpty(),this.expandByObject(e,i)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,i=!1){e.updateWorldMatrix(!1,!1);const r=e.geometry;if(r!==void 0){const c=r.getAttribute("position");if(i===!0&&c!==void 0&&e.isInstancedMesh!==!0)for(let h=0,d=c.count;h<d;h++)e.isMesh===!0?e.getVertexPosition(h,Di):Di.fromBufferAttribute(c,h),Di.applyMatrix4(e.matrixWorld),this.expandByPoint(Di);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Qu.copy(e.boundingBox)):(r.boundingBox===null&&r.computeBoundingBox(),Qu.copy(r.boundingBox)),Qu.applyMatrix4(e.matrixWorld),this.union(Qu)}const l=e.children;for(let c=0,h=l.length;c<h;c++)this.expandByObject(l[c],i);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,i){return i.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Di),Di.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let i,r;return e.normal.x>0?(i=e.normal.x*this.min.x,r=e.normal.x*this.max.x):(i=e.normal.x*this.max.x,r=e.normal.x*this.min.x),e.normal.y>0?(i+=e.normal.y*this.min.y,r+=e.normal.y*this.max.y):(i+=e.normal.y*this.max.y,r+=e.normal.y*this.min.y),e.normal.z>0?(i+=e.normal.z*this.min.z,r+=e.normal.z*this.max.z):(i+=e.normal.z*this.max.z,r+=e.normal.z*this.min.z),i<=-e.constant&&r>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ul),Ju.subVectors(this.max,ul),Vs.subVectors(e.a,ul),ks.subVectors(e.b,ul),Xs.subVectors(e.c,ul),ar.subVectors(ks,Vs),rr.subVectors(Xs,ks),Hr.subVectors(Vs,Xs);let i=[0,-ar.z,ar.y,0,-rr.z,rr.y,0,-Hr.z,Hr.y,ar.z,0,-ar.x,rr.z,0,-rr.x,Hr.z,0,-Hr.x,-ar.y,ar.x,0,-rr.y,rr.x,0,-Hr.y,Hr.x,0];return!xd(i,Vs,ks,Xs,Ju)||(i=[1,0,0,0,1,0,0,0,1],!xd(i,Vs,ks,Xs,Ju))?!1:($u.crossVectors(ar,rr),i=[$u.x,$u.y,$u.z],xd(i,Vs,ks,Xs,Ju))}clampPoint(e,i){return i.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Di).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Di).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ya[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ya[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ya[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ya[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ya[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ya[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ya[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ya[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ya),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const ya=[new et,new et,new et,new et,new et,new et,new et,new et],Di=new et,Qu=new Al,Vs=new et,ks=new et,Xs=new et,ar=new et,rr=new et,Hr=new et,ul=new et,Ju=new et,$u=new et,Gr=new et;function xd(o,e,i,r,l){for(let c=0,h=o.length-3;c<=h;c+=3){Gr.fromArray(o,c);const d=l.x*Math.abs(Gr.x)+l.y*Math.abs(Gr.y)+l.z*Math.abs(Gr.z),g=e.dot(Gr),p=i.dot(Gr),_=r.dot(Gr);if(Math.max(-Math.max(g,p,_),Math.min(g,p,_))>d)return!1}return!0}const $E=new Al,cl=new et,yd=new et;class Nc{constructor(e=new et,i=-1){this.isSphere=!0,this.center=e,this.radius=i}set(e,i){return this.center.copy(e),this.radius=i,this}setFromPoints(e,i){const r=this.center;i!==void 0?r.copy(i):$E.setFromPoints(e).getCenter(r);let l=0;for(let c=0,h=e.length;c<h;c++)l=Math.max(l,r.distanceToSquared(e[c]));return this.radius=Math.sqrt(l),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const i=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=i*i}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,i){const r=this.center.distanceToSquared(e);return i.copy(e),r>this.radius*this.radius&&(i.sub(this.center).normalize(),i.multiplyScalar(this.radius).add(this.center)),i}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;cl.subVectors(e,this.center);const i=cl.lengthSq();if(i>this.radius*this.radius){const r=Math.sqrt(i),l=(r-this.radius)*.5;this.center.addScaledVector(cl,l/r),this.radius+=l}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(yd.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(cl.copy(e.center).add(yd)),this.expandByPoint(cl.copy(e.center).sub(yd))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const Sa=new et,Sd=new et,tc=new et,sr=new et,Md=new et,ec=new et,Ed=new et;class qp{constructor(e=new et,i=new et(0,0,-1)){this.origin=e,this.direction=i}set(e,i){return this.origin.copy(e),this.direction.copy(i),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,i){return i.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Sa)),this}closestPointToPoint(e,i){i.subVectors(e,this.origin);const r=i.dot(this.direction);return r<0?i.copy(this.origin):i.copy(this.origin).addScaledVector(this.direction,r)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const i=Sa.subVectors(e,this.origin).dot(this.direction);return i<0?this.origin.distanceToSquared(e):(Sa.copy(this.origin).addScaledVector(this.direction,i),Sa.distanceToSquared(e))}distanceSqToSegment(e,i,r,l){Sd.copy(e).add(i).multiplyScalar(.5),tc.copy(i).sub(e).normalize(),sr.copy(this.origin).sub(Sd);const c=e.distanceTo(i)*.5,h=-this.direction.dot(tc),d=sr.dot(this.direction),g=-sr.dot(tc),p=sr.lengthSq(),_=Math.abs(1-h*h);let m,x,S,E;if(_>0)if(m=h*g-d,x=h*d-g,E=c*_,m>=0)if(x>=-E)if(x<=E){const A=1/_;m*=A,x*=A,S=m*(m+h*x+2*d)+x*(h*m+x+2*g)+p}else x=c,m=Math.max(0,-(h*x+d)),S=-m*m+x*(x+2*g)+p;else x=-c,m=Math.max(0,-(h*x+d)),S=-m*m+x*(x+2*g)+p;else x<=-E?(m=Math.max(0,-(-h*c+d)),x=m>0?-c:Math.min(Math.max(-c,-g),c),S=-m*m+x*(x+2*g)+p):x<=E?(m=0,x=Math.min(Math.max(-c,-g),c),S=x*(x+2*g)+p):(m=Math.max(0,-(h*c+d)),x=m>0?c:Math.min(Math.max(-c,-g),c),S=-m*m+x*(x+2*g)+p);else x=h>0?-c:c,m=Math.max(0,-(h*x+d)),S=-m*m+x*(x+2*g)+p;return r&&r.copy(this.origin).addScaledVector(this.direction,m),l&&l.copy(Sd).addScaledVector(tc,x),S}intersectSphere(e,i){Sa.subVectors(e.center,this.origin);const r=Sa.dot(this.direction),l=Sa.dot(Sa)-r*r,c=e.radius*e.radius;if(l>c)return null;const h=Math.sqrt(c-l),d=r-h,g=r+h;return g<0?null:d<0?this.at(g,i):this.at(d,i)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const i=e.normal.dot(this.direction);if(i===0)return e.distanceToPoint(this.origin)===0?0:null;const r=-(this.origin.dot(e.normal)+e.constant)/i;return r>=0?r:null}intersectPlane(e,i){const r=this.distanceToPlane(e);return r===null?null:this.at(r,i)}intersectsPlane(e){const i=e.distanceToPoint(this.origin);return i===0||e.normal.dot(this.direction)*i<0}intersectBox(e,i){let r,l,c,h,d,g;const p=1/this.direction.x,_=1/this.direction.y,m=1/this.direction.z,x=this.origin;return p>=0?(r=(e.min.x-x.x)*p,l=(e.max.x-x.x)*p):(r=(e.max.x-x.x)*p,l=(e.min.x-x.x)*p),_>=0?(c=(e.min.y-x.y)*_,h=(e.max.y-x.y)*_):(c=(e.max.y-x.y)*_,h=(e.min.y-x.y)*_),r>h||c>l||((c>r||isNaN(r))&&(r=c),(h<l||isNaN(l))&&(l=h),m>=0?(d=(e.min.z-x.z)*m,g=(e.max.z-x.z)*m):(d=(e.max.z-x.z)*m,g=(e.min.z-x.z)*m),r>g||d>l)||((d>r||r!==r)&&(r=d),(g<l||l!==l)&&(l=g),l<0)?null:this.at(r>=0?r:l,i)}intersectsBox(e){return this.intersectBox(e,Sa)!==null}intersectTriangle(e,i,r,l,c){Md.subVectors(i,e),ec.subVectors(r,e),Ed.crossVectors(Md,ec);let h=this.direction.dot(Ed),d;if(h>0){if(l)return null;d=1}else if(h<0)d=-1,h=-h;else return null;sr.subVectors(this.origin,e);const g=d*this.direction.dot(ec.crossVectors(sr,ec));if(g<0)return null;const p=d*this.direction.dot(Md.cross(sr));if(p<0||g+p>h)return null;const _=-d*sr.dot(Ed);return _<0?null:this.at(_/h,c)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class an{constructor(e,i,r,l,c,h,d,g,p,_,m,x,S,E,A,M){an.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,i,r,l,c,h,d,g,p,_,m,x,S,E,A,M)}set(e,i,r,l,c,h,d,g,p,_,m,x,S,E,A,M){const y=this.elements;return y[0]=e,y[4]=i,y[8]=r,y[12]=l,y[1]=c,y[5]=h,y[9]=d,y[13]=g,y[2]=p,y[6]=_,y[10]=m,y[14]=x,y[3]=S,y[7]=E,y[11]=A,y[15]=M,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new an().fromArray(this.elements)}copy(e){const i=this.elements,r=e.elements;return i[0]=r[0],i[1]=r[1],i[2]=r[2],i[3]=r[3],i[4]=r[4],i[5]=r[5],i[6]=r[6],i[7]=r[7],i[8]=r[8],i[9]=r[9],i[10]=r[10],i[11]=r[11],i[12]=r[12],i[13]=r[13],i[14]=r[14],i[15]=r[15],this}copyPosition(e){const i=this.elements,r=e.elements;return i[12]=r[12],i[13]=r[13],i[14]=r[14],this}setFromMatrix3(e){const i=e.elements;return this.set(i[0],i[3],i[6],0,i[1],i[4],i[7],0,i[2],i[5],i[8],0,0,0,0,1),this}extractBasis(e,i,r){return e.setFromMatrixColumn(this,0),i.setFromMatrixColumn(this,1),r.setFromMatrixColumn(this,2),this}makeBasis(e,i,r){return this.set(e.x,i.x,r.x,0,e.y,i.y,r.y,0,e.z,i.z,r.z,0,0,0,0,1),this}extractRotation(e){const i=this.elements,r=e.elements,l=1/qs.setFromMatrixColumn(e,0).length(),c=1/qs.setFromMatrixColumn(e,1).length(),h=1/qs.setFromMatrixColumn(e,2).length();return i[0]=r[0]*l,i[1]=r[1]*l,i[2]=r[2]*l,i[3]=0,i[4]=r[4]*c,i[5]=r[5]*c,i[6]=r[6]*c,i[7]=0,i[8]=r[8]*h,i[9]=r[9]*h,i[10]=r[10]*h,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromEuler(e){const i=this.elements,r=e.x,l=e.y,c=e.z,h=Math.cos(r),d=Math.sin(r),g=Math.cos(l),p=Math.sin(l),_=Math.cos(c),m=Math.sin(c);if(e.order==="XYZ"){const x=h*_,S=h*m,E=d*_,A=d*m;i[0]=g*_,i[4]=-g*m,i[8]=p,i[1]=S+E*p,i[5]=x-A*p,i[9]=-d*g,i[2]=A-x*p,i[6]=E+S*p,i[10]=h*g}else if(e.order==="YXZ"){const x=g*_,S=g*m,E=p*_,A=p*m;i[0]=x+A*d,i[4]=E*d-S,i[8]=h*p,i[1]=h*m,i[5]=h*_,i[9]=-d,i[2]=S*d-E,i[6]=A+x*d,i[10]=h*g}else if(e.order==="ZXY"){const x=g*_,S=g*m,E=p*_,A=p*m;i[0]=x-A*d,i[4]=-h*m,i[8]=E+S*d,i[1]=S+E*d,i[5]=h*_,i[9]=A-x*d,i[2]=-h*p,i[6]=d,i[10]=h*g}else if(e.order==="ZYX"){const x=h*_,S=h*m,E=d*_,A=d*m;i[0]=g*_,i[4]=E*p-S,i[8]=x*p+A,i[1]=g*m,i[5]=A*p+x,i[9]=S*p-E,i[2]=-p,i[6]=d*g,i[10]=h*g}else if(e.order==="YZX"){const x=h*g,S=h*p,E=d*g,A=d*p;i[0]=g*_,i[4]=A-x*m,i[8]=E*m+S,i[1]=m,i[5]=h*_,i[9]=-d*_,i[2]=-p*_,i[6]=S*m+E,i[10]=x-A*m}else if(e.order==="XZY"){const x=h*g,S=h*p,E=d*g,A=d*p;i[0]=g*_,i[4]=-m,i[8]=p*_,i[1]=x*m+A,i[5]=h*_,i[9]=S*m-E,i[2]=E*m-S,i[6]=d*_,i[10]=A*m+x}return i[3]=0,i[7]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,this}makeRotationFromQuaternion(e){return this.compose(tT,e,eT)}lookAt(e,i,r){const l=this.elements;return ui.subVectors(e,i),ui.lengthSq()===0&&(ui.z=1),ui.normalize(),or.crossVectors(r,ui),or.lengthSq()===0&&(Math.abs(r.z)===1?ui.x+=1e-4:ui.z+=1e-4,ui.normalize(),or.crossVectors(r,ui)),or.normalize(),nc.crossVectors(ui,or),l[0]=or.x,l[4]=nc.x,l[8]=ui.x,l[1]=or.y,l[5]=nc.y,l[9]=ui.y,l[2]=or.z,l[6]=nc.z,l[10]=ui.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,i){const r=e.elements,l=i.elements,c=this.elements,h=r[0],d=r[4],g=r[8],p=r[12],_=r[1],m=r[5],x=r[9],S=r[13],E=r[2],A=r[6],M=r[10],y=r[14],N=r[3],L=r[7],D=r[11],F=r[15],I=l[0],O=l[4],H=l[8],w=l[12],R=l[1],V=l[5],$=l[9],ft=l[13],gt=l[2],lt=l[6],j=l[10],ot=l[14],Q=l[3],St=l[7],xt=l[11],Gt=l[15];return c[0]=h*I+d*R+g*gt+p*Q,c[4]=h*O+d*V+g*lt+p*St,c[8]=h*H+d*$+g*j+p*xt,c[12]=h*w+d*ft+g*ot+p*Gt,c[1]=_*I+m*R+x*gt+S*Q,c[5]=_*O+m*V+x*lt+S*St,c[9]=_*H+m*$+x*j+S*xt,c[13]=_*w+m*ft+x*ot+S*Gt,c[2]=E*I+A*R+M*gt+y*Q,c[6]=E*O+A*V+M*lt+y*St,c[10]=E*H+A*$+M*j+y*xt,c[14]=E*w+A*ft+M*ot+y*Gt,c[3]=N*I+L*R+D*gt+F*Q,c[7]=N*O+L*V+D*lt+F*St,c[11]=N*H+L*$+D*j+F*xt,c[15]=N*w+L*ft+D*ot+F*Gt,this}multiplyScalar(e){const i=this.elements;return i[0]*=e,i[4]*=e,i[8]*=e,i[12]*=e,i[1]*=e,i[5]*=e,i[9]*=e,i[13]*=e,i[2]*=e,i[6]*=e,i[10]*=e,i[14]*=e,i[3]*=e,i[7]*=e,i[11]*=e,i[15]*=e,this}determinant(){const e=this.elements,i=e[0],r=e[4],l=e[8],c=e[12],h=e[1],d=e[5],g=e[9],p=e[13],_=e[2],m=e[6],x=e[10],S=e[14],E=e[3],A=e[7],M=e[11],y=e[15];return E*(+c*g*m-l*p*m-c*d*x+r*p*x+l*d*S-r*g*S)+A*(+i*g*S-i*p*x+c*h*x-l*h*S+l*p*_-c*g*_)+M*(+i*p*m-i*d*S-c*h*m+r*h*S+c*d*_-r*p*_)+y*(-l*d*_-i*g*m+i*d*x+l*h*m-r*h*x+r*g*_)}transpose(){const e=this.elements;let i;return i=e[1],e[1]=e[4],e[4]=i,i=e[2],e[2]=e[8],e[8]=i,i=e[6],e[6]=e[9],e[9]=i,i=e[3],e[3]=e[12],e[12]=i,i=e[7],e[7]=e[13],e[13]=i,i=e[11],e[11]=e[14],e[14]=i,this}setPosition(e,i,r){const l=this.elements;return e.isVector3?(l[12]=e.x,l[13]=e.y,l[14]=e.z):(l[12]=e,l[13]=i,l[14]=r),this}invert(){const e=this.elements,i=e[0],r=e[1],l=e[2],c=e[3],h=e[4],d=e[5],g=e[6],p=e[7],_=e[8],m=e[9],x=e[10],S=e[11],E=e[12],A=e[13],M=e[14],y=e[15],N=m*M*p-A*x*p+A*g*S-d*M*S-m*g*y+d*x*y,L=E*x*p-_*M*p-E*g*S+h*M*S+_*g*y-h*x*y,D=_*A*p-E*m*p+E*d*S-h*A*S-_*d*y+h*m*y,F=E*m*g-_*A*g-E*d*x+h*A*x+_*d*M-h*m*M,I=i*N+r*L+l*D+c*F;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const O=1/I;return e[0]=N*O,e[1]=(A*x*c-m*M*c-A*l*S+r*M*S+m*l*y-r*x*y)*O,e[2]=(d*M*c-A*g*c+A*l*p-r*M*p-d*l*y+r*g*y)*O,e[3]=(m*g*c-d*x*c-m*l*p+r*x*p+d*l*S-r*g*S)*O,e[4]=L*O,e[5]=(_*M*c-E*x*c+E*l*S-i*M*S-_*l*y+i*x*y)*O,e[6]=(E*g*c-h*M*c-E*l*p+i*M*p+h*l*y-i*g*y)*O,e[7]=(h*x*c-_*g*c+_*l*p-i*x*p-h*l*S+i*g*S)*O,e[8]=D*O,e[9]=(E*m*c-_*A*c-E*r*S+i*A*S+_*r*y-i*m*y)*O,e[10]=(h*A*c-E*d*c+E*r*p-i*A*p-h*r*y+i*d*y)*O,e[11]=(_*d*c-h*m*c-_*r*p+i*m*p+h*r*S-i*d*S)*O,e[12]=F*O,e[13]=(_*A*l-E*m*l+E*r*x-i*A*x-_*r*M+i*m*M)*O,e[14]=(E*d*l-h*A*l-E*r*g+i*A*g+h*r*M-i*d*M)*O,e[15]=(h*m*l-_*d*l+_*r*g-i*m*g-h*r*x+i*d*x)*O,this}scale(e){const i=this.elements,r=e.x,l=e.y,c=e.z;return i[0]*=r,i[4]*=l,i[8]*=c,i[1]*=r,i[5]*=l,i[9]*=c,i[2]*=r,i[6]*=l,i[10]*=c,i[3]*=r,i[7]*=l,i[11]*=c,this}getMaxScaleOnAxis(){const e=this.elements,i=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],r=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],l=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(i,r,l))}makeTranslation(e,i,r){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,i,0,0,1,r,0,0,0,1),this}makeRotationX(e){const i=Math.cos(e),r=Math.sin(e);return this.set(1,0,0,0,0,i,-r,0,0,r,i,0,0,0,0,1),this}makeRotationY(e){const i=Math.cos(e),r=Math.sin(e);return this.set(i,0,r,0,0,1,0,0,-r,0,i,0,0,0,0,1),this}makeRotationZ(e){const i=Math.cos(e),r=Math.sin(e);return this.set(i,-r,0,0,r,i,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,i){const r=Math.cos(i),l=Math.sin(i),c=1-r,h=e.x,d=e.y,g=e.z,p=c*h,_=c*d;return this.set(p*h+r,p*d-l*g,p*g+l*d,0,p*d+l*g,_*d+r,_*g-l*h,0,p*g-l*d,_*g+l*h,c*g*g+r,0,0,0,0,1),this}makeScale(e,i,r){return this.set(e,0,0,0,0,i,0,0,0,0,r,0,0,0,0,1),this}makeShear(e,i,r,l,c,h){return this.set(1,r,c,0,e,1,h,0,i,l,1,0,0,0,0,1),this}compose(e,i,r){const l=this.elements,c=i._x,h=i._y,d=i._z,g=i._w,p=c+c,_=h+h,m=d+d,x=c*p,S=c*_,E=c*m,A=h*_,M=h*m,y=d*m,N=g*p,L=g*_,D=g*m,F=r.x,I=r.y,O=r.z;return l[0]=(1-(A+y))*F,l[1]=(S+D)*F,l[2]=(E-L)*F,l[3]=0,l[4]=(S-D)*I,l[5]=(1-(x+y))*I,l[6]=(M+N)*I,l[7]=0,l[8]=(E+L)*O,l[9]=(M-N)*O,l[10]=(1-(x+A))*O,l[11]=0,l[12]=e.x,l[13]=e.y,l[14]=e.z,l[15]=1,this}decompose(e,i,r){const l=this.elements;let c=qs.set(l[0],l[1],l[2]).length();const h=qs.set(l[4],l[5],l[6]).length(),d=qs.set(l[8],l[9],l[10]).length();this.determinant()<0&&(c=-c),e.x=l[12],e.y=l[13],e.z=l[14],Ui.copy(this);const p=1/c,_=1/h,m=1/d;return Ui.elements[0]*=p,Ui.elements[1]*=p,Ui.elements[2]*=p,Ui.elements[4]*=_,Ui.elements[5]*=_,Ui.elements[6]*=_,Ui.elements[8]*=m,Ui.elements[9]*=m,Ui.elements[10]*=m,i.setFromRotationMatrix(Ui),r.x=c,r.y=h,r.z=d,this}makePerspective(e,i,r,l,c,h,d=ta,g=!1){const p=this.elements,_=2*c/(i-e),m=2*c/(r-l),x=(i+e)/(i-e),S=(r+l)/(r-l);let E,A;if(g)E=c/(h-c),A=h*c/(h-c);else if(d===ta)E=-(h+c)/(h-c),A=-2*h*c/(h-c);else if(d===bc)E=-h/(h-c),A=-h*c/(h-c);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+d);return p[0]=_,p[4]=0,p[8]=x,p[12]=0,p[1]=0,p[5]=m,p[9]=S,p[13]=0,p[2]=0,p[6]=0,p[10]=E,p[14]=A,p[3]=0,p[7]=0,p[11]=-1,p[15]=0,this}makeOrthographic(e,i,r,l,c,h,d=ta,g=!1){const p=this.elements,_=2/(i-e),m=2/(r-l),x=-(i+e)/(i-e),S=-(r+l)/(r-l);let E,A;if(g)E=1/(h-c),A=h/(h-c);else if(d===ta)E=-2/(h-c),A=-(h+c)/(h-c);else if(d===bc)E=-1/(h-c),A=-c/(h-c);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+d);return p[0]=_,p[4]=0,p[8]=0,p[12]=x,p[1]=0,p[5]=m,p[9]=0,p[13]=S,p[2]=0,p[6]=0,p[10]=E,p[14]=A,p[3]=0,p[7]=0,p[11]=0,p[15]=1,this}equals(e){const i=this.elements,r=e.elements;for(let l=0;l<16;l++)if(i[l]!==r[l])return!1;return!0}fromArray(e,i=0){for(let r=0;r<16;r++)this.elements[r]=e[r+i];return this}toArray(e=[],i=0){const r=this.elements;return e[i]=r[0],e[i+1]=r[1],e[i+2]=r[2],e[i+3]=r[3],e[i+4]=r[4],e[i+5]=r[5],e[i+6]=r[6],e[i+7]=r[7],e[i+8]=r[8],e[i+9]=r[9],e[i+10]=r[10],e[i+11]=r[11],e[i+12]=r[12],e[i+13]=r[13],e[i+14]=r[14],e[i+15]=r[15],e}}const qs=new et,Ui=new an,tT=new et(0,0,0),eT=new et(1,1,1),or=new et,nc=new et,ui=new et,Cv=new an,wv=new bl;class ia{constructor(e=0,i=0,r=0,l=ia.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=i,this._z=r,this._order=l}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,i,r,l=this._order){return this._x=e,this._y=i,this._z=r,this._order=l,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,i=this._order,r=!0){const l=e.elements,c=l[0],h=l[4],d=l[8],g=l[1],p=l[5],_=l[9],m=l[2],x=l[6],S=l[10];switch(i){case"XYZ":this._y=Math.asin(Ce(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(-_,S),this._z=Math.atan2(-h,c)):(this._x=Math.atan2(x,p),this._z=0);break;case"YXZ":this._x=Math.asin(-Ce(_,-1,1)),Math.abs(_)<.9999999?(this._y=Math.atan2(d,S),this._z=Math.atan2(g,p)):(this._y=Math.atan2(-m,c),this._z=0);break;case"ZXY":this._x=Math.asin(Ce(x,-1,1)),Math.abs(x)<.9999999?(this._y=Math.atan2(-m,S),this._z=Math.atan2(-h,p)):(this._y=0,this._z=Math.atan2(g,c));break;case"ZYX":this._y=Math.asin(-Ce(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(x,S),this._z=Math.atan2(g,c)):(this._x=0,this._z=Math.atan2(-h,p));break;case"YZX":this._z=Math.asin(Ce(g,-1,1)),Math.abs(g)<.9999999?(this._x=Math.atan2(-_,p),this._y=Math.atan2(-m,c)):(this._x=0,this._y=Math.atan2(d,S));break;case"XZY":this._z=Math.asin(-Ce(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(x,p),this._y=Math.atan2(d,c)):(this._x=Math.atan2(-_,S),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+i)}return this._order=i,r===!0&&this._onChangeCallback(),this}setFromQuaternion(e,i,r){return Cv.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Cv,i,r)}setFromVector3(e,i=this._order){return this.set(e.x,e.y,e.z,i)}reorder(e){return wv.setFromEuler(this),this.setFromQuaternion(wv,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],i=0){return e[i]=this._x,e[i+1]=this._y,e[i+2]=this._z,e[i+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ia.DEFAULT_ORDER="XYZ";class Yp{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let nT=0;const Dv=new et,Ys=new bl,Ma=new an,ic=new et,fl=new et,iT=new et,aT=new bl,Uv=new et(1,0,0),Nv=new et(0,1,0),Lv=new et(0,0,1),Ov={type:"added"},rT={type:"removed"},js={type:"childadded",child:null},Td={type:"childremoved",child:null};class An extends ho{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:nT++}),this.uuid=po(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=An.DEFAULT_UP.clone();const e=new et,i=new ia,r=new bl,l=new et(1,1,1);function c(){r.setFromEuler(i,!1)}function h(){i.setFromQuaternion(r,void 0,!1)}i._onChange(c),r._onChange(h),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:i},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:l},modelViewMatrix:{value:new an},normalMatrix:{value:new ge}}),this.matrix=new an,this.matrixWorld=new an,this.matrixAutoUpdate=An.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=An.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yp,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,i){this.quaternion.setFromAxisAngle(e,i)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,i){return Ys.setFromAxisAngle(e,i),this.quaternion.multiply(Ys),this}rotateOnWorldAxis(e,i){return Ys.setFromAxisAngle(e,i),this.quaternion.premultiply(Ys),this}rotateX(e){return this.rotateOnAxis(Uv,e)}rotateY(e){return this.rotateOnAxis(Nv,e)}rotateZ(e){return this.rotateOnAxis(Lv,e)}translateOnAxis(e,i){return Dv.copy(e).applyQuaternion(this.quaternion),this.position.add(Dv.multiplyScalar(i)),this}translateX(e){return this.translateOnAxis(Uv,e)}translateY(e){return this.translateOnAxis(Nv,e)}translateZ(e){return this.translateOnAxis(Lv,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ma.copy(this.matrixWorld).invert())}lookAt(e,i,r){e.isVector3?ic.copy(e):ic.set(e,i,r);const l=this.parent;this.updateWorldMatrix(!0,!1),fl.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ma.lookAt(fl,ic,this.up):Ma.lookAt(ic,fl,this.up),this.quaternion.setFromRotationMatrix(Ma),l&&(Ma.extractRotation(l.matrixWorld),Ys.setFromRotationMatrix(Ma),this.quaternion.premultiply(Ys.invert()))}add(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.add(arguments[i]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ov),js.child=e,this.dispatchEvent(js),js.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.remove(arguments[r]);return this}const i=this.children.indexOf(e);return i!==-1&&(e.parent=null,this.children.splice(i,1),e.dispatchEvent(rT),Td.child=e,this.dispatchEvent(Td),Td.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ma.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ma.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ma),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ov),js.child=e,this.dispatchEvent(js),js.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,i){if(this[e]===i)return this;for(let r=0,l=this.children.length;r<l;r++){const h=this.children[r].getObjectByProperty(e,i);if(h!==void 0)return h}}getObjectsByProperty(e,i,r=[]){this[e]===i&&r.push(this);const l=this.children;for(let c=0,h=l.length;c<h;c++)l[c].getObjectsByProperty(e,i,r);return r}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fl,e,iT),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fl,aT,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const i=this.matrixWorld.elements;return e.set(i[8],i[9],i[10]).normalize()}raycast(){}traverse(e){e(this);const i=this.children;for(let r=0,l=i.length;r<l;r++)i[r].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const i=this.children;for(let r=0,l=i.length;r<l;r++)i[r].traverseVisible(e)}traverseAncestors(e){const i=this.parent;i!==null&&(e(i),i.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const i=this.children;for(let r=0,l=i.length;r<l;r++)i[r].updateMatrixWorld(e)}updateWorldMatrix(e,i){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),i===!0){const l=this.children;for(let c=0,h=l.length;c<h;c++)l[c].updateWorldMatrix(!1,!0)}}toJSON(e){const i=e===void 0||typeof e=="string",r={};i&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},r.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const l={};l.uuid=this.uuid,l.type=this.type,this.name!==""&&(l.name=this.name),this.castShadow===!0&&(l.castShadow=!0),this.receiveShadow===!0&&(l.receiveShadow=!0),this.visible===!1&&(l.visible=!1),this.frustumCulled===!1&&(l.frustumCulled=!1),this.renderOrder!==0&&(l.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(l.userData=this.userData),l.layers=this.layers.mask,l.matrix=this.matrix.toArray(),l.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(l.matrixAutoUpdate=!1),this.isInstancedMesh&&(l.type="InstancedMesh",l.count=this.count,l.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(l.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(l.type="BatchedMesh",l.perObjectFrustumCulled=this.perObjectFrustumCulled,l.sortObjects=this.sortObjects,l.drawRanges=this._drawRanges,l.reservedRanges=this._reservedRanges,l.geometryInfo=this._geometryInfo.map(d=>({...d,boundingBox:d.boundingBox?d.boundingBox.toJSON():void 0,boundingSphere:d.boundingSphere?d.boundingSphere.toJSON():void 0})),l.instanceInfo=this._instanceInfo.map(d=>({...d})),l.availableInstanceIds=this._availableInstanceIds.slice(),l.availableGeometryIds=this._availableGeometryIds.slice(),l.nextIndexStart=this._nextIndexStart,l.nextVertexStart=this._nextVertexStart,l.geometryCount=this._geometryCount,l.maxInstanceCount=this._maxInstanceCount,l.maxVertexCount=this._maxVertexCount,l.maxIndexCount=this._maxIndexCount,l.geometryInitialized=this._geometryInitialized,l.matricesTexture=this._matricesTexture.toJSON(e),l.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(l.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(l.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(l.boundingBox=this.boundingBox.toJSON()));function c(d,g){return d[g.uuid]===void 0&&(d[g.uuid]=g.toJSON(e)),g.uuid}if(this.isScene)this.background&&(this.background.isColor?l.background=this.background.toJSON():this.background.isTexture&&(l.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(l.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){l.geometry=c(e.geometries,this.geometry);const d=this.geometry.parameters;if(d!==void 0&&d.shapes!==void 0){const g=d.shapes;if(Array.isArray(g))for(let p=0,_=g.length;p<_;p++){const m=g[p];c(e.shapes,m)}else c(e.shapes,g)}}if(this.isSkinnedMesh&&(l.bindMode=this.bindMode,l.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(c(e.skeletons,this.skeleton),l.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const d=[];for(let g=0,p=this.material.length;g<p;g++)d.push(c(e.materials,this.material[g]));l.material=d}else l.material=c(e.materials,this.material);if(this.children.length>0){l.children=[];for(let d=0;d<this.children.length;d++)l.children.push(this.children[d].toJSON(e).object)}if(this.animations.length>0){l.animations=[];for(let d=0;d<this.animations.length;d++){const g=this.animations[d];l.animations.push(c(e.animations,g))}}if(i){const d=h(e.geometries),g=h(e.materials),p=h(e.textures),_=h(e.images),m=h(e.shapes),x=h(e.skeletons),S=h(e.animations),E=h(e.nodes);d.length>0&&(r.geometries=d),g.length>0&&(r.materials=g),p.length>0&&(r.textures=p),_.length>0&&(r.images=_),m.length>0&&(r.shapes=m),x.length>0&&(r.skeletons=x),S.length>0&&(r.animations=S),E.length>0&&(r.nodes=E)}return r.object=l,r;function h(d){const g=[];for(const p in d){const _=d[p];delete _.metadata,g.push(_)}return g}}clone(e){return new this.constructor().copy(this,e)}copy(e,i=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),i===!0)for(let r=0;r<e.children.length;r++){const l=e.children[r];this.add(l.clone())}return this}}An.DEFAULT_UP=new et(0,1,0);An.DEFAULT_MATRIX_AUTO_UPDATE=!0;An.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ni=new et,Ea=new et,bd=new et,Ta=new et,Ws=new et,Zs=new et,zv=new et,Ad=new et,Rd=new et,Cd=new et,wd=new ln,Dd=new ln,Ud=new ln;class Oi{constructor(e=new et,i=new et,r=new et){this.a=e,this.b=i,this.c=r}static getNormal(e,i,r,l){l.subVectors(r,i),Ni.subVectors(e,i),l.cross(Ni);const c=l.lengthSq();return c>0?l.multiplyScalar(1/Math.sqrt(c)):l.set(0,0,0)}static getBarycoord(e,i,r,l,c){Ni.subVectors(l,i),Ea.subVectors(r,i),bd.subVectors(e,i);const h=Ni.dot(Ni),d=Ni.dot(Ea),g=Ni.dot(bd),p=Ea.dot(Ea),_=Ea.dot(bd),m=h*p-d*d;if(m===0)return c.set(0,0,0),null;const x=1/m,S=(p*g-d*_)*x,E=(h*_-d*g)*x;return c.set(1-S-E,E,S)}static containsPoint(e,i,r,l){return this.getBarycoord(e,i,r,l,Ta)===null?!1:Ta.x>=0&&Ta.y>=0&&Ta.x+Ta.y<=1}static getInterpolation(e,i,r,l,c,h,d,g){return this.getBarycoord(e,i,r,l,Ta)===null?(g.x=0,g.y=0,"z"in g&&(g.z=0),"w"in g&&(g.w=0),null):(g.setScalar(0),g.addScaledVector(c,Ta.x),g.addScaledVector(h,Ta.y),g.addScaledVector(d,Ta.z),g)}static getInterpolatedAttribute(e,i,r,l,c,h){return wd.setScalar(0),Dd.setScalar(0),Ud.setScalar(0),wd.fromBufferAttribute(e,i),Dd.fromBufferAttribute(e,r),Ud.fromBufferAttribute(e,l),h.setScalar(0),h.addScaledVector(wd,c.x),h.addScaledVector(Dd,c.y),h.addScaledVector(Ud,c.z),h}static isFrontFacing(e,i,r,l){return Ni.subVectors(r,i),Ea.subVectors(e,i),Ni.cross(Ea).dot(l)<0}set(e,i,r){return this.a.copy(e),this.b.copy(i),this.c.copy(r),this}setFromPointsAndIndices(e,i,r,l){return this.a.copy(e[i]),this.b.copy(e[r]),this.c.copy(e[l]),this}setFromAttributeAndIndices(e,i,r,l){return this.a.fromBufferAttribute(e,i),this.b.fromBufferAttribute(e,r),this.c.fromBufferAttribute(e,l),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ni.subVectors(this.c,this.b),Ea.subVectors(this.a,this.b),Ni.cross(Ea).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Oi.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,i){return Oi.getBarycoord(e,this.a,this.b,this.c,i)}getInterpolation(e,i,r,l,c){return Oi.getInterpolation(e,this.a,this.b,this.c,i,r,l,c)}containsPoint(e){return Oi.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Oi.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,i){const r=this.a,l=this.b,c=this.c;let h,d;Ws.subVectors(l,r),Zs.subVectors(c,r),Ad.subVectors(e,r);const g=Ws.dot(Ad),p=Zs.dot(Ad);if(g<=0&&p<=0)return i.copy(r);Rd.subVectors(e,l);const _=Ws.dot(Rd),m=Zs.dot(Rd);if(_>=0&&m<=_)return i.copy(l);const x=g*m-_*p;if(x<=0&&g>=0&&_<=0)return h=g/(g-_),i.copy(r).addScaledVector(Ws,h);Cd.subVectors(e,c);const S=Ws.dot(Cd),E=Zs.dot(Cd);if(E>=0&&S<=E)return i.copy(c);const A=S*p-g*E;if(A<=0&&p>=0&&E<=0)return d=p/(p-E),i.copy(r).addScaledVector(Zs,d);const M=_*E-S*m;if(M<=0&&m-_>=0&&S-E>=0)return zv.subVectors(c,l),d=(m-_)/(m-_+(S-E)),i.copy(l).addScaledVector(zv,d);const y=1/(M+A+x);return h=A*y,d=x*y,i.copy(r).addScaledVector(Ws,h).addScaledVector(Zs,d)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Px={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},lr={h:0,s:0,l:0},ac={h:0,s:0,l:0};function Nd(o,e,i){return i<0&&(i+=1),i>1&&(i-=1),i<1/6?o+(e-o)*6*i:i<1/2?e:i<2/3?o+(e-o)*6*(2/3-i):o}class we{constructor(e,i,r){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,i,r)}set(e,i,r){if(i===void 0&&r===void 0){const l=e;l&&l.isColor?this.copy(l):typeof l=="number"?this.setHex(l):typeof l=="string"&&this.setStyle(l)}else this.setRGB(e,i,r);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,i=Mi){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Oe.colorSpaceToWorking(this,i),this}setRGB(e,i,r,l=Oe.workingColorSpace){return this.r=e,this.g=i,this.b=r,Oe.colorSpaceToWorking(this,l),this}setHSL(e,i,r,l=Oe.workingColorSpace){if(e=kp(e,1),i=Ce(i,0,1),r=Ce(r,0,1),i===0)this.r=this.g=this.b=r;else{const c=r<=.5?r*(1+i):r+i-r*i,h=2*r-c;this.r=Nd(h,c,e+1/3),this.g=Nd(h,c,e),this.b=Nd(h,c,e-1/3)}return Oe.colorSpaceToWorking(this,l),this}setStyle(e,i=Mi){function r(c){c!==void 0&&parseFloat(c)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let l;if(l=/^(\w+)\(([^\)]*)\)/.exec(e)){let c;const h=l[1],d=l[2];switch(h){case"rgb":case"rgba":if(c=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return r(c[4]),this.setRGB(Math.min(255,parseInt(c[1],10))/255,Math.min(255,parseInt(c[2],10))/255,Math.min(255,parseInt(c[3],10))/255,i);if(c=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return r(c[4]),this.setRGB(Math.min(100,parseInt(c[1],10))/100,Math.min(100,parseInt(c[2],10))/100,Math.min(100,parseInt(c[3],10))/100,i);break;case"hsl":case"hsla":if(c=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(d))return r(c[4]),this.setHSL(parseFloat(c[1])/360,parseFloat(c[2])/100,parseFloat(c[3])/100,i);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(l=/^\#([A-Fa-f\d]+)$/.exec(e)){const c=l[1],h=c.length;if(h===3)return this.setRGB(parseInt(c.charAt(0),16)/15,parseInt(c.charAt(1),16)/15,parseInt(c.charAt(2),16)/15,i);if(h===6)return this.setHex(parseInt(c,16),i);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,i);return this}setColorName(e,i=Mi){const r=Px[e.toLowerCase()];return r!==void 0?this.setHex(r,i):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=wa(e.r),this.g=wa(e.g),this.b=wa(e.b),this}copyLinearToSRGB(e){return this.r=ro(e.r),this.g=ro(e.g),this.b=ro(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Mi){return Oe.workingToColorSpace(In.copy(this),e),Math.round(Ce(In.r*255,0,255))*65536+Math.round(Ce(In.g*255,0,255))*256+Math.round(Ce(In.b*255,0,255))}getHexString(e=Mi){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,i=Oe.workingColorSpace){Oe.workingToColorSpace(In.copy(this),i);const r=In.r,l=In.g,c=In.b,h=Math.max(r,l,c),d=Math.min(r,l,c);let g,p;const _=(d+h)/2;if(d===h)g=0,p=0;else{const m=h-d;switch(p=_<=.5?m/(h+d):m/(2-h-d),h){case r:g=(l-c)/m+(l<c?6:0);break;case l:g=(c-r)/m+2;break;case c:g=(r-l)/m+4;break}g/=6}return e.h=g,e.s=p,e.l=_,e}getRGB(e,i=Oe.workingColorSpace){return Oe.workingToColorSpace(In.copy(this),i),e.r=In.r,e.g=In.g,e.b=In.b,e}getStyle(e=Mi){Oe.workingToColorSpace(In.copy(this),e);const i=In.r,r=In.g,l=In.b;return e!==Mi?`color(${e} ${i.toFixed(3)} ${r.toFixed(3)} ${l.toFixed(3)})`:`rgb(${Math.round(i*255)},${Math.round(r*255)},${Math.round(l*255)})`}offsetHSL(e,i,r){return this.getHSL(lr),this.setHSL(lr.h+e,lr.s+i,lr.l+r)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,i){return this.r=e.r+i.r,this.g=e.g+i.g,this.b=e.b+i.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,i){return this.r+=(e.r-this.r)*i,this.g+=(e.g-this.g)*i,this.b+=(e.b-this.b)*i,this}lerpColors(e,i,r){return this.r=e.r+(i.r-e.r)*r,this.g=e.g+(i.g-e.g)*r,this.b=e.b+(i.b-e.b)*r,this}lerpHSL(e,i){this.getHSL(lr),e.getHSL(ac);const r=gl(lr.h,ac.h,i),l=gl(lr.s,ac.s,i),c=gl(lr.l,ac.l,i);return this.setHSL(r,l,c),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const i=this.r,r=this.g,l=this.b,c=e.elements;return this.r=c[0]*i+c[3]*r+c[6]*l,this.g=c[1]*i+c[4]*r+c[7]*l,this.b=c[2]*i+c[5]*r+c[8]*l,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,i=0){return this.r=e[i],this.g=e[i+1],this.b=e[i+2],this}toArray(e=[],i=0){return e[i]=this.r,e[i+1]=this.g,e[i+2]=this.b,e}fromBufferAttribute(e,i){return this.r=e.getX(i),this.g=e.getY(i),this.b=e.getZ(i),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const In=new we;we.NAMES=Px;let sT=0;class mo extends ho{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:sT++}),this.uuid=po(),this.name="",this.type="Material",this.blending=ao,this.side=pr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=qd,this.blendDst=Yd,this.blendEquation=Wr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new we(0,0,0),this.blendAlpha=0,this.depthFunc=so,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=xv,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Hs,this.stencilZFail=Hs,this.stencilZPass=Hs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const i in e){const r=e[i];if(r===void 0){console.warn(`THREE.Material: parameter '${i}' has value of undefined.`);continue}const l=this[i];if(l===void 0){console.warn(`THREE.Material: '${i}' is not a property of THREE.${this.type}.`);continue}l&&l.isColor?l.set(r):l&&l.isVector3&&r&&r.isVector3?l.copy(r):this[i]=r}}toJSON(e){const i=e===void 0||typeof e=="string";i&&(e={textures:{},images:{}});const r={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),this.roughness!==void 0&&(r.roughness=this.roughness),this.metalness!==void 0&&(r.metalness=this.metalness),this.sheen!==void 0&&(r.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(r.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(r.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(r.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(r.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(r.shininess=this.shininess),this.clearcoat!==void 0&&(r.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(r.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(r.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(r.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(r.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,r.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(r.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(r.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(r.dispersion=this.dispersion),this.iridescence!==void 0&&(r.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(r.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(r.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(r.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(r.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(r.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(r.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(r.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(r.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(e).uuid,r.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(e).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(e).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(e).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(e).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(r.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(r.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(r.combine=this.combine)),this.envMapRotation!==void 0&&(r.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(r.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(r.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(r.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(r.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(r.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(r.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(r.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(r.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(r.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(r.size=this.size),this.shadowSide!==null&&(r.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==ao&&(r.blending=this.blending),this.side!==pr&&(r.side=this.side),this.vertexColors===!0&&(r.vertexColors=!0),this.opacity<1&&(r.opacity=this.opacity),this.transparent===!0&&(r.transparent=!0),this.blendSrc!==qd&&(r.blendSrc=this.blendSrc),this.blendDst!==Yd&&(r.blendDst=this.blendDst),this.blendEquation!==Wr&&(r.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(r.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(r.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(r.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(r.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(r.blendAlpha=this.blendAlpha),this.depthFunc!==so&&(r.depthFunc=this.depthFunc),this.depthTest===!1&&(r.depthTest=this.depthTest),this.depthWrite===!1&&(r.depthWrite=this.depthWrite),this.colorWrite===!1&&(r.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(r.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==xv&&(r.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(r.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(r.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Hs&&(r.stencilFail=this.stencilFail),this.stencilZFail!==Hs&&(r.stencilZFail=this.stencilZFail),this.stencilZPass!==Hs&&(r.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(r.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(r.rotation=this.rotation),this.polygonOffset===!0&&(r.polygonOffset=!0),this.polygonOffsetFactor!==0&&(r.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(r.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(r.linewidth=this.linewidth),this.dashSize!==void 0&&(r.dashSize=this.dashSize),this.gapSize!==void 0&&(r.gapSize=this.gapSize),this.scale!==void 0&&(r.scale=this.scale),this.dithering===!0&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),this.alphaHash===!0&&(r.alphaHash=!0),this.alphaToCoverage===!0&&(r.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(r.premultipliedAlpha=!0),this.forceSinglePass===!0&&(r.forceSinglePass=!0),this.wireframe===!0&&(r.wireframe=!0),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(r.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(r.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(r.flatShading=!0),this.visible===!1&&(r.visible=!1),this.toneMapped===!1&&(r.toneMapped=!1),this.fog===!1&&(r.fog=!1),Object.keys(this.userData).length>0&&(r.userData=this.userData);function l(c){const h=[];for(const d in c){const g=c[d];delete g.metadata,h.push(g)}return h}if(i){const c=l(e.textures),h=l(e.images);c.length>0&&(r.textures=c),h.length>0&&(r.images=h)}return r}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const i=e.clippingPlanes;let r=null;if(i!==null){const l=i.length;r=new Array(l);for(let c=0;c!==l;++c)r[c]=i[c].clone()}return this.clippingPlanes=r,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class eo extends mo{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new we(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ia,this.combine=Mx,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const gn=new et,rc=new Te;let oT=0;class ea{constructor(e,i,r=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:oT++}),this.name="",this.array=e,this.itemSize=i,this.count=e!==void 0?e.length/i:0,this.normalized=r,this.usage=yv,this.updateRanges=[],this.gpuType=Ca,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,i){this.updateRanges.push({start:e,count:i})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,i,r){e*=this.itemSize,r*=i.itemSize;for(let l=0,c=this.itemSize;l<c;l++)this.array[e+l]=i.array[r+l];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let i=0,r=this.count;i<r;i++)rc.fromBufferAttribute(this,i),rc.applyMatrix3(e),this.setXY(i,rc.x,rc.y);else if(this.itemSize===3)for(let i=0,r=this.count;i<r;i++)gn.fromBufferAttribute(this,i),gn.applyMatrix3(e),this.setXYZ(i,gn.x,gn.y,gn.z);return this}applyMatrix4(e){for(let i=0,r=this.count;i<r;i++)gn.fromBufferAttribute(this,i),gn.applyMatrix4(e),this.setXYZ(i,gn.x,gn.y,gn.z);return this}applyNormalMatrix(e){for(let i=0,r=this.count;i<r;i++)gn.fromBufferAttribute(this,i),gn.applyNormalMatrix(e),this.setXYZ(i,gn.x,gn.y,gn.z);return this}transformDirection(e){for(let i=0,r=this.count;i<r;i++)gn.fromBufferAttribute(this,i),gn.transformDirection(e),this.setXYZ(i,gn.x,gn.y,gn.z);return this}set(e,i=0){return this.array.set(e,i),this}getComponent(e,i){let r=this.array[e*this.itemSize+i];return this.normalized&&(r=to(r,this.array)),r}setComponent(e,i,r){return this.normalized&&(r=kn(r,this.array)),this.array[e*this.itemSize+i]=r,this}getX(e){let i=this.array[e*this.itemSize];return this.normalized&&(i=to(i,this.array)),i}setX(e,i){return this.normalized&&(i=kn(i,this.array)),this.array[e*this.itemSize]=i,this}getY(e){let i=this.array[e*this.itemSize+1];return this.normalized&&(i=to(i,this.array)),i}setY(e,i){return this.normalized&&(i=kn(i,this.array)),this.array[e*this.itemSize+1]=i,this}getZ(e){let i=this.array[e*this.itemSize+2];return this.normalized&&(i=to(i,this.array)),i}setZ(e,i){return this.normalized&&(i=kn(i,this.array)),this.array[e*this.itemSize+2]=i,this}getW(e){let i=this.array[e*this.itemSize+3];return this.normalized&&(i=to(i,this.array)),i}setW(e,i){return this.normalized&&(i=kn(i,this.array)),this.array[e*this.itemSize+3]=i,this}setXY(e,i,r){return e*=this.itemSize,this.normalized&&(i=kn(i,this.array),r=kn(r,this.array)),this.array[e+0]=i,this.array[e+1]=r,this}setXYZ(e,i,r,l){return e*=this.itemSize,this.normalized&&(i=kn(i,this.array),r=kn(r,this.array),l=kn(l,this.array)),this.array[e+0]=i,this.array[e+1]=r,this.array[e+2]=l,this}setXYZW(e,i,r,l,c){return e*=this.itemSize,this.normalized&&(i=kn(i,this.array),r=kn(r,this.array),l=kn(l,this.array),c=kn(c,this.array)),this.array[e+0]=i,this.array[e+1]=r,this.array[e+2]=l,this.array[e+3]=c,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==yv&&(e.usage=this.usage),e}}class Ix extends ea{constructor(e,i,r){super(new Uint16Array(e),i,r)}}class Bx extends ea{constructor(e,i,r){super(new Uint32Array(e),i,r)}}class Je extends ea{constructor(e,i,r){super(new Float32Array(e),i,r)}}let lT=0;const Si=new an,Ld=new An,Ks=new et,ci=new Al,hl=new Al,bn=new et;class Yn extends ho{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:lT++}),this.uuid=po(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ox(e)?Bx:Ix)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,i){return this.attributes[e]=i,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,i,r=0){this.groups.push({start:e,count:i,materialIndex:r})}clearGroups(){this.groups=[]}setDrawRange(e,i){this.drawRange.start=e,this.drawRange.count=i}applyMatrix4(e){const i=this.attributes.position;i!==void 0&&(i.applyMatrix4(e),i.needsUpdate=!0);const r=this.attributes.normal;if(r!==void 0){const c=new ge().getNormalMatrix(e);r.applyNormalMatrix(c),r.needsUpdate=!0}const l=this.attributes.tangent;return l!==void 0&&(l.transformDirection(e),l.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Si.makeRotationFromQuaternion(e),this.applyMatrix4(Si),this}rotateX(e){return Si.makeRotationX(e),this.applyMatrix4(Si),this}rotateY(e){return Si.makeRotationY(e),this.applyMatrix4(Si),this}rotateZ(e){return Si.makeRotationZ(e),this.applyMatrix4(Si),this}translate(e,i,r){return Si.makeTranslation(e,i,r),this.applyMatrix4(Si),this}scale(e,i,r){return Si.makeScale(e,i,r),this.applyMatrix4(Si),this}lookAt(e){return Ld.lookAt(e),Ld.updateMatrix(),this.applyMatrix4(Ld.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ks).negate(),this.translate(Ks.x,Ks.y,Ks.z),this}setFromPoints(e){const i=this.getAttribute("position");if(i===void 0){const r=[];for(let l=0,c=e.length;l<c;l++){const h=e[l];r.push(h.x,h.y,h.z||0)}this.setAttribute("position",new Je(r,3))}else{const r=Math.min(e.length,i.count);for(let l=0;l<r;l++){const c=e[l];i.setXYZ(l,c.x,c.y,c.z||0)}e.length>i.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),i.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Al);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new et(-1/0,-1/0,-1/0),new et(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),i)for(let r=0,l=i.length;r<l;r++){const c=i[r];ci.setFromBufferAttribute(c),this.morphTargetsRelative?(bn.addVectors(this.boundingBox.min,ci.min),this.boundingBox.expandByPoint(bn),bn.addVectors(this.boundingBox.max,ci.max),this.boundingBox.expandByPoint(bn)):(this.boundingBox.expandByPoint(ci.min),this.boundingBox.expandByPoint(ci.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Nc);const e=this.attributes.position,i=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new et,1/0);return}if(e){const r=this.boundingSphere.center;if(ci.setFromBufferAttribute(e),i)for(let c=0,h=i.length;c<h;c++){const d=i[c];hl.setFromBufferAttribute(d),this.morphTargetsRelative?(bn.addVectors(ci.min,hl.min),ci.expandByPoint(bn),bn.addVectors(ci.max,hl.max),ci.expandByPoint(bn)):(ci.expandByPoint(hl.min),ci.expandByPoint(hl.max))}ci.getCenter(r);let l=0;for(let c=0,h=e.count;c<h;c++)bn.fromBufferAttribute(e,c),l=Math.max(l,r.distanceToSquared(bn));if(i)for(let c=0,h=i.length;c<h;c++){const d=i[c],g=this.morphTargetsRelative;for(let p=0,_=d.count;p<_;p++)bn.fromBufferAttribute(d,p),g&&(Ks.fromBufferAttribute(e,p),bn.add(Ks)),l=Math.max(l,r.distanceToSquared(bn))}this.boundingSphere.radius=Math.sqrt(l),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,i=this.attributes;if(e===null||i.position===void 0||i.normal===void 0||i.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const r=i.position,l=i.normal,c=i.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ea(new Float32Array(4*r.count),4));const h=this.getAttribute("tangent"),d=[],g=[];for(let H=0;H<r.count;H++)d[H]=new et,g[H]=new et;const p=new et,_=new et,m=new et,x=new Te,S=new Te,E=new Te,A=new et,M=new et;function y(H,w,R){p.fromBufferAttribute(r,H),_.fromBufferAttribute(r,w),m.fromBufferAttribute(r,R),x.fromBufferAttribute(c,H),S.fromBufferAttribute(c,w),E.fromBufferAttribute(c,R),_.sub(p),m.sub(p),S.sub(x),E.sub(x);const V=1/(S.x*E.y-E.x*S.y);isFinite(V)&&(A.copy(_).multiplyScalar(E.y).addScaledVector(m,-S.y).multiplyScalar(V),M.copy(m).multiplyScalar(S.x).addScaledVector(_,-E.x).multiplyScalar(V),d[H].add(A),d[w].add(A),d[R].add(A),g[H].add(M),g[w].add(M),g[R].add(M))}let N=this.groups;N.length===0&&(N=[{start:0,count:e.count}]);for(let H=0,w=N.length;H<w;++H){const R=N[H],V=R.start,$=R.count;for(let ft=V,gt=V+$;ft<gt;ft+=3)y(e.getX(ft+0),e.getX(ft+1),e.getX(ft+2))}const L=new et,D=new et,F=new et,I=new et;function O(H){F.fromBufferAttribute(l,H),I.copy(F);const w=d[H];L.copy(w),L.sub(F.multiplyScalar(F.dot(w))).normalize(),D.crossVectors(I,w);const V=D.dot(g[H])<0?-1:1;h.setXYZW(H,L.x,L.y,L.z,V)}for(let H=0,w=N.length;H<w;++H){const R=N[H],V=R.start,$=R.count;for(let ft=V,gt=V+$;ft<gt;ft+=3)O(e.getX(ft+0)),O(e.getX(ft+1)),O(e.getX(ft+2))}}computeVertexNormals(){const e=this.index,i=this.getAttribute("position");if(i!==void 0){let r=this.getAttribute("normal");if(r===void 0)r=new ea(new Float32Array(i.count*3),3),this.setAttribute("normal",r);else for(let x=0,S=r.count;x<S;x++)r.setXYZ(x,0,0,0);const l=new et,c=new et,h=new et,d=new et,g=new et,p=new et,_=new et,m=new et;if(e)for(let x=0,S=e.count;x<S;x+=3){const E=e.getX(x+0),A=e.getX(x+1),M=e.getX(x+2);l.fromBufferAttribute(i,E),c.fromBufferAttribute(i,A),h.fromBufferAttribute(i,M),_.subVectors(h,c),m.subVectors(l,c),_.cross(m),d.fromBufferAttribute(r,E),g.fromBufferAttribute(r,A),p.fromBufferAttribute(r,M),d.add(_),g.add(_),p.add(_),r.setXYZ(E,d.x,d.y,d.z),r.setXYZ(A,g.x,g.y,g.z),r.setXYZ(M,p.x,p.y,p.z)}else for(let x=0,S=i.count;x<S;x+=3)l.fromBufferAttribute(i,x+0),c.fromBufferAttribute(i,x+1),h.fromBufferAttribute(i,x+2),_.subVectors(h,c),m.subVectors(l,c),_.cross(m),r.setXYZ(x+0,_.x,_.y,_.z),r.setXYZ(x+1,_.x,_.y,_.z),r.setXYZ(x+2,_.x,_.y,_.z);this.normalizeNormals(),r.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let i=0,r=e.count;i<r;i++)bn.fromBufferAttribute(e,i),bn.normalize(),e.setXYZ(i,bn.x,bn.y,bn.z)}toNonIndexed(){function e(d,g){const p=d.array,_=d.itemSize,m=d.normalized,x=new p.constructor(g.length*_);let S=0,E=0;for(let A=0,M=g.length;A<M;A++){d.isInterleavedBufferAttribute?S=g[A]*d.data.stride+d.offset:S=g[A]*_;for(let y=0;y<_;y++)x[E++]=p[S++]}return new ea(x,_,m)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const i=new Yn,r=this.index.array,l=this.attributes;for(const d in l){const g=l[d],p=e(g,r);i.setAttribute(d,p)}const c=this.morphAttributes;for(const d in c){const g=[],p=c[d];for(let _=0,m=p.length;_<m;_++){const x=p[_],S=e(x,r);g.push(S)}i.morphAttributes[d]=g}i.morphTargetsRelative=this.morphTargetsRelative;const h=this.groups;for(let d=0,g=h.length;d<g;d++){const p=h[d];i.addGroup(p.start,p.count,p.materialIndex)}return i}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const g=this.parameters;for(const p in g)g[p]!==void 0&&(e[p]=g[p]);return e}e.data={attributes:{}};const i=this.index;i!==null&&(e.data.index={type:i.array.constructor.name,array:Array.prototype.slice.call(i.array)});const r=this.attributes;for(const g in r){const p=r[g];e.data.attributes[g]=p.toJSON(e.data)}const l={};let c=!1;for(const g in this.morphAttributes){const p=this.morphAttributes[g],_=[];for(let m=0,x=p.length;m<x;m++){const S=p[m];_.push(S.toJSON(e.data))}_.length>0&&(l[g]=_,c=!0)}c&&(e.data.morphAttributes=l,e.data.morphTargetsRelative=this.morphTargetsRelative);const h=this.groups;h.length>0&&(e.data.groups=JSON.parse(JSON.stringify(h)));const d=this.boundingSphere;return d!==null&&(e.data.boundingSphere=d.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const i={};this.name=e.name;const r=e.index;r!==null&&this.setIndex(r.clone());const l=e.attributes;for(const p in l){const _=l[p];this.setAttribute(p,_.clone(i))}const c=e.morphAttributes;for(const p in c){const _=[],m=c[p];for(let x=0,S=m.length;x<S;x++)_.push(m[x].clone(i));this.morphAttributes[p]=_}this.morphTargetsRelative=e.morphTargetsRelative;const h=e.groups;for(let p=0,_=h.length;p<_;p++){const m=h[p];this.addGroup(m.start,m.count,m.materialIndex)}const d=e.boundingBox;d!==null&&(this.boundingBox=d.clone());const g=e.boundingSphere;return g!==null&&(this.boundingSphere=g.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Pv=new an,Vr=new qp,sc=new Nc,Iv=new et,oc=new et,lc=new et,uc=new et,Od=new et,cc=new et,Bv=new et,fc=new et;class cn extends An{constructor(e=new Yn,i=new eo){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const i=this.geometry.morphAttributes,r=Object.keys(i);if(r.length>0){const l=i[r[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let c=0,h=l.length;c<h;c++){const d=l[c].name||String(c);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=c}}}}getVertexPosition(e,i){const r=this.geometry,l=r.attributes.position,c=r.morphAttributes.position,h=r.morphTargetsRelative;i.fromBufferAttribute(l,e);const d=this.morphTargetInfluences;if(c&&d){cc.set(0,0,0);for(let g=0,p=c.length;g<p;g++){const _=d[g],m=c[g];_!==0&&(Od.fromBufferAttribute(m,e),h?cc.addScaledVector(Od,_):cc.addScaledVector(Od.sub(i),_))}i.add(cc)}return i}raycast(e,i){const r=this.geometry,l=this.material,c=this.matrixWorld;l!==void 0&&(r.boundingSphere===null&&r.computeBoundingSphere(),sc.copy(r.boundingSphere),sc.applyMatrix4(c),Vr.copy(e.ray).recast(e.near),!(sc.containsPoint(Vr.origin)===!1&&(Vr.intersectSphere(sc,Iv)===null||Vr.origin.distanceToSquared(Iv)>(e.far-e.near)**2))&&(Pv.copy(c).invert(),Vr.copy(e.ray).applyMatrix4(Pv),!(r.boundingBox!==null&&Vr.intersectsBox(r.boundingBox)===!1)&&this._computeIntersections(e,i,Vr)))}_computeIntersections(e,i,r){let l;const c=this.geometry,h=this.material,d=c.index,g=c.attributes.position,p=c.attributes.uv,_=c.attributes.uv1,m=c.attributes.normal,x=c.groups,S=c.drawRange;if(d!==null)if(Array.isArray(h))for(let E=0,A=x.length;E<A;E++){const M=x[E],y=h[M.materialIndex],N=Math.max(M.start,S.start),L=Math.min(d.count,Math.min(M.start+M.count,S.start+S.count));for(let D=N,F=L;D<F;D+=3){const I=d.getX(D),O=d.getX(D+1),H=d.getX(D+2);l=hc(this,y,e,r,p,_,m,I,O,H),l&&(l.faceIndex=Math.floor(D/3),l.face.materialIndex=M.materialIndex,i.push(l))}}else{const E=Math.max(0,S.start),A=Math.min(d.count,S.start+S.count);for(let M=E,y=A;M<y;M+=3){const N=d.getX(M),L=d.getX(M+1),D=d.getX(M+2);l=hc(this,h,e,r,p,_,m,N,L,D),l&&(l.faceIndex=Math.floor(M/3),i.push(l))}}else if(g!==void 0)if(Array.isArray(h))for(let E=0,A=x.length;E<A;E++){const M=x[E],y=h[M.materialIndex],N=Math.max(M.start,S.start),L=Math.min(g.count,Math.min(M.start+M.count,S.start+S.count));for(let D=N,F=L;D<F;D+=3){const I=D,O=D+1,H=D+2;l=hc(this,y,e,r,p,_,m,I,O,H),l&&(l.faceIndex=Math.floor(D/3),l.face.materialIndex=M.materialIndex,i.push(l))}}else{const E=Math.max(0,S.start),A=Math.min(g.count,S.start+S.count);for(let M=E,y=A;M<y;M+=3){const N=M,L=M+1,D=M+2;l=hc(this,h,e,r,p,_,m,N,L,D),l&&(l.faceIndex=Math.floor(M/3),i.push(l))}}}}function uT(o,e,i,r,l,c,h,d){let g;if(e.side===$n?g=r.intersectTriangle(h,c,l,!0,d):g=r.intersectTriangle(l,c,h,e.side===pr,d),g===null)return null;fc.copy(d),fc.applyMatrix4(o.matrixWorld);const p=i.ray.origin.distanceTo(fc);return p<i.near||p>i.far?null:{distance:p,point:fc.clone(),object:o}}function hc(o,e,i,r,l,c,h,d,g,p){o.getVertexPosition(d,oc),o.getVertexPosition(g,lc),o.getVertexPosition(p,uc);const _=uT(o,e,i,r,oc,lc,uc,Bv);if(_){const m=new et;Oi.getBarycoord(Bv,oc,lc,uc,m),l&&(_.uv=Oi.getInterpolatedAttribute(l,d,g,p,m,new Te)),c&&(_.uv1=Oi.getInterpolatedAttribute(c,d,g,p,m,new Te)),h&&(_.normal=Oi.getInterpolatedAttribute(h,d,g,p,m,new et),_.normal.dot(r.direction)>0&&_.normal.multiplyScalar(-1));const x={a:d,b:g,c:p,normal:new et,materialIndex:0};Oi.getNormal(oc,lc,uc,x.normal),_.face=x,_.barycoord=m}return _}class Jn extends Yn{constructor(e=1,i=1,r=1,l=1,c=1,h=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:i,depth:r,widthSegments:l,heightSegments:c,depthSegments:h};const d=this;l=Math.floor(l),c=Math.floor(c),h=Math.floor(h);const g=[],p=[],_=[],m=[];let x=0,S=0;E("z","y","x",-1,-1,r,i,e,h,c,0),E("z","y","x",1,-1,r,i,-e,h,c,1),E("x","z","y",1,1,e,r,i,l,h,2),E("x","z","y",1,-1,e,r,-i,l,h,3),E("x","y","z",1,-1,e,i,r,l,c,4),E("x","y","z",-1,-1,e,i,-r,l,c,5),this.setIndex(g),this.setAttribute("position",new Je(p,3)),this.setAttribute("normal",new Je(_,3)),this.setAttribute("uv",new Je(m,2));function E(A,M,y,N,L,D,F,I,O,H,w){const R=D/O,V=F/H,$=D/2,ft=F/2,gt=I/2,lt=O+1,j=H+1;let ot=0,Q=0;const St=new et;for(let xt=0;xt<j;xt++){const Gt=xt*V-ft;for(let ne=0;ne<lt;ne++){const ye=ne*R-$;St[A]=ye*N,St[M]=Gt*L,St[y]=gt,p.push(St.x,St.y,St.z),St[A]=0,St[M]=0,St[y]=I>0?1:-1,_.push(St.x,St.y,St.z),m.push(ne/O),m.push(1-xt/H),ot+=1}}for(let xt=0;xt<H;xt++)for(let Gt=0;Gt<O;Gt++){const ne=x+Gt+lt*xt,ye=x+Gt+lt*(xt+1),P=x+(Gt+1)+lt*(xt+1),ht=x+(Gt+1)+lt*xt;g.push(ne,ye,ht),g.push(ye,P,ht),Q+=6}d.addGroup(S,Q,w),S+=Q,x+=ot}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Jn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function co(o){const e={};for(const i in o){e[i]={};for(const r in o[i]){const l=o[i][r];l&&(l.isColor||l.isMatrix3||l.isMatrix4||l.isVector2||l.isVector3||l.isVector4||l.isTexture||l.isQuaternion)?l.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[i][r]=null):e[i][r]=l.clone():Array.isArray(l)?e[i][r]=l.slice():e[i][r]=l}}return e}function Xn(o){const e={};for(let i=0;i<o.length;i++){const r=co(o[i]);for(const l in r)e[l]=r[l]}return e}function cT(o){const e=[];for(let i=0;i<o.length;i++)e.push(o[i].clone());return e}function Fx(o){const e=o.getRenderTarget();return e===null?o.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Oe.workingColorSpace}const fT={clone:co,merge:Xn};var hT=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,dT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class mr extends mo{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=hT,this.fragmentShader=dT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=co(e.uniforms),this.uniformsGroups=cT(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const i=super.toJSON(e);i.glslVersion=this.glslVersion,i.uniforms={};for(const l in this.uniforms){const h=this.uniforms[l].value;h&&h.isTexture?i.uniforms[l]={type:"t",value:h.toJSON(e).uuid}:h&&h.isColor?i.uniforms[l]={type:"c",value:h.getHex()}:h&&h.isVector2?i.uniforms[l]={type:"v2",value:h.toArray()}:h&&h.isVector3?i.uniforms[l]={type:"v3",value:h.toArray()}:h&&h.isVector4?i.uniforms[l]={type:"v4",value:h.toArray()}:h&&h.isMatrix3?i.uniforms[l]={type:"m3",value:h.toArray()}:h&&h.isMatrix4?i.uniforms[l]={type:"m4",value:h.toArray()}:i.uniforms[l]={value:h}}Object.keys(this.defines).length>0&&(i.defines=this.defines),i.vertexShader=this.vertexShader,i.fragmentShader=this.fragmentShader,i.lights=this.lights,i.clipping=this.clipping;const r={};for(const l in this.extensions)this.extensions[l]===!0&&(r[l]=!0);return Object.keys(r).length>0&&(i.extensions=r),i}}class Hx extends An{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new an,this.projectionMatrix=new an,this.projectionMatrixInverse=new an,this.coordinateSystem=ta,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,i){return super.copy(e,i),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,i){super.updateWorldMatrix(e,i),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ur=new et,Fv=new Te,Hv=new Te;class Ei extends Hx{constructor(e=50,i=1,r=.1,l=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=r,this.far=l,this.focus=10,this.aspect=i,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const i=.5*this.getFilmHeight()/e;this.fov=Ml*2*Math.atan(i),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ml*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ml*2*Math.atan(Math.tan(ml*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,i,r){ur.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ur.x,ur.y).multiplyScalar(-e/ur.z),ur.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),r.set(ur.x,ur.y).multiplyScalar(-e/ur.z)}getViewSize(e,i){return this.getViewBounds(e,Fv,Hv),i.subVectors(Hv,Fv)}setViewOffset(e,i,r,l,c,h){this.aspect=e/i,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=r,this.view.offsetY=l,this.view.width=c,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let i=e*Math.tan(ml*.5*this.fov)/this.zoom,r=2*i,l=this.aspect*r,c=-.5*l;const h=this.view;if(this.view!==null&&this.view.enabled){const g=h.fullWidth,p=h.fullHeight;c+=h.offsetX*l/g,i-=h.offsetY*r/p,l*=h.width/g,r*=h.height/p}const d=this.filmOffset;d!==0&&(c+=e*d/this.getFilmWidth()),this.projectionMatrix.makePerspective(c,c+l,i,i-r,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.fov=this.fov,i.object.zoom=this.zoom,i.object.near=this.near,i.object.far=this.far,i.object.focus=this.focus,i.object.aspect=this.aspect,this.view!==null&&(i.object.view=Object.assign({},this.view)),i.object.filmGauge=this.filmGauge,i.object.filmOffset=this.filmOffset,i}}const Qs=-90,Js=1;class pT extends An{constructor(e,i,r){super(),this.type="CubeCamera",this.renderTarget=r,this.coordinateSystem=null,this.activeMipmapLevel=0;const l=new Ei(Qs,Js,e,i);l.layers=this.layers,this.add(l);const c=new Ei(Qs,Js,e,i);c.layers=this.layers,this.add(c);const h=new Ei(Qs,Js,e,i);h.layers=this.layers,this.add(h);const d=new Ei(Qs,Js,e,i);d.layers=this.layers,this.add(d);const g=new Ei(Qs,Js,e,i);g.layers=this.layers,this.add(g);const p=new Ei(Qs,Js,e,i);p.layers=this.layers,this.add(p)}updateCoordinateSystem(){const e=this.coordinateSystem,i=this.children.concat(),[r,l,c,h,d,g]=i;for(const p of i)this.remove(p);if(e===ta)r.up.set(0,1,0),r.lookAt(1,0,0),l.up.set(0,1,0),l.lookAt(-1,0,0),c.up.set(0,0,-1),c.lookAt(0,1,0),h.up.set(0,0,1),h.lookAt(0,-1,0),d.up.set(0,1,0),d.lookAt(0,0,1),g.up.set(0,1,0),g.lookAt(0,0,-1);else if(e===bc)r.up.set(0,-1,0),r.lookAt(-1,0,0),l.up.set(0,-1,0),l.lookAt(1,0,0),c.up.set(0,0,1),c.lookAt(0,1,0),h.up.set(0,0,-1),h.lookAt(0,-1,0),d.up.set(0,-1,0),d.lookAt(0,0,1),g.up.set(0,-1,0),g.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const p of i)this.add(p),p.updateMatrixWorld()}update(e,i){this.parent===null&&this.updateMatrixWorld();const{renderTarget:r,activeMipmapLevel:l}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[c,h,d,g,p,_]=this.children,m=e.getRenderTarget(),x=e.getActiveCubeFace(),S=e.getActiveMipmapLevel(),E=e.xr.enabled;e.xr.enabled=!1;const A=r.texture.generateMipmaps;r.texture.generateMipmaps=!1,e.setRenderTarget(r,0,l),e.render(i,c),e.setRenderTarget(r,1,l),e.render(i,h),e.setRenderTarget(r,2,l),e.render(i,d),e.setRenderTarget(r,3,l),e.render(i,g),e.setRenderTarget(r,4,l),e.render(i,p),r.texture.generateMipmaps=A,e.setRenderTarget(r,5,l),e.render(i,_),e.setRenderTarget(m,x,S),e.xr.enabled=E,r.texture.needsPMREMUpdate=!0}}class Gx extends qn{constructor(e=[],i=oo,r,l,c,h,d,g,p,_){super(e,i,r,l,c,h,d,g,p,_),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class mT extends $r{constructor(e=1,i={}){super(e,e,i),this.isWebGLCubeRenderTarget=!0;const r={width:e,height:e,depth:1},l=[r,r,r,r,r,r];this.texture=new Gx(l),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,i){this.texture.type=i.type,this.texture.colorSpace=i.colorSpace,this.texture.generateMipmaps=i.generateMipmaps,this.texture.minFilter=i.minFilter,this.texture.magFilter=i.magFilter;const r={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},l=new Jn(5,5,5),c=new mr({name:"CubemapFromEquirect",uniforms:co(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,side:$n,blending:hr});c.uniforms.tEquirect.value=i;const h=new cn(l,c),d=i.minFilter;return i.minFilter===Qr&&(i.minFilter=zi),new pT(1,10,this).update(e,h),i.minFilter=d,h.geometry.dispose(),h.material.dispose(),this}clear(e,i=!0,r=!0,l=!0){const c=e.getRenderTarget();for(let h=0;h<6;h++)e.setRenderTarget(this,h),e.clear(i,r,l);e.setRenderTarget(c)}}class Ra extends An{constructor(){super(),this.isGroup=!0,this.type="Group"}}const gT={type:"move"};class zd{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ra,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ra,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new et,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new et),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ra,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new et,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new et),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const i=this._hand;if(i)for(const r of e.hand.values())this._getHandJoint(i,r)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,i,r){let l=null,c=null,h=null;const d=this._targetRay,g=this._grip,p=this._hand;if(e&&i.session.visibilityState!=="visible-blurred"){if(p&&e.hand){h=!0;for(const A of e.hand.values()){const M=i.getJointPose(A,r),y=this._getHandJoint(p,A);M!==null&&(y.matrix.fromArray(M.transform.matrix),y.matrix.decompose(y.position,y.rotation,y.scale),y.matrixWorldNeedsUpdate=!0,y.jointRadius=M.radius),y.visible=M!==null}const _=p.joints["index-finger-tip"],m=p.joints["thumb-tip"],x=_.position.distanceTo(m.position),S=.02,E=.005;p.inputState.pinching&&x>S+E?(p.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!p.inputState.pinching&&x<=S-E&&(p.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else g!==null&&e.gripSpace&&(c=i.getPose(e.gripSpace,r),c!==null&&(g.matrix.fromArray(c.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,c.linearVelocity?(g.hasLinearVelocity=!0,g.linearVelocity.copy(c.linearVelocity)):g.hasLinearVelocity=!1,c.angularVelocity?(g.hasAngularVelocity=!0,g.angularVelocity.copy(c.angularVelocity)):g.hasAngularVelocity=!1));d!==null&&(l=i.getPose(e.targetRaySpace,r),l===null&&c!==null&&(l=c),l!==null&&(d.matrix.fromArray(l.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,l.linearVelocity?(d.hasLinearVelocity=!0,d.linearVelocity.copy(l.linearVelocity)):d.hasLinearVelocity=!1,l.angularVelocity?(d.hasAngularVelocity=!0,d.angularVelocity.copy(l.angularVelocity)):d.hasAngularVelocity=!1,this.dispatchEvent(gT)))}return d!==null&&(d.visible=l!==null),g!==null&&(g.visible=c!==null),p!==null&&(p.visible=h!==null),this}_getHandJoint(e,i){if(e.joints[i.jointName]===void 0){const r=new Ra;r.matrixAutoUpdate=!1,r.visible=!1,e.joints[i.jointName]=r,e.add(r)}return e.joints[i.jointName]}}class jp{constructor(e,i=25e-5){this.isFogExp2=!0,this.name="",this.color=new we(e),this.density=i}clone(){return new jp(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class _T extends An{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ia,this.environmentIntensity=1,this.environmentRotation=new ia,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,i){return super.copy(e,i),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const i=super.toJSON(e);return this.fog!==null&&(i.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(i.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(i.object.backgroundIntensity=this.backgroundIntensity),i.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(i.object.environmentIntensity=this.environmentIntensity),i.object.environmentRotation=this.environmentRotation.toArray(),i}}const Pd=new et,vT=new et,xT=new ge;class cr{constructor(e=new et(1,0,0),i=0){this.isPlane=!0,this.normal=e,this.constant=i}set(e,i){return this.normal.copy(e),this.constant=i,this}setComponents(e,i,r,l){return this.normal.set(e,i,r),this.constant=l,this}setFromNormalAndCoplanarPoint(e,i){return this.normal.copy(e),this.constant=-i.dot(this.normal),this}setFromCoplanarPoints(e,i,r){const l=Pd.subVectors(r,i).cross(vT.subVectors(e,i)).normalize();return this.setFromNormalAndCoplanarPoint(l,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,i){return i.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,i){const r=e.delta(Pd),l=this.normal.dot(r);if(l===0)return this.distanceToPoint(e.start)===0?i.copy(e.start):null;const c=-(e.start.dot(this.normal)+this.constant)/l;return c<0||c>1?null:i.copy(e.start).addScaledVector(r,c)}intersectsLine(e){const i=this.distanceToPoint(e.start),r=this.distanceToPoint(e.end);return i<0&&r>0||r<0&&i>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,i){const r=i||xT.getNormalMatrix(e),l=this.coplanarPoint(Pd).applyMatrix4(e),c=this.normal.applyMatrix3(r).normalize();return this.constant=-l.dot(c),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const kr=new Nc,yT=new Te(.5,.5),dc=new et;class Wp{constructor(e=new cr,i=new cr,r=new cr,l=new cr,c=new cr,h=new cr){this.planes=[e,i,r,l,c,h]}set(e,i,r,l,c,h){const d=this.planes;return d[0].copy(e),d[1].copy(i),d[2].copy(r),d[3].copy(l),d[4].copy(c),d[5].copy(h),this}copy(e){const i=this.planes;for(let r=0;r<6;r++)i[r].copy(e.planes[r]);return this}setFromProjectionMatrix(e,i=ta,r=!1){const l=this.planes,c=e.elements,h=c[0],d=c[1],g=c[2],p=c[3],_=c[4],m=c[5],x=c[6],S=c[7],E=c[8],A=c[9],M=c[10],y=c[11],N=c[12],L=c[13],D=c[14],F=c[15];if(l[0].setComponents(p-h,S-_,y-E,F-N).normalize(),l[1].setComponents(p+h,S+_,y+E,F+N).normalize(),l[2].setComponents(p+d,S+m,y+A,F+L).normalize(),l[3].setComponents(p-d,S-m,y-A,F-L).normalize(),r)l[4].setComponents(g,x,M,D).normalize(),l[5].setComponents(p-g,S-x,y-M,F-D).normalize();else if(l[4].setComponents(p-g,S-x,y-M,F-D).normalize(),i===ta)l[5].setComponents(p+g,S+x,y+M,F+D).normalize();else if(i===bc)l[5].setComponents(g,x,M,D).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+i);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),kr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const i=e.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),kr.copy(i.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(kr)}intersectsSprite(e){kr.center.set(0,0,0);const i=yT.distanceTo(e.center);return kr.radius=.7071067811865476+i,kr.applyMatrix4(e.matrixWorld),this.intersectsSphere(kr)}intersectsSphere(e){const i=this.planes,r=e.center,l=-e.radius;for(let c=0;c<6;c++)if(i[c].distanceToPoint(r)<l)return!1;return!0}intersectsBox(e){const i=this.planes;for(let r=0;r<6;r++){const l=i[r];if(dc.x=l.normal.x>0?e.max.x:e.min.x,dc.y=l.normal.y>0?e.max.y:e.min.y,dc.z=l.normal.z>0?e.max.z:e.min.z,l.distanceToPoint(dc)<0)return!1}return!0}containsPoint(e){const i=this.planes;for(let r=0;r<6;r++)if(i[r].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Zp extends mo{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new we(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Rc=new et,Cc=new et,Gv=new an,dl=new qp,pc=new Nc,Id=new et,Vv=new et;class Np extends An{constructor(e=new Yn,i=new Zp){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=i,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,i){return super.copy(e,i),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,r=[0];for(let l=1,c=i.count;l<c;l++)Rc.fromBufferAttribute(i,l-1),Cc.fromBufferAttribute(i,l),r[l]=r[l-1],r[l]+=Rc.distanceTo(Cc);e.setAttribute("lineDistance",new Je(r,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,i){const r=this.geometry,l=this.matrixWorld,c=e.params.Line.threshold,h=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),pc.copy(r.boundingSphere),pc.applyMatrix4(l),pc.radius+=c,e.ray.intersectsSphere(pc)===!1)return;Gv.copy(l).invert(),dl.copy(e.ray).applyMatrix4(Gv);const d=c/((this.scale.x+this.scale.y+this.scale.z)/3),g=d*d,p=this.isLineSegments?2:1,_=r.index,x=r.attributes.position;if(_!==null){const S=Math.max(0,h.start),E=Math.min(_.count,h.start+h.count);for(let A=S,M=E-1;A<M;A+=p){const y=_.getX(A),N=_.getX(A+1),L=mc(this,e,dl,g,y,N,A);L&&i.push(L)}if(this.isLineLoop){const A=_.getX(E-1),M=_.getX(S),y=mc(this,e,dl,g,A,M,E-1);y&&i.push(y)}}else{const S=Math.max(0,h.start),E=Math.min(x.count,h.start+h.count);for(let A=S,M=E-1;A<M;A+=p){const y=mc(this,e,dl,g,A,A+1,A);y&&i.push(y)}if(this.isLineLoop){const A=mc(this,e,dl,g,E-1,S,E-1);A&&i.push(A)}}}updateMorphTargets(){const i=this.geometry.morphAttributes,r=Object.keys(i);if(r.length>0){const l=i[r[0]];if(l!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let c=0,h=l.length;c<h;c++){const d=l[c].name||String(c);this.morphTargetInfluences.push(0),this.morphTargetDictionary[d]=c}}}}}function mc(o,e,i,r,l,c,h){const d=o.geometry.attributes.position;if(Rc.fromBufferAttribute(d,l),Cc.fromBufferAttribute(d,c),i.distanceSqToSegment(Rc,Cc,Id,Vv)>r)return;Id.applyMatrix4(o.matrixWorld);const p=e.ray.origin.distanceTo(Id);if(!(p<e.near||p>e.far))return{distance:p,point:Vv.clone().applyMatrix4(o.matrixWorld),index:h,face:null,faceIndex:null,barycoord:null,object:o}}const kv=new et,Xv=new et;class ST extends Np{constructor(e,i){super(e,i),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const i=e.attributes.position,r=[];for(let l=0,c=i.count;l<c;l+=2)kv.fromBufferAttribute(i,l),Xv.fromBufferAttribute(i,l+1),r[l]=l===0?0:r[l-1],r[l+1]=r[l]+kv.distanceTo(Xv);e.setAttribute("lineDistance",new Je(r,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class MT extends qn{constructor(e,i,r,l,c,h,d,g,p){super(e,i,r,l,c,h,d,g,p),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Vx extends qn{constructor(e,i,r=Jr,l,c,h,d=Ii,g=Ii,p,_=yl,m=1){if(_!==yl&&_!==Sl)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const x={width:e,height:i,depth:m};super(x,l,c,h,d,g,_,r,p),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Xp(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const i=super.toJSON(e);return this.compareFunction!==null&&(i.compareFunction=this.compareFunction),i}}class kx extends qn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Aa extends Yn{constructor(e=1,i=1,r=1,l=32,c=1,h=!1,d=0,g=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:i,height:r,radialSegments:l,heightSegments:c,openEnded:h,thetaStart:d,thetaLength:g};const p=this;l=Math.floor(l),c=Math.floor(c);const _=[],m=[],x=[],S=[];let E=0;const A=[],M=r/2;let y=0;N(),h===!1&&(e>0&&L(!0),i>0&&L(!1)),this.setIndex(_),this.setAttribute("position",new Je(m,3)),this.setAttribute("normal",new Je(x,3)),this.setAttribute("uv",new Je(S,2));function N(){const D=new et,F=new et;let I=0;const O=(i-e)/r;for(let H=0;H<=c;H++){const w=[],R=H/c,V=R*(i-e)+e;for(let $=0;$<=l;$++){const ft=$/l,gt=ft*g+d,lt=Math.sin(gt),j=Math.cos(gt);F.x=V*lt,F.y=-R*r+M,F.z=V*j,m.push(F.x,F.y,F.z),D.set(lt,O,j).normalize(),x.push(D.x,D.y,D.z),S.push(ft,1-R),w.push(E++)}A.push(w)}for(let H=0;H<l;H++)for(let w=0;w<c;w++){const R=A[w][H],V=A[w+1][H],$=A[w+1][H+1],ft=A[w][H+1];(e>0||w!==0)&&(_.push(R,V,ft),I+=3),(i>0||w!==c-1)&&(_.push(V,$,ft),I+=3)}p.addGroup(y,I,0),y+=I}function L(D){const F=E,I=new Te,O=new et;let H=0;const w=D===!0?e:i,R=D===!0?1:-1;for(let $=1;$<=l;$++)m.push(0,M*R,0),x.push(0,R,0),S.push(.5,.5),E++;const V=E;for(let $=0;$<=l;$++){const gt=$/l*g+d,lt=Math.cos(gt),j=Math.sin(gt);O.x=w*j,O.y=M*R,O.z=w*lt,m.push(O.x,O.y,O.z),x.push(0,R,0),I.x=lt*.5+.5,I.y=j*.5*R+.5,S.push(I.x,I.y),E++}for(let $=0;$<l;$++){const ft=F+$,gt=V+$;D===!0?_.push(gt,gt+1,ft):_.push(gt+1,gt,ft),H+=3}p.addGroup(y,H,D===!0?1:2),y+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Aa(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class _l extends Aa{constructor(e=1,i=1,r=32,l=1,c=!1,h=0,d=Math.PI*2){super(0,e,i,r,l,c,h,d),this.type="ConeGeometry",this.parameters={radius:e,height:i,radialSegments:r,heightSegments:l,openEnded:c,thetaStart:h,thetaLength:d}}static fromJSON(e){return new _l(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Lc extends Yn{constructor(e=[],i=[],r=1,l=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:i,radius:r,detail:l};const c=[],h=[];d(l),p(r),_(),this.setAttribute("position",new Je(c,3)),this.setAttribute("normal",new Je(c.slice(),3)),this.setAttribute("uv",new Je(h,2)),l===0?this.computeVertexNormals():this.normalizeNormals();function d(N){const L=new et,D=new et,F=new et;for(let I=0;I<i.length;I+=3)S(i[I+0],L),S(i[I+1],D),S(i[I+2],F),g(L,D,F,N)}function g(N,L,D,F){const I=F+1,O=[];for(let H=0;H<=I;H++){O[H]=[];const w=N.clone().lerp(D,H/I),R=L.clone().lerp(D,H/I),V=I-H;for(let $=0;$<=V;$++)$===0&&H===I?O[H][$]=w:O[H][$]=w.clone().lerp(R,$/V)}for(let H=0;H<I;H++)for(let w=0;w<2*(I-H)-1;w++){const R=Math.floor(w/2);w%2===0?(x(O[H][R+1]),x(O[H+1][R]),x(O[H][R])):(x(O[H][R+1]),x(O[H+1][R+1]),x(O[H+1][R]))}}function p(N){const L=new et;for(let D=0;D<c.length;D+=3)L.x=c[D+0],L.y=c[D+1],L.z=c[D+2],L.normalize().multiplyScalar(N),c[D+0]=L.x,c[D+1]=L.y,c[D+2]=L.z}function _(){const N=new et;for(let L=0;L<c.length;L+=3){N.x=c[L+0],N.y=c[L+1],N.z=c[L+2];const D=M(N)/2/Math.PI+.5,F=y(N)/Math.PI+.5;h.push(D,1-F)}E(),m()}function m(){for(let N=0;N<h.length;N+=6){const L=h[N+0],D=h[N+2],F=h[N+4],I=Math.max(L,D,F),O=Math.min(L,D,F);I>.9&&O<.1&&(L<.2&&(h[N+0]+=1),D<.2&&(h[N+2]+=1),F<.2&&(h[N+4]+=1))}}function x(N){c.push(N.x,N.y,N.z)}function S(N,L){const D=N*3;L.x=e[D+0],L.y=e[D+1],L.z=e[D+2]}function E(){const N=new et,L=new et,D=new et,F=new et,I=new Te,O=new Te,H=new Te;for(let w=0,R=0;w<c.length;w+=9,R+=6){N.set(c[w+0],c[w+1],c[w+2]),L.set(c[w+3],c[w+4],c[w+5]),D.set(c[w+6],c[w+7],c[w+8]),I.set(h[R+0],h[R+1]),O.set(h[R+2],h[R+3]),H.set(h[R+4],h[R+5]),F.copy(N).add(L).add(D).divideScalar(3);const V=M(F);A(I,R+0,N,V),A(O,R+2,L,V),A(H,R+4,D,V)}}function A(N,L,D,F){F<0&&N.x===1&&(h[L]=N.x-1),D.x===0&&D.z===0&&(h[L]=F/2/Math.PI+.5)}function M(N){return Math.atan2(N.z,-N.x)}function y(N){return Math.atan2(-N.y,Math.sqrt(N.x*N.x+N.z*N.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Lc(e.vertices,e.indices,e.radius,e.details)}}class Kp extends Lc{constructor(e=1,i=0){const r=(1+Math.sqrt(5))/2,l=1/r,c=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-l,-r,0,-l,r,0,l,-r,0,l,r,-l,-r,0,-l,r,0,l,-r,0,l,r,0,-r,0,-l,r,0,-l,-r,0,l,r,0,l],h=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(c,h,e,i),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:i}}static fromJSON(e){return new Kp(e.radius,e.detail)}}class no extends Lc{constructor(e=1,i=0){const r=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],l=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(r,l,e,i),this.type="OctahedronGeometry",this.parameters={radius:e,detail:i}}static fromJSON(e){return new no(e.radius,e.detail)}}class fo extends Yn{constructor(e=1,i=1,r=1,l=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:i,widthSegments:r,heightSegments:l};const c=e/2,h=i/2,d=Math.floor(r),g=Math.floor(l),p=d+1,_=g+1,m=e/d,x=i/g,S=[],E=[],A=[],M=[];for(let y=0;y<_;y++){const N=y*x-h;for(let L=0;L<p;L++){const D=L*m-c;E.push(D,-N,0),A.push(0,0,1),M.push(L/d),M.push(1-y/g)}}for(let y=0;y<g;y++)for(let N=0;N<d;N++){const L=N+p*y,D=N+p*(y+1),F=N+1+p*(y+1),I=N+1+p*y;S.push(L,D,I),S.push(D,F,I)}this.setIndex(S),this.setAttribute("position",new Je(E,3)),this.setAttribute("normal",new Je(A,3)),this.setAttribute("uv",new Je(M,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fo(e.width,e.height,e.widthSegments,e.heightSegments)}}class wc extends Yn{constructor(e=.5,i=1,r=32,l=1,c=0,h=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:i,thetaSegments:r,phiSegments:l,thetaStart:c,thetaLength:h},r=Math.max(3,r),l=Math.max(1,l);const d=[],g=[],p=[],_=[];let m=e;const x=(i-e)/l,S=new et,E=new Te;for(let A=0;A<=l;A++){for(let M=0;M<=r;M++){const y=c+M/r*h;S.x=m*Math.cos(y),S.y=m*Math.sin(y),g.push(S.x,S.y,S.z),p.push(0,0,1),E.x=(S.x/i+1)/2,E.y=(S.y/i+1)/2,_.push(E.x,E.y)}m+=x}for(let A=0;A<l;A++){const M=A*(r+1);for(let y=0;y<r;y++){const N=y+M,L=N,D=N+r+1,F=N+r+2,I=N+1;d.push(L,D,I),d.push(D,F,I)}}this.setIndex(d),this.setAttribute("position",new Je(g,3)),this.setAttribute("normal",new Je(p,3)),this.setAttribute("uv",new Je(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new wc(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class Qp extends Yn{constructor(e=1,i=32,r=16,l=0,c=Math.PI*2,h=0,d=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:i,heightSegments:r,phiStart:l,phiLength:c,thetaStart:h,thetaLength:d},i=Math.max(3,Math.floor(i)),r=Math.max(2,Math.floor(r));const g=Math.min(h+d,Math.PI);let p=0;const _=[],m=new et,x=new et,S=[],E=[],A=[],M=[];for(let y=0;y<=r;y++){const N=[],L=y/r;let D=0;y===0&&h===0?D=.5/i:y===r&&g===Math.PI&&(D=-.5/i);for(let F=0;F<=i;F++){const I=F/i;m.x=-e*Math.cos(l+I*c)*Math.sin(h+L*d),m.y=e*Math.cos(h+L*d),m.z=e*Math.sin(l+I*c)*Math.sin(h+L*d),E.push(m.x,m.y,m.z),x.copy(m).normalize(),A.push(x.x,x.y,x.z),M.push(I+D,1-L),N.push(p++)}_.push(N)}for(let y=0;y<r;y++)for(let N=0;N<i;N++){const L=_[y][N+1],D=_[y][N],F=_[y+1][N],I=_[y+1][N+1];(y!==0||h>0)&&S.push(L,D,I),(y!==r-1||g<Math.PI)&&S.push(D,F,I)}this.setIndex(S),this.setAttribute("position",new Je(E,3)),this.setAttribute("normal",new Je(A,3)),this.setAttribute("uv",new Je(M,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Qp(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Dc extends Yn{constructor(e=1,i=.4,r=12,l=48,c=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:i,radialSegments:r,tubularSegments:l,arc:c},r=Math.floor(r),l=Math.floor(l);const h=[],d=[],g=[],p=[],_=new et,m=new et,x=new et;for(let S=0;S<=r;S++)for(let E=0;E<=l;E++){const A=E/l*c,M=S/r*Math.PI*2;m.x=(e+i*Math.cos(M))*Math.cos(A),m.y=(e+i*Math.cos(M))*Math.sin(A),m.z=i*Math.sin(M),d.push(m.x,m.y,m.z),_.x=e*Math.cos(A),_.y=e*Math.sin(A),x.subVectors(m,_).normalize(),g.push(x.x,x.y,x.z),p.push(E/l),p.push(S/r)}for(let S=1;S<=r;S++)for(let E=1;E<=l;E++){const A=(l+1)*S+E-1,M=(l+1)*(S-1)+E-1,y=(l+1)*(S-1)+E,N=(l+1)*S+E;h.push(A,M,N),h.push(M,y,N)}this.setIndex(h),this.setAttribute("position",new Je(d,3)),this.setAttribute("normal",new Je(g,3)),this.setAttribute("uv",new Je(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Dc(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class ET extends mo{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new we(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new we(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Nx,this.normalScale=new Te(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ia,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class TT extends mo{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=xE,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class bT extends mo{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Xx extends An{constructor(e,i=1){super(),this.isLight=!0,this.type="Light",this.color=new we(e),this.intensity=i}dispose(){}copy(e,i){return super.copy(e,i),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const i=super.toJSON(e);return i.object.color=this.color.getHex(),i.object.intensity=this.intensity,this.groundColor!==void 0&&(i.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(i.object.distance=this.distance),this.angle!==void 0&&(i.object.angle=this.angle),this.decay!==void 0&&(i.object.decay=this.decay),this.penumbra!==void 0&&(i.object.penumbra=this.penumbra),this.shadow!==void 0&&(i.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(i.object.target=this.target.uuid),i}}class AT extends Xx{constructor(e,i,r){super(e,r),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(An.DEFAULT_UP),this.updateMatrix(),this.groundColor=new we(i)}copy(e,i){return super.copy(e,i),this.groundColor.copy(e.groundColor),this}}const Bd=new an,qv=new et,Yv=new et;class RT{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Te(512,512),this.mapType=na,this.map=null,this.mapPass=null,this.matrix=new an,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Wp,this._frameExtents=new Te(1,1),this._viewportCount=1,this._viewports=[new ln(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const i=this.camera,r=this.matrix;qv.setFromMatrixPosition(e.matrixWorld),i.position.copy(qv),Yv.setFromMatrixPosition(e.target.matrixWorld),i.lookAt(Yv),i.updateMatrixWorld(),Bd.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Bd,i.coordinateSystem,i.reversedDepth),i.reversedDepth?r.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(Bd)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class qx extends Hx{constructor(e=-1,i=1,r=1,l=-1,c=.1,h=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=i,this.top=r,this.bottom=l,this.near=c,this.far=h,this.updateProjectionMatrix()}copy(e,i){return super.copy(e,i),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,i,r,l,c,h){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=i,this.view.offsetX=r,this.view.offsetY=l,this.view.width=c,this.view.height=h,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),i=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,l=(this.top+this.bottom)/2;let c=r-e,h=r+e,d=l+i,g=l-i;if(this.view!==null&&this.view.enabled){const p=(this.right-this.left)/this.view.fullWidth/this.zoom,_=(this.top-this.bottom)/this.view.fullHeight/this.zoom;c+=p*this.view.offsetX,h=c+p*this.view.width,d-=_*this.view.offsetY,g=d-_*this.view.height}this.projectionMatrix.makeOrthographic(c,h,d,g,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const i=super.toJSON(e);return i.object.zoom=this.zoom,i.object.left=this.left,i.object.right=this.right,i.object.top=this.top,i.object.bottom=this.bottom,i.object.near=this.near,i.object.far=this.far,this.view!==null&&(i.object.view=Object.assign({},this.view)),i}}class CT extends RT{constructor(){super(new qx(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wT extends Xx{constructor(e,i){super(e,i),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(An.DEFAULT_UP),this.updateMatrix(),this.target=new An,this.shadow=new CT}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class DT extends Ei{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const jv=new an;class UT{constructor(e,i,r=0,l=1/0){this.ray=new qp(e,i),this.near=r,this.far=l,this.camera=null,this.layers=new Yp,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,i){this.ray.set(e,i)}setFromCamera(e,i){i.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(i.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(i).sub(this.ray.origin).normalize(),this.camera=i):i.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(i.near+i.far)/(i.near-i.far)).unproject(i),this.ray.direction.set(0,0,-1).transformDirection(i.matrixWorld),this.camera=i):console.error("THREE.Raycaster: Unsupported camera type: "+i.type)}setFromXRController(e){return jv.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(jv),this}intersectObject(e,i=!0,r=[]){return Lp(e,this,r,i),r.sort(Wv),r}intersectObjects(e,i=!0,r=[]){for(let l=0,c=e.length;l<c;l++)Lp(e[l],this,r,i);return r.sort(Wv),r}}function Wv(o,e){return o.distance-e.distance}function Lp(o,e,i,r){let l=!0;if(o.layers.test(e.layers)&&o.raycast(e,i)===!1&&(l=!1),l===!0&&r===!0){const c=o.children;for(let h=0,d=c.length;h<d;h++)Lp(c[h],e,i,!0)}}class NT extends ST{constructor(e=10,i=10,r=4473924,l=8947848){r=new we(r),l=new we(l);const c=i/2,h=e/i,d=e/2,g=[],p=[];for(let x=0,S=0,E=-d;x<=i;x++,E+=h){g.push(-d,0,E,d,0,E),g.push(E,0,-d,E,0,d);const A=x===c?r:l;A.toArray(p,S),S+=3,A.toArray(p,S),S+=3,A.toArray(p,S),S+=3,A.toArray(p,S),S+=3}const _=new Yn;_.setAttribute("position",new Je(g,3)),_.setAttribute("color",new Je(p,3));const m=new Zp({vertexColors:!0,toneMapped:!1});super(_,m),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}function Zv(o,e,i,r){const l=LT(r);switch(i){case Cx:return o*e;case Dx:return o*e/l.components*l.byteLength;case Hp:return o*e/l.components*l.byteLength;case Ux:return o*e*2/l.components*l.byteLength;case Gp:return o*e*2/l.components*l.byteLength;case wx:return o*e*3/l.components*l.byteLength;case Pi:return o*e*4/l.components*l.byteLength;case Vp:return o*e*4/l.components*l.byteLength;case xc:case yc:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case Sc:case Mc:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case rp:case op:return Math.max(o,16)*Math.max(e,8)/4;case ap:case sp:return Math.max(o,8)*Math.max(e,8)/2;case lp:case up:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case cp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case fp:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case hp:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case dp:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case pp:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case mp:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case gp:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case _p:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case vp:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case xp:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case yp:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case Sp:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case Mp:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case Ep:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case Tp:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case bp:case Ap:case Rp:return Math.ceil(o/4)*Math.ceil(e/4)*16;case Cp:case wp:return Math.ceil(o/4)*Math.ceil(e/4)*8;case Dp:case Up:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${i} format.`)}function LT(o){switch(o){case na:case Tx:return{byteLength:1,components:1};case vl:case bx:case Tl:return{byteLength:2,components:1};case Bp:case Fp:return{byteLength:2,components:4};case Jr:case Ip:case Ca:return{byteLength:4,components:1};case Ax:case Rx:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${o}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pp}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pp);function Yx(){let o=null,e=!1,i=null,r=null;function l(c,h){i(c,h),r=o.requestAnimationFrame(l)}return{start:function(){e!==!0&&i!==null&&(r=o.requestAnimationFrame(l),e=!0)},stop:function(){o.cancelAnimationFrame(r),e=!1},setAnimationLoop:function(c){i=c},setContext:function(c){o=c}}}function OT(o){const e=new WeakMap;function i(d,g){const p=d.array,_=d.usage,m=p.byteLength,x=o.createBuffer();o.bindBuffer(g,x),o.bufferData(g,p,_),d.onUploadCallback();let S;if(p instanceof Float32Array)S=o.FLOAT;else if(typeof Float16Array<"u"&&p instanceof Float16Array)S=o.HALF_FLOAT;else if(p instanceof Uint16Array)d.isFloat16BufferAttribute?S=o.HALF_FLOAT:S=o.UNSIGNED_SHORT;else if(p instanceof Int16Array)S=o.SHORT;else if(p instanceof Uint32Array)S=o.UNSIGNED_INT;else if(p instanceof Int32Array)S=o.INT;else if(p instanceof Int8Array)S=o.BYTE;else if(p instanceof Uint8Array)S=o.UNSIGNED_BYTE;else if(p instanceof Uint8ClampedArray)S=o.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+p);return{buffer:x,type:S,bytesPerElement:p.BYTES_PER_ELEMENT,version:d.version,size:m}}function r(d,g,p){const _=g.array,m=g.updateRanges;if(o.bindBuffer(p,d),m.length===0)o.bufferSubData(p,0,_);else{m.sort((S,E)=>S.start-E.start);let x=0;for(let S=1;S<m.length;S++){const E=m[x],A=m[S];A.start<=E.start+E.count+1?E.count=Math.max(E.count,A.start+A.count-E.start):(++x,m[x]=A)}m.length=x+1;for(let S=0,E=m.length;S<E;S++){const A=m[S];o.bufferSubData(p,A.start*_.BYTES_PER_ELEMENT,_,A.start,A.count)}g.clearUpdateRanges()}g.onUploadCallback()}function l(d){return d.isInterleavedBufferAttribute&&(d=d.data),e.get(d)}function c(d){d.isInterleavedBufferAttribute&&(d=d.data);const g=e.get(d);g&&(o.deleteBuffer(g.buffer),e.delete(d))}function h(d,g){if(d.isInterleavedBufferAttribute&&(d=d.data),d.isGLBufferAttribute){const _=e.get(d);(!_||_.version<d.version)&&e.set(d,{buffer:d.buffer,type:d.type,bytesPerElement:d.elementSize,version:d.version});return}const p=e.get(d);if(p===void 0)e.set(d,i(d,g));else if(p.version<d.version){if(p.size!==d.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(p.buffer,d,g),p.version=d.version}}return{get:l,remove:c,update:h}}var zT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,PT=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,IT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,BT=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,FT=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,HT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,GT=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,VT=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,kT=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,XT=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,qT=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,YT=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,jT=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,WT=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ZT=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,KT=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,QT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,JT=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,$T=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,t1=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,e1=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,n1=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,i1=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,a1=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,r1=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,s1=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,o1=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,l1=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,u1=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,c1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,f1="gl_FragColor = linearToOutputTexel( gl_FragColor );",h1=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,d1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,p1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,m1=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,g1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,_1=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,v1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,x1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,y1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,S1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,M1=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,E1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,T1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,b1=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,A1=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,R1=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,C1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,w1=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,D1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,U1=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,N1=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,L1=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,O1=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,z1=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,P1=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,I1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,B1=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,F1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,H1=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,G1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,V1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,k1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,X1=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,q1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Y1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,j1=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,W1=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Z1=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,K1=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Q1=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,J1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,$1=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,tb=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,eb=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,nb=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ib=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,ab=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,rb=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,sb=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ob=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,lb=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ub=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,cb=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,fb=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,hb=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,db=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,pb=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,mb=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,gb=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,_b=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,vb=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,xb=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,yb=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Sb=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Mb=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Eb=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Tb=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,bb=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Ab=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Rb=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Cb=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,wb=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Db=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ub=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Nb=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Lb=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Ob=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,zb=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ib=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fb=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hb=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Gb=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Vb=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,kb=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Xb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,qb=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yb=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jb=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Wb=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Zb=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kb=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qb=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jb=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,$b=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tA=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,eA=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,nA=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,iA=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,aA=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,rA=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sA=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,oA=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lA=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,uA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,cA=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fA=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,hA=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,dA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,_e={alphahash_fragment:zT,alphahash_pars_fragment:PT,alphamap_fragment:IT,alphamap_pars_fragment:BT,alphatest_fragment:FT,alphatest_pars_fragment:HT,aomap_fragment:GT,aomap_pars_fragment:VT,batching_pars_vertex:kT,batching_vertex:XT,begin_vertex:qT,beginnormal_vertex:YT,bsdfs:jT,iridescence_fragment:WT,bumpmap_pars_fragment:ZT,clipping_planes_fragment:KT,clipping_planes_pars_fragment:QT,clipping_planes_pars_vertex:JT,clipping_planes_vertex:$T,color_fragment:t1,color_pars_fragment:e1,color_pars_vertex:n1,color_vertex:i1,common:a1,cube_uv_reflection_fragment:r1,defaultnormal_vertex:s1,displacementmap_pars_vertex:o1,displacementmap_vertex:l1,emissivemap_fragment:u1,emissivemap_pars_fragment:c1,colorspace_fragment:f1,colorspace_pars_fragment:h1,envmap_fragment:d1,envmap_common_pars_fragment:p1,envmap_pars_fragment:m1,envmap_pars_vertex:g1,envmap_physical_pars_fragment:R1,envmap_vertex:_1,fog_vertex:v1,fog_pars_vertex:x1,fog_fragment:y1,fog_pars_fragment:S1,gradientmap_pars_fragment:M1,lightmap_pars_fragment:E1,lights_lambert_fragment:T1,lights_lambert_pars_fragment:b1,lights_pars_begin:A1,lights_toon_fragment:C1,lights_toon_pars_fragment:w1,lights_phong_fragment:D1,lights_phong_pars_fragment:U1,lights_physical_fragment:N1,lights_physical_pars_fragment:L1,lights_fragment_begin:O1,lights_fragment_maps:z1,lights_fragment_end:P1,logdepthbuf_fragment:I1,logdepthbuf_pars_fragment:B1,logdepthbuf_pars_vertex:F1,logdepthbuf_vertex:H1,map_fragment:G1,map_pars_fragment:V1,map_particle_fragment:k1,map_particle_pars_fragment:X1,metalnessmap_fragment:q1,metalnessmap_pars_fragment:Y1,morphinstance_vertex:j1,morphcolor_vertex:W1,morphnormal_vertex:Z1,morphtarget_pars_vertex:K1,morphtarget_vertex:Q1,normal_fragment_begin:J1,normal_fragment_maps:$1,normal_pars_fragment:tb,normal_pars_vertex:eb,normal_vertex:nb,normalmap_pars_fragment:ib,clearcoat_normal_fragment_begin:ab,clearcoat_normal_fragment_maps:rb,clearcoat_pars_fragment:sb,iridescence_pars_fragment:ob,opaque_fragment:lb,packing:ub,premultiplied_alpha_fragment:cb,project_vertex:fb,dithering_fragment:hb,dithering_pars_fragment:db,roughnessmap_fragment:pb,roughnessmap_pars_fragment:mb,shadowmap_pars_fragment:gb,shadowmap_pars_vertex:_b,shadowmap_vertex:vb,shadowmask_pars_fragment:xb,skinbase_vertex:yb,skinning_pars_vertex:Sb,skinning_vertex:Mb,skinnormal_vertex:Eb,specularmap_fragment:Tb,specularmap_pars_fragment:bb,tonemapping_fragment:Ab,tonemapping_pars_fragment:Rb,transmission_fragment:Cb,transmission_pars_fragment:wb,uv_pars_fragment:Db,uv_pars_vertex:Ub,uv_vertex:Nb,worldpos_vertex:Lb,background_vert:Ob,background_frag:zb,backgroundCube_vert:Pb,backgroundCube_frag:Ib,cube_vert:Bb,cube_frag:Fb,depth_vert:Hb,depth_frag:Gb,distanceRGBA_vert:Vb,distanceRGBA_frag:kb,equirect_vert:Xb,equirect_frag:qb,linedashed_vert:Yb,linedashed_frag:jb,meshbasic_vert:Wb,meshbasic_frag:Zb,meshlambert_vert:Kb,meshlambert_frag:Qb,meshmatcap_vert:Jb,meshmatcap_frag:$b,meshnormal_vert:tA,meshnormal_frag:eA,meshphong_vert:nA,meshphong_frag:iA,meshphysical_vert:aA,meshphysical_frag:rA,meshtoon_vert:sA,meshtoon_frag:oA,points_vert:lA,points_frag:uA,shadow_vert:cA,shadow_frag:fA,sprite_vert:hA,sprite_frag:dA},Ft={common:{diffuse:{value:new we(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ge},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ge}},envmap:{envMap:{value:null},envMapRotation:{value:new ge},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ge},normalScale:{value:new Te(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new we(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new we(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0},uvTransform:{value:new ge}},sprite:{diffuse:{value:new we(16777215)},opacity:{value:1},center:{value:new Te(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ge},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0}}},Ji={basic:{uniforms:Xn([Ft.common,Ft.specularmap,Ft.envmap,Ft.aomap,Ft.lightmap,Ft.fog]),vertexShader:_e.meshbasic_vert,fragmentShader:_e.meshbasic_frag},lambert:{uniforms:Xn([Ft.common,Ft.specularmap,Ft.envmap,Ft.aomap,Ft.lightmap,Ft.emissivemap,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,Ft.fog,Ft.lights,{emissive:{value:new we(0)}}]),vertexShader:_e.meshlambert_vert,fragmentShader:_e.meshlambert_frag},phong:{uniforms:Xn([Ft.common,Ft.specularmap,Ft.envmap,Ft.aomap,Ft.lightmap,Ft.emissivemap,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,Ft.fog,Ft.lights,{emissive:{value:new we(0)},specular:{value:new we(1118481)},shininess:{value:30}}]),vertexShader:_e.meshphong_vert,fragmentShader:_e.meshphong_frag},standard:{uniforms:Xn([Ft.common,Ft.envmap,Ft.aomap,Ft.lightmap,Ft.emissivemap,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,Ft.roughnessmap,Ft.metalnessmap,Ft.fog,Ft.lights,{emissive:{value:new we(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag},toon:{uniforms:Xn([Ft.common,Ft.aomap,Ft.lightmap,Ft.emissivemap,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,Ft.gradientmap,Ft.fog,Ft.lights,{emissive:{value:new we(0)}}]),vertexShader:_e.meshtoon_vert,fragmentShader:_e.meshtoon_frag},matcap:{uniforms:Xn([Ft.common,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,Ft.fog,{matcap:{value:null}}]),vertexShader:_e.meshmatcap_vert,fragmentShader:_e.meshmatcap_frag},points:{uniforms:Xn([Ft.points,Ft.fog]),vertexShader:_e.points_vert,fragmentShader:_e.points_frag},dashed:{uniforms:Xn([Ft.common,Ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:_e.linedashed_vert,fragmentShader:_e.linedashed_frag},depth:{uniforms:Xn([Ft.common,Ft.displacementmap]),vertexShader:_e.depth_vert,fragmentShader:_e.depth_frag},normal:{uniforms:Xn([Ft.common,Ft.bumpmap,Ft.normalmap,Ft.displacementmap,{opacity:{value:1}}]),vertexShader:_e.meshnormal_vert,fragmentShader:_e.meshnormal_frag},sprite:{uniforms:Xn([Ft.sprite,Ft.fog]),vertexShader:_e.sprite_vert,fragmentShader:_e.sprite_frag},background:{uniforms:{uvTransform:{value:new ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:_e.background_vert,fragmentShader:_e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ge}},vertexShader:_e.backgroundCube_vert,fragmentShader:_e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:_e.cube_vert,fragmentShader:_e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:_e.equirect_vert,fragmentShader:_e.equirect_frag},distanceRGBA:{uniforms:Xn([Ft.common,Ft.displacementmap,{referencePosition:{value:new et},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:_e.distanceRGBA_vert,fragmentShader:_e.distanceRGBA_frag},shadow:{uniforms:Xn([Ft.lights,Ft.fog,{color:{value:new we(0)},opacity:{value:1}}]),vertexShader:_e.shadow_vert,fragmentShader:_e.shadow_frag}};Ji.physical={uniforms:Xn([Ji.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ge},clearcoatNormalScale:{value:new Te(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ge},sheen:{value:0},sheenColor:{value:new we(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ge},transmissionSamplerSize:{value:new Te},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ge},attenuationDistance:{value:0},attenuationColor:{value:new we(0)},specularColor:{value:new we(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ge},anisotropyVector:{value:new Te},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ge}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag};const gc={r:0,b:0,g:0},Xr=new ia,pA=new an;function mA(o,e,i,r,l,c,h){const d=new we(0);let g=c===!0?0:1,p,_,m=null,x=0,S=null;function E(L){let D=L.isScene===!0?L.background:null;return D&&D.isTexture&&(D=(L.backgroundBlurriness>0?i:e).get(D)),D}function A(L){let D=!1;const F=E(L);F===null?y(d,g):F&&F.isColor&&(y(F,1),D=!0);const I=o.xr.getEnvironmentBlendMode();I==="additive"?r.buffers.color.setClear(0,0,0,1,h):I==="alpha-blend"&&r.buffers.color.setClear(0,0,0,0,h),(o.autoClear||D)&&(r.buffers.depth.setTest(!0),r.buffers.depth.setMask(!0),r.buffers.color.setMask(!0),o.clear(o.autoClearColor,o.autoClearDepth,o.autoClearStencil))}function M(L,D){const F=E(D);F&&(F.isCubeTexture||F.mapping===Uc)?(_===void 0&&(_=new cn(new Jn(1,1,1),new mr({name:"BackgroundCubeMaterial",uniforms:co(Ji.backgroundCube.uniforms),vertexShader:Ji.backgroundCube.vertexShader,fragmentShader:Ji.backgroundCube.fragmentShader,side:$n,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),_.geometry.deleteAttribute("normal"),_.geometry.deleteAttribute("uv"),_.onBeforeRender=function(I,O,H){this.matrixWorld.copyPosition(H.matrixWorld)},Object.defineProperty(_.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),l.update(_)),Xr.copy(D.backgroundRotation),Xr.x*=-1,Xr.y*=-1,Xr.z*=-1,F.isCubeTexture&&F.isRenderTargetTexture===!1&&(Xr.y*=-1,Xr.z*=-1),_.material.uniforms.envMap.value=F,_.material.uniforms.flipEnvMap.value=F.isCubeTexture&&F.isRenderTargetTexture===!1?-1:1,_.material.uniforms.backgroundBlurriness.value=D.backgroundBlurriness,_.material.uniforms.backgroundIntensity.value=D.backgroundIntensity,_.material.uniforms.backgroundRotation.value.setFromMatrix4(pA.makeRotationFromEuler(Xr)),_.material.toneMapped=Oe.getTransfer(F.colorSpace)!==je,(m!==F||x!==F.version||S!==o.toneMapping)&&(_.material.needsUpdate=!0,m=F,x=F.version,S=o.toneMapping),_.layers.enableAll(),L.unshift(_,_.geometry,_.material,0,0,null)):F&&F.isTexture&&(p===void 0&&(p=new cn(new fo(2,2),new mr({name:"BackgroundMaterial",uniforms:co(Ji.background.uniforms),vertexShader:Ji.background.vertexShader,fragmentShader:Ji.background.fragmentShader,side:pr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),p.geometry.deleteAttribute("normal"),Object.defineProperty(p.material,"map",{get:function(){return this.uniforms.t2D.value}}),l.update(p)),p.material.uniforms.t2D.value=F,p.material.uniforms.backgroundIntensity.value=D.backgroundIntensity,p.material.toneMapped=Oe.getTransfer(F.colorSpace)!==je,F.matrixAutoUpdate===!0&&F.updateMatrix(),p.material.uniforms.uvTransform.value.copy(F.matrix),(m!==F||x!==F.version||S!==o.toneMapping)&&(p.material.needsUpdate=!0,m=F,x=F.version,S=o.toneMapping),p.layers.enableAll(),L.unshift(p,p.geometry,p.material,0,0,null))}function y(L,D){L.getRGB(gc,Fx(o)),r.buffers.color.setClear(gc.r,gc.g,gc.b,D,h)}function N(){_!==void 0&&(_.geometry.dispose(),_.material.dispose(),_=void 0),p!==void 0&&(p.geometry.dispose(),p.material.dispose(),p=void 0)}return{getClearColor:function(){return d},setClearColor:function(L,D=1){d.set(L),g=D,y(d,g)},getClearAlpha:function(){return g},setClearAlpha:function(L){g=L,y(d,g)},render:A,addToRenderList:M,dispose:N}}function gA(o,e){const i=o.getParameter(o.MAX_VERTEX_ATTRIBS),r={},l=x(null);let c=l,h=!1;function d(R,V,$,ft,gt){let lt=!1;const j=m(ft,$,V);c!==j&&(c=j,p(c.object)),lt=S(R,ft,$,gt),lt&&E(R,ft,$,gt),gt!==null&&e.update(gt,o.ELEMENT_ARRAY_BUFFER),(lt||h)&&(h=!1,D(R,V,$,ft),gt!==null&&o.bindBuffer(o.ELEMENT_ARRAY_BUFFER,e.get(gt).buffer))}function g(){return o.createVertexArray()}function p(R){return o.bindVertexArray(R)}function _(R){return o.deleteVertexArray(R)}function m(R,V,$){const ft=$.wireframe===!0;let gt=r[R.id];gt===void 0&&(gt={},r[R.id]=gt);let lt=gt[V.id];lt===void 0&&(lt={},gt[V.id]=lt);let j=lt[ft];return j===void 0&&(j=x(g()),lt[ft]=j),j}function x(R){const V=[],$=[],ft=[];for(let gt=0;gt<i;gt++)V[gt]=0,$[gt]=0,ft[gt]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:V,enabledAttributes:$,attributeDivisors:ft,object:R,attributes:{},index:null}}function S(R,V,$,ft){const gt=c.attributes,lt=V.attributes;let j=0;const ot=$.getAttributes();for(const Q in ot)if(ot[Q].location>=0){const xt=gt[Q];let Gt=lt[Q];if(Gt===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(Gt=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(Gt=R.instanceColor)),xt===void 0||xt.attribute!==Gt||Gt&&xt.data!==Gt.data)return!0;j++}return c.attributesNum!==j||c.index!==ft}function E(R,V,$,ft){const gt={},lt=V.attributes;let j=0;const ot=$.getAttributes();for(const Q in ot)if(ot[Q].location>=0){let xt=lt[Q];xt===void 0&&(Q==="instanceMatrix"&&R.instanceMatrix&&(xt=R.instanceMatrix),Q==="instanceColor"&&R.instanceColor&&(xt=R.instanceColor));const Gt={};Gt.attribute=xt,xt&&xt.data&&(Gt.data=xt.data),gt[Q]=Gt,j++}c.attributes=gt,c.attributesNum=j,c.index=ft}function A(){const R=c.newAttributes;for(let V=0,$=R.length;V<$;V++)R[V]=0}function M(R){y(R,0)}function y(R,V){const $=c.newAttributes,ft=c.enabledAttributes,gt=c.attributeDivisors;$[R]=1,ft[R]===0&&(o.enableVertexAttribArray(R),ft[R]=1),gt[R]!==V&&(o.vertexAttribDivisor(R,V),gt[R]=V)}function N(){const R=c.newAttributes,V=c.enabledAttributes;for(let $=0,ft=V.length;$<ft;$++)V[$]!==R[$]&&(o.disableVertexAttribArray($),V[$]=0)}function L(R,V,$,ft,gt,lt,j){j===!0?o.vertexAttribIPointer(R,V,$,gt,lt):o.vertexAttribPointer(R,V,$,ft,gt,lt)}function D(R,V,$,ft){A();const gt=ft.attributes,lt=$.getAttributes(),j=V.defaultAttributeValues;for(const ot in lt){const Q=lt[ot];if(Q.location>=0){let St=gt[ot];if(St===void 0&&(ot==="instanceMatrix"&&R.instanceMatrix&&(St=R.instanceMatrix),ot==="instanceColor"&&R.instanceColor&&(St=R.instanceColor)),St!==void 0){const xt=St.normalized,Gt=St.itemSize,ne=e.get(St);if(ne===void 0)continue;const ye=ne.buffer,P=ne.type,ht=ne.bytesPerElement,Y=P===o.INT||P===o.UNSIGNED_INT||St.gpuType===Ip;if(St.isInterleavedBufferAttribute){const rt=St.data,bt=rt.stride,Ot=St.offset;if(rt.isInstancedInterleavedBuffer){for(let Dt=0;Dt<Q.locationSize;Dt++)y(Q.location+Dt,rt.meshPerAttribute);R.isInstancedMesh!==!0&&ft._maxInstanceCount===void 0&&(ft._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let Dt=0;Dt<Q.locationSize;Dt++)M(Q.location+Dt);o.bindBuffer(o.ARRAY_BUFFER,ye);for(let Dt=0;Dt<Q.locationSize;Dt++)L(Q.location+Dt,Gt/Q.locationSize,P,xt,bt*ht,(Ot+Gt/Q.locationSize*Dt)*ht,Y)}else{if(St.isInstancedBufferAttribute){for(let rt=0;rt<Q.locationSize;rt++)y(Q.location+rt,St.meshPerAttribute);R.isInstancedMesh!==!0&&ft._maxInstanceCount===void 0&&(ft._maxInstanceCount=St.meshPerAttribute*St.count)}else for(let rt=0;rt<Q.locationSize;rt++)M(Q.location+rt);o.bindBuffer(o.ARRAY_BUFFER,ye);for(let rt=0;rt<Q.locationSize;rt++)L(Q.location+rt,Gt/Q.locationSize,P,xt,Gt*ht,Gt/Q.locationSize*rt*ht,Y)}}else if(j!==void 0){const xt=j[ot];if(xt!==void 0)switch(xt.length){case 2:o.vertexAttrib2fv(Q.location,xt);break;case 3:o.vertexAttrib3fv(Q.location,xt);break;case 4:o.vertexAttrib4fv(Q.location,xt);break;default:o.vertexAttrib1fv(Q.location,xt)}}}}N()}function F(){H();for(const R in r){const V=r[R];for(const $ in V){const ft=V[$];for(const gt in ft)_(ft[gt].object),delete ft[gt];delete V[$]}delete r[R]}}function I(R){if(r[R.id]===void 0)return;const V=r[R.id];for(const $ in V){const ft=V[$];for(const gt in ft)_(ft[gt].object),delete ft[gt];delete V[$]}delete r[R.id]}function O(R){for(const V in r){const $=r[V];if($[R.id]===void 0)continue;const ft=$[R.id];for(const gt in ft)_(ft[gt].object),delete ft[gt];delete $[R.id]}}function H(){w(),h=!0,c!==l&&(c=l,p(c.object))}function w(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:H,resetDefaultState:w,dispose:F,releaseStatesOfGeometry:I,releaseStatesOfProgram:O,initAttributes:A,enableAttribute:M,disableUnusedAttributes:N}}function _A(o,e,i){let r;function l(p){r=p}function c(p,_){o.drawArrays(r,p,_),i.update(_,r,1)}function h(p,_,m){m!==0&&(o.drawArraysInstanced(r,p,_,m),i.update(_,r,m))}function d(p,_,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(r,p,0,_,0,m);let S=0;for(let E=0;E<m;E++)S+=_[E];i.update(S,r,1)}function g(p,_,m,x){if(m===0)return;const S=e.get("WEBGL_multi_draw");if(S===null)for(let E=0;E<p.length;E++)h(p[E],_[E],x[E]);else{S.multiDrawArraysInstancedWEBGL(r,p,0,_,0,x,0,m);let E=0;for(let A=0;A<m;A++)E+=_[A]*x[A];i.update(E,r,1)}}this.setMode=l,this.render=c,this.renderInstances=h,this.renderMultiDraw=d,this.renderMultiDrawInstances=g}function vA(o,e,i,r){let l;function c(){if(l!==void 0)return l;if(e.has("EXT_texture_filter_anisotropic")===!0){const O=e.get("EXT_texture_filter_anisotropic");l=o.getParameter(O.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else l=0;return l}function h(O){return!(O!==Pi&&r.convert(O)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_FORMAT))}function d(O){const H=O===Tl&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(O!==na&&r.convert(O)!==o.getParameter(o.IMPLEMENTATION_COLOR_READ_TYPE)&&O!==Ca&&!H)}function g(O){if(O==="highp"){if(o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.HIGH_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision>0)return"highp";O="mediump"}return O==="mediump"&&o.getShaderPrecisionFormat(o.VERTEX_SHADER,o.MEDIUM_FLOAT).precision>0&&o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let p=i.precision!==void 0?i.precision:"highp";const _=g(p);_!==p&&(console.warn("THREE.WebGLRenderer:",p,"not supported, using",_,"instead."),p=_);const m=i.logarithmicDepthBuffer===!0,x=i.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),S=o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS),E=o.getParameter(o.MAX_VERTEX_TEXTURE_IMAGE_UNITS),A=o.getParameter(o.MAX_TEXTURE_SIZE),M=o.getParameter(o.MAX_CUBE_MAP_TEXTURE_SIZE),y=o.getParameter(o.MAX_VERTEX_ATTRIBS),N=o.getParameter(o.MAX_VERTEX_UNIFORM_VECTORS),L=o.getParameter(o.MAX_VARYING_VECTORS),D=o.getParameter(o.MAX_FRAGMENT_UNIFORM_VECTORS),F=E>0,I=o.getParameter(o.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:c,getMaxPrecision:g,textureFormatReadable:h,textureTypeReadable:d,precision:p,logarithmicDepthBuffer:m,reversedDepthBuffer:x,maxTextures:S,maxVertexTextures:E,maxTextureSize:A,maxCubemapSize:M,maxAttributes:y,maxVertexUniforms:N,maxVaryings:L,maxFragmentUniforms:D,vertexTextures:F,maxSamples:I}}function xA(o){const e=this;let i=null,r=0,l=!1,c=!1;const h=new cr,d=new ge,g={value:null,needsUpdate:!1};this.uniform=g,this.numPlanes=0,this.numIntersection=0,this.init=function(m,x){const S=m.length!==0||x||r!==0||l;return l=x,r=m.length,S},this.beginShadows=function(){c=!0,_(null)},this.endShadows=function(){c=!1},this.setGlobalState=function(m,x){i=_(m,x,0)},this.setState=function(m,x,S){const E=m.clippingPlanes,A=m.clipIntersection,M=m.clipShadows,y=o.get(m);if(!l||E===null||E.length===0||c&&!M)c?_(null):p();else{const N=c?0:r,L=N*4;let D=y.clippingState||null;g.value=D,D=_(E,x,L,S);for(let F=0;F!==L;++F)D[F]=i[F];y.clippingState=D,this.numIntersection=A?this.numPlanes:0,this.numPlanes+=N}};function p(){g.value!==i&&(g.value=i,g.needsUpdate=r>0),e.numPlanes=r,e.numIntersection=0}function _(m,x,S,E){const A=m!==null?m.length:0;let M=null;if(A!==0){if(M=g.value,E!==!0||M===null){const y=S+A*4,N=x.matrixWorldInverse;d.getNormalMatrix(N),(M===null||M.length<y)&&(M=new Float32Array(y));for(let L=0,D=S;L!==A;++L,D+=4)h.copy(m[L]).applyMatrix4(N,d),h.normal.toArray(M,D),M[D+3]=h.constant}g.value=M,g.needsUpdate=!0}return e.numPlanes=A,e.numIntersection=0,M}}function yA(o){let e=new WeakMap;function i(h,d){return d===tp?h.mapping=oo:d===ep&&(h.mapping=lo),h}function r(h){if(h&&h.isTexture){const d=h.mapping;if(d===tp||d===ep)if(e.has(h)){const g=e.get(h).texture;return i(g,h.mapping)}else{const g=h.image;if(g&&g.height>0){const p=new mT(g.height);return p.fromEquirectangularTexture(o,h),e.set(h,p),h.addEventListener("dispose",l),i(p.texture,h.mapping)}else return null}}return h}function l(h){const d=h.target;d.removeEventListener("dispose",l);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function c(){e=new WeakMap}return{get:r,dispose:c}}const io=4,Kv=[.125,.215,.35,.446,.526,.582],Zr=20,Fd=new qx,Qv=new we;let Hd=null,Gd=0,Vd=0,kd=!1;const Yr=(1+Math.sqrt(5))/2,$s=1/Yr,Jv=[new et(-Yr,$s,0),new et(Yr,$s,0),new et(-$s,0,Yr),new et($s,0,Yr),new et(0,Yr,-$s),new et(0,Yr,$s),new et(-1,1,-1),new et(1,1,-1),new et(-1,1,1),new et(1,1,1)],SA=new et;class $v{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,i=0,r=.1,l=100,c={}){const{size:h=256,position:d=SA}=c;Hd=this._renderer.getRenderTarget(),Gd=this._renderer.getActiveCubeFace(),Vd=this._renderer.getActiveMipmapLevel(),kd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(h);const g=this._allocateTargets();return g.depthBuffer=!0,this._sceneToCubeUV(e,r,l,g,d),i>0&&this._blur(g,0,0,i),this._applyPMREM(g),this._cleanup(g),g}fromEquirectangular(e,i=null){return this._fromTexture(e,i)}fromCubemap(e,i=null){return this._fromTexture(e,i)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=nx(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ex(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Hd,Gd,Vd),this._renderer.xr.enabled=kd,e.scissorTest=!1,_c(e,0,0,e.width,e.height)}_fromTexture(e,i){e.mapping===oo||e.mapping===lo?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Hd=this._renderer.getRenderTarget(),Gd=this._renderer.getActiveCubeFace(),Vd=this._renderer.getActiveMipmapLevel(),kd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const r=i||this._allocateTargets();return this._textureToCubeUV(e,r),this._applyPMREM(r),this._cleanup(r),r}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),i=4*this._cubeSize,r={magFilter:zi,minFilter:zi,generateMipmaps:!1,type:Tl,format:Pi,colorSpace:uo,depthBuffer:!1},l=tx(e,i,r);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==i){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=tx(e,i,r);const{_lodMax:c}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=MA(c)),this._blurMaterial=EA(c,e,i)}return l}_compileMaterial(e){const i=new cn(this._lodPlanes[0],e);this._renderer.compile(i,Fd)}_sceneToCubeUV(e,i,r,l,c){const g=new Ei(90,1,i,r),p=[1,-1,1,1,1,1],_=[1,1,1,-1,-1,-1],m=this._renderer,x=m.autoClear,S=m.toneMapping;m.getClearColor(Qv),m.toneMapping=dr,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(l),m.clearDepth(),m.setRenderTarget(null));const A=new eo({name:"PMREM.Background",side:$n,depthWrite:!1,depthTest:!1}),M=new cn(new Jn,A);let y=!1;const N=e.background;N?N.isColor&&(A.color.copy(N),e.background=null,y=!0):(A.color.copy(Qv),y=!0);for(let L=0;L<6;L++){const D=L%3;D===0?(g.up.set(0,p[L],0),g.position.set(c.x,c.y,c.z),g.lookAt(c.x+_[L],c.y,c.z)):D===1?(g.up.set(0,0,p[L]),g.position.set(c.x,c.y,c.z),g.lookAt(c.x,c.y+_[L],c.z)):(g.up.set(0,p[L],0),g.position.set(c.x,c.y,c.z),g.lookAt(c.x,c.y,c.z+_[L]));const F=this._cubeSize;_c(l,D*F,L>2?F:0,F,F),m.setRenderTarget(l),y&&m.render(M,g),m.render(e,g)}M.geometry.dispose(),M.material.dispose(),m.toneMapping=S,m.autoClear=x,e.background=N}_textureToCubeUV(e,i){const r=this._renderer,l=e.mapping===oo||e.mapping===lo;l?(this._cubemapMaterial===null&&(this._cubemapMaterial=nx()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ex());const c=l?this._cubemapMaterial:this._equirectMaterial,h=new cn(this._lodPlanes[0],c),d=c.uniforms;d.envMap.value=e;const g=this._cubeSize;_c(i,0,0,3*g,2*g),r.setRenderTarget(i),r.render(h,Fd)}_applyPMREM(e){const i=this._renderer,r=i.autoClear;i.autoClear=!1;const l=this._lodPlanes.length;for(let c=1;c<l;c++){const h=Math.sqrt(this._sigmas[c]*this._sigmas[c]-this._sigmas[c-1]*this._sigmas[c-1]),d=Jv[(l-c-1)%Jv.length];this._blur(e,c-1,c,h,d)}i.autoClear=r}_blur(e,i,r,l,c){const h=this._pingPongRenderTarget;this._halfBlur(e,h,i,r,l,"latitudinal",c),this._halfBlur(h,e,r,r,l,"longitudinal",c)}_halfBlur(e,i,r,l,c,h,d){const g=this._renderer,p=this._blurMaterial;h!=="latitudinal"&&h!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const _=3,m=new cn(this._lodPlanes[l],p),x=p.uniforms,S=this._sizeLods[r]-1,E=isFinite(c)?Math.PI/(2*S):2*Math.PI/(2*Zr-1),A=c/E,M=isFinite(c)?1+Math.floor(_*A):Zr;M>Zr&&console.warn(`sigmaRadians, ${c}, is too large and will clip, as it requested ${M} samples when the maximum is set to ${Zr}`);const y=[];let N=0;for(let O=0;O<Zr;++O){const H=O/A,w=Math.exp(-H*H/2);y.push(w),O===0?N+=w:O<M&&(N+=2*w)}for(let O=0;O<y.length;O++)y[O]=y[O]/N;x.envMap.value=e.texture,x.samples.value=M,x.weights.value=y,x.latitudinal.value=h==="latitudinal",d&&(x.poleAxis.value=d);const{_lodMax:L}=this;x.dTheta.value=E,x.mipInt.value=L-r;const D=this._sizeLods[l],F=3*D*(l>L-io?l-L+io:0),I=4*(this._cubeSize-D);_c(i,F,I,3*D,2*D),g.setRenderTarget(i),g.render(m,Fd)}}function MA(o){const e=[],i=[],r=[];let l=o;const c=o-io+1+Kv.length;for(let h=0;h<c;h++){const d=Math.pow(2,l);i.push(d);let g=1/d;h>o-io?g=Kv[h-o+io-1]:h===0&&(g=0),r.push(g);const p=1/(d-2),_=-p,m=1+p,x=[_,_,m,_,m,m,_,_,m,m,_,m],S=6,E=6,A=3,M=2,y=1,N=new Float32Array(A*E*S),L=new Float32Array(M*E*S),D=new Float32Array(y*E*S);for(let I=0;I<S;I++){const O=I%3*2/3-1,H=I>2?0:-1,w=[O,H,0,O+2/3,H,0,O+2/3,H+1,0,O,H,0,O+2/3,H+1,0,O,H+1,0];N.set(w,A*E*I),L.set(x,M*E*I);const R=[I,I,I,I,I,I];D.set(R,y*E*I)}const F=new Yn;F.setAttribute("position",new ea(N,A)),F.setAttribute("uv",new ea(L,M)),F.setAttribute("faceIndex",new ea(D,y)),e.push(F),l>io&&l--}return{lodPlanes:e,sizeLods:i,sigmas:r}}function tx(o,e,i){const r=new $r(o,e,i);return r.texture.mapping=Uc,r.texture.name="PMREM.cubeUv",r.scissorTest=!0,r}function _c(o,e,i,r,l){o.viewport.set(e,i,r,l),o.scissor.set(e,i,r,l)}function EA(o,e,i){const r=new Float32Array(Zr),l=new et(0,1,0);return new mr({name:"SphericalGaussianBlur",defines:{n:Zr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/i,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:r},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:l}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function ex(){return new mr({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function nx(){return new mr({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Jp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function Jp(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function TA(o){let e=new WeakMap,i=null;function r(d){if(d&&d.isTexture){const g=d.mapping,p=g===tp||g===ep,_=g===oo||g===lo;if(p||_){let m=e.get(d);const x=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==x)return i===null&&(i=new $v(o)),m=p?i.fromEquirectangular(d,m):i.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,e.set(d,m),m.texture;if(m!==void 0)return m.texture;{const S=d.image;return p&&S&&S.height>0||_&&S&&l(S)?(i===null&&(i=new $v(o)),m=p?i.fromEquirectangular(d):i.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,e.set(d,m),d.addEventListener("dispose",c),m.texture):null}}}return d}function l(d){let g=0;const p=6;for(let _=0;_<p;_++)d[_]!==void 0&&g++;return g===p}function c(d){const g=d.target;g.removeEventListener("dispose",c);const p=e.get(g);p!==void 0&&(e.delete(g),p.dispose())}function h(){e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:h}}function bA(o){const e={};function i(r){if(e[r]!==void 0)return e[r];let l;switch(r){case"WEBGL_depth_texture":l=o.getExtension("WEBGL_depth_texture")||o.getExtension("MOZ_WEBGL_depth_texture")||o.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":l=o.getExtension("EXT_texture_filter_anisotropic")||o.getExtension("MOZ_EXT_texture_filter_anisotropic")||o.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":l=o.getExtension("WEBGL_compressed_texture_s3tc")||o.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||o.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":l=o.getExtension("WEBGL_compressed_texture_pvrtc")||o.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:l=o.getExtension(r)}return e[r]=l,l}return{has:function(r){return i(r)!==null},init:function(){i("EXT_color_buffer_float"),i("WEBGL_clip_cull_distance"),i("OES_texture_float_linear"),i("EXT_color_buffer_half_float"),i("WEBGL_multisampled_render_to_texture"),i("WEBGL_render_shared_exponent")},get:function(r){const l=i(r);return l===null&&El("THREE.WebGLRenderer: "+r+" extension not supported."),l}}}function AA(o,e,i,r){const l={},c=new WeakMap;function h(m){const x=m.target;x.index!==null&&e.remove(x.index);for(const E in x.attributes)e.remove(x.attributes[E]);x.removeEventListener("dispose",h),delete l[x.id];const S=c.get(x);S&&(e.remove(S),c.delete(x)),r.releaseStatesOfGeometry(x),x.isInstancedBufferGeometry===!0&&delete x._maxInstanceCount,i.memory.geometries--}function d(m,x){return l[x.id]===!0||(x.addEventListener("dispose",h),l[x.id]=!0,i.memory.geometries++),x}function g(m){const x=m.attributes;for(const S in x)e.update(x[S],o.ARRAY_BUFFER)}function p(m){const x=[],S=m.index,E=m.attributes.position;let A=0;if(S!==null){const N=S.array;A=S.version;for(let L=0,D=N.length;L<D;L+=3){const F=N[L+0],I=N[L+1],O=N[L+2];x.push(F,I,I,O,O,F)}}else if(E!==void 0){const N=E.array;A=E.version;for(let L=0,D=N.length/3-1;L<D;L+=3){const F=L+0,I=L+1,O=L+2;x.push(F,I,I,O,O,F)}}else return;const M=new(Ox(x)?Bx:Ix)(x,1);M.version=A;const y=c.get(m);y&&e.remove(y),c.set(m,M)}function _(m){const x=c.get(m);if(x){const S=m.index;S!==null&&x.version<S.version&&p(m)}else p(m);return c.get(m)}return{get:d,update:g,getWireframeAttribute:_}}function RA(o,e,i){let r;function l(x){r=x}let c,h;function d(x){c=x.type,h=x.bytesPerElement}function g(x,S){o.drawElements(r,S,c,x*h),i.update(S,r,1)}function p(x,S,E){E!==0&&(o.drawElementsInstanced(r,S,c,x*h,E),i.update(S,r,E))}function _(x,S,E){if(E===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(r,S,0,c,x,0,E);let M=0;for(let y=0;y<E;y++)M+=S[y];i.update(M,r,1)}function m(x,S,E,A){if(E===0)return;const M=e.get("WEBGL_multi_draw");if(M===null)for(let y=0;y<x.length;y++)p(x[y]/h,S[y],A[y]);else{M.multiDrawElementsInstancedWEBGL(r,S,0,c,x,0,A,0,E);let y=0;for(let N=0;N<E;N++)y+=S[N]*A[N];i.update(y,r,1)}}this.setMode=l,this.setIndex=d,this.render=g,this.renderInstances=p,this.renderMultiDraw=_,this.renderMultiDrawInstances=m}function CA(o){const e={geometries:0,textures:0},i={frame:0,calls:0,triangles:0,points:0,lines:0};function r(c,h,d){switch(i.calls++,h){case o.TRIANGLES:i.triangles+=d*(c/3);break;case o.LINES:i.lines+=d*(c/2);break;case o.LINE_STRIP:i.lines+=d*(c-1);break;case o.LINE_LOOP:i.lines+=d*c;break;case o.POINTS:i.points+=d*c;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",h);break}}function l(){i.calls=0,i.triangles=0,i.points=0,i.lines=0}return{memory:e,render:i,programs:null,autoReset:!0,reset:l,update:r}}function wA(o,e,i){const r=new WeakMap,l=new ln;function c(h,d,g){const p=h.morphTargetInfluences,_=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,m=_!==void 0?_.length:0;let x=r.get(d);if(x===void 0||x.count!==m){let R=function(){H.dispose(),r.delete(d),d.removeEventListener("dispose",R)};var S=R;x!==void 0&&x.texture.dispose();const E=d.morphAttributes.position!==void 0,A=d.morphAttributes.normal!==void 0,M=d.morphAttributes.color!==void 0,y=d.morphAttributes.position||[],N=d.morphAttributes.normal||[],L=d.morphAttributes.color||[];let D=0;E===!0&&(D=1),A===!0&&(D=2),M===!0&&(D=3);let F=d.attributes.position.count*D,I=1;F>e.maxTextureSize&&(I=Math.ceil(F/e.maxTextureSize),F=e.maxTextureSize);const O=new Float32Array(F*I*4*m),H=new zx(O,F,I,m);H.type=Ca,H.needsUpdate=!0;const w=D*4;for(let V=0;V<m;V++){const $=y[V],ft=N[V],gt=L[V],lt=F*I*4*V;for(let j=0;j<$.count;j++){const ot=j*w;E===!0&&(l.fromBufferAttribute($,j),O[lt+ot+0]=l.x,O[lt+ot+1]=l.y,O[lt+ot+2]=l.z,O[lt+ot+3]=0),A===!0&&(l.fromBufferAttribute(ft,j),O[lt+ot+4]=l.x,O[lt+ot+5]=l.y,O[lt+ot+6]=l.z,O[lt+ot+7]=0),M===!0&&(l.fromBufferAttribute(gt,j),O[lt+ot+8]=l.x,O[lt+ot+9]=l.y,O[lt+ot+10]=l.z,O[lt+ot+11]=gt.itemSize===4?l.w:1)}}x={count:m,texture:H,size:new Te(F,I)},r.set(d,x),d.addEventListener("dispose",R)}if(h.isInstancedMesh===!0&&h.morphTexture!==null)g.getUniforms().setValue(o,"morphTexture",h.morphTexture,i);else{let E=0;for(let M=0;M<p.length;M++)E+=p[M];const A=d.morphTargetsRelative?1:1-E;g.getUniforms().setValue(o,"morphTargetBaseInfluence",A),g.getUniforms().setValue(o,"morphTargetInfluences",p)}g.getUniforms().setValue(o,"morphTargetsTexture",x.texture,i),g.getUniforms().setValue(o,"morphTargetsTextureSize",x.size)}return{update:c}}function DA(o,e,i,r){let l=new WeakMap;function c(g){const p=r.render.frame,_=g.geometry,m=e.get(g,_);if(l.get(m)!==p&&(e.update(m),l.set(m,p)),g.isInstancedMesh&&(g.hasEventListener("dispose",d)===!1&&g.addEventListener("dispose",d),l.get(g)!==p&&(i.update(g.instanceMatrix,o.ARRAY_BUFFER),g.instanceColor!==null&&i.update(g.instanceColor,o.ARRAY_BUFFER),l.set(g,p))),g.isSkinnedMesh){const x=g.skeleton;l.get(x)!==p&&(x.update(),l.set(x,p))}return m}function h(){l=new WeakMap}function d(g){const p=g.target;p.removeEventListener("dispose",d),i.remove(p.instanceMatrix),p.instanceColor!==null&&i.remove(p.instanceColor)}return{update:c,dispose:h}}const jx=new qn,ix=new Vx(1,1),Wx=new zx,Zx=new JE,Kx=new Gx,ax=[],rx=[],sx=new Float32Array(16),ox=new Float32Array(9),lx=new Float32Array(4);function go(o,e,i){const r=o[0];if(r<=0||r>0)return o;const l=e*i;let c=ax[l];if(c===void 0&&(c=new Float32Array(l),ax[l]=c),e!==0){r.toArray(c,0);for(let h=1,d=0;h!==e;++h)d+=i,o[h].toArray(c,d)}return c}function yn(o,e){if(o.length!==e.length)return!1;for(let i=0,r=o.length;i<r;i++)if(o[i]!==e[i])return!1;return!0}function Sn(o,e){for(let i=0,r=e.length;i<r;i++)o[i]=e[i]}function Oc(o,e){let i=rx[e];i===void 0&&(i=new Int32Array(e),rx[e]=i);for(let r=0;r!==e;++r)i[r]=o.allocateTextureUnit();return i}function UA(o,e){const i=this.cache;i[0]!==e&&(o.uniform1f(this.addr,e),i[0]=e)}function NA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2f(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(yn(i,e))return;o.uniform2fv(this.addr,e),Sn(i,e)}}function LA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3f(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else if(e.r!==void 0)(i[0]!==e.r||i[1]!==e.g||i[2]!==e.b)&&(o.uniform3f(this.addr,e.r,e.g,e.b),i[0]=e.r,i[1]=e.g,i[2]=e.b);else{if(yn(i,e))return;o.uniform3fv(this.addr,e),Sn(i,e)}}function OA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4f(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(yn(i,e))return;o.uniform4fv(this.addr,e),Sn(i,e)}}function zA(o,e){const i=this.cache,r=e.elements;if(r===void 0){if(yn(i,e))return;o.uniformMatrix2fv(this.addr,!1,e),Sn(i,e)}else{if(yn(i,r))return;lx.set(r),o.uniformMatrix2fv(this.addr,!1,lx),Sn(i,r)}}function PA(o,e){const i=this.cache,r=e.elements;if(r===void 0){if(yn(i,e))return;o.uniformMatrix3fv(this.addr,!1,e),Sn(i,e)}else{if(yn(i,r))return;ox.set(r),o.uniformMatrix3fv(this.addr,!1,ox),Sn(i,r)}}function IA(o,e){const i=this.cache,r=e.elements;if(r===void 0){if(yn(i,e))return;o.uniformMatrix4fv(this.addr,!1,e),Sn(i,e)}else{if(yn(i,r))return;sx.set(r),o.uniformMatrix4fv(this.addr,!1,sx),Sn(i,r)}}function BA(o,e){const i=this.cache;i[0]!==e&&(o.uniform1i(this.addr,e),i[0]=e)}function FA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2i(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(yn(i,e))return;o.uniform2iv(this.addr,e),Sn(i,e)}}function HA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3i(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(yn(i,e))return;o.uniform3iv(this.addr,e),Sn(i,e)}}function GA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4i(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(yn(i,e))return;o.uniform4iv(this.addr,e),Sn(i,e)}}function VA(o,e){const i=this.cache;i[0]!==e&&(o.uniform1ui(this.addr,e),i[0]=e)}function kA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y)&&(o.uniform2ui(this.addr,e.x,e.y),i[0]=e.x,i[1]=e.y);else{if(yn(i,e))return;o.uniform2uiv(this.addr,e),Sn(i,e)}}function XA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z)&&(o.uniform3ui(this.addr,e.x,e.y,e.z),i[0]=e.x,i[1]=e.y,i[2]=e.z);else{if(yn(i,e))return;o.uniform3uiv(this.addr,e),Sn(i,e)}}function qA(o,e){const i=this.cache;if(e.x!==void 0)(i[0]!==e.x||i[1]!==e.y||i[2]!==e.z||i[3]!==e.w)&&(o.uniform4ui(this.addr,e.x,e.y,e.z,e.w),i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=e.w);else{if(yn(i,e))return;o.uniform4uiv(this.addr,e),Sn(i,e)}}function YA(o,e,i){const r=this.cache,l=i.allocateTextureUnit();r[0]!==l&&(o.uniform1i(this.addr,l),r[0]=l);let c;this.type===o.SAMPLER_2D_SHADOW?(ix.compareFunction=Lx,c=ix):c=jx,i.setTexture2D(e||c,l)}function jA(o,e,i){const r=this.cache,l=i.allocateTextureUnit();r[0]!==l&&(o.uniform1i(this.addr,l),r[0]=l),i.setTexture3D(e||Zx,l)}function WA(o,e,i){const r=this.cache,l=i.allocateTextureUnit();r[0]!==l&&(o.uniform1i(this.addr,l),r[0]=l),i.setTextureCube(e||Kx,l)}function ZA(o,e,i){const r=this.cache,l=i.allocateTextureUnit();r[0]!==l&&(o.uniform1i(this.addr,l),r[0]=l),i.setTexture2DArray(e||Wx,l)}function KA(o){switch(o){case 5126:return UA;case 35664:return NA;case 35665:return LA;case 35666:return OA;case 35674:return zA;case 35675:return PA;case 35676:return IA;case 5124:case 35670:return BA;case 35667:case 35671:return FA;case 35668:case 35672:return HA;case 35669:case 35673:return GA;case 5125:return VA;case 36294:return kA;case 36295:return XA;case 36296:return qA;case 35678:case 36198:case 36298:case 36306:case 35682:return YA;case 35679:case 36299:case 36307:return jA;case 35680:case 36300:case 36308:case 36293:return WA;case 36289:case 36303:case 36311:case 36292:return ZA}}function QA(o,e){o.uniform1fv(this.addr,e)}function JA(o,e){const i=go(e,this.size,2);o.uniform2fv(this.addr,i)}function $A(o,e){const i=go(e,this.size,3);o.uniform3fv(this.addr,i)}function tR(o,e){const i=go(e,this.size,4);o.uniform4fv(this.addr,i)}function eR(o,e){const i=go(e,this.size,4);o.uniformMatrix2fv(this.addr,!1,i)}function nR(o,e){const i=go(e,this.size,9);o.uniformMatrix3fv(this.addr,!1,i)}function iR(o,e){const i=go(e,this.size,16);o.uniformMatrix4fv(this.addr,!1,i)}function aR(o,e){o.uniform1iv(this.addr,e)}function rR(o,e){o.uniform2iv(this.addr,e)}function sR(o,e){o.uniform3iv(this.addr,e)}function oR(o,e){o.uniform4iv(this.addr,e)}function lR(o,e){o.uniform1uiv(this.addr,e)}function uR(o,e){o.uniform2uiv(this.addr,e)}function cR(o,e){o.uniform3uiv(this.addr,e)}function fR(o,e){o.uniform4uiv(this.addr,e)}function hR(o,e,i){const r=this.cache,l=e.length,c=Oc(i,l);yn(r,c)||(o.uniform1iv(this.addr,c),Sn(r,c));for(let h=0;h!==l;++h)i.setTexture2D(e[h]||jx,c[h])}function dR(o,e,i){const r=this.cache,l=e.length,c=Oc(i,l);yn(r,c)||(o.uniform1iv(this.addr,c),Sn(r,c));for(let h=0;h!==l;++h)i.setTexture3D(e[h]||Zx,c[h])}function pR(o,e,i){const r=this.cache,l=e.length,c=Oc(i,l);yn(r,c)||(o.uniform1iv(this.addr,c),Sn(r,c));for(let h=0;h!==l;++h)i.setTextureCube(e[h]||Kx,c[h])}function mR(o,e,i){const r=this.cache,l=e.length,c=Oc(i,l);yn(r,c)||(o.uniform1iv(this.addr,c),Sn(r,c));for(let h=0;h!==l;++h)i.setTexture2DArray(e[h]||Wx,c[h])}function gR(o){switch(o){case 5126:return QA;case 35664:return JA;case 35665:return $A;case 35666:return tR;case 35674:return eR;case 35675:return nR;case 35676:return iR;case 5124:case 35670:return aR;case 35667:case 35671:return rR;case 35668:case 35672:return sR;case 35669:case 35673:return oR;case 5125:return lR;case 36294:return uR;case 36295:return cR;case 36296:return fR;case 35678:case 36198:case 36298:case 36306:case 35682:return hR;case 35679:case 36299:case 36307:return dR;case 35680:case 36300:case 36308:case 36293:return pR;case 36289:case 36303:case 36311:case 36292:return mR}}class _R{constructor(e,i,r){this.id=e,this.addr=r,this.cache=[],this.type=i.type,this.setValue=KA(i.type)}}class vR{constructor(e,i,r){this.id=e,this.addr=r,this.cache=[],this.type=i.type,this.size=i.size,this.setValue=gR(i.type)}}class xR{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,i,r){const l=this.seq;for(let c=0,h=l.length;c!==h;++c){const d=l[c];d.setValue(e,i[d.id],r)}}}const Xd=/(\w+)(\])?(\[|\.)?/g;function ux(o,e){o.seq.push(e),o.map[e.id]=e}function yR(o,e,i){const r=o.name,l=r.length;for(Xd.lastIndex=0;;){const c=Xd.exec(r),h=Xd.lastIndex;let d=c[1];const g=c[2]==="]",p=c[3];if(g&&(d=d|0),p===void 0||p==="["&&h+2===l){ux(i,p===void 0?new _R(d,o,e):new vR(d,o,e));break}else{let m=i.map[d];m===void 0&&(m=new xR(d),ux(i,m)),i=m}}}class Ec{constructor(e,i){this.seq=[],this.map={};const r=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let l=0;l<r;++l){const c=e.getActiveUniform(i,l),h=e.getUniformLocation(i,c.name);yR(c,h,this)}}setValue(e,i,r,l){const c=this.map[i];c!==void 0&&c.setValue(e,r,l)}setOptional(e,i,r){const l=i[r];l!==void 0&&this.setValue(e,r,l)}static upload(e,i,r,l){for(let c=0,h=i.length;c!==h;++c){const d=i[c],g=r[d.id];g.needsUpdate!==!1&&d.setValue(e,g.value,l)}}static seqWithValue(e,i){const r=[];for(let l=0,c=e.length;l!==c;++l){const h=e[l];h.id in i&&r.push(h)}return r}}function cx(o,e,i){const r=o.createShader(e);return o.shaderSource(r,i),o.compileShader(r),r}const SR=37297;let MR=0;function ER(o,e){const i=o.split(`
`),r=[],l=Math.max(e-6,0),c=Math.min(e+6,i.length);for(let h=l;h<c;h++){const d=h+1;r.push(`${d===e?">":" "} ${d}: ${i[h]}`)}return r.join(`
`)}const fx=new ge;function TR(o){Oe._getMatrix(fx,Oe.workingColorSpace,o);const e=`mat3( ${fx.elements.map(i=>i.toFixed(4))} )`;switch(Oe.getTransfer(o)){case Tc:return[e,"LinearTransferOETF"];case je:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",o),[e,"LinearTransferOETF"]}}function hx(o,e,i){const r=o.getShaderParameter(e,o.COMPILE_STATUS),c=(o.getShaderInfoLog(e)||"").trim();if(r&&c==="")return"";const h=/ERROR: 0:(\d+)/.exec(c);if(h){const d=parseInt(h[1]);return i.toUpperCase()+`

`+c+`

`+ER(o.getShaderSource(e),d)}else return c}function bR(o,e){const i=TR(e);return[`vec4 ${o}( vec4 value ) {`,`	return ${i[1]}( vec4( value.rgb * ${i[0]}, value.a ) );`,"}"].join(`
`)}function AR(o,e){let i;switch(e){case fE:i="Linear";break;case hE:i="Reinhard";break;case dE:i="Cineon";break;case pE:i="ACESFilmic";break;case gE:i="AgX";break;case _E:i="Neutral";break;case mE:i="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),i="Linear"}return"vec3 "+o+"( vec3 color ) { return "+i+"ToneMapping( color ); }"}const vc=new et;function RR(){Oe.getLuminanceCoefficients(vc);const o=vc.x.toFixed(4),e=vc.y.toFixed(4),i=vc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${o}, ${e}, ${i} );`,"	return dot( weights, rgb );","}"].join(`
`)}function CR(o){return[o.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",o.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pl).join(`
`)}function wR(o){const e=[];for(const i in o){const r=o[i];r!==!1&&e.push("#define "+i+" "+r)}return e.join(`
`)}function DR(o,e){const i={},r=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);for(let l=0;l<r;l++){const c=o.getActiveAttrib(e,l),h=c.name;let d=1;c.type===o.FLOAT_MAT2&&(d=2),c.type===o.FLOAT_MAT3&&(d=3),c.type===o.FLOAT_MAT4&&(d=4),i[h]={type:c.type,location:o.getAttribLocation(e,h),locationSize:d}}return i}function pl(o){return o!==""}function dx(o,e){const i=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return o.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,i).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function px(o,e){return o.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const UR=/^[ \t]*#include +<([\w\d./]+)>/gm;function Op(o){return o.replace(UR,LR)}const NR=new Map;function LR(o,e){let i=_e[e];if(i===void 0){const r=NR.get(e);if(r!==void 0)i=_e[r],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,r);else throw new Error("Can not resolve #include <"+e+">")}return Op(i)}const OR=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function mx(o){return o.replace(OR,zR)}function zR(o,e,i,r){let l="";for(let c=parseInt(e);c<parseInt(i);c++)l+=r.replace(/\[\s*i\s*\]/g,"[ "+c+" ]").replace(/UNROLLED_LOOP_INDEX/g,c);return l}function gx(o){let e=`precision ${o.precision} float;
	precision ${o.precision} int;
	precision ${o.precision} sampler2D;
	precision ${o.precision} samplerCube;
	precision ${o.precision} sampler3D;
	precision ${o.precision} sampler2DArray;
	precision ${o.precision} sampler2DShadow;
	precision ${o.precision} samplerCubeShadow;
	precision ${o.precision} sampler2DArrayShadow;
	precision ${o.precision} isampler2D;
	precision ${o.precision} isampler3D;
	precision ${o.precision} isamplerCube;
	precision ${o.precision} isampler2DArray;
	precision ${o.precision} usampler2D;
	precision ${o.precision} usampler3D;
	precision ${o.precision} usamplerCube;
	precision ${o.precision} usampler2DArray;
	`;return o.precision==="highp"?e+=`
#define HIGH_PRECISION`:o.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:o.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function PR(o){let e="SHADOWMAP_TYPE_BASIC";return o.shadowMapType===yx?e="SHADOWMAP_TYPE_PCF":o.shadowMapType===Sx?e="SHADOWMAP_TYPE_PCF_SOFT":o.shadowMapType===ba&&(e="SHADOWMAP_TYPE_VSM"),e}function IR(o){let e="ENVMAP_TYPE_CUBE";if(o.envMap)switch(o.envMapMode){case oo:case lo:e="ENVMAP_TYPE_CUBE";break;case Uc:e="ENVMAP_TYPE_CUBE_UV";break}return e}function BR(o){let e="ENVMAP_MODE_REFLECTION";return o.envMap&&o.envMapMode===lo&&(e="ENVMAP_MODE_REFRACTION"),e}function FR(o){let e="ENVMAP_BLENDING_NONE";if(o.envMap)switch(o.combine){case Mx:e="ENVMAP_BLENDING_MULTIPLY";break;case uE:e="ENVMAP_BLENDING_MIX";break;case cE:e="ENVMAP_BLENDING_ADD";break}return e}function HR(o){const e=o.envMapCubeUVHeight;if(e===null)return null;const i=Math.log2(e)-2,r=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,i),112)),texelHeight:r,maxMip:i}}function GR(o,e,i,r){const l=o.getContext(),c=i.defines;let h=i.vertexShader,d=i.fragmentShader;const g=PR(i),p=IR(i),_=BR(i),m=FR(i),x=HR(i),S=CR(i),E=wR(c),A=l.createProgram();let M,y,N=i.glslVersion?"#version "+i.glslVersion+`
`:"";i.isRawShaderMaterial?(M=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,E].filter(pl).join(`
`),M.length>0&&(M+=`
`),y=["#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,E].filter(pl).join(`
`),y.length>0&&(y+=`
`)):(M=[gx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,E,i.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",i.batching?"#define USE_BATCHING":"",i.batchingColor?"#define USE_BATCHING_COLOR":"",i.instancing?"#define USE_INSTANCING":"",i.instancingColor?"#define USE_INSTANCING_COLOR":"",i.instancingMorph?"#define USE_INSTANCING_MORPH":"",i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.map?"#define USE_MAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+_:"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.displacementMap?"#define USE_DISPLACEMENTMAP":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.mapUv?"#define MAP_UV "+i.mapUv:"",i.alphaMapUv?"#define ALPHAMAP_UV "+i.alphaMapUv:"",i.lightMapUv?"#define LIGHTMAP_UV "+i.lightMapUv:"",i.aoMapUv?"#define AOMAP_UV "+i.aoMapUv:"",i.emissiveMapUv?"#define EMISSIVEMAP_UV "+i.emissiveMapUv:"",i.bumpMapUv?"#define BUMPMAP_UV "+i.bumpMapUv:"",i.normalMapUv?"#define NORMALMAP_UV "+i.normalMapUv:"",i.displacementMapUv?"#define DISPLACEMENTMAP_UV "+i.displacementMapUv:"",i.metalnessMapUv?"#define METALNESSMAP_UV "+i.metalnessMapUv:"",i.roughnessMapUv?"#define ROUGHNESSMAP_UV "+i.roughnessMapUv:"",i.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+i.anisotropyMapUv:"",i.clearcoatMapUv?"#define CLEARCOATMAP_UV "+i.clearcoatMapUv:"",i.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+i.clearcoatNormalMapUv:"",i.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+i.clearcoatRoughnessMapUv:"",i.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+i.iridescenceMapUv:"",i.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+i.iridescenceThicknessMapUv:"",i.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+i.sheenColorMapUv:"",i.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+i.sheenRoughnessMapUv:"",i.specularMapUv?"#define SPECULARMAP_UV "+i.specularMapUv:"",i.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+i.specularColorMapUv:"",i.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+i.specularIntensityMapUv:"",i.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+i.transmissionMapUv:"",i.thicknessMapUv?"#define THICKNESSMAP_UV "+i.thicknessMapUv:"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.flatShading?"#define FLAT_SHADED":"",i.skinning?"#define USE_SKINNING":"",i.morphTargets?"#define USE_MORPHTARGETS":"",i.morphNormals&&i.flatShading===!1?"#define USE_MORPHNORMALS":"",i.morphColors?"#define USE_MORPHCOLORS":"",i.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+i.morphTextureStride:"",i.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+i.morphTargetsCount:"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+g:"",i.sizeAttenuation?"#define USE_SIZEATTENUATION":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pl).join(`
`),y=[gx(i),"#define SHADER_TYPE "+i.shaderType,"#define SHADER_NAME "+i.shaderName,E,i.useFog&&i.fog?"#define USE_FOG":"",i.useFog&&i.fogExp2?"#define FOG_EXP2":"",i.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",i.map?"#define USE_MAP":"",i.matcap?"#define USE_MATCAP":"",i.envMap?"#define USE_ENVMAP":"",i.envMap?"#define "+p:"",i.envMap?"#define "+_:"",i.envMap?"#define "+m:"",x?"#define CUBEUV_TEXEL_WIDTH "+x.texelWidth:"",x?"#define CUBEUV_TEXEL_HEIGHT "+x.texelHeight:"",x?"#define CUBEUV_MAX_MIP "+x.maxMip+".0":"",i.lightMap?"#define USE_LIGHTMAP":"",i.aoMap?"#define USE_AOMAP":"",i.bumpMap?"#define USE_BUMPMAP":"",i.normalMap?"#define USE_NORMALMAP":"",i.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",i.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",i.emissiveMap?"#define USE_EMISSIVEMAP":"",i.anisotropy?"#define USE_ANISOTROPY":"",i.anisotropyMap?"#define USE_ANISOTROPYMAP":"",i.clearcoat?"#define USE_CLEARCOAT":"",i.clearcoatMap?"#define USE_CLEARCOATMAP":"",i.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",i.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",i.dispersion?"#define USE_DISPERSION":"",i.iridescence?"#define USE_IRIDESCENCE":"",i.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",i.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",i.specularMap?"#define USE_SPECULARMAP":"",i.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",i.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",i.roughnessMap?"#define USE_ROUGHNESSMAP":"",i.metalnessMap?"#define USE_METALNESSMAP":"",i.alphaMap?"#define USE_ALPHAMAP":"",i.alphaTest?"#define USE_ALPHATEST":"",i.alphaHash?"#define USE_ALPHAHASH":"",i.sheen?"#define USE_SHEEN":"",i.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",i.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",i.transmission?"#define USE_TRANSMISSION":"",i.transmissionMap?"#define USE_TRANSMISSIONMAP":"",i.thicknessMap?"#define USE_THICKNESSMAP":"",i.vertexTangents&&i.flatShading===!1?"#define USE_TANGENT":"",i.vertexColors||i.instancingColor||i.batchingColor?"#define USE_COLOR":"",i.vertexAlphas?"#define USE_COLOR_ALPHA":"",i.vertexUv1s?"#define USE_UV1":"",i.vertexUv2s?"#define USE_UV2":"",i.vertexUv3s?"#define USE_UV3":"",i.pointsUvs?"#define USE_POINTS_UV":"",i.gradientMap?"#define USE_GRADIENTMAP":"",i.flatShading?"#define FLAT_SHADED":"",i.doubleSided?"#define DOUBLE_SIDED":"",i.flipSided?"#define FLIP_SIDED":"",i.shadowMapEnabled?"#define USE_SHADOWMAP":"",i.shadowMapEnabled?"#define "+g:"",i.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",i.numLightProbes>0?"#define USE_LIGHT_PROBES":"",i.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",i.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",i.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",i.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",i.toneMapping!==dr?"#define TONE_MAPPING":"",i.toneMapping!==dr?_e.tonemapping_pars_fragment:"",i.toneMapping!==dr?AR("toneMapping",i.toneMapping):"",i.dithering?"#define DITHERING":"",i.opaque?"#define OPAQUE":"",_e.colorspace_pars_fragment,bR("linearToOutputTexel",i.outputColorSpace),RR(),i.useDepthPacking?"#define DEPTH_PACKING "+i.depthPacking:"",`
`].filter(pl).join(`
`)),h=Op(h),h=dx(h,i),h=px(h,i),d=Op(d),d=dx(d,i),d=px(d,i),h=mx(h),d=mx(d),i.isRawShaderMaterial!==!0&&(N=`#version 300 es
`,M=[S,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+M,y=["#define varying in",i.glslVersion===Sv?"":"layout(location = 0) out highp vec4 pc_fragColor;",i.glslVersion===Sv?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+y);const L=N+M+h,D=N+y+d,F=cx(l,l.VERTEX_SHADER,L),I=cx(l,l.FRAGMENT_SHADER,D);l.attachShader(A,F),l.attachShader(A,I),i.index0AttributeName!==void 0?l.bindAttribLocation(A,0,i.index0AttributeName):i.morphTargets===!0&&l.bindAttribLocation(A,0,"position"),l.linkProgram(A);function O(V){if(o.debug.checkShaderErrors){const $=l.getProgramInfoLog(A)||"",ft=l.getShaderInfoLog(F)||"",gt=l.getShaderInfoLog(I)||"",lt=$.trim(),j=ft.trim(),ot=gt.trim();let Q=!0,St=!0;if(l.getProgramParameter(A,l.LINK_STATUS)===!1)if(Q=!1,typeof o.debug.onShaderError=="function")o.debug.onShaderError(l,A,F,I);else{const xt=hx(l,F,"vertex"),Gt=hx(l,I,"fragment");console.error("THREE.WebGLProgram: Shader Error "+l.getError()+" - VALIDATE_STATUS "+l.getProgramParameter(A,l.VALIDATE_STATUS)+`

Material Name: `+V.name+`
Material Type: `+V.type+`

Program Info Log: `+lt+`
`+xt+`
`+Gt)}else lt!==""?console.warn("THREE.WebGLProgram: Program Info Log:",lt):(j===""||ot==="")&&(St=!1);St&&(V.diagnostics={runnable:Q,programLog:lt,vertexShader:{log:j,prefix:M},fragmentShader:{log:ot,prefix:y}})}l.deleteShader(F),l.deleteShader(I),H=new Ec(l,A),w=DR(l,A)}let H;this.getUniforms=function(){return H===void 0&&O(this),H};let w;this.getAttributes=function(){return w===void 0&&O(this),w};let R=i.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=l.getProgramParameter(A,SR)),R},this.destroy=function(){r.releaseStatesOfProgram(this),l.deleteProgram(A),this.program=void 0},this.type=i.shaderType,this.name=i.shaderName,this.id=MR++,this.cacheKey=e,this.usedTimes=1,this.program=A,this.vertexShader=F,this.fragmentShader=I,this}let VR=0;class kR{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const i=e.vertexShader,r=e.fragmentShader,l=this._getShaderStage(i),c=this._getShaderStage(r),h=this._getShaderCacheForMaterial(e);return h.has(l)===!1&&(h.add(l),l.usedTimes++),h.has(c)===!1&&(h.add(c),c.usedTimes++),this}remove(e){const i=this.materialCache.get(e);for(const r of i)r.usedTimes--,r.usedTimes===0&&this.shaderCache.delete(r.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const i=this.materialCache;let r=i.get(e);return r===void 0&&(r=new Set,i.set(e,r)),r}_getShaderStage(e){const i=this.shaderCache;let r=i.get(e);return r===void 0&&(r=new XR(e),i.set(e,r)),r}}class XR{constructor(e){this.id=VR++,this.code=e,this.usedTimes=0}}function qR(o,e,i,r,l,c,h){const d=new Yp,g=new kR,p=new Set,_=[],m=l.logarithmicDepthBuffer,x=l.vertexTextures;let S=l.precision;const E={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function A(w){return p.add(w),w===0?"uv":`uv${w}`}function M(w,R,V,$,ft){const gt=$.fog,lt=ft.geometry,j=w.isMeshStandardMaterial?$.environment:null,ot=(w.isMeshStandardMaterial?i:e).get(w.envMap||j),Q=ot&&ot.mapping===Uc?ot.image.height:null,St=E[w.type];w.precision!==null&&(S=l.getMaxPrecision(w.precision),S!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",S,"instead."));const xt=lt.morphAttributes.position||lt.morphAttributes.normal||lt.morphAttributes.color,Gt=xt!==void 0?xt.length:0;let ne=0;lt.morphAttributes.position!==void 0&&(ne=1),lt.morphAttributes.normal!==void 0&&(ne=2),lt.morphAttributes.color!==void 0&&(ne=3);let ye,P,ht,Y;if(St){const be=Ji[St];ye=be.vertexShader,P=be.fragmentShader}else ye=w.vertexShader,P=w.fragmentShader,g.update(w),ht=g.getVertexShaderID(w),Y=g.getFragmentShaderID(w);const rt=o.getRenderTarget(),bt=o.state.buffers.depth.getReversed(),Ot=ft.isInstancedMesh===!0,Dt=ft.isBatchedMesh===!0,Tt=!!w.map,qt=!!w.matcap,B=!!ot,ze=!!w.aoMap,le=!!w.lightMap,Wt=!!w.bumpMap,G=!!w.normalMap,_t=!!w.displacementMap,Mt=!!w.emissiveMap,Ht=!!w.metalnessMap,oe=!!w.roughnessMap,kt=w.anisotropy>0,U=w.clearcoat>0,b=w.dispersion>0,nt=w.iridescence>0,dt=w.sheen>0,Et=w.transmission>0,pt=kt&&!!w.anisotropyMap,jt=U&&!!w.clearcoatMap,Ut=U&&!!w.clearcoatNormalMap,$t=U&&!!w.clearcoatRoughnessMap,ee=nt&&!!w.iridescenceMap,Ct=nt&&!!w.iridescenceThicknessMap,Pt=dt&&!!w.sheenColorMap,ue=dt&&!!w.sheenRoughnessMap,te=!!w.specularMap,It=!!w.specularColorMap,de=!!w.specularIntensityMap,q=Et&&!!w.transmissionMap,wt=Et&&!!w.thicknessMap,Lt=!!w.gradientMap,Yt=!!w.alphaMap,At=w.alphaTest>0,yt=!!w.alphaHash,Qt=!!w.extensions;let he=dr;w.toneMapped&&(rt===null||rt.isXRRenderTarget===!0)&&(he=o.toneMapping);const qe={shaderID:St,shaderType:w.type,shaderName:w.name,vertexShader:ye,fragmentShader:P,defines:w.defines,customVertexShaderID:ht,customFragmentShaderID:Y,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:S,batching:Dt,batchingColor:Dt&&ft._colorsTexture!==null,instancing:Ot,instancingColor:Ot&&ft.instanceColor!==null,instancingMorph:Ot&&ft.morphTexture!==null,supportsVertexTextures:x,outputColorSpace:rt===null?o.outputColorSpace:rt.isXRRenderTarget===!0?rt.texture.colorSpace:uo,alphaToCoverage:!!w.alphaToCoverage,map:Tt,matcap:qt,envMap:B,envMapMode:B&&ot.mapping,envMapCubeUVHeight:Q,aoMap:ze,lightMap:le,bumpMap:Wt,normalMap:G,displacementMap:x&&_t,emissiveMap:Mt,normalMapObjectSpace:G&&w.normalMapType===SE,normalMapTangentSpace:G&&w.normalMapType===Nx,metalnessMap:Ht,roughnessMap:oe,anisotropy:kt,anisotropyMap:pt,clearcoat:U,clearcoatMap:jt,clearcoatNormalMap:Ut,clearcoatRoughnessMap:$t,dispersion:b,iridescence:nt,iridescenceMap:ee,iridescenceThicknessMap:Ct,sheen:dt,sheenColorMap:Pt,sheenRoughnessMap:ue,specularMap:te,specularColorMap:It,specularIntensityMap:de,transmission:Et,transmissionMap:q,thicknessMap:wt,gradientMap:Lt,opaque:w.transparent===!1&&w.blending===ao&&w.alphaToCoverage===!1,alphaMap:Yt,alphaTest:At,alphaHash:yt,combine:w.combine,mapUv:Tt&&A(w.map.channel),aoMapUv:ze&&A(w.aoMap.channel),lightMapUv:le&&A(w.lightMap.channel),bumpMapUv:Wt&&A(w.bumpMap.channel),normalMapUv:G&&A(w.normalMap.channel),displacementMapUv:_t&&A(w.displacementMap.channel),emissiveMapUv:Mt&&A(w.emissiveMap.channel),metalnessMapUv:Ht&&A(w.metalnessMap.channel),roughnessMapUv:oe&&A(w.roughnessMap.channel),anisotropyMapUv:pt&&A(w.anisotropyMap.channel),clearcoatMapUv:jt&&A(w.clearcoatMap.channel),clearcoatNormalMapUv:Ut&&A(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:$t&&A(w.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&A(w.iridescenceMap.channel),iridescenceThicknessMapUv:Ct&&A(w.iridescenceThicknessMap.channel),sheenColorMapUv:Pt&&A(w.sheenColorMap.channel),sheenRoughnessMapUv:ue&&A(w.sheenRoughnessMap.channel),specularMapUv:te&&A(w.specularMap.channel),specularColorMapUv:It&&A(w.specularColorMap.channel),specularIntensityMapUv:de&&A(w.specularIntensityMap.channel),transmissionMapUv:q&&A(w.transmissionMap.channel),thicknessMapUv:wt&&A(w.thicknessMap.channel),alphaMapUv:Yt&&A(w.alphaMap.channel),vertexTangents:!!lt.attributes.tangent&&(G||kt),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!lt.attributes.color&&lt.attributes.color.itemSize===4,pointsUvs:ft.isPoints===!0&&!!lt.attributes.uv&&(Tt||Yt),fog:!!gt,useFog:w.fog===!0,fogExp2:!!gt&&gt.isFogExp2,flatShading:w.flatShading===!0&&w.wireframe===!1,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:bt,skinning:ft.isSkinnedMesh===!0,morphTargets:lt.morphAttributes.position!==void 0,morphNormals:lt.morphAttributes.normal!==void 0,morphColors:lt.morphAttributes.color!==void 0,morphTargetsCount:Gt,morphTextureStride:ne,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numLightProbes:R.numLightProbes,numClippingPlanes:h.numPlanes,numClipIntersection:h.numIntersection,dithering:w.dithering,shadowMapEnabled:o.shadowMap.enabled&&V.length>0,shadowMapType:o.shadowMap.type,toneMapping:he,decodeVideoTexture:Tt&&w.map.isVideoTexture===!0&&Oe.getTransfer(w.map.colorSpace)===je,decodeVideoTextureEmissive:Mt&&w.emissiveMap.isVideoTexture===!0&&Oe.getTransfer(w.emissiveMap.colorSpace)===je,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===Li,flipSided:w.side===$n,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Qt&&w.extensions.clipCullDistance===!0&&r.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Qt&&w.extensions.multiDraw===!0||Dt)&&r.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:r.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return qe.vertexUv1s=p.has(1),qe.vertexUv2s=p.has(2),qe.vertexUv3s=p.has(3),p.clear(),qe}function y(w){const R=[];if(w.shaderID?R.push(w.shaderID):(R.push(w.customVertexShaderID),R.push(w.customFragmentShaderID)),w.defines!==void 0)for(const V in w.defines)R.push(V),R.push(w.defines[V]);return w.isRawShaderMaterial===!1&&(N(R,w),L(R,w),R.push(o.outputColorSpace)),R.push(w.customProgramCacheKey),R.join()}function N(w,R){w.push(R.precision),w.push(R.outputColorSpace),w.push(R.envMapMode),w.push(R.envMapCubeUVHeight),w.push(R.mapUv),w.push(R.alphaMapUv),w.push(R.lightMapUv),w.push(R.aoMapUv),w.push(R.bumpMapUv),w.push(R.normalMapUv),w.push(R.displacementMapUv),w.push(R.emissiveMapUv),w.push(R.metalnessMapUv),w.push(R.roughnessMapUv),w.push(R.anisotropyMapUv),w.push(R.clearcoatMapUv),w.push(R.clearcoatNormalMapUv),w.push(R.clearcoatRoughnessMapUv),w.push(R.iridescenceMapUv),w.push(R.iridescenceThicknessMapUv),w.push(R.sheenColorMapUv),w.push(R.sheenRoughnessMapUv),w.push(R.specularMapUv),w.push(R.specularColorMapUv),w.push(R.specularIntensityMapUv),w.push(R.transmissionMapUv),w.push(R.thicknessMapUv),w.push(R.combine),w.push(R.fogExp2),w.push(R.sizeAttenuation),w.push(R.morphTargetsCount),w.push(R.morphAttributeCount),w.push(R.numDirLights),w.push(R.numPointLights),w.push(R.numSpotLights),w.push(R.numSpotLightMaps),w.push(R.numHemiLights),w.push(R.numRectAreaLights),w.push(R.numDirLightShadows),w.push(R.numPointLightShadows),w.push(R.numSpotLightShadows),w.push(R.numSpotLightShadowsWithMaps),w.push(R.numLightProbes),w.push(R.shadowMapType),w.push(R.toneMapping),w.push(R.numClippingPlanes),w.push(R.numClipIntersection),w.push(R.depthPacking)}function L(w,R){d.disableAll(),R.supportsVertexTextures&&d.enable(0),R.instancing&&d.enable(1),R.instancingColor&&d.enable(2),R.instancingMorph&&d.enable(3),R.matcap&&d.enable(4),R.envMap&&d.enable(5),R.normalMapObjectSpace&&d.enable(6),R.normalMapTangentSpace&&d.enable(7),R.clearcoat&&d.enable(8),R.iridescence&&d.enable(9),R.alphaTest&&d.enable(10),R.vertexColors&&d.enable(11),R.vertexAlphas&&d.enable(12),R.vertexUv1s&&d.enable(13),R.vertexUv2s&&d.enable(14),R.vertexUv3s&&d.enable(15),R.vertexTangents&&d.enable(16),R.anisotropy&&d.enable(17),R.alphaHash&&d.enable(18),R.batching&&d.enable(19),R.dispersion&&d.enable(20),R.batchingColor&&d.enable(21),R.gradientMap&&d.enable(22),w.push(d.mask),d.disableAll(),R.fog&&d.enable(0),R.useFog&&d.enable(1),R.flatShading&&d.enable(2),R.logarithmicDepthBuffer&&d.enable(3),R.reversedDepthBuffer&&d.enable(4),R.skinning&&d.enable(5),R.morphTargets&&d.enable(6),R.morphNormals&&d.enable(7),R.morphColors&&d.enable(8),R.premultipliedAlpha&&d.enable(9),R.shadowMapEnabled&&d.enable(10),R.doubleSided&&d.enable(11),R.flipSided&&d.enable(12),R.useDepthPacking&&d.enable(13),R.dithering&&d.enable(14),R.transmission&&d.enable(15),R.sheen&&d.enable(16),R.opaque&&d.enable(17),R.pointsUvs&&d.enable(18),R.decodeVideoTexture&&d.enable(19),R.decodeVideoTextureEmissive&&d.enable(20),R.alphaToCoverage&&d.enable(21),w.push(d.mask)}function D(w){const R=E[w.type];let V;if(R){const $=Ji[R];V=fT.clone($.uniforms)}else V=w.uniforms;return V}function F(w,R){let V;for(let $=0,ft=_.length;$<ft;$++){const gt=_[$];if(gt.cacheKey===R){V=gt,++V.usedTimes;break}}return V===void 0&&(V=new GR(o,R,w,c),_.push(V)),V}function I(w){if(--w.usedTimes===0){const R=_.indexOf(w);_[R]=_[_.length-1],_.pop(),w.destroy()}}function O(w){g.remove(w)}function H(){g.dispose()}return{getParameters:M,getProgramCacheKey:y,getUniforms:D,acquireProgram:F,releaseProgram:I,releaseShaderCache:O,programs:_,dispose:H}}function YR(){let o=new WeakMap;function e(h){return o.has(h)}function i(h){let d=o.get(h);return d===void 0&&(d={},o.set(h,d)),d}function r(h){o.delete(h)}function l(h,d,g){o.get(h)[d]=g}function c(){o=new WeakMap}return{has:e,get:i,remove:r,update:l,dispose:c}}function jR(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.material.id!==e.material.id?o.material.id-e.material.id:o.z!==e.z?o.z-e.z:o.id-e.id}function _x(o,e){return o.groupOrder!==e.groupOrder?o.groupOrder-e.groupOrder:o.renderOrder!==e.renderOrder?o.renderOrder-e.renderOrder:o.z!==e.z?e.z-o.z:o.id-e.id}function vx(){const o=[];let e=0;const i=[],r=[],l=[];function c(){e=0,i.length=0,r.length=0,l.length=0}function h(m,x,S,E,A,M){let y=o[e];return y===void 0?(y={id:m.id,object:m,geometry:x,material:S,groupOrder:E,renderOrder:m.renderOrder,z:A,group:M},o[e]=y):(y.id=m.id,y.object=m,y.geometry=x,y.material=S,y.groupOrder=E,y.renderOrder=m.renderOrder,y.z=A,y.group=M),e++,y}function d(m,x,S,E,A,M){const y=h(m,x,S,E,A,M);S.transmission>0?r.push(y):S.transparent===!0?l.push(y):i.push(y)}function g(m,x,S,E,A,M){const y=h(m,x,S,E,A,M);S.transmission>0?r.unshift(y):S.transparent===!0?l.unshift(y):i.unshift(y)}function p(m,x){i.length>1&&i.sort(m||jR),r.length>1&&r.sort(x||_x),l.length>1&&l.sort(x||_x)}function _(){for(let m=e,x=o.length;m<x;m++){const S=o[m];if(S.id===null)break;S.id=null,S.object=null,S.geometry=null,S.material=null,S.group=null}}return{opaque:i,transmissive:r,transparent:l,init:c,push:d,unshift:g,finish:_,sort:p}}function WR(){let o=new WeakMap;function e(r,l){const c=o.get(r);let h;return c===void 0?(h=new vx,o.set(r,[h])):l>=c.length?(h=new vx,c.push(h)):h=c[l],h}function i(){o=new WeakMap}return{get:e,dispose:i}}function ZR(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"DirectionalLight":i={direction:new et,color:new we};break;case"SpotLight":i={position:new et,direction:new et,color:new we,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":i={position:new et,color:new we,distance:0,decay:0};break;case"HemisphereLight":i={direction:new et,skyColor:new we,groundColor:new we};break;case"RectAreaLight":i={color:new we,position:new et,halfWidth:new et,halfHeight:new et};break}return o[e.id]=i,i}}}function KR(){const o={};return{get:function(e){if(o[e.id]!==void 0)return o[e.id];let i;switch(e.type){case"DirectionalLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"SpotLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"PointLight":i={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te,shadowCameraNear:1,shadowCameraFar:1e3};break}return o[e.id]=i,i}}}let QR=0;function JR(o,e){return(e.castShadow?2:0)-(o.castShadow?2:0)+(e.map?1:0)-(o.map?1:0)}function $R(o){const e=new ZR,i=KR(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let p=0;p<9;p++)r.probe.push(new et);const l=new et,c=new an,h=new an;function d(p){let _=0,m=0,x=0;for(let w=0;w<9;w++)r.probe[w].set(0,0,0);let S=0,E=0,A=0,M=0,y=0,N=0,L=0,D=0,F=0,I=0,O=0;p.sort(JR);for(let w=0,R=p.length;w<R;w++){const V=p[w],$=V.color,ft=V.intensity,gt=V.distance,lt=V.shadow&&V.shadow.map?V.shadow.map.texture:null;if(V.isAmbientLight)_+=$.r*ft,m+=$.g*ft,x+=$.b*ft;else if(V.isLightProbe){for(let j=0;j<9;j++)r.probe[j].addScaledVector(V.sh.coefficients[j],ft);O++}else if(V.isDirectionalLight){const j=e.get(V);if(j.color.copy(V.color).multiplyScalar(V.intensity),V.castShadow){const ot=V.shadow,Q=i.get(V);Q.shadowIntensity=ot.intensity,Q.shadowBias=ot.bias,Q.shadowNormalBias=ot.normalBias,Q.shadowRadius=ot.radius,Q.shadowMapSize=ot.mapSize,r.directionalShadow[S]=Q,r.directionalShadowMap[S]=lt,r.directionalShadowMatrix[S]=V.shadow.matrix,N++}r.directional[S]=j,S++}else if(V.isSpotLight){const j=e.get(V);j.position.setFromMatrixPosition(V.matrixWorld),j.color.copy($).multiplyScalar(ft),j.distance=gt,j.coneCos=Math.cos(V.angle),j.penumbraCos=Math.cos(V.angle*(1-V.penumbra)),j.decay=V.decay,r.spot[A]=j;const ot=V.shadow;if(V.map&&(r.spotLightMap[F]=V.map,F++,ot.updateMatrices(V),V.castShadow&&I++),r.spotLightMatrix[A]=ot.matrix,V.castShadow){const Q=i.get(V);Q.shadowIntensity=ot.intensity,Q.shadowBias=ot.bias,Q.shadowNormalBias=ot.normalBias,Q.shadowRadius=ot.radius,Q.shadowMapSize=ot.mapSize,r.spotShadow[A]=Q,r.spotShadowMap[A]=lt,D++}A++}else if(V.isRectAreaLight){const j=e.get(V);j.color.copy($).multiplyScalar(ft),j.halfWidth.set(V.width*.5,0,0),j.halfHeight.set(0,V.height*.5,0),r.rectArea[M]=j,M++}else if(V.isPointLight){const j=e.get(V);if(j.color.copy(V.color).multiplyScalar(V.intensity),j.distance=V.distance,j.decay=V.decay,V.castShadow){const ot=V.shadow,Q=i.get(V);Q.shadowIntensity=ot.intensity,Q.shadowBias=ot.bias,Q.shadowNormalBias=ot.normalBias,Q.shadowRadius=ot.radius,Q.shadowMapSize=ot.mapSize,Q.shadowCameraNear=ot.camera.near,Q.shadowCameraFar=ot.camera.far,r.pointShadow[E]=Q,r.pointShadowMap[E]=lt,r.pointShadowMatrix[E]=V.shadow.matrix,L++}r.point[E]=j,E++}else if(V.isHemisphereLight){const j=e.get(V);j.skyColor.copy(V.color).multiplyScalar(ft),j.groundColor.copy(V.groundColor).multiplyScalar(ft),r.hemi[y]=j,y++}}M>0&&(o.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=Ft.LTC_FLOAT_1,r.rectAreaLTC2=Ft.LTC_FLOAT_2):(r.rectAreaLTC1=Ft.LTC_HALF_1,r.rectAreaLTC2=Ft.LTC_HALF_2)),r.ambient[0]=_,r.ambient[1]=m,r.ambient[2]=x;const H=r.hash;(H.directionalLength!==S||H.pointLength!==E||H.spotLength!==A||H.rectAreaLength!==M||H.hemiLength!==y||H.numDirectionalShadows!==N||H.numPointShadows!==L||H.numSpotShadows!==D||H.numSpotMaps!==F||H.numLightProbes!==O)&&(r.directional.length=S,r.spot.length=A,r.rectArea.length=M,r.point.length=E,r.hemi.length=y,r.directionalShadow.length=N,r.directionalShadowMap.length=N,r.pointShadow.length=L,r.pointShadowMap.length=L,r.spotShadow.length=D,r.spotShadowMap.length=D,r.directionalShadowMatrix.length=N,r.pointShadowMatrix.length=L,r.spotLightMatrix.length=D+F-I,r.spotLightMap.length=F,r.numSpotLightShadowsWithMaps=I,r.numLightProbes=O,H.directionalLength=S,H.pointLength=E,H.spotLength=A,H.rectAreaLength=M,H.hemiLength=y,H.numDirectionalShadows=N,H.numPointShadows=L,H.numSpotShadows=D,H.numSpotMaps=F,H.numLightProbes=O,r.version=QR++)}function g(p,_){let m=0,x=0,S=0,E=0,A=0;const M=_.matrixWorldInverse;for(let y=0,N=p.length;y<N;y++){const L=p[y];if(L.isDirectionalLight){const D=r.directional[m];D.direction.setFromMatrixPosition(L.matrixWorld),l.setFromMatrixPosition(L.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(M),m++}else if(L.isSpotLight){const D=r.spot[S];D.position.setFromMatrixPosition(L.matrixWorld),D.position.applyMatrix4(M),D.direction.setFromMatrixPosition(L.matrixWorld),l.setFromMatrixPosition(L.target.matrixWorld),D.direction.sub(l),D.direction.transformDirection(M),S++}else if(L.isRectAreaLight){const D=r.rectArea[E];D.position.setFromMatrixPosition(L.matrixWorld),D.position.applyMatrix4(M),h.identity(),c.copy(L.matrixWorld),c.premultiply(M),h.extractRotation(c),D.halfWidth.set(L.width*.5,0,0),D.halfHeight.set(0,L.height*.5,0),D.halfWidth.applyMatrix4(h),D.halfHeight.applyMatrix4(h),E++}else if(L.isPointLight){const D=r.point[x];D.position.setFromMatrixPosition(L.matrixWorld),D.position.applyMatrix4(M),x++}else if(L.isHemisphereLight){const D=r.hemi[A];D.direction.setFromMatrixPosition(L.matrixWorld),D.direction.transformDirection(M),A++}}}return{setup:d,setupView:g,state:r}}function xx(o){const e=new $R(o),i=[],r=[];function l(_){p.camera=_,i.length=0,r.length=0}function c(_){i.push(_)}function h(_){r.push(_)}function d(){e.setup(i)}function g(_){e.setupView(i,_)}const p={lightsArray:i,shadowsArray:r,camera:null,lights:e,transmissionRenderTarget:{}};return{init:l,state:p,setupLights:d,setupLightsView:g,pushLight:c,pushShadow:h}}function tC(o){let e=new WeakMap;function i(l,c=0){const h=e.get(l);let d;return h===void 0?(d=new xx(o),e.set(l,[d])):c>=h.length?(d=new xx(o),h.push(d)):d=h[c],d}function r(){e=new WeakMap}return{get:i,dispose:r}}const eC=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,nC=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function iC(o,e,i){let r=new Wp;const l=new Te,c=new Te,h=new ln,d=new TT({depthPacking:yE}),g=new bT,p={},_=i.maxTextureSize,m={[pr]:$n,[$n]:pr,[Li]:Li},x=new mr({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Te},radius:{value:4}},vertexShader:eC,fragmentShader:nC}),S=x.clone();S.defines.HORIZONTAL_PASS=1;const E=new Yn;E.setAttribute("position",new ea(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const A=new cn(E,x),M=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=yx;let y=this.type;this.render=function(I,O,H){if(M.enabled===!1||M.autoUpdate===!1&&M.needsUpdate===!1||I.length===0)return;const w=o.getRenderTarget(),R=o.getActiveCubeFace(),V=o.getActiveMipmapLevel(),$=o.state;$.setBlending(hr),$.buffers.depth.getReversed()===!0?$.buffers.color.setClear(0,0,0,0):$.buffers.color.setClear(1,1,1,1),$.buffers.depth.setTest(!0),$.setScissorTest(!1);const ft=y!==ba&&this.type===ba,gt=y===ba&&this.type!==ba;for(let lt=0,j=I.length;lt<j;lt++){const ot=I[lt],Q=ot.shadow;if(Q===void 0){console.warn("THREE.WebGLShadowMap:",ot,"has no shadow.");continue}if(Q.autoUpdate===!1&&Q.needsUpdate===!1)continue;l.copy(Q.mapSize);const St=Q.getFrameExtents();if(l.multiply(St),c.copy(Q.mapSize),(l.x>_||l.y>_)&&(l.x>_&&(c.x=Math.floor(_/St.x),l.x=c.x*St.x,Q.mapSize.x=c.x),l.y>_&&(c.y=Math.floor(_/St.y),l.y=c.y*St.y,Q.mapSize.y=c.y)),Q.map===null||ft===!0||gt===!0){const Gt=this.type!==ba?{minFilter:Ii,magFilter:Ii}:{};Q.map!==null&&Q.map.dispose(),Q.map=new $r(l.x,l.y,Gt),Q.map.texture.name=ot.name+".shadowMap",Q.camera.updateProjectionMatrix()}o.setRenderTarget(Q.map),o.clear();const xt=Q.getViewportCount();for(let Gt=0;Gt<xt;Gt++){const ne=Q.getViewport(Gt);h.set(c.x*ne.x,c.y*ne.y,c.x*ne.z,c.y*ne.w),$.viewport(h),Q.updateMatrices(ot,Gt),r=Q.getFrustum(),D(O,H,Q.camera,ot,this.type)}Q.isPointLightShadow!==!0&&this.type===ba&&N(Q,H),Q.needsUpdate=!1}y=this.type,M.needsUpdate=!1,o.setRenderTarget(w,R,V)};function N(I,O){const H=e.update(A);x.defines.VSM_SAMPLES!==I.blurSamples&&(x.defines.VSM_SAMPLES=I.blurSamples,S.defines.VSM_SAMPLES=I.blurSamples,x.needsUpdate=!0,S.needsUpdate=!0),I.mapPass===null&&(I.mapPass=new $r(l.x,l.y)),x.uniforms.shadow_pass.value=I.map.texture,x.uniforms.resolution.value=I.mapSize,x.uniforms.radius.value=I.radius,o.setRenderTarget(I.mapPass),o.clear(),o.renderBufferDirect(O,null,H,x,A,null),S.uniforms.shadow_pass.value=I.mapPass.texture,S.uniforms.resolution.value=I.mapSize,S.uniforms.radius.value=I.radius,o.setRenderTarget(I.map),o.clear(),o.renderBufferDirect(O,null,H,S,A,null)}function L(I,O,H,w){let R=null;const V=H.isPointLight===!0?I.customDistanceMaterial:I.customDepthMaterial;if(V!==void 0)R=V;else if(R=H.isPointLight===!0?g:d,o.localClippingEnabled&&O.clipShadows===!0&&Array.isArray(O.clippingPlanes)&&O.clippingPlanes.length!==0||O.displacementMap&&O.displacementScale!==0||O.alphaMap&&O.alphaTest>0||O.map&&O.alphaTest>0||O.alphaToCoverage===!0){const $=R.uuid,ft=O.uuid;let gt=p[$];gt===void 0&&(gt={},p[$]=gt);let lt=gt[ft];lt===void 0&&(lt=R.clone(),gt[ft]=lt,O.addEventListener("dispose",F)),R=lt}if(R.visible=O.visible,R.wireframe=O.wireframe,w===ba?R.side=O.shadowSide!==null?O.shadowSide:O.side:R.side=O.shadowSide!==null?O.shadowSide:m[O.side],R.alphaMap=O.alphaMap,R.alphaTest=O.alphaToCoverage===!0?.5:O.alphaTest,R.map=O.map,R.clipShadows=O.clipShadows,R.clippingPlanes=O.clippingPlanes,R.clipIntersection=O.clipIntersection,R.displacementMap=O.displacementMap,R.displacementScale=O.displacementScale,R.displacementBias=O.displacementBias,R.wireframeLinewidth=O.wireframeLinewidth,R.linewidth=O.linewidth,H.isPointLight===!0&&R.isMeshDistanceMaterial===!0){const $=o.properties.get(R);$.light=H}return R}function D(I,O,H,w,R){if(I.visible===!1)return;if(I.layers.test(O.layers)&&(I.isMesh||I.isLine||I.isPoints)&&(I.castShadow||I.receiveShadow&&R===ba)&&(!I.frustumCulled||r.intersectsObject(I))){I.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,I.matrixWorld);const ft=e.update(I),gt=I.material;if(Array.isArray(gt)){const lt=ft.groups;for(let j=0,ot=lt.length;j<ot;j++){const Q=lt[j],St=gt[Q.materialIndex];if(St&&St.visible){const xt=L(I,St,w,R);I.onBeforeShadow(o,I,O,H,ft,xt,Q),o.renderBufferDirect(H,null,ft,xt,I,Q),I.onAfterShadow(o,I,O,H,ft,xt,Q)}}}else if(gt.visible){const lt=L(I,gt,w,R);I.onBeforeShadow(o,I,O,H,ft,lt,null),o.renderBufferDirect(H,null,ft,lt,I,null),I.onAfterShadow(o,I,O,H,ft,lt,null)}}const $=I.children;for(let ft=0,gt=$.length;ft<gt;ft++)D($[ft],O,H,w,R)}function F(I){I.target.removeEventListener("dispose",F);for(const H in p){const w=p[H],R=I.target.uuid;R in w&&(w[R].dispose(),delete w[R])}}}const aC={[jd]:Wd,[Zd]:Jd,[Kd]:$d,[so]:Qd,[Wd]:jd,[Jd]:Zd,[$d]:Kd,[Qd]:so};function rC(o,e){function i(){let q=!1;const wt=new ln;let Lt=null;const Yt=new ln(0,0,0,0);return{setMask:function(At){Lt!==At&&!q&&(o.colorMask(At,At,At,At),Lt=At)},setLocked:function(At){q=At},setClear:function(At,yt,Qt,he,qe){qe===!0&&(At*=he,yt*=he,Qt*=he),wt.set(At,yt,Qt,he),Yt.equals(wt)===!1&&(o.clearColor(At,yt,Qt,he),Yt.copy(wt))},reset:function(){q=!1,Lt=null,Yt.set(-1,0,0,0)}}}function r(){let q=!1,wt=!1,Lt=null,Yt=null,At=null;return{setReversed:function(yt){if(wt!==yt){const Qt=e.get("EXT_clip_control");yt?Qt.clipControlEXT(Qt.LOWER_LEFT_EXT,Qt.ZERO_TO_ONE_EXT):Qt.clipControlEXT(Qt.LOWER_LEFT_EXT,Qt.NEGATIVE_ONE_TO_ONE_EXT),wt=yt;const he=At;At=null,this.setClear(he)}},getReversed:function(){return wt},setTest:function(yt){yt?rt(o.DEPTH_TEST):bt(o.DEPTH_TEST)},setMask:function(yt){Lt!==yt&&!q&&(o.depthMask(yt),Lt=yt)},setFunc:function(yt){if(wt&&(yt=aC[yt]),Yt!==yt){switch(yt){case jd:o.depthFunc(o.NEVER);break;case Wd:o.depthFunc(o.ALWAYS);break;case Zd:o.depthFunc(o.LESS);break;case so:o.depthFunc(o.LEQUAL);break;case Kd:o.depthFunc(o.EQUAL);break;case Qd:o.depthFunc(o.GEQUAL);break;case Jd:o.depthFunc(o.GREATER);break;case $d:o.depthFunc(o.NOTEQUAL);break;default:o.depthFunc(o.LEQUAL)}Yt=yt}},setLocked:function(yt){q=yt},setClear:function(yt){At!==yt&&(wt&&(yt=1-yt),o.clearDepth(yt),At=yt)},reset:function(){q=!1,Lt=null,Yt=null,At=null,wt=!1}}}function l(){let q=!1,wt=null,Lt=null,Yt=null,At=null,yt=null,Qt=null,he=null,qe=null;return{setTest:function(be){q||(be?rt(o.STENCIL_TEST):bt(o.STENCIL_TEST))},setMask:function(be){wt!==be&&!q&&(o.stencilMask(be),wt=be)},setFunc:function(be,en,_n){(Lt!==be||Yt!==en||At!==_n)&&(o.stencilFunc(be,en,_n),Lt=be,Yt=en,At=_n)},setOp:function(be,en,_n){(yt!==be||Qt!==en||he!==_n)&&(o.stencilOp(be,en,_n),yt=be,Qt=en,he=_n)},setLocked:function(be){q=be},setClear:function(be){qe!==be&&(o.clearStencil(be),qe=be)},reset:function(){q=!1,wt=null,Lt=null,Yt=null,At=null,yt=null,Qt=null,he=null,qe=null}}}const c=new i,h=new r,d=new l,g=new WeakMap,p=new WeakMap;let _={},m={},x=new WeakMap,S=[],E=null,A=!1,M=null,y=null,N=null,L=null,D=null,F=null,I=null,O=new we(0,0,0),H=0,w=!1,R=null,V=null,$=null,ft=null,gt=null;const lt=o.getParameter(o.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,ot=0;const Q=o.getParameter(o.VERSION);Q.indexOf("WebGL")!==-1?(ot=parseFloat(/^WebGL (\d)/.exec(Q)[1]),j=ot>=1):Q.indexOf("OpenGL ES")!==-1&&(ot=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),j=ot>=2);let St=null,xt={};const Gt=o.getParameter(o.SCISSOR_BOX),ne=o.getParameter(o.VIEWPORT),ye=new ln().fromArray(Gt),P=new ln().fromArray(ne);function ht(q,wt,Lt,Yt){const At=new Uint8Array(4),yt=o.createTexture();o.bindTexture(q,yt),o.texParameteri(q,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(q,o.TEXTURE_MAG_FILTER,o.NEAREST);for(let Qt=0;Qt<Lt;Qt++)q===o.TEXTURE_3D||q===o.TEXTURE_2D_ARRAY?o.texImage3D(wt,0,o.RGBA,1,1,Yt,0,o.RGBA,o.UNSIGNED_BYTE,At):o.texImage2D(wt+Qt,0,o.RGBA,1,1,0,o.RGBA,o.UNSIGNED_BYTE,At);return yt}const Y={};Y[o.TEXTURE_2D]=ht(o.TEXTURE_2D,o.TEXTURE_2D,1),Y[o.TEXTURE_CUBE_MAP]=ht(o.TEXTURE_CUBE_MAP,o.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[o.TEXTURE_2D_ARRAY]=ht(o.TEXTURE_2D_ARRAY,o.TEXTURE_2D_ARRAY,1,1),Y[o.TEXTURE_3D]=ht(o.TEXTURE_3D,o.TEXTURE_3D,1,1),c.setClear(0,0,0,1),h.setClear(1),d.setClear(0),rt(o.DEPTH_TEST),h.setFunc(so),Wt(!1),G(mv),rt(o.CULL_FACE),ze(hr);function rt(q){_[q]!==!0&&(o.enable(q),_[q]=!0)}function bt(q){_[q]!==!1&&(o.disable(q),_[q]=!1)}function Ot(q,wt){return m[q]!==wt?(o.bindFramebuffer(q,wt),m[q]=wt,q===o.DRAW_FRAMEBUFFER&&(m[o.FRAMEBUFFER]=wt),q===o.FRAMEBUFFER&&(m[o.DRAW_FRAMEBUFFER]=wt),!0):!1}function Dt(q,wt){let Lt=S,Yt=!1;if(q){Lt=x.get(wt),Lt===void 0&&(Lt=[],x.set(wt,Lt));const At=q.textures;if(Lt.length!==At.length||Lt[0]!==o.COLOR_ATTACHMENT0){for(let yt=0,Qt=At.length;yt<Qt;yt++)Lt[yt]=o.COLOR_ATTACHMENT0+yt;Lt.length=At.length,Yt=!0}}else Lt[0]!==o.BACK&&(Lt[0]=o.BACK,Yt=!0);Yt&&o.drawBuffers(Lt)}function Tt(q){return E!==q?(o.useProgram(q),E=q,!0):!1}const qt={[Wr]:o.FUNC_ADD,[YM]:o.FUNC_SUBTRACT,[jM]:o.FUNC_REVERSE_SUBTRACT};qt[WM]=o.MIN,qt[ZM]=o.MAX;const B={[KM]:o.ZERO,[QM]:o.ONE,[JM]:o.SRC_COLOR,[qd]:o.SRC_ALPHA,[aE]:o.SRC_ALPHA_SATURATE,[nE]:o.DST_COLOR,[tE]:o.DST_ALPHA,[$M]:o.ONE_MINUS_SRC_COLOR,[Yd]:o.ONE_MINUS_SRC_ALPHA,[iE]:o.ONE_MINUS_DST_COLOR,[eE]:o.ONE_MINUS_DST_ALPHA,[rE]:o.CONSTANT_COLOR,[sE]:o.ONE_MINUS_CONSTANT_COLOR,[oE]:o.CONSTANT_ALPHA,[lE]:o.ONE_MINUS_CONSTANT_ALPHA};function ze(q,wt,Lt,Yt,At,yt,Qt,he,qe,be){if(q===hr){A===!0&&(bt(o.BLEND),A=!1);return}if(A===!1&&(rt(o.BLEND),A=!0),q!==qM){if(q!==M||be!==w){if((y!==Wr||D!==Wr)&&(o.blendEquation(o.FUNC_ADD),y=Wr,D=Wr),be)switch(q){case ao:o.blendFuncSeparate(o.ONE,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case gv:o.blendFunc(o.ONE,o.ONE);break;case _v:o.blendFuncSeparate(o.ZERO,o.ONE_MINUS_SRC_COLOR,o.ZERO,o.ONE);break;case vv:o.blendFuncSeparate(o.DST_COLOR,o.ONE_MINUS_SRC_ALPHA,o.ZERO,o.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",q);break}else switch(q){case ao:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA,o.ONE,o.ONE_MINUS_SRC_ALPHA);break;case gv:o.blendFuncSeparate(o.SRC_ALPHA,o.ONE,o.ONE,o.ONE);break;case _v:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case vv:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",q);break}N=null,L=null,F=null,I=null,O.set(0,0,0),H=0,M=q,w=be}return}At=At||wt,yt=yt||Lt,Qt=Qt||Yt,(wt!==y||At!==D)&&(o.blendEquationSeparate(qt[wt],qt[At]),y=wt,D=At),(Lt!==N||Yt!==L||yt!==F||Qt!==I)&&(o.blendFuncSeparate(B[Lt],B[Yt],B[yt],B[Qt]),N=Lt,L=Yt,F=yt,I=Qt),(he.equals(O)===!1||qe!==H)&&(o.blendColor(he.r,he.g,he.b,qe),O.copy(he),H=qe),M=q,w=!1}function le(q,wt){q.side===Li?bt(o.CULL_FACE):rt(o.CULL_FACE);let Lt=q.side===$n;wt&&(Lt=!Lt),Wt(Lt),q.blending===ao&&q.transparent===!1?ze(hr):ze(q.blending,q.blendEquation,q.blendSrc,q.blendDst,q.blendEquationAlpha,q.blendSrcAlpha,q.blendDstAlpha,q.blendColor,q.blendAlpha,q.premultipliedAlpha),h.setFunc(q.depthFunc),h.setTest(q.depthTest),h.setMask(q.depthWrite),c.setMask(q.colorWrite);const Yt=q.stencilWrite;d.setTest(Yt),Yt&&(d.setMask(q.stencilWriteMask),d.setFunc(q.stencilFunc,q.stencilRef,q.stencilFuncMask),d.setOp(q.stencilFail,q.stencilZFail,q.stencilZPass)),Mt(q.polygonOffset,q.polygonOffsetFactor,q.polygonOffsetUnits),q.alphaToCoverage===!0?rt(o.SAMPLE_ALPHA_TO_COVERAGE):bt(o.SAMPLE_ALPHA_TO_COVERAGE)}function Wt(q){R!==q&&(q?o.frontFace(o.CW):o.frontFace(o.CCW),R=q)}function G(q){q!==kM?(rt(o.CULL_FACE),q!==V&&(q===mv?o.cullFace(o.BACK):q===XM?o.cullFace(o.FRONT):o.cullFace(o.FRONT_AND_BACK))):bt(o.CULL_FACE),V=q}function _t(q){q!==$&&(j&&o.lineWidth(q),$=q)}function Mt(q,wt,Lt){q?(rt(o.POLYGON_OFFSET_FILL),(ft!==wt||gt!==Lt)&&(o.polygonOffset(wt,Lt),ft=wt,gt=Lt)):bt(o.POLYGON_OFFSET_FILL)}function Ht(q){q?rt(o.SCISSOR_TEST):bt(o.SCISSOR_TEST)}function oe(q){q===void 0&&(q=o.TEXTURE0+lt-1),St!==q&&(o.activeTexture(q),St=q)}function kt(q,wt,Lt){Lt===void 0&&(St===null?Lt=o.TEXTURE0+lt-1:Lt=St);let Yt=xt[Lt];Yt===void 0&&(Yt={type:void 0,texture:void 0},xt[Lt]=Yt),(Yt.type!==q||Yt.texture!==wt)&&(St!==Lt&&(o.activeTexture(Lt),St=Lt),o.bindTexture(q,wt||Y[q]),Yt.type=q,Yt.texture=wt)}function U(){const q=xt[St];q!==void 0&&q.type!==void 0&&(o.bindTexture(q.type,null),q.type=void 0,q.texture=void 0)}function b(){try{o.compressedTexImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function nt(){try{o.compressedTexImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function dt(){try{o.texSubImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function Et(){try{o.texSubImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function pt(){try{o.compressedTexSubImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function jt(){try{o.compressedTexSubImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function Ut(){try{o.texStorage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function $t(){try{o.texStorage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function ee(){try{o.texImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function Ct(){try{o.texImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function Pt(q){ye.equals(q)===!1&&(o.scissor(q.x,q.y,q.z,q.w),ye.copy(q))}function ue(q){P.equals(q)===!1&&(o.viewport(q.x,q.y,q.z,q.w),P.copy(q))}function te(q,wt){let Lt=p.get(wt);Lt===void 0&&(Lt=new WeakMap,p.set(wt,Lt));let Yt=Lt.get(q);Yt===void 0&&(Yt=o.getUniformBlockIndex(wt,q.name),Lt.set(q,Yt))}function It(q,wt){const Yt=p.get(wt).get(q);g.get(wt)!==Yt&&(o.uniformBlockBinding(wt,Yt,q.__bindingPointIndex),g.set(wt,Yt))}function de(){o.disable(o.BLEND),o.disable(o.CULL_FACE),o.disable(o.DEPTH_TEST),o.disable(o.POLYGON_OFFSET_FILL),o.disable(o.SCISSOR_TEST),o.disable(o.STENCIL_TEST),o.disable(o.SAMPLE_ALPHA_TO_COVERAGE),o.blendEquation(o.FUNC_ADD),o.blendFunc(o.ONE,o.ZERO),o.blendFuncSeparate(o.ONE,o.ZERO,o.ONE,o.ZERO),o.blendColor(0,0,0,0),o.colorMask(!0,!0,!0,!0),o.clearColor(0,0,0,0),o.depthMask(!0),o.depthFunc(o.LESS),h.setReversed(!1),o.clearDepth(1),o.stencilMask(4294967295),o.stencilFunc(o.ALWAYS,0,4294967295),o.stencilOp(o.KEEP,o.KEEP,o.KEEP),o.clearStencil(0),o.cullFace(o.BACK),o.frontFace(o.CCW),o.polygonOffset(0,0),o.activeTexture(o.TEXTURE0),o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.useProgram(null),o.lineWidth(1),o.scissor(0,0,o.canvas.width,o.canvas.height),o.viewport(0,0,o.canvas.width,o.canvas.height),_={},St=null,xt={},m={},x=new WeakMap,S=[],E=null,A=!1,M=null,y=null,N=null,L=null,D=null,F=null,I=null,O=new we(0,0,0),H=0,w=!1,R=null,V=null,$=null,ft=null,gt=null,ye.set(0,0,o.canvas.width,o.canvas.height),P.set(0,0,o.canvas.width,o.canvas.height),c.reset(),h.reset(),d.reset()}return{buffers:{color:c,depth:h,stencil:d},enable:rt,disable:bt,bindFramebuffer:Ot,drawBuffers:Dt,useProgram:Tt,setBlending:ze,setMaterial:le,setFlipSided:Wt,setCullFace:G,setLineWidth:_t,setPolygonOffset:Mt,setScissorTest:Ht,activeTexture:oe,bindTexture:kt,unbindTexture:U,compressedTexImage2D:b,compressedTexImage3D:nt,texImage2D:ee,texImage3D:Ct,updateUBOMapping:te,uniformBlockBinding:It,texStorage2D:Ut,texStorage3D:$t,texSubImage2D:dt,texSubImage3D:Et,compressedTexSubImage2D:pt,compressedTexSubImage3D:jt,scissor:Pt,viewport:ue,reset:de}}function sC(o,e,i,r,l,c,h){const d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,g=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),p=new Te,_=new WeakMap;let m;const x=new WeakMap;let S=!1;try{S=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function E(U,b){return S?new OffscreenCanvas(U,b):Ac("canvas")}function A(U,b,nt){let dt=1;const Et=kt(U);if((Et.width>nt||Et.height>nt)&&(dt=nt/Math.max(Et.width,Et.height)),dt<1)if(typeof HTMLImageElement<"u"&&U instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&U instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&U instanceof ImageBitmap||typeof VideoFrame<"u"&&U instanceof VideoFrame){const pt=Math.floor(dt*Et.width),jt=Math.floor(dt*Et.height);m===void 0&&(m=E(pt,jt));const Ut=b?E(pt,jt):m;return Ut.width=pt,Ut.height=jt,Ut.getContext("2d").drawImage(U,0,0,pt,jt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Et.width+"x"+Et.height+") to ("+pt+"x"+jt+")."),Ut}else return"data"in U&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Et.width+"x"+Et.height+")."),U;return U}function M(U){return U.generateMipmaps}function y(U){o.generateMipmap(U)}function N(U){return U.isWebGLCubeRenderTarget?o.TEXTURE_CUBE_MAP:U.isWebGL3DRenderTarget?o.TEXTURE_3D:U.isWebGLArrayRenderTarget||U.isCompressedArrayTexture?o.TEXTURE_2D_ARRAY:o.TEXTURE_2D}function L(U,b,nt,dt,Et=!1){if(U!==null){if(o[U]!==void 0)return o[U];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+U+"'")}let pt=b;if(b===o.RED&&(nt===o.FLOAT&&(pt=o.R32F),nt===o.HALF_FLOAT&&(pt=o.R16F),nt===o.UNSIGNED_BYTE&&(pt=o.R8)),b===o.RED_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.R8UI),nt===o.UNSIGNED_SHORT&&(pt=o.R16UI),nt===o.UNSIGNED_INT&&(pt=o.R32UI),nt===o.BYTE&&(pt=o.R8I),nt===o.SHORT&&(pt=o.R16I),nt===o.INT&&(pt=o.R32I)),b===o.RG&&(nt===o.FLOAT&&(pt=o.RG32F),nt===o.HALF_FLOAT&&(pt=o.RG16F),nt===o.UNSIGNED_BYTE&&(pt=o.RG8)),b===o.RG_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RG8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RG16UI),nt===o.UNSIGNED_INT&&(pt=o.RG32UI),nt===o.BYTE&&(pt=o.RG8I),nt===o.SHORT&&(pt=o.RG16I),nt===o.INT&&(pt=o.RG32I)),b===o.RGB_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RGB8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RGB16UI),nt===o.UNSIGNED_INT&&(pt=o.RGB32UI),nt===o.BYTE&&(pt=o.RGB8I),nt===o.SHORT&&(pt=o.RGB16I),nt===o.INT&&(pt=o.RGB32I)),b===o.RGBA_INTEGER&&(nt===o.UNSIGNED_BYTE&&(pt=o.RGBA8UI),nt===o.UNSIGNED_SHORT&&(pt=o.RGBA16UI),nt===o.UNSIGNED_INT&&(pt=o.RGBA32UI),nt===o.BYTE&&(pt=o.RGBA8I),nt===o.SHORT&&(pt=o.RGBA16I),nt===o.INT&&(pt=o.RGBA32I)),b===o.RGB&&(nt===o.UNSIGNED_INT_5_9_9_9_REV&&(pt=o.RGB9_E5),nt===o.UNSIGNED_INT_10F_11F_11F_REV&&(pt=o.R11F_G11F_B10F)),b===o.RGBA){const jt=Et?Tc:Oe.getTransfer(dt);nt===o.FLOAT&&(pt=o.RGBA32F),nt===o.HALF_FLOAT&&(pt=o.RGBA16F),nt===o.UNSIGNED_BYTE&&(pt=jt===je?o.SRGB8_ALPHA8:o.RGBA8),nt===o.UNSIGNED_SHORT_4_4_4_4&&(pt=o.RGBA4),nt===o.UNSIGNED_SHORT_5_5_5_1&&(pt=o.RGB5_A1)}return(pt===o.R16F||pt===o.R32F||pt===o.RG16F||pt===o.RG32F||pt===o.RGBA16F||pt===o.RGBA32F)&&e.get("EXT_color_buffer_float"),pt}function D(U,b){let nt;return U?b===null||b===Jr||b===xl?nt=o.DEPTH24_STENCIL8:b===Ca?nt=o.DEPTH32F_STENCIL8:b===vl&&(nt=o.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Jr||b===xl?nt=o.DEPTH_COMPONENT24:b===Ca?nt=o.DEPTH_COMPONENT32F:b===vl&&(nt=o.DEPTH_COMPONENT16),nt}function F(U,b){return M(U)===!0||U.isFramebufferTexture&&U.minFilter!==Ii&&U.minFilter!==zi?Math.log2(Math.max(b.width,b.height))+1:U.mipmaps!==void 0&&U.mipmaps.length>0?U.mipmaps.length:U.isCompressedTexture&&Array.isArray(U.image)?b.mipmaps.length:1}function I(U){const b=U.target;b.removeEventListener("dispose",I),H(b),b.isVideoTexture&&_.delete(b)}function O(U){const b=U.target;b.removeEventListener("dispose",O),R(b)}function H(U){const b=r.get(U);if(b.__webglInit===void 0)return;const nt=U.source,dt=x.get(nt);if(dt){const Et=dt[b.__cacheKey];Et.usedTimes--,Et.usedTimes===0&&w(U),Object.keys(dt).length===0&&x.delete(nt)}r.remove(U)}function w(U){const b=r.get(U);o.deleteTexture(b.__webglTexture);const nt=U.source,dt=x.get(nt);delete dt[b.__cacheKey],h.memory.textures--}function R(U){const b=r.get(U);if(U.depthTexture&&(U.depthTexture.dispose(),r.remove(U.depthTexture)),U.isWebGLCubeRenderTarget)for(let dt=0;dt<6;dt++){if(Array.isArray(b.__webglFramebuffer[dt]))for(let Et=0;Et<b.__webglFramebuffer[dt].length;Et++)o.deleteFramebuffer(b.__webglFramebuffer[dt][Et]);else o.deleteFramebuffer(b.__webglFramebuffer[dt]);b.__webglDepthbuffer&&o.deleteRenderbuffer(b.__webglDepthbuffer[dt])}else{if(Array.isArray(b.__webglFramebuffer))for(let dt=0;dt<b.__webglFramebuffer.length;dt++)o.deleteFramebuffer(b.__webglFramebuffer[dt]);else o.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&o.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&o.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let dt=0;dt<b.__webglColorRenderbuffer.length;dt++)b.__webglColorRenderbuffer[dt]&&o.deleteRenderbuffer(b.__webglColorRenderbuffer[dt]);b.__webglDepthRenderbuffer&&o.deleteRenderbuffer(b.__webglDepthRenderbuffer)}const nt=U.textures;for(let dt=0,Et=nt.length;dt<Et;dt++){const pt=r.get(nt[dt]);pt.__webglTexture&&(o.deleteTexture(pt.__webglTexture),h.memory.textures--),r.remove(nt[dt])}r.remove(U)}let V=0;function $(){V=0}function ft(){const U=V;return U>=l.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+U+" texture units while this GPU supports only "+l.maxTextures),V+=1,U}function gt(U){const b=[];return b.push(U.wrapS),b.push(U.wrapT),b.push(U.wrapR||0),b.push(U.magFilter),b.push(U.minFilter),b.push(U.anisotropy),b.push(U.internalFormat),b.push(U.format),b.push(U.type),b.push(U.generateMipmaps),b.push(U.premultiplyAlpha),b.push(U.flipY),b.push(U.unpackAlignment),b.push(U.colorSpace),b.join()}function lt(U,b){const nt=r.get(U);if(U.isVideoTexture&&Ht(U),U.isRenderTargetTexture===!1&&U.isExternalTexture!==!0&&U.version>0&&nt.__version!==U.version){const dt=U.image;if(dt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(dt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Y(nt,U,b);return}}else U.isExternalTexture&&(nt.__webglTexture=U.sourceTexture?U.sourceTexture:null);i.bindTexture(o.TEXTURE_2D,nt.__webglTexture,o.TEXTURE0+b)}function j(U,b){const nt=r.get(U);if(U.isRenderTargetTexture===!1&&U.version>0&&nt.__version!==U.version){Y(nt,U,b);return}i.bindTexture(o.TEXTURE_2D_ARRAY,nt.__webglTexture,o.TEXTURE0+b)}function ot(U,b){const nt=r.get(U);if(U.isRenderTargetTexture===!1&&U.version>0&&nt.__version!==U.version){Y(nt,U,b);return}i.bindTexture(o.TEXTURE_3D,nt.__webglTexture,o.TEXTURE0+b)}function Q(U,b){const nt=r.get(U);if(U.version>0&&nt.__version!==U.version){rt(nt,U,b);return}i.bindTexture(o.TEXTURE_CUBE_MAP,nt.__webglTexture,o.TEXTURE0+b)}const St={[np]:o.REPEAT,[Kr]:o.CLAMP_TO_EDGE,[ip]:o.MIRRORED_REPEAT},xt={[Ii]:o.NEAREST,[vE]:o.NEAREST_MIPMAP_NEAREST,[Ku]:o.NEAREST_MIPMAP_LINEAR,[zi]:o.LINEAR,[pd]:o.LINEAR_MIPMAP_NEAREST,[Qr]:o.LINEAR_MIPMAP_LINEAR},Gt={[ME]:o.NEVER,[CE]:o.ALWAYS,[EE]:o.LESS,[Lx]:o.LEQUAL,[TE]:o.EQUAL,[RE]:o.GEQUAL,[bE]:o.GREATER,[AE]:o.NOTEQUAL};function ne(U,b){if(b.type===Ca&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===zi||b.magFilter===pd||b.magFilter===Ku||b.magFilter===Qr||b.minFilter===zi||b.minFilter===pd||b.minFilter===Ku||b.minFilter===Qr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),o.texParameteri(U,o.TEXTURE_WRAP_S,St[b.wrapS]),o.texParameteri(U,o.TEXTURE_WRAP_T,St[b.wrapT]),(U===o.TEXTURE_3D||U===o.TEXTURE_2D_ARRAY)&&o.texParameteri(U,o.TEXTURE_WRAP_R,St[b.wrapR]),o.texParameteri(U,o.TEXTURE_MAG_FILTER,xt[b.magFilter]),o.texParameteri(U,o.TEXTURE_MIN_FILTER,xt[b.minFilter]),b.compareFunction&&(o.texParameteri(U,o.TEXTURE_COMPARE_MODE,o.COMPARE_REF_TO_TEXTURE),o.texParameteri(U,o.TEXTURE_COMPARE_FUNC,Gt[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Ii||b.minFilter!==Ku&&b.minFilter!==Qr||b.type===Ca&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||r.get(b).__currentAnisotropy){const nt=e.get("EXT_texture_filter_anisotropic");o.texParameterf(U,nt.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,l.getMaxAnisotropy())),r.get(b).__currentAnisotropy=b.anisotropy}}}function ye(U,b){let nt=!1;U.__webglInit===void 0&&(U.__webglInit=!0,b.addEventListener("dispose",I));const dt=b.source;let Et=x.get(dt);Et===void 0&&(Et={},x.set(dt,Et));const pt=gt(b);if(pt!==U.__cacheKey){Et[pt]===void 0&&(Et[pt]={texture:o.createTexture(),usedTimes:0},h.memory.textures++,nt=!0),Et[pt].usedTimes++;const jt=Et[U.__cacheKey];jt!==void 0&&(Et[U.__cacheKey].usedTimes--,jt.usedTimes===0&&w(b)),U.__cacheKey=pt,U.__webglTexture=Et[pt].texture}return nt}function P(U,b,nt){return Math.floor(Math.floor(U/nt)/b)}function ht(U,b,nt,dt){const pt=U.updateRanges;if(pt.length===0)i.texSubImage2D(o.TEXTURE_2D,0,0,0,b.width,b.height,nt,dt,b.data);else{pt.sort((Ct,Pt)=>Ct.start-Pt.start);let jt=0;for(let Ct=1;Ct<pt.length;Ct++){const Pt=pt[jt],ue=pt[Ct],te=Pt.start+Pt.count,It=P(ue.start,b.width,4),de=P(Pt.start,b.width,4);ue.start<=te+1&&It===de&&P(ue.start+ue.count-1,b.width,4)===It?Pt.count=Math.max(Pt.count,ue.start+ue.count-Pt.start):(++jt,pt[jt]=ue)}pt.length=jt+1;const Ut=o.getParameter(o.UNPACK_ROW_LENGTH),$t=o.getParameter(o.UNPACK_SKIP_PIXELS),ee=o.getParameter(o.UNPACK_SKIP_ROWS);o.pixelStorei(o.UNPACK_ROW_LENGTH,b.width);for(let Ct=0,Pt=pt.length;Ct<Pt;Ct++){const ue=pt[Ct],te=Math.floor(ue.start/4),It=Math.ceil(ue.count/4),de=te%b.width,q=Math.floor(te/b.width),wt=It,Lt=1;o.pixelStorei(o.UNPACK_SKIP_PIXELS,de),o.pixelStorei(o.UNPACK_SKIP_ROWS,q),i.texSubImage2D(o.TEXTURE_2D,0,de,q,wt,Lt,nt,dt,b.data)}U.clearUpdateRanges(),o.pixelStorei(o.UNPACK_ROW_LENGTH,Ut),o.pixelStorei(o.UNPACK_SKIP_PIXELS,$t),o.pixelStorei(o.UNPACK_SKIP_ROWS,ee)}}function Y(U,b,nt){let dt=o.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(dt=o.TEXTURE_2D_ARRAY),b.isData3DTexture&&(dt=o.TEXTURE_3D);const Et=ye(U,b),pt=b.source;i.bindTexture(dt,U.__webglTexture,o.TEXTURE0+nt);const jt=r.get(pt);if(pt.version!==jt.__version||Et===!0){i.activeTexture(o.TEXTURE0+nt);const Ut=Oe.getPrimaries(Oe.workingColorSpace),$t=b.colorSpace===fr?null:Oe.getPrimaries(b.colorSpace),ee=b.colorSpace===fr||Ut===$t?o.NONE:o.BROWSER_DEFAULT_WEBGL;o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,b.flipY),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),o.pixelStorei(o.UNPACK_ALIGNMENT,b.unpackAlignment),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let Ct=A(b.image,!1,l.maxTextureSize);Ct=oe(b,Ct);const Pt=c.convert(b.format,b.colorSpace),ue=c.convert(b.type);let te=L(b.internalFormat,Pt,ue,b.colorSpace,b.isVideoTexture);ne(dt,b);let It;const de=b.mipmaps,q=b.isVideoTexture!==!0,wt=jt.__version===void 0||Et===!0,Lt=pt.dataReady,Yt=F(b,Ct);if(b.isDepthTexture)te=D(b.format===Sl,b.type),wt&&(q?i.texStorage2D(o.TEXTURE_2D,1,te,Ct.width,Ct.height):i.texImage2D(o.TEXTURE_2D,0,te,Ct.width,Ct.height,0,Pt,ue,null));else if(b.isDataTexture)if(de.length>0){q&&wt&&i.texStorage2D(o.TEXTURE_2D,Yt,te,de[0].width,de[0].height);for(let At=0,yt=de.length;At<yt;At++)It=de[At],q?Lt&&i.texSubImage2D(o.TEXTURE_2D,At,0,0,It.width,It.height,Pt,ue,It.data):i.texImage2D(o.TEXTURE_2D,At,te,It.width,It.height,0,Pt,ue,It.data);b.generateMipmaps=!1}else q?(wt&&i.texStorage2D(o.TEXTURE_2D,Yt,te,Ct.width,Ct.height),Lt&&ht(b,Ct,Pt,ue)):i.texImage2D(o.TEXTURE_2D,0,te,Ct.width,Ct.height,0,Pt,ue,Ct.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){q&&wt&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Yt,te,de[0].width,de[0].height,Ct.depth);for(let At=0,yt=de.length;At<yt;At++)if(It=de[At],b.format!==Pi)if(Pt!==null)if(q){if(Lt)if(b.layerUpdates.size>0){const Qt=Zv(It.width,It.height,b.format,b.type);for(const he of b.layerUpdates){const qe=It.data.subarray(he*Qt/It.data.BYTES_PER_ELEMENT,(he+1)*Qt/It.data.BYTES_PER_ELEMENT);i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,At,0,0,he,It.width,It.height,1,Pt,qe)}b.clearLayerUpdates()}else i.compressedTexSubImage3D(o.TEXTURE_2D_ARRAY,At,0,0,0,It.width,It.height,Ct.depth,Pt,It.data)}else i.compressedTexImage3D(o.TEXTURE_2D_ARRAY,At,te,It.width,It.height,Ct.depth,0,It.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else q?Lt&&i.texSubImage3D(o.TEXTURE_2D_ARRAY,At,0,0,0,It.width,It.height,Ct.depth,Pt,ue,It.data):i.texImage3D(o.TEXTURE_2D_ARRAY,At,te,It.width,It.height,Ct.depth,0,Pt,ue,It.data)}else{q&&wt&&i.texStorage2D(o.TEXTURE_2D,Yt,te,de[0].width,de[0].height);for(let At=0,yt=de.length;At<yt;At++)It=de[At],b.format!==Pi?Pt!==null?q?Lt&&i.compressedTexSubImage2D(o.TEXTURE_2D,At,0,0,It.width,It.height,Pt,It.data):i.compressedTexImage2D(o.TEXTURE_2D,At,te,It.width,It.height,0,It.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):q?Lt&&i.texSubImage2D(o.TEXTURE_2D,At,0,0,It.width,It.height,Pt,ue,It.data):i.texImage2D(o.TEXTURE_2D,At,te,It.width,It.height,0,Pt,ue,It.data)}else if(b.isDataArrayTexture)if(q){if(wt&&i.texStorage3D(o.TEXTURE_2D_ARRAY,Yt,te,Ct.width,Ct.height,Ct.depth),Lt)if(b.layerUpdates.size>0){const At=Zv(Ct.width,Ct.height,b.format,b.type);for(const yt of b.layerUpdates){const Qt=Ct.data.subarray(yt*At/Ct.data.BYTES_PER_ELEMENT,(yt+1)*At/Ct.data.BYTES_PER_ELEMENT);i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,yt,Ct.width,Ct.height,1,Pt,ue,Qt)}b.clearLayerUpdates()}else i.texSubImage3D(o.TEXTURE_2D_ARRAY,0,0,0,0,Ct.width,Ct.height,Ct.depth,Pt,ue,Ct.data)}else i.texImage3D(o.TEXTURE_2D_ARRAY,0,te,Ct.width,Ct.height,Ct.depth,0,Pt,ue,Ct.data);else if(b.isData3DTexture)q?(wt&&i.texStorage3D(o.TEXTURE_3D,Yt,te,Ct.width,Ct.height,Ct.depth),Lt&&i.texSubImage3D(o.TEXTURE_3D,0,0,0,0,Ct.width,Ct.height,Ct.depth,Pt,ue,Ct.data)):i.texImage3D(o.TEXTURE_3D,0,te,Ct.width,Ct.height,Ct.depth,0,Pt,ue,Ct.data);else if(b.isFramebufferTexture){if(wt)if(q)i.texStorage2D(o.TEXTURE_2D,Yt,te,Ct.width,Ct.height);else{let At=Ct.width,yt=Ct.height;for(let Qt=0;Qt<Yt;Qt++)i.texImage2D(o.TEXTURE_2D,Qt,te,At,yt,0,Pt,ue,null),At>>=1,yt>>=1}}else if(de.length>0){if(q&&wt){const At=kt(de[0]);i.texStorage2D(o.TEXTURE_2D,Yt,te,At.width,At.height)}for(let At=0,yt=de.length;At<yt;At++)It=de[At],q?Lt&&i.texSubImage2D(o.TEXTURE_2D,At,0,0,Pt,ue,It):i.texImage2D(o.TEXTURE_2D,At,te,Pt,ue,It);b.generateMipmaps=!1}else if(q){if(wt){const At=kt(Ct);i.texStorage2D(o.TEXTURE_2D,Yt,te,At.width,At.height)}Lt&&i.texSubImage2D(o.TEXTURE_2D,0,0,0,Pt,ue,Ct)}else i.texImage2D(o.TEXTURE_2D,0,te,Pt,ue,Ct);M(b)&&y(dt),jt.__version=pt.version,b.onUpdate&&b.onUpdate(b)}U.__version=b.version}function rt(U,b,nt){if(b.image.length!==6)return;const dt=ye(U,b),Et=b.source;i.bindTexture(o.TEXTURE_CUBE_MAP,U.__webglTexture,o.TEXTURE0+nt);const pt=r.get(Et);if(Et.version!==pt.__version||dt===!0){i.activeTexture(o.TEXTURE0+nt);const jt=Oe.getPrimaries(Oe.workingColorSpace),Ut=b.colorSpace===fr?null:Oe.getPrimaries(b.colorSpace),$t=b.colorSpace===fr||jt===Ut?o.NONE:o.BROWSER_DEFAULT_WEBGL;o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,b.flipY),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),o.pixelStorei(o.UNPACK_ALIGNMENT,b.unpackAlignment),o.pixelStorei(o.UNPACK_COLORSPACE_CONVERSION_WEBGL,$t);const ee=b.isCompressedTexture||b.image[0].isCompressedTexture,Ct=b.image[0]&&b.image[0].isDataTexture,Pt=[];for(let yt=0;yt<6;yt++)!ee&&!Ct?Pt[yt]=A(b.image[yt],!0,l.maxCubemapSize):Pt[yt]=Ct?b.image[yt].image:b.image[yt],Pt[yt]=oe(b,Pt[yt]);const ue=Pt[0],te=c.convert(b.format,b.colorSpace),It=c.convert(b.type),de=L(b.internalFormat,te,It,b.colorSpace),q=b.isVideoTexture!==!0,wt=pt.__version===void 0||dt===!0,Lt=Et.dataReady;let Yt=F(b,ue);ne(o.TEXTURE_CUBE_MAP,b);let At;if(ee){q&&wt&&i.texStorage2D(o.TEXTURE_CUBE_MAP,Yt,de,ue.width,ue.height);for(let yt=0;yt<6;yt++){At=Pt[yt].mipmaps;for(let Qt=0;Qt<At.length;Qt++){const he=At[Qt];b.format!==Pi?te!==null?q?Lt&&i.compressedTexSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt,0,0,he.width,he.height,te,he.data):i.compressedTexImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt,de,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):q?Lt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt,0,0,he.width,he.height,te,It,he.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt,de,he.width,he.height,0,te,It,he.data)}}}else{if(At=b.mipmaps,q&&wt){At.length>0&&Yt++;const yt=kt(Pt[0]);i.texStorage2D(o.TEXTURE_CUBE_MAP,Yt,de,yt.width,yt.height)}for(let yt=0;yt<6;yt++)if(Ct){q?Lt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,0,0,0,Pt[yt].width,Pt[yt].height,te,It,Pt[yt].data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,0,de,Pt[yt].width,Pt[yt].height,0,te,It,Pt[yt].data);for(let Qt=0;Qt<At.length;Qt++){const qe=At[Qt].image[yt].image;q?Lt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt+1,0,0,qe.width,qe.height,te,It,qe.data):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt+1,de,qe.width,qe.height,0,te,It,qe.data)}}else{q?Lt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,0,0,0,te,It,Pt[yt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,0,de,te,It,Pt[yt]);for(let Qt=0;Qt<At.length;Qt++){const he=At[Qt];q?Lt&&i.texSubImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt+1,0,0,te,It,he.image[yt]):i.texImage2D(o.TEXTURE_CUBE_MAP_POSITIVE_X+yt,Qt+1,de,te,It,he.image[yt])}}}M(b)&&y(o.TEXTURE_CUBE_MAP),pt.__version=Et.version,b.onUpdate&&b.onUpdate(b)}U.__version=b.version}function bt(U,b,nt,dt,Et,pt){const jt=c.convert(nt.format,nt.colorSpace),Ut=c.convert(nt.type),$t=L(nt.internalFormat,jt,Ut,nt.colorSpace),ee=r.get(b),Ct=r.get(nt);if(Ct.__renderTarget=b,!ee.__hasExternalTextures){const Pt=Math.max(1,b.width>>pt),ue=Math.max(1,b.height>>pt);Et===o.TEXTURE_3D||Et===o.TEXTURE_2D_ARRAY?i.texImage3D(Et,pt,$t,Pt,ue,b.depth,0,jt,Ut,null):i.texImage2D(Et,pt,$t,Pt,ue,0,jt,Ut,null)}i.bindFramebuffer(o.FRAMEBUFFER,U),Mt(b)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,dt,Et,Ct.__webglTexture,0,_t(b)):(Et===o.TEXTURE_2D||Et>=o.TEXTURE_CUBE_MAP_POSITIVE_X&&Et<=o.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&o.framebufferTexture2D(o.FRAMEBUFFER,dt,Et,Ct.__webglTexture,pt),i.bindFramebuffer(o.FRAMEBUFFER,null)}function Ot(U,b,nt){if(o.bindRenderbuffer(o.RENDERBUFFER,U),b.depthBuffer){const dt=b.depthTexture,Et=dt&&dt.isDepthTexture?dt.type:null,pt=D(b.stencilBuffer,Et),jt=b.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,Ut=_t(b);Mt(b)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,Ut,pt,b.width,b.height):nt?o.renderbufferStorageMultisample(o.RENDERBUFFER,Ut,pt,b.width,b.height):o.renderbufferStorage(o.RENDERBUFFER,pt,b.width,b.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,jt,o.RENDERBUFFER,U)}else{const dt=b.textures;for(let Et=0;Et<dt.length;Et++){const pt=dt[Et],jt=c.convert(pt.format,pt.colorSpace),Ut=c.convert(pt.type),$t=L(pt.internalFormat,jt,Ut,pt.colorSpace),ee=_t(b);nt&&Mt(b)===!1?o.renderbufferStorageMultisample(o.RENDERBUFFER,ee,$t,b.width,b.height):Mt(b)?d.renderbufferStorageMultisampleEXT(o.RENDERBUFFER,ee,$t,b.width,b.height):o.renderbufferStorage(o.RENDERBUFFER,$t,b.width,b.height)}}o.bindRenderbuffer(o.RENDERBUFFER,null)}function Dt(U,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(i.bindFramebuffer(o.FRAMEBUFFER,U),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const dt=r.get(b.depthTexture);dt.__renderTarget=b,(!dt.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),lt(b.depthTexture,0);const Et=dt.__webglTexture,pt=_t(b);if(b.depthTexture.format===yl)Mt(b)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,o.DEPTH_ATTACHMENT,o.TEXTURE_2D,Et,0,pt):o.framebufferTexture2D(o.FRAMEBUFFER,o.DEPTH_ATTACHMENT,o.TEXTURE_2D,Et,0);else if(b.depthTexture.format===Sl)Mt(b)?d.framebufferTexture2DMultisampleEXT(o.FRAMEBUFFER,o.DEPTH_STENCIL_ATTACHMENT,o.TEXTURE_2D,Et,0,pt):o.framebufferTexture2D(o.FRAMEBUFFER,o.DEPTH_STENCIL_ATTACHMENT,o.TEXTURE_2D,Et,0);else throw new Error("Unknown depthTexture format")}function Tt(U){const b=r.get(U),nt=U.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==U.depthTexture){const dt=U.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),dt){const Et=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,dt.removeEventListener("dispose",Et)};dt.addEventListener("dispose",Et),b.__depthDisposeCallback=Et}b.__boundDepthTexture=dt}if(U.depthTexture&&!b.__autoAllocateDepthBuffer){if(nt)throw new Error("target.depthTexture not supported in Cube render targets");const dt=U.texture.mipmaps;dt&&dt.length>0?Dt(b.__webglFramebuffer[0],U):Dt(b.__webglFramebuffer,U)}else if(nt){b.__webglDepthbuffer=[];for(let dt=0;dt<6;dt++)if(i.bindFramebuffer(o.FRAMEBUFFER,b.__webglFramebuffer[dt]),b.__webglDepthbuffer[dt]===void 0)b.__webglDepthbuffer[dt]=o.createRenderbuffer(),Ot(b.__webglDepthbuffer[dt],U,!1);else{const Et=U.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,pt=b.__webglDepthbuffer[dt];o.bindRenderbuffer(o.RENDERBUFFER,pt),o.framebufferRenderbuffer(o.FRAMEBUFFER,Et,o.RENDERBUFFER,pt)}}else{const dt=U.texture.mipmaps;if(dt&&dt.length>0?i.bindFramebuffer(o.FRAMEBUFFER,b.__webglFramebuffer[0]):i.bindFramebuffer(o.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=o.createRenderbuffer(),Ot(b.__webglDepthbuffer,U,!1);else{const Et=U.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,pt=b.__webglDepthbuffer;o.bindRenderbuffer(o.RENDERBUFFER,pt),o.framebufferRenderbuffer(o.FRAMEBUFFER,Et,o.RENDERBUFFER,pt)}}i.bindFramebuffer(o.FRAMEBUFFER,null)}function qt(U,b,nt){const dt=r.get(U);b!==void 0&&bt(dt.__webglFramebuffer,U,U.texture,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,0),nt!==void 0&&Tt(U)}function B(U){const b=U.texture,nt=r.get(U),dt=r.get(b);U.addEventListener("dispose",O);const Et=U.textures,pt=U.isWebGLCubeRenderTarget===!0,jt=Et.length>1;if(jt||(dt.__webglTexture===void 0&&(dt.__webglTexture=o.createTexture()),dt.__version=b.version,h.memory.textures++),pt){nt.__webglFramebuffer=[];for(let Ut=0;Ut<6;Ut++)if(b.mipmaps&&b.mipmaps.length>0){nt.__webglFramebuffer[Ut]=[];for(let $t=0;$t<b.mipmaps.length;$t++)nt.__webglFramebuffer[Ut][$t]=o.createFramebuffer()}else nt.__webglFramebuffer[Ut]=o.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){nt.__webglFramebuffer=[];for(let Ut=0;Ut<b.mipmaps.length;Ut++)nt.__webglFramebuffer[Ut]=o.createFramebuffer()}else nt.__webglFramebuffer=o.createFramebuffer();if(jt)for(let Ut=0,$t=Et.length;Ut<$t;Ut++){const ee=r.get(Et[Ut]);ee.__webglTexture===void 0&&(ee.__webglTexture=o.createTexture(),h.memory.textures++)}if(U.samples>0&&Mt(U)===!1){nt.__webglMultisampledFramebuffer=o.createFramebuffer(),nt.__webglColorRenderbuffer=[],i.bindFramebuffer(o.FRAMEBUFFER,nt.__webglMultisampledFramebuffer);for(let Ut=0;Ut<Et.length;Ut++){const $t=Et[Ut];nt.__webglColorRenderbuffer[Ut]=o.createRenderbuffer(),o.bindRenderbuffer(o.RENDERBUFFER,nt.__webglColorRenderbuffer[Ut]);const ee=c.convert($t.format,$t.colorSpace),Ct=c.convert($t.type),Pt=L($t.internalFormat,ee,Ct,$t.colorSpace,U.isXRRenderTarget===!0),ue=_t(U);o.renderbufferStorageMultisample(o.RENDERBUFFER,ue,Pt,U.width,U.height),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+Ut,o.RENDERBUFFER,nt.__webglColorRenderbuffer[Ut])}o.bindRenderbuffer(o.RENDERBUFFER,null),U.depthBuffer&&(nt.__webglDepthRenderbuffer=o.createRenderbuffer(),Ot(nt.__webglDepthRenderbuffer,U,!0)),i.bindFramebuffer(o.FRAMEBUFFER,null)}}if(pt){i.bindTexture(o.TEXTURE_CUBE_MAP,dt.__webglTexture),ne(o.TEXTURE_CUBE_MAP,b);for(let Ut=0;Ut<6;Ut++)if(b.mipmaps&&b.mipmaps.length>0)for(let $t=0;$t<b.mipmaps.length;$t++)bt(nt.__webglFramebuffer[Ut][$t],U,b,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+Ut,$t);else bt(nt.__webglFramebuffer[Ut],U,b,o.COLOR_ATTACHMENT0,o.TEXTURE_CUBE_MAP_POSITIVE_X+Ut,0);M(b)&&y(o.TEXTURE_CUBE_MAP),i.unbindTexture()}else if(jt){for(let Ut=0,$t=Et.length;Ut<$t;Ut++){const ee=Et[Ut],Ct=r.get(ee);let Pt=o.TEXTURE_2D;(U.isWebGL3DRenderTarget||U.isWebGLArrayRenderTarget)&&(Pt=U.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(Pt,Ct.__webglTexture),ne(Pt,ee),bt(nt.__webglFramebuffer,U,ee,o.COLOR_ATTACHMENT0+Ut,Pt,0),M(ee)&&y(Pt)}i.unbindTexture()}else{let Ut=o.TEXTURE_2D;if((U.isWebGL3DRenderTarget||U.isWebGLArrayRenderTarget)&&(Ut=U.isWebGL3DRenderTarget?o.TEXTURE_3D:o.TEXTURE_2D_ARRAY),i.bindTexture(Ut,dt.__webglTexture),ne(Ut,b),b.mipmaps&&b.mipmaps.length>0)for(let $t=0;$t<b.mipmaps.length;$t++)bt(nt.__webglFramebuffer[$t],U,b,o.COLOR_ATTACHMENT0,Ut,$t);else bt(nt.__webglFramebuffer,U,b,o.COLOR_ATTACHMENT0,Ut,0);M(b)&&y(Ut),i.unbindTexture()}U.depthBuffer&&Tt(U)}function ze(U){const b=U.textures;for(let nt=0,dt=b.length;nt<dt;nt++){const Et=b[nt];if(M(Et)){const pt=N(U),jt=r.get(Et).__webglTexture;i.bindTexture(pt,jt),y(pt),i.unbindTexture()}}}const le=[],Wt=[];function G(U){if(U.samples>0){if(Mt(U)===!1){const b=U.textures,nt=U.width,dt=U.height;let Et=o.COLOR_BUFFER_BIT;const pt=U.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT,jt=r.get(U),Ut=b.length>1;if(Ut)for(let ee=0;ee<b.length;ee++)i.bindFramebuffer(o.FRAMEBUFFER,jt.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+ee,o.RENDERBUFFER,null),i.bindFramebuffer(o.FRAMEBUFFER,jt.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+ee,o.TEXTURE_2D,null,0);i.bindFramebuffer(o.READ_FRAMEBUFFER,jt.__webglMultisampledFramebuffer);const $t=U.texture.mipmaps;$t&&$t.length>0?i.bindFramebuffer(o.DRAW_FRAMEBUFFER,jt.__webglFramebuffer[0]):i.bindFramebuffer(o.DRAW_FRAMEBUFFER,jt.__webglFramebuffer);for(let ee=0;ee<b.length;ee++){if(U.resolveDepthBuffer&&(U.depthBuffer&&(Et|=o.DEPTH_BUFFER_BIT),U.stencilBuffer&&U.resolveStencilBuffer&&(Et|=o.STENCIL_BUFFER_BIT)),Ut){o.framebufferRenderbuffer(o.READ_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.RENDERBUFFER,jt.__webglColorRenderbuffer[ee]);const Ct=r.get(b[ee]).__webglTexture;o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,Ct,0)}o.blitFramebuffer(0,0,nt,dt,0,0,nt,dt,Et,o.NEAREST),g===!0&&(le.length=0,Wt.length=0,le.push(o.COLOR_ATTACHMENT0+ee),U.depthBuffer&&U.resolveDepthBuffer===!1&&(le.push(pt),Wt.push(pt),o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,Wt)),o.invalidateFramebuffer(o.READ_FRAMEBUFFER,le))}if(i.bindFramebuffer(o.READ_FRAMEBUFFER,null),i.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),Ut)for(let ee=0;ee<b.length;ee++){i.bindFramebuffer(o.FRAMEBUFFER,jt.__webglMultisampledFramebuffer),o.framebufferRenderbuffer(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0+ee,o.RENDERBUFFER,jt.__webglColorRenderbuffer[ee]);const Ct=r.get(b[ee]).__webglTexture;i.bindFramebuffer(o.FRAMEBUFFER,jt.__webglFramebuffer),o.framebufferTexture2D(o.DRAW_FRAMEBUFFER,o.COLOR_ATTACHMENT0+ee,o.TEXTURE_2D,Ct,0)}i.bindFramebuffer(o.DRAW_FRAMEBUFFER,jt.__webglMultisampledFramebuffer)}else if(U.depthBuffer&&U.resolveDepthBuffer===!1&&g){const b=U.stencilBuffer?o.DEPTH_STENCIL_ATTACHMENT:o.DEPTH_ATTACHMENT;o.invalidateFramebuffer(o.DRAW_FRAMEBUFFER,[b])}}}function _t(U){return Math.min(l.maxSamples,U.samples)}function Mt(U){const b=r.get(U);return U.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Ht(U){const b=h.render.frame;_.get(U)!==b&&(_.set(U,b),U.update())}function oe(U,b){const nt=U.colorSpace,dt=U.format,Et=U.type;return U.isCompressedTexture===!0||U.isVideoTexture===!0||nt!==uo&&nt!==fr&&(Oe.getTransfer(nt)===je?(dt!==Pi||Et!==na)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",nt)),b}function kt(U){return typeof HTMLImageElement<"u"&&U instanceof HTMLImageElement?(p.width=U.naturalWidth||U.width,p.height=U.naturalHeight||U.height):typeof VideoFrame<"u"&&U instanceof VideoFrame?(p.width=U.displayWidth,p.height=U.displayHeight):(p.width=U.width,p.height=U.height),p}this.allocateTextureUnit=ft,this.resetTextureUnits=$,this.setTexture2D=lt,this.setTexture2DArray=j,this.setTexture3D=ot,this.setTextureCube=Q,this.rebindTextures=qt,this.setupRenderTarget=B,this.updateRenderTargetMipmap=ze,this.updateMultisampleRenderTarget=G,this.setupDepthRenderbuffer=Tt,this.setupFrameBufferTexture=bt,this.useMultisampledRTT=Mt}function oC(o,e){function i(r,l=fr){let c;const h=Oe.getTransfer(l);if(r===na)return o.UNSIGNED_BYTE;if(r===Bp)return o.UNSIGNED_SHORT_4_4_4_4;if(r===Fp)return o.UNSIGNED_SHORT_5_5_5_1;if(r===Ax)return o.UNSIGNED_INT_5_9_9_9_REV;if(r===Rx)return o.UNSIGNED_INT_10F_11F_11F_REV;if(r===Tx)return o.BYTE;if(r===bx)return o.SHORT;if(r===vl)return o.UNSIGNED_SHORT;if(r===Ip)return o.INT;if(r===Jr)return o.UNSIGNED_INT;if(r===Ca)return o.FLOAT;if(r===Tl)return o.HALF_FLOAT;if(r===Cx)return o.ALPHA;if(r===wx)return o.RGB;if(r===Pi)return o.RGBA;if(r===yl)return o.DEPTH_COMPONENT;if(r===Sl)return o.DEPTH_STENCIL;if(r===Dx)return o.RED;if(r===Hp)return o.RED_INTEGER;if(r===Ux)return o.RG;if(r===Gp)return o.RG_INTEGER;if(r===Vp)return o.RGBA_INTEGER;if(r===xc||r===yc||r===Sc||r===Mc)if(h===je)if(c=e.get("WEBGL_compressed_texture_s3tc_srgb"),c!==null){if(r===xc)return c.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===yc)return c.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Sc)return c.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===Mc)return c.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(c=e.get("WEBGL_compressed_texture_s3tc"),c!==null){if(r===xc)return c.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===yc)return c.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Sc)return c.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===Mc)return c.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===ap||r===rp||r===sp||r===op)if(c=e.get("WEBGL_compressed_texture_pvrtc"),c!==null){if(r===ap)return c.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===rp)return c.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===sp)return c.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===op)return c.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===lp||r===up||r===cp)if(c=e.get("WEBGL_compressed_texture_etc"),c!==null){if(r===lp||r===up)return h===je?c.COMPRESSED_SRGB8_ETC2:c.COMPRESSED_RGB8_ETC2;if(r===cp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:c.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===fp||r===hp||r===dp||r===pp||r===mp||r===gp||r===_p||r===vp||r===xp||r===yp||r===Sp||r===Mp||r===Ep||r===Tp)if(c=e.get("WEBGL_compressed_texture_astc"),c!==null){if(r===fp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:c.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===hp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:c.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===dp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:c.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===pp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:c.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===mp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:c.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===gp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:c.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===_p)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:c.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===vp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:c.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===xp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:c.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===yp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:c.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===Sp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:c.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===Mp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:c.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Ep)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:c.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===Tp)return h===je?c.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:c.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===bp||r===Ap||r===Rp)if(c=e.get("EXT_texture_compression_bptc"),c!==null){if(r===bp)return h===je?c.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:c.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===Ap)return c.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===Rp)return c.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===Cp||r===wp||r===Dp||r===Up)if(c=e.get("EXT_texture_compression_rgtc"),c!==null){if(r===Cp)return c.COMPRESSED_RED_RGTC1_EXT;if(r===wp)return c.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===Dp)return c.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===Up)return c.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===xl?o.UNSIGNED_INT_24_8:o[r]!==void 0?o[r]:null}return{convert:i}}const lC=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,uC=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class cC{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,i){if(this.texture===null){const r=new kx(e.texture);(e.depthNear!==i.depthNear||e.depthFar!==i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const i=e.cameras[0].viewport,r=new mr({vertexShader:lC,fragmentShader:uC,uniforms:{depthColor:{value:this.texture},depthWidth:{value:i.z},depthHeight:{value:i.w}}});this.mesh=new cn(new fo(20,20),r)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class fC extends ho{constructor(e,i){super();const r=this;let l=null,c=1,h=null,d="local-floor",g=1,p=null,_=null,m=null,x=null,S=null,E=null;const A=typeof XRWebGLBinding<"u",M=new cC,y={},N=i.getContextAttributes();let L=null,D=null;const F=[],I=[],O=new Te;let H=null;const w=new Ei;w.viewport=new ln;const R=new Ei;R.viewport=new ln;const V=[w,R],$=new DT;let ft=null,gt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let rt=F[Y];return rt===void 0&&(rt=new zd,F[Y]=rt),rt.getTargetRaySpace()},this.getControllerGrip=function(Y){let rt=F[Y];return rt===void 0&&(rt=new zd,F[Y]=rt),rt.getGripSpace()},this.getHand=function(Y){let rt=F[Y];return rt===void 0&&(rt=new zd,F[Y]=rt),rt.getHandSpace()};function lt(Y){const rt=I.indexOf(Y.inputSource);if(rt===-1)return;const bt=F[rt];bt!==void 0&&(bt.update(Y.inputSource,Y.frame,p||h),bt.dispatchEvent({type:Y.type,data:Y.inputSource}))}function j(){l.removeEventListener("select",lt),l.removeEventListener("selectstart",lt),l.removeEventListener("selectend",lt),l.removeEventListener("squeeze",lt),l.removeEventListener("squeezestart",lt),l.removeEventListener("squeezeend",lt),l.removeEventListener("end",j),l.removeEventListener("inputsourceschange",ot);for(let Y=0;Y<F.length;Y++){const rt=I[Y];rt!==null&&(I[Y]=null,F[Y].disconnect(rt))}ft=null,gt=null,M.reset();for(const Y in y)delete y[Y];e.setRenderTarget(L),S=null,x=null,m=null,l=null,D=null,ht.stop(),r.isPresenting=!1,e.setPixelRatio(H),e.setSize(O.width,O.height,!1),r.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){c=Y,r.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){d=Y,r.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return p||h},this.setReferenceSpace=function(Y){p=Y},this.getBaseLayer=function(){return x!==null?x:S},this.getBinding=function(){return m===null&&A&&(m=new XRWebGLBinding(l,i)),m},this.getFrame=function(){return E},this.getSession=function(){return l},this.setSession=async function(Y){if(l=Y,l!==null){if(L=e.getRenderTarget(),l.addEventListener("select",lt),l.addEventListener("selectstart",lt),l.addEventListener("selectend",lt),l.addEventListener("squeeze",lt),l.addEventListener("squeezestart",lt),l.addEventListener("squeezeend",lt),l.addEventListener("end",j),l.addEventListener("inputsourceschange",ot),N.xrCompatible!==!0&&await i.makeXRCompatible(),H=e.getPixelRatio(),e.getSize(O),A&&"createProjectionLayer"in XRWebGLBinding.prototype){let bt=null,Ot=null,Dt=null;N.depth&&(Dt=N.stencil?i.DEPTH24_STENCIL8:i.DEPTH_COMPONENT24,bt=N.stencil?Sl:yl,Ot=N.stencil?xl:Jr);const Tt={colorFormat:i.RGBA8,depthFormat:Dt,scaleFactor:c};m=this.getBinding(),x=m.createProjectionLayer(Tt),l.updateRenderState({layers:[x]}),e.setPixelRatio(1),e.setSize(x.textureWidth,x.textureHeight,!1),D=new $r(x.textureWidth,x.textureHeight,{format:Pi,type:na,depthTexture:new Vx(x.textureWidth,x.textureHeight,Ot,void 0,void 0,void 0,void 0,void 0,void 0,bt),stencilBuffer:N.stencil,colorSpace:e.outputColorSpace,samples:N.antialias?4:0,resolveDepthBuffer:x.ignoreDepthValues===!1,resolveStencilBuffer:x.ignoreDepthValues===!1})}else{const bt={antialias:N.antialias,alpha:!0,depth:N.depth,stencil:N.stencil,framebufferScaleFactor:c};S=new XRWebGLLayer(l,i,bt),l.updateRenderState({baseLayer:S}),e.setPixelRatio(1),e.setSize(S.framebufferWidth,S.framebufferHeight,!1),D=new $r(S.framebufferWidth,S.framebufferHeight,{format:Pi,type:na,colorSpace:e.outputColorSpace,stencilBuffer:N.stencil,resolveDepthBuffer:S.ignoreDepthValues===!1,resolveStencilBuffer:S.ignoreDepthValues===!1})}D.isXRRenderTarget=!0,this.setFoveation(g),p=null,h=await l.requestReferenceSpace(d),ht.setContext(l),ht.start(),r.isPresenting=!0,r.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(l!==null)return l.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function ot(Y){for(let rt=0;rt<Y.removed.length;rt++){const bt=Y.removed[rt],Ot=I.indexOf(bt);Ot>=0&&(I[Ot]=null,F[Ot].disconnect(bt))}for(let rt=0;rt<Y.added.length;rt++){const bt=Y.added[rt];let Ot=I.indexOf(bt);if(Ot===-1){for(let Tt=0;Tt<F.length;Tt++)if(Tt>=I.length){I.push(bt),Ot=Tt;break}else if(I[Tt]===null){I[Tt]=bt,Ot=Tt;break}if(Ot===-1)break}const Dt=F[Ot];Dt&&Dt.connect(bt)}}const Q=new et,St=new et;function xt(Y,rt,bt){Q.setFromMatrixPosition(rt.matrixWorld),St.setFromMatrixPosition(bt.matrixWorld);const Ot=Q.distanceTo(St),Dt=rt.projectionMatrix.elements,Tt=bt.projectionMatrix.elements,qt=Dt[14]/(Dt[10]-1),B=Dt[14]/(Dt[10]+1),ze=(Dt[9]+1)/Dt[5],le=(Dt[9]-1)/Dt[5],Wt=(Dt[8]-1)/Dt[0],G=(Tt[8]+1)/Tt[0],_t=qt*Wt,Mt=qt*G,Ht=Ot/(-Wt+G),oe=Ht*-Wt;if(rt.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(oe),Y.translateZ(Ht),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Dt[10]===-1)Y.projectionMatrix.copy(rt.projectionMatrix),Y.projectionMatrixInverse.copy(rt.projectionMatrixInverse);else{const kt=qt+Ht,U=B+Ht,b=_t-oe,nt=Mt+(Ot-oe),dt=ze*B/U*kt,Et=le*B/U*kt;Y.projectionMatrix.makePerspective(b,nt,dt,Et,kt,U),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function Gt(Y,rt){rt===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(rt.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(l===null)return;let rt=Y.near,bt=Y.far;M.texture!==null&&(M.depthNear>0&&(rt=M.depthNear),M.depthFar>0&&(bt=M.depthFar)),$.near=R.near=w.near=rt,$.far=R.far=w.far=bt,(ft!==$.near||gt!==$.far)&&(l.updateRenderState({depthNear:$.near,depthFar:$.far}),ft=$.near,gt=$.far),$.layers.mask=Y.layers.mask|6,w.layers.mask=$.layers.mask&3,R.layers.mask=$.layers.mask&5;const Ot=Y.parent,Dt=$.cameras;Gt($,Ot);for(let Tt=0;Tt<Dt.length;Tt++)Gt(Dt[Tt],Ot);Dt.length===2?xt($,w,R):$.projectionMatrix.copy(w.projectionMatrix),ne(Y,$,Ot)};function ne(Y,rt,bt){bt===null?Y.matrix.copy(rt.matrixWorld):(Y.matrix.copy(bt.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(rt.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(rt.projectionMatrix),Y.projectionMatrixInverse.copy(rt.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Ml*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return $},this.getFoveation=function(){if(!(x===null&&S===null))return g},this.setFoveation=function(Y){g=Y,x!==null&&(x.fixedFoveation=Y),S!==null&&S.fixedFoveation!==void 0&&(S.fixedFoveation=Y)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh($)},this.getCameraTexture=function(Y){return y[Y]};let ye=null;function P(Y,rt){if(_=rt.getViewerPose(p||h),E=rt,_!==null){const bt=_.views;S!==null&&(e.setRenderTargetFramebuffer(D,S.framebuffer),e.setRenderTarget(D));let Ot=!1;bt.length!==$.cameras.length&&($.cameras.length=0,Ot=!0);for(let B=0;B<bt.length;B++){const ze=bt[B];let le=null;if(S!==null)le=S.getViewport(ze);else{const G=m.getViewSubImage(x,ze);le=G.viewport,B===0&&(e.setRenderTargetTextures(D,G.colorTexture,G.depthStencilTexture),e.setRenderTarget(D))}let Wt=V[B];Wt===void 0&&(Wt=new Ei,Wt.layers.enable(B),Wt.viewport=new ln,V[B]=Wt),Wt.matrix.fromArray(ze.transform.matrix),Wt.matrix.decompose(Wt.position,Wt.quaternion,Wt.scale),Wt.projectionMatrix.fromArray(ze.projectionMatrix),Wt.projectionMatrixInverse.copy(Wt.projectionMatrix).invert(),Wt.viewport.set(le.x,le.y,le.width,le.height),B===0&&($.matrix.copy(Wt.matrix),$.matrix.decompose($.position,$.quaternion,$.scale)),Ot===!0&&$.cameras.push(Wt)}const Dt=l.enabledFeatures;if(Dt&&Dt.includes("depth-sensing")&&l.depthUsage=="gpu-optimized"&&A){m=r.getBinding();const B=m.getDepthInformation(bt[0]);B&&B.isValid&&B.texture&&M.init(B,l.renderState)}if(Dt&&Dt.includes("camera-access")&&A){e.state.unbindTexture(),m=r.getBinding();for(let B=0;B<bt.length;B++){const ze=bt[B].camera;if(ze){let le=y[ze];le||(le=new kx,y[ze]=le);const Wt=m.getCameraImage(ze);le.sourceTexture=Wt}}}}for(let bt=0;bt<F.length;bt++){const Ot=I[bt],Dt=F[bt];Ot!==null&&Dt!==void 0&&Dt.update(Ot,rt,p||h)}ye&&ye(Y,rt),rt.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:rt}),E=null}const ht=new Yx;ht.setAnimationLoop(P),this.setAnimationLoop=function(Y){ye=Y},this.dispose=function(){}}}const qr=new ia,hC=new an;function dC(o,e){function i(M,y){M.matrixAutoUpdate===!0&&M.updateMatrix(),y.value.copy(M.matrix)}function r(M,y){y.color.getRGB(M.fogColor.value,Fx(o)),y.isFog?(M.fogNear.value=y.near,M.fogFar.value=y.far):y.isFogExp2&&(M.fogDensity.value=y.density)}function l(M,y,N,L,D){y.isMeshBasicMaterial||y.isMeshLambertMaterial?c(M,y):y.isMeshToonMaterial?(c(M,y),m(M,y)):y.isMeshPhongMaterial?(c(M,y),_(M,y)):y.isMeshStandardMaterial?(c(M,y),x(M,y),y.isMeshPhysicalMaterial&&S(M,y,D)):y.isMeshMatcapMaterial?(c(M,y),E(M,y)):y.isMeshDepthMaterial?c(M,y):y.isMeshDistanceMaterial?(c(M,y),A(M,y)):y.isMeshNormalMaterial?c(M,y):y.isLineBasicMaterial?(h(M,y),y.isLineDashedMaterial&&d(M,y)):y.isPointsMaterial?g(M,y,N,L):y.isSpriteMaterial?p(M,y):y.isShadowMaterial?(M.color.value.copy(y.color),M.opacity.value=y.opacity):y.isShaderMaterial&&(y.uniformsNeedUpdate=!1)}function c(M,y){M.opacity.value=y.opacity,y.color&&M.diffuse.value.copy(y.color),y.emissive&&M.emissive.value.copy(y.emissive).multiplyScalar(y.emissiveIntensity),y.map&&(M.map.value=y.map,i(y.map,M.mapTransform)),y.alphaMap&&(M.alphaMap.value=y.alphaMap,i(y.alphaMap,M.alphaMapTransform)),y.bumpMap&&(M.bumpMap.value=y.bumpMap,i(y.bumpMap,M.bumpMapTransform),M.bumpScale.value=y.bumpScale,y.side===$n&&(M.bumpScale.value*=-1)),y.normalMap&&(M.normalMap.value=y.normalMap,i(y.normalMap,M.normalMapTransform),M.normalScale.value.copy(y.normalScale),y.side===$n&&M.normalScale.value.negate()),y.displacementMap&&(M.displacementMap.value=y.displacementMap,i(y.displacementMap,M.displacementMapTransform),M.displacementScale.value=y.displacementScale,M.displacementBias.value=y.displacementBias),y.emissiveMap&&(M.emissiveMap.value=y.emissiveMap,i(y.emissiveMap,M.emissiveMapTransform)),y.specularMap&&(M.specularMap.value=y.specularMap,i(y.specularMap,M.specularMapTransform)),y.alphaTest>0&&(M.alphaTest.value=y.alphaTest);const N=e.get(y),L=N.envMap,D=N.envMapRotation;L&&(M.envMap.value=L,qr.copy(D),qr.x*=-1,qr.y*=-1,qr.z*=-1,L.isCubeTexture&&L.isRenderTargetTexture===!1&&(qr.y*=-1,qr.z*=-1),M.envMapRotation.value.setFromMatrix4(hC.makeRotationFromEuler(qr)),M.flipEnvMap.value=L.isCubeTexture&&L.isRenderTargetTexture===!1?-1:1,M.reflectivity.value=y.reflectivity,M.ior.value=y.ior,M.refractionRatio.value=y.refractionRatio),y.lightMap&&(M.lightMap.value=y.lightMap,M.lightMapIntensity.value=y.lightMapIntensity,i(y.lightMap,M.lightMapTransform)),y.aoMap&&(M.aoMap.value=y.aoMap,M.aoMapIntensity.value=y.aoMapIntensity,i(y.aoMap,M.aoMapTransform))}function h(M,y){M.diffuse.value.copy(y.color),M.opacity.value=y.opacity,y.map&&(M.map.value=y.map,i(y.map,M.mapTransform))}function d(M,y){M.dashSize.value=y.dashSize,M.totalSize.value=y.dashSize+y.gapSize,M.scale.value=y.scale}function g(M,y,N,L){M.diffuse.value.copy(y.color),M.opacity.value=y.opacity,M.size.value=y.size*N,M.scale.value=L*.5,y.map&&(M.map.value=y.map,i(y.map,M.uvTransform)),y.alphaMap&&(M.alphaMap.value=y.alphaMap,i(y.alphaMap,M.alphaMapTransform)),y.alphaTest>0&&(M.alphaTest.value=y.alphaTest)}function p(M,y){M.diffuse.value.copy(y.color),M.opacity.value=y.opacity,M.rotation.value=y.rotation,y.map&&(M.map.value=y.map,i(y.map,M.mapTransform)),y.alphaMap&&(M.alphaMap.value=y.alphaMap,i(y.alphaMap,M.alphaMapTransform)),y.alphaTest>0&&(M.alphaTest.value=y.alphaTest)}function _(M,y){M.specular.value.copy(y.specular),M.shininess.value=Math.max(y.shininess,1e-4)}function m(M,y){y.gradientMap&&(M.gradientMap.value=y.gradientMap)}function x(M,y){M.metalness.value=y.metalness,y.metalnessMap&&(M.metalnessMap.value=y.metalnessMap,i(y.metalnessMap,M.metalnessMapTransform)),M.roughness.value=y.roughness,y.roughnessMap&&(M.roughnessMap.value=y.roughnessMap,i(y.roughnessMap,M.roughnessMapTransform)),y.envMap&&(M.envMapIntensity.value=y.envMapIntensity)}function S(M,y,N){M.ior.value=y.ior,y.sheen>0&&(M.sheenColor.value.copy(y.sheenColor).multiplyScalar(y.sheen),M.sheenRoughness.value=y.sheenRoughness,y.sheenColorMap&&(M.sheenColorMap.value=y.sheenColorMap,i(y.sheenColorMap,M.sheenColorMapTransform)),y.sheenRoughnessMap&&(M.sheenRoughnessMap.value=y.sheenRoughnessMap,i(y.sheenRoughnessMap,M.sheenRoughnessMapTransform))),y.clearcoat>0&&(M.clearcoat.value=y.clearcoat,M.clearcoatRoughness.value=y.clearcoatRoughness,y.clearcoatMap&&(M.clearcoatMap.value=y.clearcoatMap,i(y.clearcoatMap,M.clearcoatMapTransform)),y.clearcoatRoughnessMap&&(M.clearcoatRoughnessMap.value=y.clearcoatRoughnessMap,i(y.clearcoatRoughnessMap,M.clearcoatRoughnessMapTransform)),y.clearcoatNormalMap&&(M.clearcoatNormalMap.value=y.clearcoatNormalMap,i(y.clearcoatNormalMap,M.clearcoatNormalMapTransform),M.clearcoatNormalScale.value.copy(y.clearcoatNormalScale),y.side===$n&&M.clearcoatNormalScale.value.negate())),y.dispersion>0&&(M.dispersion.value=y.dispersion),y.iridescence>0&&(M.iridescence.value=y.iridescence,M.iridescenceIOR.value=y.iridescenceIOR,M.iridescenceThicknessMinimum.value=y.iridescenceThicknessRange[0],M.iridescenceThicknessMaximum.value=y.iridescenceThicknessRange[1],y.iridescenceMap&&(M.iridescenceMap.value=y.iridescenceMap,i(y.iridescenceMap,M.iridescenceMapTransform)),y.iridescenceThicknessMap&&(M.iridescenceThicknessMap.value=y.iridescenceThicknessMap,i(y.iridescenceThicknessMap,M.iridescenceThicknessMapTransform))),y.transmission>0&&(M.transmission.value=y.transmission,M.transmissionSamplerMap.value=N.texture,M.transmissionSamplerSize.value.set(N.width,N.height),y.transmissionMap&&(M.transmissionMap.value=y.transmissionMap,i(y.transmissionMap,M.transmissionMapTransform)),M.thickness.value=y.thickness,y.thicknessMap&&(M.thicknessMap.value=y.thicknessMap,i(y.thicknessMap,M.thicknessMapTransform)),M.attenuationDistance.value=y.attenuationDistance,M.attenuationColor.value.copy(y.attenuationColor)),y.anisotropy>0&&(M.anisotropyVector.value.set(y.anisotropy*Math.cos(y.anisotropyRotation),y.anisotropy*Math.sin(y.anisotropyRotation)),y.anisotropyMap&&(M.anisotropyMap.value=y.anisotropyMap,i(y.anisotropyMap,M.anisotropyMapTransform))),M.specularIntensity.value=y.specularIntensity,M.specularColor.value.copy(y.specularColor),y.specularColorMap&&(M.specularColorMap.value=y.specularColorMap,i(y.specularColorMap,M.specularColorMapTransform)),y.specularIntensityMap&&(M.specularIntensityMap.value=y.specularIntensityMap,i(y.specularIntensityMap,M.specularIntensityMapTransform))}function E(M,y){y.matcap&&(M.matcap.value=y.matcap)}function A(M,y){const N=e.get(y).light;M.referencePosition.value.setFromMatrixPosition(N.matrixWorld),M.nearDistance.value=N.shadow.camera.near,M.farDistance.value=N.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:l}}function pC(o,e,i,r){let l={},c={},h=[];const d=o.getParameter(o.MAX_UNIFORM_BUFFER_BINDINGS);function g(N,L){const D=L.program;r.uniformBlockBinding(N,D)}function p(N,L){let D=l[N.id];D===void 0&&(E(N),D=_(N),l[N.id]=D,N.addEventListener("dispose",M));const F=L.program;r.updateUBOMapping(N,F);const I=e.render.frame;c[N.id]!==I&&(x(N),c[N.id]=I)}function _(N){const L=m();N.__bindingPointIndex=L;const D=o.createBuffer(),F=N.__size,I=N.usage;return o.bindBuffer(o.UNIFORM_BUFFER,D),o.bufferData(o.UNIFORM_BUFFER,F,I),o.bindBuffer(o.UNIFORM_BUFFER,null),o.bindBufferBase(o.UNIFORM_BUFFER,L,D),D}function m(){for(let N=0;N<d;N++)if(h.indexOf(N)===-1)return h.push(N),N;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function x(N){const L=l[N.id],D=N.uniforms,F=N.__cache;o.bindBuffer(o.UNIFORM_BUFFER,L);for(let I=0,O=D.length;I<O;I++){const H=Array.isArray(D[I])?D[I]:[D[I]];for(let w=0,R=H.length;w<R;w++){const V=H[w];if(S(V,I,w,F)===!0){const $=V.__offset,ft=Array.isArray(V.value)?V.value:[V.value];let gt=0;for(let lt=0;lt<ft.length;lt++){const j=ft[lt],ot=A(j);typeof j=="number"||typeof j=="boolean"?(V.__data[0]=j,o.bufferSubData(o.UNIFORM_BUFFER,$+gt,V.__data)):j.isMatrix3?(V.__data[0]=j.elements[0],V.__data[1]=j.elements[1],V.__data[2]=j.elements[2],V.__data[3]=0,V.__data[4]=j.elements[3],V.__data[5]=j.elements[4],V.__data[6]=j.elements[5],V.__data[7]=0,V.__data[8]=j.elements[6],V.__data[9]=j.elements[7],V.__data[10]=j.elements[8],V.__data[11]=0):(j.toArray(V.__data,gt),gt+=ot.storage/Float32Array.BYTES_PER_ELEMENT)}o.bufferSubData(o.UNIFORM_BUFFER,$,V.__data)}}}o.bindBuffer(o.UNIFORM_BUFFER,null)}function S(N,L,D,F){const I=N.value,O=L+"_"+D;if(F[O]===void 0)return typeof I=="number"||typeof I=="boolean"?F[O]=I:F[O]=I.clone(),!0;{const H=F[O];if(typeof I=="number"||typeof I=="boolean"){if(H!==I)return F[O]=I,!0}else if(H.equals(I)===!1)return H.copy(I),!0}return!1}function E(N){const L=N.uniforms;let D=0;const F=16;for(let O=0,H=L.length;O<H;O++){const w=Array.isArray(L[O])?L[O]:[L[O]];for(let R=0,V=w.length;R<V;R++){const $=w[R],ft=Array.isArray($.value)?$.value:[$.value];for(let gt=0,lt=ft.length;gt<lt;gt++){const j=ft[gt],ot=A(j),Q=D%F,St=Q%ot.boundary,xt=Q+St;D+=St,xt!==0&&F-xt<ot.storage&&(D+=F-xt),$.__data=new Float32Array(ot.storage/Float32Array.BYTES_PER_ELEMENT),$.__offset=D,D+=ot.storage}}}const I=D%F;return I>0&&(D+=F-I),N.__size=D,N.__cache={},this}function A(N){const L={boundary:0,storage:0};return typeof N=="number"||typeof N=="boolean"?(L.boundary=4,L.storage=4):N.isVector2?(L.boundary=8,L.storage=8):N.isVector3||N.isColor?(L.boundary=16,L.storage=12):N.isVector4?(L.boundary=16,L.storage=16):N.isMatrix3?(L.boundary=48,L.storage=48):N.isMatrix4?(L.boundary=64,L.storage=64):N.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",N),L}function M(N){const L=N.target;L.removeEventListener("dispose",M);const D=h.indexOf(L.__bindingPointIndex);h.splice(D,1),o.deleteBuffer(l[L.id]),delete l[L.id],delete c[L.id]}function y(){for(const N in l)o.deleteBuffer(l[N]);h=[],l={},c={}}return{bind:g,update:p,dispose:y}}class mC{constructor(e={}){const{canvas:i=qE(),context:r=null,depth:l=!0,stencil:c=!1,alpha:h=!1,antialias:d=!1,premultipliedAlpha:g=!0,preserveDrawingBuffer:p=!1,powerPreference:_="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:x=!1}=e;this.isWebGLRenderer=!0;let S;if(r!==null){if(typeof WebGLRenderingContext<"u"&&r instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");S=r.getContextAttributes().alpha}else S=h;const E=new Uint32Array(4),A=new Int32Array(4);let M=null,y=null;const N=[],L=[];this.domElement=i,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=dr,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const D=this;let F=!1;this._outputColorSpace=Mi;let I=0,O=0,H=null,w=-1,R=null;const V=new ln,$=new ln;let ft=null;const gt=new we(0);let lt=0,j=i.width,ot=i.height,Q=1,St=null,xt=null;const Gt=new ln(0,0,j,ot),ne=new ln(0,0,j,ot);let ye=!1;const P=new Wp;let ht=!1,Y=!1;const rt=new an,bt=new et,Ot=new ln,Dt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Tt=!1;function qt(){return H===null?Q:1}let B=r;function ze(C,J){return i.getContext(C,J)}try{const C={alpha:!0,depth:l,stencil:c,antialias:d,premultipliedAlpha:g,preserveDrawingBuffer:p,powerPreference:_,failIfMajorPerformanceCaveat:m};if("setAttribute"in i&&i.setAttribute("data-engine",`three.js r${Pp}`),i.addEventListener("webglcontextlost",Lt,!1),i.addEventListener("webglcontextrestored",Yt,!1),i.addEventListener("webglcontextcreationerror",At,!1),B===null){const J="webgl2";if(B=ze(J,C),B===null)throw ze(J)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let le,Wt,G,_t,Mt,Ht,oe,kt,U,b,nt,dt,Et,pt,jt,Ut,$t,ee,Ct,Pt,ue,te,It,de;function q(){le=new bA(B),le.init(),te=new oC(B,le),Wt=new vA(B,le,e,te),G=new rC(B,le),Wt.reversedDepthBuffer&&x&&G.buffers.depth.setReversed(!0),_t=new CA(B),Mt=new YR,Ht=new sC(B,le,G,Mt,Wt,te,_t),oe=new yA(D),kt=new TA(D),U=new OT(B),It=new gA(B,U),b=new AA(B,U,_t,It),nt=new DA(B,b,U,_t),Ct=new wA(B,Wt,Ht),Ut=new xA(Mt),dt=new qR(D,oe,kt,le,Wt,It,Ut),Et=new dC(D,Mt),pt=new WR,jt=new tC(le),ee=new mA(D,oe,kt,G,nt,S,g),$t=new iC(D,nt,Wt),de=new pC(B,_t,Wt,G),Pt=new _A(B,le,_t),ue=new RA(B,le,_t),_t.programs=dt.programs,D.capabilities=Wt,D.extensions=le,D.properties=Mt,D.renderLists=pt,D.shadowMap=$t,D.state=G,D.info=_t}q();const wt=new fC(D,B);this.xr=wt,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){const C=le.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){const C=le.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(C){C!==void 0&&(Q=C,this.setSize(j,ot,!1))},this.getSize=function(C){return C.set(j,ot)},this.setSize=function(C,J,ut=!0){if(wt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}j=C,ot=J,i.width=Math.floor(C*Q),i.height=Math.floor(J*Q),ut===!0&&(i.style.width=C+"px",i.style.height=J+"px"),this.setViewport(0,0,C,J)},this.getDrawingBufferSize=function(C){return C.set(j*Q,ot*Q).floor()},this.setDrawingBufferSize=function(C,J,ut){j=C,ot=J,Q=ut,i.width=Math.floor(C*ut),i.height=Math.floor(J*ut),this.setViewport(0,0,C,J)},this.getCurrentViewport=function(C){return C.copy(V)},this.getViewport=function(C){return C.copy(Gt)},this.setViewport=function(C,J,ut,ct){C.isVector4?Gt.set(C.x,C.y,C.z,C.w):Gt.set(C,J,ut,ct),G.viewport(V.copy(Gt).multiplyScalar(Q).round())},this.getScissor=function(C){return C.copy(ne)},this.setScissor=function(C,J,ut,ct){C.isVector4?ne.set(C.x,C.y,C.z,C.w):ne.set(C,J,ut,ct),G.scissor($.copy(ne).multiplyScalar(Q).round())},this.getScissorTest=function(){return ye},this.setScissorTest=function(C){G.setScissorTest(ye=C)},this.setOpaqueSort=function(C){St=C},this.setTransparentSort=function(C){xt=C},this.getClearColor=function(C){return C.copy(ee.getClearColor())},this.setClearColor=function(){ee.setClearColor(...arguments)},this.getClearAlpha=function(){return ee.getClearAlpha()},this.setClearAlpha=function(){ee.setClearAlpha(...arguments)},this.clear=function(C=!0,J=!0,ut=!0){let ct=0;if(C){let tt=!1;if(H!==null){const Rt=H.texture.format;tt=Rt===Vp||Rt===Gp||Rt===Hp}if(tt){const Rt=H.texture.type,Bt=Rt===na||Rt===Jr||Rt===vl||Rt===xl||Rt===Bp||Rt===Fp,Vt=ee.getClearColor(),Nt=ee.getClearAlpha(),Zt=Vt.r,se=Vt.g,ae=Vt.b;Bt?(E[0]=Zt,E[1]=se,E[2]=ae,E[3]=Nt,B.clearBufferuiv(B.COLOR,0,E)):(A[0]=Zt,A[1]=se,A[2]=ae,A[3]=Nt,B.clearBufferiv(B.COLOR,0,A))}else ct|=B.COLOR_BUFFER_BIT}J&&(ct|=B.DEPTH_BUFFER_BIT),ut&&(ct|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(ct)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){i.removeEventListener("webglcontextlost",Lt,!1),i.removeEventListener("webglcontextrestored",Yt,!1),i.removeEventListener("webglcontextcreationerror",At,!1),ee.dispose(),pt.dispose(),jt.dispose(),Mt.dispose(),oe.dispose(),kt.dispose(),nt.dispose(),It.dispose(),de.dispose(),dt.dispose(),wt.dispose(),wt.removeEventListener("sessionstart",_n),wt.removeEventListener("sessionend",Ln),aa.stop()};function Lt(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),F=!0}function Yt(){console.log("THREE.WebGLRenderer: Context Restored."),F=!1;const C=_t.autoReset,J=$t.enabled,ut=$t.autoUpdate,ct=$t.needsUpdate,tt=$t.type;q(),_t.autoReset=C,$t.enabled=J,$t.autoUpdate=ut,$t.needsUpdate=ct,$t.type=tt}function At(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function yt(C){const J=C.target;J.removeEventListener("dispose",yt),Qt(J)}function Qt(C){he(C),Mt.remove(C)}function he(C){const J=Mt.get(C).programs;J!==void 0&&(J.forEach(function(ut){dt.releaseProgram(ut)}),C.isShaderMaterial&&dt.releaseShaderCache(C))}this.renderBufferDirect=function(C,J,ut,ct,tt,Rt){J===null&&(J=Dt);const Bt=tt.isMesh&&tt.matrixWorld.determinant()<0,Vt=Cl(C,J,ut,ct,tt);G.setMaterial(ct,Bt);let Nt=ut.index,Zt=1;if(ct.wireframe===!0){if(Nt=b.getWireframeAttribute(ut),Nt===void 0)return;Zt=2}const se=ut.drawRange,ae=ut.attributes.position;let Se=se.start*Zt,He=(se.start+se.count)*Zt;Rt!==null&&(Se=Math.max(Se,Rt.start*Zt),He=Math.min(He,(Rt.start+Rt.count)*Zt)),Nt!==null?(Se=Math.max(Se,0),He=Math.min(He,Nt.count)):ae!=null&&(Se=Math.max(Se,0),He=Math.min(He,ae.count));const $e=He-Se;if($e<0||$e===1/0)return;It.setup(tt,ct,Vt,ut,Nt);let Pe,Ue=Pt;if(Nt!==null&&(Pe=U.get(Nt),Ue=ue,Ue.setIndex(Pe)),tt.isMesh)ct.wireframe===!0?(G.setLineWidth(ct.wireframeLinewidth*qt()),Ue.setMode(B.LINES)):Ue.setMode(B.TRIANGLES);else if(tt.isLine){let re=ct.linewidth;re===void 0&&(re=1),G.setLineWidth(re*qt()),tt.isLineSegments?Ue.setMode(B.LINES):tt.isLineLoop?Ue.setMode(B.LINE_LOOP):Ue.setMode(B.LINE_STRIP)}else tt.isPoints?Ue.setMode(B.POINTS):tt.isSprite&&Ue.setMode(B.TRIANGLES);if(tt.isBatchedMesh)if(tt._multiDrawInstances!==null)El("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Ue.renderMultiDrawInstances(tt._multiDrawStarts,tt._multiDrawCounts,tt._multiDrawCount,tt._multiDrawInstances);else if(le.get("WEBGL_multi_draw"))Ue.renderMultiDraw(tt._multiDrawStarts,tt._multiDrawCounts,tt._multiDrawCount);else{const re=tt._multiDrawStarts,Ie=tt._multiDrawCounts,ve=tt._multiDrawCount,vn=Nt?U.get(Nt).bytesPerElement:1,ti=Mt.get(ct).currentProgram.getUniforms();for(let Ne=0;Ne<ve;Ne++)ti.setValue(B,"_gl_DrawID",Ne),Ue.render(re[Ne]/vn,Ie[Ne])}else if(tt.isInstancedMesh)Ue.renderInstances(Se,$e,tt.count);else if(ut.isInstancedBufferGeometry){const re=ut._maxInstanceCount!==void 0?ut._maxInstanceCount:1/0,Ie=Math.min(ut.instanceCount,re);Ue.renderInstances(Se,$e,Ie)}else Ue.render(Se,$e)};function qe(C,J,ut){C.transparent===!0&&C.side===Li&&C.forceSinglePass===!1?(C.side=$n,C.needsUpdate=!0,fi(C,J,ut),C.side=pr,C.needsUpdate=!0,fi(C,J,ut),C.side=Li):fi(C,J,ut)}this.compile=function(C,J,ut=null){ut===null&&(ut=C),y=jt.get(ut),y.init(J),L.push(y),ut.traverseVisible(function(tt){tt.isLight&&tt.layers.test(J.layers)&&(y.pushLight(tt),tt.castShadow&&y.pushShadow(tt))}),C!==ut&&C.traverseVisible(function(tt){tt.isLight&&tt.layers.test(J.layers)&&(y.pushLight(tt),tt.castShadow&&y.pushShadow(tt))}),y.setupLights();const ct=new Set;return C.traverse(function(tt){if(!(tt.isMesh||tt.isPoints||tt.isLine||tt.isSprite))return;const Rt=tt.material;if(Rt)if(Array.isArray(Rt))for(let Bt=0;Bt<Rt.length;Bt++){const Vt=Rt[Bt];qe(Vt,ut,tt),ct.add(Vt)}else qe(Rt,ut,tt),ct.add(Rt)}),y=L.pop(),ct},this.compileAsync=function(C,J,ut=null){const ct=this.compile(C,J,ut);return new Promise(tt=>{function Rt(){if(ct.forEach(function(Bt){Mt.get(Bt).currentProgram.isReady()&&ct.delete(Bt)}),ct.size===0){tt(C);return}setTimeout(Rt,10)}le.get("KHR_parallel_shader_compile")!==null?Rt():setTimeout(Rt,10)})};let be=null;function en(C){be&&be(C)}function _n(){aa.stop()}function Ln(){aa.start()}const aa=new Yx;aa.setAnimationLoop(en),typeof self<"u"&&aa.setContext(self),this.setAnimationLoop=function(C){be=C,wt.setAnimationLoop(C),C===null?aa.stop():aa.start()},wt.addEventListener("sessionstart",_n),wt.addEventListener("sessionend",Ln),this.render=function(C,J){if(J!==void 0&&J.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===!0)return;if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),J.parent===null&&J.matrixWorldAutoUpdate===!0&&J.updateMatrixWorld(),wt.enabled===!0&&wt.isPresenting===!0&&(wt.cameraAutoUpdate===!0&&wt.updateCamera(J),J=wt.getCamera()),C.isScene===!0&&C.onBeforeRender(D,C,J,H),y=jt.get(C,L.length),y.init(J),L.push(y),rt.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),P.setFromProjectionMatrix(rt,ta,J.reversedDepth),Y=this.localClippingEnabled,ht=Ut.init(this.clippingPlanes,Y),M=pt.get(C,N.length),M.init(),N.push(M),wt.enabled===!0&&wt.isPresenting===!0){const Rt=D.xr.getDepthSensingMesh();Rt!==null&&_o(Rt,J,-1/0,D.sortObjects)}_o(C,J,0,D.sortObjects),M.finish(),D.sortObjects===!0&&M.sort(St,xt),Tt=wt.enabled===!1||wt.isPresenting===!1||wt.hasDepthSensing()===!1,Tt&&ee.addToRenderList(M,C),this.info.render.frame++,ht===!0&&Ut.beginShadows();const ut=y.state.shadowsArray;$t.render(ut,C,J),ht===!0&&Ut.endShadows(),this.info.autoReset===!0&&this.info.reset();const ct=M.opaque,tt=M.transmissive;if(y.setupLights(),J.isArrayCamera){const Rt=J.cameras;if(tt.length>0)for(let Bt=0,Vt=Rt.length;Bt<Vt;Bt++){const Nt=Rt[Bt];gr(ct,tt,C,Nt)}Tt&&ee.render(C);for(let Bt=0,Vt=Rt.length;Bt<Vt;Bt++){const Nt=Rt[Bt];Rl(M,C,Nt,Nt.viewport)}}else tt.length>0&&gr(ct,tt,C,J),Tt&&ee.render(C),Rl(M,C,J);H!==null&&O===0&&(Ht.updateMultisampleRenderTarget(H),Ht.updateRenderTargetMipmap(H)),C.isScene===!0&&C.onAfterRender(D,C,J),It.resetDefaultState(),w=-1,R=null,L.pop(),L.length>0?(y=L[L.length-1],ht===!0&&Ut.setGlobalState(D.clippingPlanes,y.state.camera)):y=null,N.pop(),N.length>0?M=N[N.length-1]:M=null};function _o(C,J,ut,ct){if(C.visible===!1)return;if(C.layers.test(J.layers)){if(C.isGroup)ut=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(J);else if(C.isLight)y.pushLight(C),C.castShadow&&y.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||P.intersectsSprite(C)){ct&&Ot.setFromMatrixPosition(C.matrixWorld).applyMatrix4(rt);const Bt=nt.update(C),Vt=C.material;Vt.visible&&M.push(C,Bt,Vt,ut,Ot.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||P.intersectsObject(C))){const Bt=nt.update(C),Vt=C.material;if(ct&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),Ot.copy(C.boundingSphere.center)):(Bt.boundingSphere===null&&Bt.computeBoundingSphere(),Ot.copy(Bt.boundingSphere.center)),Ot.applyMatrix4(C.matrixWorld).applyMatrix4(rt)),Array.isArray(Vt)){const Nt=Bt.groups;for(let Zt=0,se=Nt.length;Zt<se;Zt++){const ae=Nt[Zt],Se=Vt[ae.materialIndex];Se&&Se.visible&&M.push(C,Bt,Se,ut,Ot.z,ae)}}else Vt.visible&&M.push(C,Bt,Vt,ut,Ot.z,null)}}const Rt=C.children;for(let Bt=0,Vt=Rt.length;Bt<Vt;Bt++)_o(Rt[Bt],J,ut,ct)}function Rl(C,J,ut,ct){const tt=C.opaque,Rt=C.transmissive,Bt=C.transparent;y.setupLightsView(ut),ht===!0&&Ut.setGlobalState(D.clippingPlanes,ut),ct&&G.viewport(V.copy(ct)),tt.length>0&&ra(tt,J,ut),Rt.length>0&&ra(Rt,J,ut),Bt.length>0&&ra(Bt,J,ut),G.buffers.depth.setTest(!0),G.buffers.depth.setMask(!0),G.buffers.color.setMask(!0),G.setPolygonOffset(!1)}function gr(C,J,ut,ct){if((ut.isScene===!0?ut.overrideMaterial:null)!==null)return;y.state.transmissionRenderTarget[ct.id]===void 0&&(y.state.transmissionRenderTarget[ct.id]=new $r(1,1,{generateMipmaps:!0,type:le.has("EXT_color_buffer_half_float")||le.has("EXT_color_buffer_float")?Tl:na,minFilter:Qr,samples:4,stencilBuffer:c,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Oe.workingColorSpace}));const Rt=y.state.transmissionRenderTarget[ct.id],Bt=ct.viewport||V;Rt.setSize(Bt.z*D.transmissionResolutionScale,Bt.w*D.transmissionResolutionScale);const Vt=D.getRenderTarget(),Nt=D.getActiveCubeFace(),Zt=D.getActiveMipmapLevel();D.setRenderTarget(Rt),D.getClearColor(gt),lt=D.getClearAlpha(),lt<1&&D.setClearColor(16777215,.5),D.clear(),Tt&&ee.render(ut);const se=D.toneMapping;D.toneMapping=dr;const ae=ct.viewport;if(ct.viewport!==void 0&&(ct.viewport=void 0),y.setupLightsView(ct),ht===!0&&Ut.setGlobalState(D.clippingPlanes,ct),ra(C,ut,ct),Ht.updateMultisampleRenderTarget(Rt),Ht.updateRenderTargetMipmap(Rt),le.has("WEBGL_multisampled_render_to_texture")===!1){let Se=!1;for(let He=0,$e=J.length;He<$e;He++){const Pe=J[He],Ue=Pe.object,re=Pe.geometry,Ie=Pe.material,ve=Pe.group;if(Ie.side===Li&&Ue.layers.test(ct.layers)){const vn=Ie.side;Ie.side=$n,Ie.needsUpdate=!0,_r(Ue,ut,ct,re,Ie,ve),Ie.side=vn,Ie.needsUpdate=!0,Se=!0}}Se===!0&&(Ht.updateMultisampleRenderTarget(Rt),Ht.updateRenderTargetMipmap(Rt))}D.setRenderTarget(Vt,Nt,Zt),D.setClearColor(gt,lt),ae!==void 0&&(ct.viewport=ae),D.toneMapping=se}function ra(C,J,ut){const ct=J.isScene===!0?J.overrideMaterial:null;for(let tt=0,Rt=C.length;tt<Rt;tt++){const Bt=C[tt],Vt=Bt.object,Nt=Bt.geometry,Zt=Bt.group;let se=Bt.material;se.allowOverride===!0&&ct!==null&&(se=ct),Vt.layers.test(ut.layers)&&_r(Vt,J,ut,Nt,se,Zt)}}function _r(C,J,ut,ct,tt,Rt){C.onBeforeRender(D,J,ut,ct,tt,Rt),C.modelViewMatrix.multiplyMatrices(ut.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),tt.onBeforeRender(D,J,ut,ct,C,Rt),tt.transparent===!0&&tt.side===Li&&tt.forceSinglePass===!1?(tt.side=$n,tt.needsUpdate=!0,D.renderBufferDirect(ut,J,ct,tt,C,Rt),tt.side=pr,tt.needsUpdate=!0,D.renderBufferDirect(ut,J,ct,tt,C,Rt),tt.side=Li):D.renderBufferDirect(ut,J,ct,tt,C,Rt),C.onAfterRender(D,J,ut,ct,tt,Rt)}function fi(C,J,ut){J.isScene!==!0&&(J=Dt);const ct=Mt.get(C),tt=y.state.lights,Rt=y.state.shadowsArray,Bt=tt.state.version,Vt=dt.getParameters(C,tt.state,Rt,J,ut),Nt=dt.getProgramCacheKey(Vt);let Zt=ct.programs;ct.environment=C.isMeshStandardMaterial?J.environment:null,ct.fog=J.fog,ct.envMap=(C.isMeshStandardMaterial?kt:oe).get(C.envMap||ct.environment),ct.envMapRotation=ct.environment!==null&&C.envMap===null?J.environmentRotation:C.envMapRotation,Zt===void 0&&(C.addEventListener("dispose",yt),Zt=new Map,ct.programs=Zt);let se=Zt.get(Nt);if(se!==void 0){if(ct.currentProgram===se&&ct.lightsStateVersion===Bt)return Da(C,Vt),se}else Vt.uniforms=dt.getUniforms(C),C.onBeforeCompile(Vt,D),se=dt.acquireProgram(Vt,Nt),Zt.set(Nt,se),ct.uniforms=Vt.uniforms;const ae=ct.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(ae.clippingPlanes=Ut.uniform),Da(C,Vt),ct.needsLights=wl(C),ct.lightsStateVersion=Bt,ct.needsLights&&(ae.ambientLightColor.value=tt.state.ambient,ae.lightProbe.value=tt.state.probe,ae.directionalLights.value=tt.state.directional,ae.directionalLightShadows.value=tt.state.directionalShadow,ae.spotLights.value=tt.state.spot,ae.spotLightShadows.value=tt.state.spotShadow,ae.rectAreaLights.value=tt.state.rectArea,ae.ltc_1.value=tt.state.rectAreaLTC1,ae.ltc_2.value=tt.state.rectAreaLTC2,ae.pointLights.value=tt.state.point,ae.pointLightShadows.value=tt.state.pointShadow,ae.hemisphereLights.value=tt.state.hemi,ae.directionalShadowMap.value=tt.state.directionalShadowMap,ae.directionalShadowMatrix.value=tt.state.directionalShadowMatrix,ae.spotShadowMap.value=tt.state.spotShadowMap,ae.spotLightMatrix.value=tt.state.spotLightMatrix,ae.spotLightMap.value=tt.state.spotLightMap,ae.pointShadowMap.value=tt.state.pointShadowMap,ae.pointShadowMatrix.value=tt.state.pointShadowMatrix),ct.currentProgram=se,ct.uniformsList=null,se}function vr(C){if(C.uniformsList===null){const J=C.currentProgram.getUniforms();C.uniformsList=Ec.seqWithValue(J.seq,C.uniforms)}return C.uniformsList}function Da(C,J){const ut=Mt.get(C);ut.outputColorSpace=J.outputColorSpace,ut.batching=J.batching,ut.batchingColor=J.batchingColor,ut.instancing=J.instancing,ut.instancingColor=J.instancingColor,ut.instancingMorph=J.instancingMorph,ut.skinning=J.skinning,ut.morphTargets=J.morphTargets,ut.morphNormals=J.morphNormals,ut.morphColors=J.morphColors,ut.morphTargetsCount=J.morphTargetsCount,ut.numClippingPlanes=J.numClippingPlanes,ut.numIntersection=J.numClipIntersection,ut.vertexAlphas=J.vertexAlphas,ut.vertexTangents=J.vertexTangents,ut.toneMapping=J.toneMapping}function Cl(C,J,ut,ct,tt){J.isScene!==!0&&(J=Dt),Ht.resetTextureUnits();const Rt=J.fog,Bt=ct.isMeshStandardMaterial?J.environment:null,Vt=H===null?D.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:uo,Nt=(ct.isMeshStandardMaterial?kt:oe).get(ct.envMap||Bt),Zt=ct.vertexColors===!0&&!!ut.attributes.color&&ut.attributes.color.itemSize===4,se=!!ut.attributes.tangent&&(!!ct.normalMap||ct.anisotropy>0),ae=!!ut.morphAttributes.position,Se=!!ut.morphAttributes.normal,He=!!ut.morphAttributes.color;let $e=dr;ct.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&($e=D.toneMapping);const Pe=ut.morphAttributes.position||ut.morphAttributes.normal||ut.morphAttributes.color,Ue=Pe!==void 0?Pe.length:0,re=Mt.get(ct),Ie=y.state.lights;if(ht===!0&&(Y===!0||C!==R)){const rn=C===R&&ct.id===w;Ut.setState(ct,C,rn)}let ve=!1;ct.version===re.__version?(re.needsLights&&re.lightsStateVersion!==Ie.state.version||re.outputColorSpace!==Vt||tt.isBatchedMesh&&re.batching===!1||!tt.isBatchedMesh&&re.batching===!0||tt.isBatchedMesh&&re.batchingColor===!0&&tt.colorTexture===null||tt.isBatchedMesh&&re.batchingColor===!1&&tt.colorTexture!==null||tt.isInstancedMesh&&re.instancing===!1||!tt.isInstancedMesh&&re.instancing===!0||tt.isSkinnedMesh&&re.skinning===!1||!tt.isSkinnedMesh&&re.skinning===!0||tt.isInstancedMesh&&re.instancingColor===!0&&tt.instanceColor===null||tt.isInstancedMesh&&re.instancingColor===!1&&tt.instanceColor!==null||tt.isInstancedMesh&&re.instancingMorph===!0&&tt.morphTexture===null||tt.isInstancedMesh&&re.instancingMorph===!1&&tt.morphTexture!==null||re.envMap!==Nt||ct.fog===!0&&re.fog!==Rt||re.numClippingPlanes!==void 0&&(re.numClippingPlanes!==Ut.numPlanes||re.numIntersection!==Ut.numIntersection)||re.vertexAlphas!==Zt||re.vertexTangents!==se||re.morphTargets!==ae||re.morphNormals!==Se||re.morphColors!==He||re.toneMapping!==$e||re.morphTargetsCount!==Ue)&&(ve=!0):(ve=!0,re.__version=ct.version);let vn=re.currentProgram;ve===!0&&(vn=fi(ct,J,tt));let ti=!1,Ne=!1,Ua=!1;const Ze=vn.getUniforms(),Bn=re.uniforms;if(G.useProgram(vn.program)&&(ti=!0,Ne=!0,Ua=!0),ct.id!==w&&(w=ct.id,Ne=!0),ti||R!==C){G.buffers.depth.getReversed()&&C.reversedDepth!==!0&&(C._reversedDepth=!0,C.updateProjectionMatrix()),Ze.setValue(B,"projectionMatrix",C.projectionMatrix),Ze.setValue(B,"viewMatrix",C.matrixWorldInverse);const On=Ze.map.cameraPosition;On!==void 0&&On.setValue(B,bt.setFromMatrixPosition(C.matrixWorld)),Wt.logarithmicDepthBuffer&&Ze.setValue(B,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(ct.isMeshPhongMaterial||ct.isMeshToonMaterial||ct.isMeshLambertMaterial||ct.isMeshBasicMaterial||ct.isMeshStandardMaterial||ct.isShaderMaterial)&&Ze.setValue(B,"isOrthographic",C.isOrthographicCamera===!0),R!==C&&(R=C,Ne=!0,Ua=!0)}if(tt.isSkinnedMesh){Ze.setOptional(B,tt,"bindMatrix"),Ze.setOptional(B,tt,"bindMatrixInverse");const rn=tt.skeleton;rn&&(rn.boneTexture===null&&rn.computeBoneTexture(),Ze.setValue(B,"boneTexture",rn.boneTexture,Ht))}tt.isBatchedMesh&&(Ze.setOptional(B,tt,"batchingTexture"),Ze.setValue(B,"batchingTexture",tt._matricesTexture,Ht),Ze.setOptional(B,tt,"batchingIdTexture"),Ze.setValue(B,"batchingIdTexture",tt._indirectTexture,Ht),Ze.setOptional(B,tt,"batchingColorTexture"),tt._colorsTexture!==null&&Ze.setValue(B,"batchingColorTexture",tt._colorsTexture,Ht));const fn=ut.morphAttributes;if((fn.position!==void 0||fn.normal!==void 0||fn.color!==void 0)&&Ct.update(tt,ut,vn),(Ne||re.receiveShadow!==tt.receiveShadow)&&(re.receiveShadow=tt.receiveShadow,Ze.setValue(B,"receiveShadow",tt.receiveShadow)),ct.isMeshGouraudMaterial&&ct.envMap!==null&&(Bn.envMap.value=Nt,Bn.flipEnvMap.value=Nt.isCubeTexture&&Nt.isRenderTargetTexture===!1?-1:1),ct.isMeshStandardMaterial&&ct.envMap===null&&J.environment!==null&&(Bn.envMapIntensity.value=J.environmentIntensity),Ne&&(Ze.setValue(B,"toneMappingExposure",D.toneMappingExposure),re.needsLights&&zc(Bn,Ua),Rt&&ct.fog===!0&&Et.refreshFogUniforms(Bn,Rt),Et.refreshMaterialUniforms(Bn,ct,Q,ot,y.state.transmissionRenderTarget[C.id]),Ec.upload(B,vr(re),Bn,Ht)),ct.isShaderMaterial&&ct.uniformsNeedUpdate===!0&&(Ec.upload(B,vr(re),Bn,Ht),ct.uniformsNeedUpdate=!1),ct.isSpriteMaterial&&Ze.setValue(B,"center",tt.center),Ze.setValue(B,"modelViewMatrix",tt.modelViewMatrix),Ze.setValue(B,"normalMatrix",tt.normalMatrix),Ze.setValue(B,"modelMatrix",tt.matrixWorld),ct.isShaderMaterial||ct.isRawShaderMaterial){const rn=ct.uniformsGroups;for(let On=0,ts=rn.length;On<ts;On++){const Bi=rn[On];de.update(Bi,vn),de.bind(Bi,vn)}}return vn}function zc(C,J){C.ambientLightColor.needsUpdate=J,C.lightProbe.needsUpdate=J,C.directionalLights.needsUpdate=J,C.directionalLightShadows.needsUpdate=J,C.pointLights.needsUpdate=J,C.pointLightShadows.needsUpdate=J,C.spotLights.needsUpdate=J,C.spotLightShadows.needsUpdate=J,C.rectAreaLights.needsUpdate=J,C.hemisphereLights.needsUpdate=J}function wl(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return I},this.getActiveMipmapLevel=function(){return O},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(C,J,ut){const ct=Mt.get(C);ct.__autoAllocateDepthBuffer=C.resolveDepthBuffer===!1,ct.__autoAllocateDepthBuffer===!1&&(ct.__useRenderToTexture=!1),Mt.get(C.texture).__webglTexture=J,Mt.get(C.depthTexture).__webglTexture=ct.__autoAllocateDepthBuffer?void 0:ut,ct.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(C,J){const ut=Mt.get(C);ut.__webglFramebuffer=J,ut.__useDefaultFramebuffer=J===void 0};const vo=B.createFramebuffer();this.setRenderTarget=function(C,J=0,ut=0){H=C,I=J,O=ut;let ct=!0,tt=null,Rt=!1,Bt=!1;if(C){const Nt=Mt.get(C);if(Nt.__useDefaultFramebuffer!==void 0)G.bindFramebuffer(B.FRAMEBUFFER,null),ct=!1;else if(Nt.__webglFramebuffer===void 0)Ht.setupRenderTarget(C);else if(Nt.__hasExternalTextures)Ht.rebindTextures(C,Mt.get(C.texture).__webglTexture,Mt.get(C.depthTexture).__webglTexture);else if(C.depthBuffer){const ae=C.depthTexture;if(Nt.__boundDepthTexture!==ae){if(ae!==null&&Mt.has(ae)&&(C.width!==ae.image.width||C.height!==ae.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ht.setupDepthRenderbuffer(C)}}const Zt=C.texture;(Zt.isData3DTexture||Zt.isDataArrayTexture||Zt.isCompressedArrayTexture)&&(Bt=!0);const se=Mt.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(se[J])?tt=se[J][ut]:tt=se[J],Rt=!0):C.samples>0&&Ht.useMultisampledRTT(C)===!1?tt=Mt.get(C).__webglMultisampledFramebuffer:Array.isArray(se)?tt=se[ut]:tt=se,V.copy(C.viewport),$.copy(C.scissor),ft=C.scissorTest}else V.copy(Gt).multiplyScalar(Q).floor(),$.copy(ne).multiplyScalar(Q).floor(),ft=ye;if(ut!==0&&(tt=vo),G.bindFramebuffer(B.FRAMEBUFFER,tt)&&ct&&G.drawBuffers(C,tt),G.viewport(V),G.scissor($),G.setScissorTest(ft),Rt){const Nt=Mt.get(C.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+J,Nt.__webglTexture,ut)}else if(Bt){const Nt=J;for(let Zt=0;Zt<C.textures.length;Zt++){const se=Mt.get(C.textures[Zt]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+Zt,se.__webglTexture,ut,Nt)}}else if(C!==null&&ut!==0){const Nt=Mt.get(C.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Nt.__webglTexture,ut)}w=-1},this.readRenderTargetPixels=function(C,J,ut,ct,tt,Rt,Bt,Vt=0){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Nt=Mt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Bt!==void 0&&(Nt=Nt[Bt]),Nt){G.bindFramebuffer(B.FRAMEBUFFER,Nt);try{const Zt=C.textures[Vt],se=Zt.format,ae=Zt.type;if(!Wt.textureFormatReadable(se)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Wt.textureTypeReadable(ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}J>=0&&J<=C.width-ct&&ut>=0&&ut<=C.height-tt&&(C.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+Vt),B.readPixels(J,ut,ct,tt,te.convert(se),te.convert(ae),Rt))}finally{const Zt=H!==null?Mt.get(H).__webglFramebuffer:null;G.bindFramebuffer(B.FRAMEBUFFER,Zt)}}},this.readRenderTargetPixelsAsync=async function(C,J,ut,ct,tt,Rt,Bt,Vt=0){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Nt=Mt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Bt!==void 0&&(Nt=Nt[Bt]),Nt)if(J>=0&&J<=C.width-ct&&ut>=0&&ut<=C.height-tt){G.bindFramebuffer(B.FRAMEBUFFER,Nt);const Zt=C.textures[Vt],se=Zt.format,ae=Zt.type;if(!Wt.textureFormatReadable(se))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Wt.textureTypeReadable(ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Se=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,Se),B.bufferData(B.PIXEL_PACK_BUFFER,Rt.byteLength,B.STREAM_READ),C.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+Vt),B.readPixels(J,ut,ct,tt,te.convert(se),te.convert(ae),0);const He=H!==null?Mt.get(H).__webglFramebuffer:null;G.bindFramebuffer(B.FRAMEBUFFER,He);const $e=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await YE(B,$e,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,Se),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,Rt),B.deleteBuffer(Se),B.deleteSync($e),Rt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(C,J=null,ut=0){const ct=Math.pow(2,-ut),tt=Math.floor(C.image.width*ct),Rt=Math.floor(C.image.height*ct),Bt=J!==null?J.x:0,Vt=J!==null?J.y:0;Ht.setTexture2D(C,0),B.copyTexSubImage2D(B.TEXTURE_2D,ut,0,0,Bt,Vt,tt,Rt),G.unbindTexture()};const xr=B.createFramebuffer(),Pc=B.createFramebuffer();this.copyTextureToTexture=function(C,J,ut=null,ct=null,tt=0,Rt=null){Rt===null&&(tt!==0?(El("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),Rt=tt,tt=0):Rt=0);let Bt,Vt,Nt,Zt,se,ae,Se,He,$e;const Pe=C.isCompressedTexture?C.mipmaps[Rt]:C.image;if(ut!==null)Bt=ut.max.x-ut.min.x,Vt=ut.max.y-ut.min.y,Nt=ut.isBox3?ut.max.z-ut.min.z:1,Zt=ut.min.x,se=ut.min.y,ae=ut.isBox3?ut.min.z:0;else{const fn=Math.pow(2,-tt);Bt=Math.floor(Pe.width*fn),Vt=Math.floor(Pe.height*fn),C.isDataArrayTexture?Nt=Pe.depth:C.isData3DTexture?Nt=Math.floor(Pe.depth*fn):Nt=1,Zt=0,se=0,ae=0}ct!==null?(Se=ct.x,He=ct.y,$e=ct.z):(Se=0,He=0,$e=0);const Ue=te.convert(J.format),re=te.convert(J.type);let Ie;J.isData3DTexture?(Ht.setTexture3D(J,0),Ie=B.TEXTURE_3D):J.isDataArrayTexture||J.isCompressedArrayTexture?(Ht.setTexture2DArray(J,0),Ie=B.TEXTURE_2D_ARRAY):(Ht.setTexture2D(J,0),Ie=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,J.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,J.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,J.unpackAlignment);const ve=B.getParameter(B.UNPACK_ROW_LENGTH),vn=B.getParameter(B.UNPACK_IMAGE_HEIGHT),ti=B.getParameter(B.UNPACK_SKIP_PIXELS),Ne=B.getParameter(B.UNPACK_SKIP_ROWS),Ua=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,Pe.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,Pe.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,Zt),B.pixelStorei(B.UNPACK_SKIP_ROWS,se),B.pixelStorei(B.UNPACK_SKIP_IMAGES,ae);const Ze=C.isDataArrayTexture||C.isData3DTexture,Bn=J.isDataArrayTexture||J.isData3DTexture;if(C.isDepthTexture){const fn=Mt.get(C),rn=Mt.get(J),On=Mt.get(fn.__renderTarget),ts=Mt.get(rn.__renderTarget);G.bindFramebuffer(B.READ_FRAMEBUFFER,On.__webglFramebuffer),G.bindFramebuffer(B.DRAW_FRAMEBUFFER,ts.__webglFramebuffer);for(let Bi=0;Bi<Nt;Bi++)Ze&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Mt.get(C).__webglTexture,tt,ae+Bi),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Mt.get(J).__webglTexture,Rt,$e+Bi)),B.blitFramebuffer(Zt,se,Bt,Vt,Se,He,Bt,Vt,B.DEPTH_BUFFER_BIT,B.NEAREST);G.bindFramebuffer(B.READ_FRAMEBUFFER,null),G.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(tt!==0||C.isRenderTargetTexture||Mt.has(C)){const fn=Mt.get(C),rn=Mt.get(J);G.bindFramebuffer(B.READ_FRAMEBUFFER,xr),G.bindFramebuffer(B.DRAW_FRAMEBUFFER,Pc);for(let On=0;On<Nt;On++)Ze?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,fn.__webglTexture,tt,ae+On):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,fn.__webglTexture,tt),Bn?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,rn.__webglTexture,Rt,$e+On):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,rn.__webglTexture,Rt),tt!==0?B.blitFramebuffer(Zt,se,Bt,Vt,Se,He,Bt,Vt,B.COLOR_BUFFER_BIT,B.NEAREST):Bn?B.copyTexSubImage3D(Ie,Rt,Se,He,$e+On,Zt,se,Bt,Vt):B.copyTexSubImage2D(Ie,Rt,Se,He,Zt,se,Bt,Vt);G.bindFramebuffer(B.READ_FRAMEBUFFER,null),G.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else Bn?C.isDataTexture||C.isData3DTexture?B.texSubImage3D(Ie,Rt,Se,He,$e,Bt,Vt,Nt,Ue,re,Pe.data):J.isCompressedArrayTexture?B.compressedTexSubImage3D(Ie,Rt,Se,He,$e,Bt,Vt,Nt,Ue,Pe.data):B.texSubImage3D(Ie,Rt,Se,He,$e,Bt,Vt,Nt,Ue,re,Pe):C.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,Rt,Se,He,Bt,Vt,Ue,re,Pe.data):C.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,Rt,Se,He,Pe.width,Pe.height,Ue,Pe.data):B.texSubImage2D(B.TEXTURE_2D,Rt,Se,He,Bt,Vt,Ue,re,Pe);B.pixelStorei(B.UNPACK_ROW_LENGTH,ve),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,vn),B.pixelStorei(B.UNPACK_SKIP_PIXELS,ti),B.pixelStorei(B.UNPACK_SKIP_ROWS,Ne),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Ua),Rt===0&&J.generateMipmaps&&B.generateMipmap(Ie),G.unbindTexture()},this.initRenderTarget=function(C){Mt.get(C).__webglFramebuffer===void 0&&Ht.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?Ht.setTextureCube(C,0):C.isData3DTexture?Ht.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?Ht.setTexture2DArray(C,0):Ht.setTexture2D(C,0),G.unbindTexture()},this.resetState=function(){I=0,O=0,H=null,G.reset(),It.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ta}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const i=this.getContext();i.drawingBufferColorSpace=Oe._getDrawingBufferColorSpace(e),i.unpackColorSpace=Oe._getUnpackColorSpace()}}const Qi=(o,e=0)=>new ET({color:o,roughness:.72,metalness:.35,emissive:e,emissiveIntensity:.65});class gC{constructor(e){this.canvas=e,this.renderer=new mC({canvas:e,antialias:!0,alpha:!1}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)),this.renderer.setClearColor(726302),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Sx,this.scene.fog=new jp(1122347,.003),this.scene.add(new AT(10734035,2437433,2.3));const i=new wT(16768940,3.2);i.position.set(20,65,35),i.castShadow=!0,i.shadow.mapSize.set(2048,2048),i.shadow.camera.left=-80,i.shadow.camera.right=80,i.shadow.camera.top=80,i.shadow.camera.bottom=-80,i.shadow.camera.far=180,i.shadow.bias=-.001,this.scene.add(i);const r=this.box(180,1,150,2636869);r.position.set(56,-.65,44),r.receiveShadow=!0,this.scene.add(r);const l=new NT(112,56,3822940,3229519);l.position.set(56,-.1,44),l.scale.z=88/112,this.scene.add(l);const c=this.box(8,1.2,88,530464);c.position.set(56,-.35,44),this.scene.add(c);for(const p of $i.bridges){const _=this.box(11,.5,8,5792106);_.position.set(56,.05,p),_.receiveShadow=!0,this.scene.add(_);for(const m of[51,61]){const x=this.box(.3,.65,8,10981988);x.position.set(m,.5,p),this.scene.add(x)}for(let m=52;m<61;m+=2){const x=this.box(.07,.04,7.5,12102528);x.position.set(m,.33,p),this.scene.add(x)}}let h=36;const d=()=>(h=h*1664525+1013904223>>>0,h/4294967296);for(let p=0;p<190;p++){let _=d()*112,m=d()*88;if(_>8&&_<104&&m>8&&m<80&&Math.abs(_-56)>8||$i.bridges.some(S=>Math.abs(m-S)<6)&&Math.abs(_-56)<10)continue;const x=new cn(new Kp(1+d()*2.3,0),Qi(3425872));x.position.set(_,d()*.8,m),x.scale.y=1+d()*1.7,x.rotation.set(d(),d(),d()),x.castShadow=!0,this.scene.add(x)}for(const p of $i.vents){const _=new cn(new Dc(1.9,.17,5,16),Qi(6965906,7556021));_.rotation.x=Math.PI/2,_.position.set(p.x,.2,p.z),this.scene.add(_);const m=new cn(new Aa(.8,1.2,.15,12),Qi(7092876,11032270));m.position.set(p.x,.12,p.z),this.scene.add(m)}for(const p of $i.pylons){const _=new Ra,m=this.box(2.5,.4,2.5,5727594);_.add(m);const x=this.box(.5,4,.5,11973536);x.position.y=2,_.add(x);const S=new cn(new no(1.1),Qi(13089406,6120778));S.position.y=4,_.add(S),_.position.set(p.x,0,p.z),this.scene.add(_)}this.fogCanvas.width=112,this.fogCanvas.height=88,this.fogTexture=new MT(this.fogCanvas),this.fogTexture.magFilter=zi;const g=new eo({map:this.fogTexture,transparent:!0,depthWrite:!1,fog:!1});this.fogMesh=new cn(new fo(112,88),g),this.fogMesh.rotation.x=-Math.PI/2,this.fogMesh.position.set(56,.08,44),this.fogMesh.renderOrder=5,this.scene.add(this.fogMesh),this.placement=new cn(new wc(2.3,2.5,40),new eo({color:6811585,side:Li,transparent:!0,opacity:.8})),this.placement.rotation.x=-Math.PI/2,this.placement.position.y=.2,this.placement.visible=!1,this.scene.add(this.placement),this.resize()}canvas;renderer;scene=new _T;camera=new Ei(45,1,.1,300);center=new et(28,0,62);zoom=42;selected=new Set;views=new Map;rings=new Map;ray=new UT;plane=new cr(new et(0,1,0),0);pointer=new Te;keys=new Set;fogCanvas=document.createElement("canvas");fogTexture;fogMesh;placement;clock=0;debug=!1;box(e,i,r,l){const c=new cn(new Jn(e,i,r),Qi(l));return c.castShadow=!0,c}create(e,i){const r=new Ra,l=Jt[e.kind],c=i.factions[e.team]==="verdant",h=e.team?13796284:6741186,d=Qi(h,h),g=Qi(c?6706538:8688536),p=Qi(2505542),_=(S,E,A,M,y)=>{const N=new cn(S,E);return N.position.set(A,M,y),N.castShadow=!0,r.add(N),N};if(l.building){const S=l.radius;if(_(new Aa(S*1.1,S*1.25,.4,c?7:4),p,0,.2,0),e.kind==="core"){_(new Aa(S*.75,S,2.6,c?7:6),g,0,1.5,0),_(new Dc(2.1,.2,6,6),d,0,3,0).rotation.x=Math.PI/2,_(new no(1.1),d,0,3.8,0);for(const E of[-2.1,2.1])_(new Jn(.8,2.4,2.3),p,E,1.5,0)}else if(e.kind==="pylon"||e.kind==="tap")_(new Aa(.4,.9,2.6,6),g,0,1.5,0),_(new no(1),d,0,3,0);else if(_(new Jn(S*1.7,1.7,S*1.5),g,0,1,0),_(new Jn(S*1.4,.18,.35),d,0,1.9,.5),e.kind==="turret")_(new Jn(.6,.6,2.4),p,0,2.2,.8);else for(let E=-1;E<=1;E+=2)_(new Aa(.22,.3,1.7,6),p,E*S*.6,2.4,-.5)}else{const S=l.radius;if(c){_(new Qp(S,7,5),g,0,S,0).scale.set(1,1.3,1.3),_(new _l(S*.65,S*2,5),d,0,S*2.3,-.2);for(const E of[-1,1]){const A=_(new _l(.17,S*1.9,4),p,E*S,.5,.4);A.rotation.z=E*.65}}else{_(new Jn(S*1.5,S,S*1.7),g,0,S+.15,0),_(new Jn(S,.18,S*.5),d,0,S*1.6,.2);for(const E of[-1,1])_(new Jn(.35,.55,S*1.7),p,E*S,.35,0);e.kind!=="worker"&&_(new Jn(.28,.3,S*2),p,.35,S*1.8,.7),e.kind==="siege"&&(_(new Aa(.3,.45,2.7,6),g,0,1.6,.6).rotation.x=Math.PI/3)}e.kind==="worker"&&_(new no(.4),Qi(7536621,2538918),0,1.5,-.4)}const m=new cn(new wc(l.radius+.3,l.radius+.42,32),new eo({color:h,side:Li,transparent:!0,opacity:.9}));m.rotation.x=-Math.PI/2,m.position.y=.12,r.add(m),this.rings.set(e.id,m);const x=new cn(new fo(l.radius*2.4,.14),new eo({color:h}));return x.name="hp",x.position.set(0,l.building?4.8:2.8,0),x.rotation.x=-.7,r.add(x),this.scene.add(r),this.views.set(e.id,r),r}resize(){const e=this.canvas.clientWidth,i=this.canvas.clientHeight;this.renderer.setSize(e,i,!1),this.camera.aspect=e/i,this.camera.updateProjectionMatrix()}groundAt(e,i){const r=this.canvas.getBoundingClientRect();this.pointer.set((e-r.left)/r.width*2-1,-(i-r.top)/r.height*2+1),this.ray.setFromCamera(this.pointer,this.camera);const l=new et;return this.ray.ray.intersectPlane(this.plane,l)?l:null}screen(e){const i=new et(e.x,1,e.z).project(this.camera);return{x:(i.x+1)/2*this.canvas.clientWidth,y:(1-i.y)/2*this.canvas.clientHeight}}focus(e,i){this.center.set(e,0,i)}render(e,i){this.clock+=i;const r=i*this.zoom*.6*(this.keys.has("Shift")?1.6:1);(this.keys.has("w")||this.keys.has("ArrowUp"))&&(this.center.z-=r),(this.keys.has("s")||this.keys.has("ArrowDown"))&&(this.center.z+=r),(this.keys.has("a")||this.keys.has("ArrowLeft"))&&(this.center.x-=r),(this.keys.has("d")||this.keys.has("ArrowRight"))&&(this.center.x+=r),this.center.x=Ev.clamp(this.center.x,10,102),this.center.z=Ev.clamp(this.center.z,10,78),this.camera.position.set(this.center.x,this.zoom,this.center.z+this.zoom*.7),this.camera.lookAt(this.center),this.camera.updateMatrixWorld();for(const[h,d]of this.views)e.entities.some(g=>g.id===h)||(this.scene.remove(d),this.views.delete(h),this.rings.delete(h),d.traverse(g=>{g instanceof cn&&g.geometry.dispose()}));for(const h of e.entities){const d=this.views.get(h.id)??this.create(h,e);d.visible=h.team===0||e.seen[0].has(h.id)||this.debug,d.position.set(h.x,0,h.z),d.rotation.y=h.angle,d.scale.set(Jt[h.kind].building?1:1.15,Math.max(.12,h.progress),Jt[h.kind].building?1:1.15),Jt[h.kind].building||(d.position.y=Math.sin(this.clock*8+h.id)*.035),this.rings.get(h.id).visible=this.selected.has(h.id);const g=d.getObjectByName("hp");g.visible=this.selected.has(h.id)||h.hp<Jt[h.kind].hp,g.scale.x=Math.max(.01,h.hp/Jt[h.kind].hp)}if(e.tick%10===0){const h=this.fogCanvas.getContext("2d");h.clearRect(0,0,112,88);for(let d=0;d<88;d+=4)for(let g=0;g<112;g+=4){const p=e.visible(0,g+2,d+2);h.fillStyle=p?"rgba(6,14,23,0)":e.explored[0].has(d*112+g)?"rgba(6,14,23,.58)":"rgba(6,14,23,.94)",h.fillRect(g,d,4,4)}this.fogTexture.needsUpdate=!0}this.fogMesh.visible=!this.debug;const l=this.scene.getObjectByName("tracers");l&&(this.scene.remove(l),l.traverse(h=>{h instanceof Np&&(h.geometry.dispose(),h.material.dispose())}));const c=new Ra;c.name="tracers";for(const h of e.effects){const d=new et(h.x,1.5,h.z),g=new et(h.tx,1.2,h.tz),p=new Np(new Yn().setFromPoints([d,g]),new Zp({color:h.team?15503310:16767879,transparent:!0,opacity:h.life/8}));c.add(p)}this.scene.add(c),this.renderer.render(this.scene,this.camera)}addResources(e){const i=this.scene.getObjectByName("resources");i&&this.scene.remove(i);const r=new Ra;r.name="resources",this.scene.add(r);for(const l of e.resources){const c=new Ra;for(let h=0;h<3;h++){const d=new cn(new _l(.5,1.4+h*.6,5),Qi(6669755,2326393));d.position.set((h-1)*.45,.6+h*.15,0),d.rotation.z=(h-1)*.35,d.castShadow=!0,c.add(d)}c.position.set(l.x,0,l.z),r.add(c)}}dispose(){this.renderer.dispose()}}const _C="SHARDFRONT";function vC(){const o=Fe.useRef(null),e=Fe.useRef(null),i=Fe.useRef(null),r=Fe.useRef(new pv),l=Fe.useRef(new Set),c=Fe.useRef(null),h=Fe.useRef({}),[d,g]=Fe.useState("menu"),[p,_]=Fe.useState("helix"),[m,x]=Fe.useState(1),[S,E]=Fe.useState(!1),[A,M]=Fe.useState(!1),[y,N]=Fe.useState(0),[L,D]=Fe.useState(""),[F,I]=Fe.useState(""),[O,H]=Fe.useState(!1),[w,R]=Fe.useState(null),[V,$]=Fe.useState(!1),[ft,gt]=Fe.useState(!1),lt=Fe.useRef(!1),j=Fe.useRef(!1),ot=Fe.useRef(!1),Q=Fe.useRef(null),St=Fe.useRef(0),xt=Fe.useRef(new Set),Gt=(G=400)=>{if(!ot.current)try{Q.current??=new AudioContext;const _t=Q.current;_t.state==="suspended"&&_t.resume();const Mt=_t.createOscillator(),Ht=_t.createGain();Mt.type="sine",Mt.frequency.setValueAtTime(G,_t.currentTime),Mt.frequency.exponentialRampToValueAtTime(G*.5,_t.currentTime+.12),Ht.gain.setValueAtTime(.035,_t.currentTime),Ht.gain.exponentialRampToValueAtTime(.001,_t.currentTime+.16),Mt.connect(Ht),Ht.connect(_t.destination),Mt.start(),Mt.stop(_t.currentTime+.18)}catch{}},ne=G=>{const _t=r.current;_t.message="";const Mt=_t.command({...G,team:0});return Mt?(xt.current.add(G.kind),G.order&&xt.current.add(G.order),Gt(G.kind==="order"?460:650)):(I(_t.message||"Order unavailable"),Gt(160)),N(Ht=>Ht+1),Mt},ye=G=>{r.current=new pv(p,m),i.current?.views.forEach(_t=>i.current?.scene.remove(_t)),i.current?.views.clear(),i.current&&(i.current.addResources(r.current),i.current.focus(27,63)),l.current.clear(),c.current=null,xt.current.clear(),E(G),g("game"),M(!1),j.current=!1,lt.current=!0,I("Uplink established. Your workers are harvesting Prism Ore."),H(!1),Gt(820)};Fe.useEffect(()=>{if(!o.current)return;let G;try{if(!document.createElement("canvas").getContext("webgl2"))throw new Error("WebGL 2 is unavailable. Enable hardware acceleration and reload in Chrome or Edge.");G=new gC(o.current),i.current=G,G.addResources(r.current)}catch(nt){D(String(nt));return}let _t=0,Mt=performance.now(),Ht=0,oe=0;const kt=nt=>{const dt=Math.min(.1,(nt-Mt)/1e3);if(Mt=nt,lt.current&&!j.current&&!document.hidden){for(Ht+=dt;Ht>=.05;)r.current.step(),Ht-=.05;if(r.current.winner!==null){lt.current=!1,g("result");try{localStorage.setItem("shardfront-last-match",JSON.stringify({winner:r.current.winner,ticks:r.current.tick,created:r.current.created[0]}))}catch{}}}G.selected=l.current,G.render(r.current,dt),r.current.effects.length&&nt-St.current>250&&(Gt(r.current.effects[0].siege?95:135),St.current=nt),nt-oe>150&&(N(Et=>Et+1),oe=nt),_t=requestAnimationFrame(kt)};_t=requestAnimationFrame(kt);const U=()=>G.resize();window.addEventListener("resize",U);const b=nt=>{nt.preventDefault(),j.current=!0,D("Graphics context lost. Reload the page to begin a fresh match.")};return o.current.addEventListener("webglcontextlost",b),()=>{cancelAnimationFrame(_t),window.removeEventListener("resize",U),G.dispose()}},[]),Fe.useEffect(()=>{j.current=A},[A]),Fe.useEffect(()=>{ot.current=V},[V]),Fe.useEffect(()=>{const G=i.current;if(!G)return;const _t=oe=>{if(!lt.current)return;const kt=oe.key.toLowerCase();if(!(oe.target instanceof HTMLSelectElement)){if([" ","arrowup","arrowdown","arrowleft","arrowright","tab"].includes(kt)&&oe.preventDefault(),kt==="escape"){c.current?(c.current=null,H(!1)):M(U=>!U);return}if(kt==="b"){H(U=>!U);return}if(kt==="a"&&!oe.repeat){c.current="attack",I("ATTACK MOVE · left click a destination");return}if(kt==="s"&&oe.ctrlKey){oe.preventDefault(),ne({kind:"stop",ids:[...l.current]});return}if(kt==="q"){ne({kind:"ability",ids:[...l.current]});return}if(kt==="home"||kt===" "){G.focus(18,66);return}if(kt==="f"){const U=r.current.entities.filter(b=>l.current.has(b.id));U.length&&G.focus(U[0].x,U[0].z);return}if(/^[1-9]$/.test(kt)){oe.ctrlKey?(oe.preventDefault(),h.current[kt]=[...l.current],xt.current.add("group"),I("Control group "+kt+" assigned")):l.current=new Set(h.current[kt]??[]);return}kt==="f3"&&(oe.preventDefault(),G.debug=!G.debug),G.keys.add(oe.key),G.keys.add(kt)}},Mt=oe=>{G.keys.delete(oe.key),G.keys.delete(oe.key.toLowerCase())},Ht=()=>G.keys.clear();return window.addEventListener("keydown",_t),window.addEventListener("keyup",Mt),window.addEventListener("blur",Ht),()=>{window.removeEventListener("keydown",_t),window.removeEventListener("keyup",Mt),window.removeEventListener("blur",Ht)}},[d]),Fe.useEffect(()=>{const G=e.current;if(!G)return;const _t=G.getContext("2d"),Mt=r.current;_t.fillStyle="#111f28",_t.fillRect(0,0,224,156);const Ht=U=>U*2,oe=U=>U*156/88;_t.fillStyle="#061016",_t.fillRect(104,0,16,156),_t.fillStyle="#6c7069";for(const U of $i.bridges)_t.fillRect(102,oe(U-4),20,14);for(const U of Mt.resources)_t.fillStyle="#407d78",_t.fillRect(Ht(U.x)-1,oe(U.z)-1,2,2);for(const U of Mt.entities)if(Mt.seen[0].has(U.id)){_t.fillStyle=U.team?"#e795c9":"#70e5c6";const b=Jt[U.kind].building?5:2.5;_t.fillRect(Ht(U.x)-b/2,oe(U.z)-b/2,b,b)}const kt=i.current;kt&&(_t.strokeStyle="#b2c4c6",_t.lineWidth=1,_t.strokeRect(Ht(kt.center.x)-39,oe(kt.center.z)-26,78,52))},[y]);const P=r.current,ht=P.entities.filter(G=>l.current.has(G.id)),Y=ht[0],rt=ht.some(G=>G.kind==="worker"),bt=Y?.kind==="core",Ot=Y?.kind==="bay",Dt=Y?.kind==="tech",Tt=Fe.useRef({x:0,y:0,button:0}),qt=(G,_t,Mt=!1)=>{const Ht=P.entities.find(kt=>kt.team===1&&P.seen[0].has(kt.id)&&Math.hypot(kt.x-G,kt.z-_t)<Jt[kt.kind].radius+1.4),oe=P.resources.find(kt=>Math.hypot(kt.x-G,kt.z-_t)<3);ne({kind:"order",ids:[...l.current],x:G,z:_t,target:Ht?.id,order:Ht||c.current==="attack"?"attack":oe&&rt?"gather":"move",append:Mt}),c.current=null},B=G=>{if(!lt.current||A)return;const _t=i.current,Mt=Tt.current;if(Mt.button===2)return;const Ht=_t.groundAt(G.clientX,G.clientY);if(!Ht)return;if(c.current){c.current==="attack"?qt(Ht.x,Ht.z,G.shiftKey):ne({kind:"build",ids:[...l.current],unit:c.current,x:Ht.x,z:Ht.z})&&(c.current=null,H(!1)),R(null);return}const oe=Math.hypot(G.clientX-Mt.x,G.clientY-Mt.y);if(G.shiftKey||(l.current=new Set),oe>6)for(const kt of P.entities.filter(U=>U.team===0&&!Jt[U.kind].building)){const U=_t.screen(kt);U.x>=Math.min(Mt.x,G.clientX)&&U.x<=Math.max(Mt.x,G.clientX)&&U.y>=Math.min(Mt.y,G.clientY)&&U.y<=Math.max(Mt.y,G.clientY)&&l.current.add(kt.id)}else{const kt=P.entities.filter(U=>U.team===0).map(U=>({u:U,q:_t.screen(U)})).sort((U,b)=>Math.hypot(U.q.x-G.clientX,U.q.y-G.clientY)-Math.hypot(b.q.x-G.clientX,b.q.y-G.clientY))[0];kt&&Math.hypot(kt.q.x-G.clientX,kt.q.y-G.clientY)<30&&(G.shiftKey&&l.current.has(kt.u.id)?l.current.delete(kt.u.id):l.current.add(kt.u.id))}R(null),xt.current.add("select"),N(kt=>kt+1)},ze=Math.floor(P.tick/20),le=`${Math.floor(ze/60).toString().padStart(2,"0")}:${(ze%60).toString().padStart(2,"0")}`,Wt=G=>X.jsxs("button",{className:"command",title:`${Ki(G,p)} · ${Jt[G].hp} HP · ${Jt[G].damage} damage · range ${Jt[G].range} · ${Jt[G].time/20}s production${Jt[G].prereq?" · Requires "+Ki(Jt[G].prereq,p):""}`,onClick:()=>ne({kind:"train",ids:[...l.current],unit:G}),children:[X.jsx("span",{className:"unit-icon "+G,children:"◇"}),X.jsx("b",{children:Ki(G,p)}),X.jsxs("small",{children:[Jt[G].ore," O ",Jt[G].flux?` / ${Jt[G].flux} F`:""]})]},G);return X.jsxs("main",{children:[X.jsx("canvas",{ref:o,className:"battlefield",onContextMenu:G=>{if(G.preventDefault(),lt.current&&!A){const _t=i.current?.groundAt(G.clientX,G.clientY);_t&&qt(_t.x,_t.z,G.shiftKey)}},onPointerDown:G=>{Tt.current={x:G.clientX,y:G.clientY,button:G.button},G.button===0&&G.currentTarget.setPointerCapture(G.pointerId)},onPointerMove:G=>{const _t=i.current?.groundAt(G.clientX,G.clientY),Mt=i.current;Mt&&_t&&(Mt.placement.visible=!!c.current,Mt.placement.position.set(_t.x,.2,_t.z),c.current&&c.current!=="attack"&&Mt.placement.material.color.set(P.canPlace(c.current,_t.x,_t.z)?7398854:16742263)),G.buttons===1&&Tt.current.button===0&&!c.current&&R({x:Math.min(G.clientX,Tt.current.x),y:Math.min(G.clientY,Tt.current.y),w:Math.abs(G.clientX-Tt.current.x),h:Math.abs(G.clientY-Tt.current.y)})},onPointerUp:B,onDoubleClick:()=>{Y&&(l.current=new Set(P.entities.filter(G=>G.team===0&&G.kind===Y.kind).map(G=>G.id)))},onWheel:G=>{i.current&&(i.current.zoom=Math.max(24,Math.min(68,i.current.zoom+G.deltaY*.025)))}}),L?X.jsxs("div",{className:"modal",children:[X.jsx("h1",{children:"Uplink interrupted"}),X.jsx("p",{children:L}),X.jsx("button",{onClick:()=>location.reload(),children:"Reload"})]}):null,d==="menu"&&!L?X.jsxs(X.Fragment,{children:[X.jsx("div",{className:"menu-shade"}),X.jsxs("div",{className:"menu",children:[X.jsx("div",{className:"eyebrow",children:"ONESHOT ARCADE / ORIGINAL RTS"}),X.jsxs("h1",{children:[_C,X.jsx("span",{children:"THE GLASS RAVINE OPERATION"})]}),X.jsxs("p",{className:"intro",children:["Two signals. One fractured moon.",X.jsx("br",{}),"Build your foothold. Break their relay."]}),X.jsxs("div",{className:"factions",children:[X.jsxs("button",{className:p==="helix"?"chosen":"",onClick:()=>_("helix"),children:[X.jsx("span",{children:"◇"}),X.jsx("b",{children:"HELIX DIRECTORATE"}),X.jsx("small",{children:"Armored machinery · steady firepower"})]}),X.jsxs("button",{className:p==="verdant"?"chosen verdant":"verdant",onClick:()=>_("verdant"),children:[X.jsx("span",{children:"◇"}),X.jsx("b",{children:"VERDANT CHORUS"}),X.jsx("small",{children:"Living forms · speed & regeneration"})]})]}),X.jsxs("div",{className:"preflight",children:[X.jsxs("label",{children:["OPPOSITION ",X.jsxs("select",{value:m,onChange:G=>x(+G.target.value),children:[X.jsx("option",{value:0,children:"Easy · slower assaults"}),X.jsx("option",{value:1,children:"Normal · balanced assaults"}),X.jsx("option",{value:2,children:"Hard · earlier assaults"})]})]}),X.jsx("span",{children:"01 / GLASS RAVINE"})]}),X.jsxs("div",{className:"menu-actions",children:[X.jsxs("button",{className:"primary",onClick:()=>ye(!1),children:["DEPLOY TO RAVINE ",X.jsx("span",{children:"◇"})]}),X.jsx("button",{onClick:()=>ye(!0),children:"GUIDED OPERATION"})]}),X.jsx("p",{className:"menu-foot",children:"LOCAL SKIRMISH · NO ACCOUNT · KEYBOARD + MOUSE"})]}),X.jsxs("div",{className:"map-label",children:[X.jsx("span",{children:"SECTOR 07.31"}),X.jsxs("b",{children:["A world divided.",X.jsx("br",{}),"A front to cross."]}),X.jsx("small",{children:"PRISM ORE / FLUX / SIGNAL CONTROL"})]})]}):null,d!=="menu"&&!L?X.jsxs(X.Fragment,{children:[X.jsxs("header",{children:[X.jsxs("div",{className:"wordmark",children:["SHARD",X.jsx("span",{children:"FRONT"}),X.jsxs("small",{children:["GLASS RAVINE / ",p==="helix"?"DIRECTORATE":"CHORUS"]})]}),X.jsxs("div",{className:"objective",children:[X.jsx("i",{})," DESTROY THE ENEMY RELAY ",X.jsx("small",{children:"Across the ravine · northeast"})]}),X.jsxs("div",{className:"resources",children:[X.jsxs("div",{children:[X.jsx("i",{children:"O"}),X.jsx("b",{children:Math.floor(P.ore[0])}),X.jsx("small",{children:"PRISM ORE"})]}),X.jsxs("div",{children:[X.jsx("i",{children:"F"}),X.jsx("b",{children:Math.floor(P.flux[0])}),X.jsx("small",{children:"FLUX"})]}),X.jsxs("div",{className:P.supply(0)>=P.cap(0)?"danger":"",children:[X.jsxs("b",{children:[P.supply(0),X.jsxs("em",{children:[" / ",P.cap(0)]})]}),X.jsx("small",{children:"SUPPLY"})]}),X.jsxs("div",{children:[X.jsx("b",{children:le}),X.jsx("small",{children:"MISSION TIME"})]}),X.jsx("button",{onClick:()=>M(G=>!G),children:"PAUSE"})]})]}),X.jsxs("div",{className:"sector",children:[X.jsx("span",{children:"LIVE / SURFACE UPLINK"}),X.jsx("b",{children:"GLASS RAVINE"}),X.jsx("small",{children:"112 × 88 · TWO BRIDGE LANES + CENTRAL CROSSING"})]}),S?X.jsxs("div",{className:"guide",children:[X.jsxs("span",{children:["FIELD MANUAL / ",xt.current.size," actions"]}),X.jsx("b",{children:xt.current.has("select")?xt.current.has("build")?xt.current.has("train")?xt.current.has("attack")?"05 · Break the enemy relay":"04 · Advance across the ravine":"03 · Raise an army":"02 · Establish production":"01 · Select your forces"}),X.jsx("p",{children:xt.current.has("select")?xt.current.has("build")?xt.current.has("train")?"Train combined arms, add supply pylons and a Foundry. A + click orders an attack move. Q spends 10 Flux to repair selected combat units. Ctrl + 1 assigns a control group.":"Select your production building and train combat units. Build a Flux Tap on a violet vent for advanced technology.":"Select a worker, choose Assembly Bay / Brood Hollow, then click clear ground near your base.":"Drag a box around units. Right click crystals to gather or terrain to move."})]}):null,X.jsx("div",{className:"notification",children:c.current?X.jsxs(X.Fragment,{children:[X.jsx("span",{children:"◇"})," ",c.current==="attack"?"ATTACK MOVE · Select destination":`PLACE ${Ki(c.current,p).toUpperCase()} · Click ground · Esc cancels`]}):F||"Workers online. Establish production and cross the ravine."}),w?X.jsx("div",{className:"selection-box",style:{left:w.x,top:w.y,width:w.w,height:w.h}}):null,X.jsxs("footer",{children:[X.jsxs("section",{className:"minimap-panel",children:[X.jsxs("div",{className:"panel-title",children:["TACTICAL OVERVIEW ",X.jsx("span",{children:"01"})]}),X.jsx("canvas",{ref:e,width:224,height:156,onClick:G=>{const _t=G.currentTarget.getBoundingClientRect();i.current?.focus((G.clientX-_t.left)/_t.width*112,(G.clientY-_t.top)/_t.height*88)},onContextMenu:G=>{G.preventDefault();const _t=G.currentTarget.getBoundingClientRect();qt((G.clientX-_t.left)/_t.width*112,(G.clientY-_t.top)/_t.height*88,G.shiftKey)}}),X.jsx("small",{children:"CLICK TO NAVIGATE / RIGHT CLICK TO ORDER"})]}),X.jsxs("section",{className:"selection-panel",children:[X.jsxs("div",{className:"panel-title",children:[Y?"SELECTED / "+ht.length:"COMMAND UPLINK",X.jsx("span",{children:Y?Ki(Y.kind,p):"AWAITING ORDERS"})]}),Y?X.jsxs(X.Fragment,{children:[X.jsxs("div",{className:"unit-details",children:[X.jsx("div",{className:"portrait",children:Jt[Y.kind].building?"S":"U"}),X.jsxs("div",{children:[X.jsx("h2",{children:Ki(Y.kind,p)}),X.jsx("div",{className:"hp-track",children:X.jsx("i",{style:{width:Y.hp/Jt[Y.kind].hp*100+"%"}})}),X.jsxs("small",{children:[Math.ceil(Y.hp)," / ",Jt[Y.kind].hp," INTEGRITY ",Y.progress<1?` · CONSTRUCTING ${Math.floor(Y.progress*100)}%`:""]}),X.jsx("p",{children:Jt[Y.kind].building?"FIELD STRUCTURE":Y.kind==="worker"?"RESOURCE & FIELD ENGINEERING":`DMG ${Jt[Y.kind].damage} · RANGE ${Jt[Y.kind].range} · SUPPLY ${Jt[Y.kind].supply}`})]})]}),Y.queue.length?X.jsxs("div",{className:"queue",children:[X.jsx("span",{children:P.supply(0)+Jt[Y.queue[0]].supply>P.cap(0)?"SUPPLY BLOCKED":`PRODUCTION ${Math.floor(Y.train/Jt[Y.queue[0]].time*100)}%`}),Y.queue.map((G,_t)=>X.jsx("b",{children:Ki(G,p)},_t)),X.jsx("button",{title:"Cancel last queued unit for 75% refund",onClick:()=>ne({kind:"cancel",ids:[Y.id]}),children:"×"})]}):X.jsx("div",{className:"selection-chips",children:ht.slice(0,14).map(G=>X.jsxs("button",{onClick:()=>{l.current=new Set([G.id]),N(_t=>_t+1)},children:[Ki(G.kind,p)," ",X.jsx("span",{children:Math.ceil(G.hp)})]},G.id))})]}):X.jsxs("div",{className:"empty-selection",children:[X.jsx("b",{children:"Every foothold begins with a signal."}),X.jsxs("p",{children:["Drag to select units · Right click to command",X.jsx("br",{}),"Select a worker to construct your first Assembly Bay."]})]})]}),X.jsxs("section",{className:"commands-panel",children:[X.jsxs("div",{className:"panel-title",children:[O&&rt?"CONSTRUCTION NETWORK":"COMMAND DECK",X.jsx("span",{children:X.jsx("button",{onClick:()=>gt(G=>!G),children:"? CONTROLS"})})]}),X.jsx("div",{className:"commands",children:rt?O?["bay","pylon","tap","tech","turret","core"].map(G=>X.jsxs("button",{className:"command",title:`${Ki(G,p)} · ${Jt[G].hp} HP · ${Jt[G].time/20}s · ${G==="tap"?"Place on a violet vent":"Within 30 units of a friendly structure"}`,onClick:()=>{c.current=G,I("Select a placement site")},children:[X.jsx("span",{className:"unit-icon",children:G==="tap"?"S":"U"}),X.jsx("b",{children:Ki(G,p)}),X.jsxs("small",{children:[Jt[G].ore," O ",Jt[G].flux?` / ${Jt[G].flux} F`:""]})]},G)):X.jsxs(X.Fragment,{children:[X.jsxs("button",{className:"command",onClick:()=>H(!0),children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:"Construct"}),X.jsx("small",{children:"B / BUILD NETWORK"})]}),X.jsxs("button",{className:"command",onClick:()=>ne({kind:"stop",ids:[...l.current]}),children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:"Stop"}),X.jsx("small",{children:"CTRL + S"})]})]}):bt?X.jsxs(X.Fragment,{children:[Wt("worker"),Wt("scout")]}):Ot?X.jsxs(X.Fragment,{children:[Wt("soldier"),Wt("lancer"),Wt("siege")]}):Dt?X.jsxs("button",{className:"command",disabled:!!P.upgrades[0],onClick:()=>ne({kind:"upgrade",ids:[...l.current]}),children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:P.upgrades[0]?"Weapons calibrated":"Calibrate weapons"}),X.jsx("small",{children:"150 O / 60 F · +10% DAMAGE"})]}):ht.length?X.jsxs(X.Fragment,{children:[X.jsxs("button",{className:"command",onClick:()=>{c.current="attack"},children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:"Attack move"}),X.jsx("small",{children:"A / SELECT DESTINATION"})]}),X.jsxs("button",{className:"command",onClick:()=>ne({kind:"ability",ids:[...l.current]}),children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:"Field restoration"}),X.jsx("small",{children:"Q / 10 F · +65 HP · 20s"})]}),X.jsxs("button",{className:"command",onClick:()=>ne({kind:"stop",ids:[...l.current]}),children:[X.jsx("span",{className:"unit-icon",children:"◇"}),X.jsx("b",{children:"Stop"}),X.jsx("small",{children:"CTRL + S"})]})]}):X.jsxs("div",{className:"hint-grid",children:[X.jsxs("span",{children:["01 ",X.jsx("b",{children:"BUILD AN ECONOMY"})]}),X.jsxs("span",{children:["02 ",X.jsx("b",{children:"ASSEMBLE YOUR FORCE"})]}),X.jsxs("span",{children:["03 ",X.jsx("b",{children:"BREAK THE RELAY"})]})]})}),X.jsxs("div",{className:"command-foot",children:[P.entities.filter(G=>G.team===0&&G.kind==="worker").length," WORKERS ONLINE ",X.jsx("span",{children:"20 Hz SIMULATION / LOCAL"})]})]})]}),ft?X.jsxs("div",{className:"help",children:[X.jsx("button",{onClick:()=>gt(!1),children:"× CLOSE"}),X.jsx("h2",{children:"Field controls"}),X.jsxs("p",{children:["Left click / drag: select",X.jsx("br",{}),"Shift click: add · double click: same type",X.jsx("br",{}),"Right click: move, gather, attack, or rally",X.jsx("br",{}),"A then click: attack move · Shift: queue order",X.jsx("br",{}),"B: construction · Q: restore (10 Flux)",X.jsx("br",{}),"WASD / arrows: camera · wheel: zoom",X.jsx("br",{}),"Home / Space: base · F: focus selection",X.jsx("br",{}),"Ctrl + 1–9: assign group · 1–9: select",X.jsx("br",{}),"Ctrl + S: stop · Esc: cancel / pause",X.jsx("br",{}),"F3: fog debug view"]}),X.jsx("p",{children:"Build Flux Taps on violet vents. Build pylons for +12 supply. A Foundry unlocks ranged specialists and siege units. Capture a Watch Pylon by standing nearby for 3 seconds."})]}):null]}):null,A&&d==="game"?X.jsx("div",{className:"scrim",children:X.jsxs("div",{className:"modal",children:[X.jsx("div",{className:"eyebrow",children:"SIGNAL ON HOLD"}),X.jsx("h1",{children:"Operation paused"}),X.jsx("p",{children:"Workers, production, and combat are paused."}),X.jsx("button",{className:"primary",onClick:()=>M(!1),children:"RESUME OPERATION"}),X.jsxs("button",{onClick:()=>$(G=>!G),children:["AUDIO: ",V?"OFF":"ON"]}),X.jsx("button",{onClick:()=>{lt.current=!1,M(!1),g("menu")},children:"RETURN TO MENU"})]})}):null,d==="result"?X.jsx("div",{className:"scrim",children:X.jsxs("div",{className:"modal results",children:[X.jsxs("div",{className:"eyebrow",children:["OPERATION CONCLUDED / ",le]}),X.jsx("h1",{children:P.winner===0?"Ravine secured.":"Signal lost."}),X.jsx("p",{children:P.winner===0?"The enemy relay has fallen. Your foothold holds.":"Your last relay was destroyed. Regroup and deploy again."}),X.jsxs("div",{className:"metrics",children:[X.jsxs("div",{children:[X.jsx("b",{children:P.collected[0]}),X.jsx("span",{children:"ORE HARVESTED"})]}),X.jsxs("div",{children:[X.jsx("b",{children:P.created[0]}),X.jsx("span",{children:"ENTITIES CREATED"})]}),X.jsxs("div",{children:[X.jsx("b",{children:P.lost[0]}),X.jsx("span",{children:"ENTITIES LOST"})]})]}),X.jsx("div",{className:"timeline",children:P.events.slice(-5).map((G,_t)=>X.jsxs("p",{children:[Math.floor(G.tick/1200),":",Math.floor(G.tick/20%60).toString().padStart(2,"0")," ",X.jsx("span",{children:G.text})]},_t))}),X.jsx("button",{className:"primary",onClick:()=>ye(S),children:"DEPLOY AGAIN +"}),X.jsx("button",{onClick:()=>g("menu"),children:"RETURN TO MENU"})]})}):null]})}GM.createRoot(document.getElementById("root")).render(X.jsx(vC,{}));
