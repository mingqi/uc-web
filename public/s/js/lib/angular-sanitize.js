(function(e,t,n){function i(){this.$get=["$$sanitizeUri",function(e){return function(t){var n=[];return k(t,_(n,function(t,n){return!/^unsafe/.test(e(t,n))})),n.join("")}}]}function s(e){var n=[],r=_(n,t.noop);return r.chars(e),n.join("")}function C(e){var t={},n=e.split(","),r;for(r=0;r<n.length;r++)t[n[r]]=!0;return t}function k(e,n){function x(e,r,i,s){r=t.lowercase(r);if(w[r])while(v.last()&&E[v.last()])T("",v.last());b[r]&&v.last()==r&&T("",r),s=m[r]||!!s,s||v.push(r);var o={};i.replace(a,function(e,t,n,r,i){var s=n||r||i||"";o[t]=O(s)}),n.start&&n.start(r,o,s)}function T(e,r){var i=0,s;r=t.lowercase(r);if(r)for(i=v.length-1;i>=0;i--)if(v[i]==r)break;if(i>=0){for(s=v.length-1;s>=i;s--)n.end&&n.end(v[s]);v.length=i}}var i,s,d,v=[],g=e;v.last=function(){return v[v.length-1]};while(e){s=!0;if(!v.last()||!S[v.last()]){e.indexOf("<!--")===0?(i=e.indexOf("--",4),i>=0&&e.lastIndexOf("-->",i)===i&&(n.comment&&n.comment(e.substring(4,i)),e=e.substring(i+3),s=!1)):h.test(e)?(d=e.match(h),d&&(e=e.replace(d[0],""),s=!1)):l.test(e)?(d=e.match(u),d&&(e=e.substring(d[0].length),d[0].replace(u,T),s=!1)):f.test(e)&&(d=e.match(o),d&&(e=e.substring(d[0].length),d[0].replace(o,x),s=!1));if(s){i=e.indexOf("<");var y=i<0?e:e.substring(0,i);e=i<0?"":e.substring(i),n.chars&&n.chars(O(y))}}else e=e.replace(new RegExp("(.*)<\\s*\\/\\s*"+v.last()+"[^>]*>","i"),function(e,t){return t=t.replace(c,"$1").replace(p,"$1"),n.chars&&n.chars(O(t)),""}),T("",v.last());if(e==g)throw r("badparse","The sanitizer was unable to parse the following block of html: {0}",e);g=e}T()}function O(e){if(!e)return"";var t=A.exec(e),n=t[1],r=t[3],i=t[2];return i&&(L.innerHTML=i.replace(/</g,"&lt;"),i="textContent"in L?L.textContent:L.innerText),n+i+r}function M(e){return e.replace(/&/g,"&amp;").replace(d,function(e){var t=e.charCodeAt(0),n=e.charCodeAt(1);return"&#"+((t-55296)*1024+(n-56320)+65536)+";"}).replace(v,function(e){return"&#"+e.charCodeAt(0)+";"}).replace(/</g,"&lt;").replace(/>/g,"&gt;")}function _(e,n){var r=!1,i=t.bind(e,e.push);return{start:function(e,s,o){e=t.lowercase(e),!r&&S[e]&&(r=e),!r&&x[e]===!0&&(i("<"),i(e),t.forEach(s,function(r,s){var o=t.lowercase(s),u=e==="img"&&o==="src"||o==="background";N[o]===!0&&(T[o]!==!0||n(r,u))&&(i(" "),i(s),i('="'),i(M(r)),i('"'))}),i(o?"/>":">"))},end:function(e){e=t.lowercase(e),!r&&x[e]===!0&&(i("</"),i(e),i(">")),e==r&&(r=!1)},chars:function(e){r||i(M(e))}}}var r=t.$$minErr("$sanitize"),o=/^<\s*([\w:-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/,u=/^<\s*\/\s*([\w:-]+)[^>]*>/,a=/([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,f=/^</,l=/^<\s*\//,c=/<!--(.*?)-->/g,h=/<!DOCTYPE([^>]*?)>/i,p=/<!\[CDATA\[(.*?)]]>/g,d=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,v=/([^\#-~| |!])/g,m=C("area,br,col,hr,img,wbr"),g=C("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),y=C("rp,rt"),b=t.extend({},y,g),w=t.extend({},g,C("address,article,aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul")),E=t.extend({},y,C("a,abbr,acronym,b,bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,samp,small,span,strike,strong,sub,sup,time,tt,u,var")),S=C("script,style"),x=t.extend({},m,w,E,b),T=C("background,cite,href,longdesc,src,usemap"),N=t.extend({},T,C("abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,scope,scrolling,shape,size,span,start,summary,target,title,type,valign,value,vspace,width")),L=document.createElement("pre"),A=/^(\s*)([\s\S]*?)(\s*)$/;t.module("ngSanitize",[]).provider("$sanitize",i),t.module("ngSanitize").filter("linky",["$sanitize",function(e){var n=/((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/,r=/^mailto:/;return function(i,o){function h(e){if(!e)return;f.push(s(e))}function p(e,n){f.push("<a "),t.isDefined(o)&&(f.push('target="'),f.push(o),f.push('" ')),f.push('href="'),f.push(e),f.push('">'),h(n),f.push("</a>")}if(!i)return i;var u,a=i,f=[],l,c;while(u=a.match(n))l=u[0],u[2]==u[3]&&(l="mailto:"+l),c=u.index,h(a.substr(0,c)),p(l,u[0].replace(r,"")),a=a.substring(c+u[0].length);return h(a),e(f.join(""))}}])})(window,window.angular);