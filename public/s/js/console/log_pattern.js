(function(){var e,t,n,r;e=["\\","[","]",".","^","$","|","?","*","+","(",")","{","}"],t=function(t){var n,r,i;for(r=0,i=e.length;r<i;r++)n=e[r],t=t.replace(n,"\\"+n);return t},n=function(e,n){var r,i,s;return i=/%(\w+)%/g,r=function(){var t;t=[];while(s=i.exec(e))t.push(s[1]);return t}(),{attributes:r,toExtract:function(n){return s=t(e).replace("%"+n+"%","(?<value>[a-zA-Z0-9_.-]+)"),s=s.replace(i,"[a-zA-Z0-9_.-]+"),s},toFilter:function(){var r;return r=t(e).replace(i,"[a-zA-Z0-9_.-]+"),n&&(r+="\\b"),{script:{script:"pattern_filter",params:{pattern:r}}}}}},r=function(e,t){var i,s,o,u,a,f,l,c,h,p,d,v,m;t==null&&(t=!1);if(!e)return{query:null,attributes:[],filters:[]};c=[],u=[],m=e.split("|");for(h=0,d=m.length;h<d;h++)f=m[h],f=f.trim(),f.indexOf("parse")===0?u.push(n(f.substring(5).trim(),t)):c=c.concat(f.split(/\s+/));c.length===0?a=null:a={bool:{must:function(){var e,t,n;n=[];for(e=0,t=c.length;e<t;e++)l=c[e],n.push({match_phrase:{message:l}});return n}()}},i=[],s=[];for(p=0,v=u.length;p<v;p++)o=u[p],i=i.concat(o.attributes),s.push(o.toFilter());return{query:a,attributes:i,filters:s,toBucket:function(e){var t,n,r;for(n=0,r=u.length;n<r;n++){o=u[n];if(o.attributes.indexOf(e)>=0)return t=o.toExtract(e),{script:"pattern_extract",lang:"groovy",params:{pattern:t,onlyNumber:!1},size:300}}return null},toMetric:function(e){var t,n,r;for(n=0,r=u.length;n<r;n++){o=u[n];if(o.attributes.indexOf(e)>=0)return t=o.toExtract(e),{script:"pattern_extract",lang:"groovy",params:{pattern:t,onlyNumber:!0}}}return null},applyFilter:function(t,n){var i,s;return i="%"+t+"%",s=e.replace(i,n),e.indexOf(i)+i.length===e.length?r(s,!0):r(s,!1)}}},define([],function(){return r})}).call(this);