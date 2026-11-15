import { PREFS_KEY } from "./types"

/**
 * Script executado no <head> antes da primeira pintura (RF-017, research R3).
 * Precisa ser autocontido: repete a lógica de storage.ts e apply.ts em JavaScript puro.
 */
export const NO_FLASH_SCRIPT = `(function(){
var d=document.documentElement,p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"{}")||{}}catch(e){p={}}
var dark=false;try{dark=matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}
d.dataset.theme=p.theme==="light"||p.theme==="dark"?p.theme:(dark?"dark":"light");
if(p.highContrast===true){d.dataset.contrast="high"}
d.dataset.font=[0,1,2,3].indexOf(p.fontScale)>=0?String(p.fontScale):"0";
var l=["pt","en","es"].indexOf(p.locale)>=0?p.locale:null;
if(!l){var n=(navigator.language||"").toLowerCase();l=n.indexOf("en")===0?"en":n.indexOf("es")===0?"es":"pt"}
d.lang=l==="pt"?"pt-BR":l;
})()`
