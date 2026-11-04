// Local encrypted form archive helper. Not a server-side or shared store.
const SESSION_KEY='bl_session_v1', FORMS_KEY='bl_forms_v1';
const session=localStorage.getItem(SESSION_KEY);
const list=document.getElementById('formsList');
const count=document.getElementById('formCount');
function logout(){localStorage.removeItem(SESSION_KEY);location.href='login.html'}
document.getElementById('logoutBtn')?.addEventListener('click',logout);
if(!session){list.textContent='برای مشاهده آرشیو ابتدا وارد حساب شوید.';count.textContent='۰ مورد'}else{
 const all=JSON.parse(localStorage.getItem(FORMS_KEY)||'{}');const own=all[session]||[];
 count.textContent=own.length+' مورد';
 list.textContent=own.length?'فرم‌ها به‌صورت رمزنگاری‌شده ذخیره شده‌اند. برای افزودن فرم باید از تابع BlackLight.saveForm در کد پروژه استفاده شود.':'هنوز فرمی ذخیره نشده است.';
}
// Form encryption uses a key derived from the user's password; password is requested again only by the calling app.
// For real deployment, move key management and authorization to a private backend.
async function deriveKey(password,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function saveForm(data,password){if(!session)throw new Error('ابتدا وارد شوید');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(password,salt);const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));const all=JSON.parse(localStorage.getItem(FORMS_KEY)||'{}');all[session]=all[session]||[];all[session].push({salt:Array.from(salt),iv:Array.from(iv),cipher:Array.from(new Uint8Array(cipher)),createdAt:new Date().toISOString()});localStorage.setItem(FORMS_KEY,JSON.stringify(all))}
async function readForm(record,password){const key=await deriveKey(password,new Uint8Array(record.salt));const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(record.iv)},key,new Uint8Array(record.cipher));return JSON.parse(new TextDecoder().decode(plain))}
window.BlackLight={saveForm,readForm};