const KEY="trimemo_ambassador_referral";
const TTL=30*24*60*60*1000;
const pattern=/^AMB[A-F0-9]{8}$/;
export function rememberReferralFromUrl(search:string,storage:Storage,now=Date.now()){
 const raw=new URLSearchParams(search).get("ref");
 const code=String(raw||"").trim().toUpperCase();
 if(!pattern.test(code))return false;
 try { storage.setItem(KEY,JSON.stringify({code,expiresAt:now+TTL})); return true; }
 catch{return false;}
}
export function getActiveReferral(storage:Storage,now=Date.now()):string|null{
 try{
  const stored=JSON.parse(storage.getItem(KEY)||"null");
  if(pattern.test(stored?.code)&&Number(stored?.expiresAt)>now)return stored.code;
  storage.removeItem(KEY);
 }catch{}
 return null;
}
export async function attributeReferralToProject(projectId:string,token:string,storage:Storage){
 const code=getActiveReferral(storage);
 if(!code||!token)return false;
 const response=await fetch("/api/ambassadors",{
  method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
  body:JSON.stringify({action:"attribute",projectId,code})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.attributed)return false;
 return true;
}
