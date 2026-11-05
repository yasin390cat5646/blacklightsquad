(() => {
  const ready = () => window.supabase && window.BLACKLIGHT_SUPABASE_URL?.startsWith("https://") &&
    window.BLACKLIGHT_SUPABASE_ANON_KEY && !window.BLACKLIGHT_SUPABASE_ANON_KEY.startsWith("YOUR_");
  const client = () => ready() ? window.supabase.createClient(window.BLACKLIGHT_SUPABASE_URL, window.BLACKLIGHT_SUPABASE_ANON_KEY) : null;
  const el = id => document.getElementById(id);
  const say = (id, msg, bad=false) => { const n=el(id); if(n){n.textContent=msg;n.className="message "+(bad?"error":"");} };
  const init = async () => {
    const db=client();
    if(!db){ ["loginMessage","joinMessage","adminMessage"].forEach(id=>say(id,"ابتدا آدرس و کلید عمومی Supabase را در config.js وارد کن.",true)); return; }

    const login=el("loginForm");
    if(login) login.addEventListener("submit", async e=>{
      e.preventDefault(); const f=new FormData(login);
      const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
      if(error) return say("loginMessage",error.message,true);
      location.href="adminp.html";
    });

    const join=el("joinForm");
    if(join) join.addEventListener("submit",async e=>{
      e.preventDefault(); const f=new FormData(join);
      const age=Number(f.get("real_age")), rating=Number(f.get("skill_rating"));
      if(age<10 || rating<0 || rating>10) return say("joinMessage","اطلاعات سن یا امتیاز مهارت معتبر نیست.",true);
      const row={game_username:f.get("game_username").trim(),real_age:age,join_goal:f.get("join_goal").trim(),rubika_id:f.get("rubika_id").trim(),game_test:f.get("game_test").trim(),skill_rating:rating};
      const {error}=await db.from("applications").insert(row);
      if(error) return say("joinMessage","ارسال ناموفق بود: "+error.message,true);
      join.reset(); say("joinMessage","درخواستت با موفقیت ثبت شد. درصورت تایید فرم لینک ورود به ایدی شما ارسال میشود");
    });

    const logout=el("logoutBtn");
    if(logout) logout.addEventListener("click",async()=>{await db.auth.signOut();location.href="login.html";});

    if(el("adminMessage")){
      const {data:{user}}=await db.auth.getUser();
      if(!user){say("adminMessage","برای ورود به پنل ابتدا وارد حساب شو.",true); setTimeout(()=>location.href="login.html",900);return;}
      const [{data:profile},{data:admin,error:adminErr}]=await Promise.all([
        db.from("profiles").select("username").eq("user_id",user.id).maybeSingle(),
        db.from("admin_users").select("role").eq("user_id",user.id).maybeSingle()
      ]);
      if(adminErr || !admin){say("adminMessage","این حساب دسترسی مدیریتی ندارد.",true);return;}
      const plus=admin.role==="admin_plus";
      el("whoami").textContent=(profile?.username||user.email)+" — "+(plus?"Admin+":"Admin");
      el("applicationsPanel").classList.remove("hidden");
      if(plus) el("rankPanel").classList.remove("hidden");
      say("adminMessage",plus?"دسترسی Admin+ تایید شد.":"دسترسی Admin تایید شد.");
      await loadApplications(db);
      if(el("rankForm")) el("rankForm").addEventListener("submit",async e=>{
        e.preventDefault(); const submitter=e.submitter;
        const f=new FormData(e.currentTarget), uid=String(f.get("user_id")).trim(), username=String(f.get("username")).trim();
        const action=submitter?.value;
        let result;
        if(action==="grant") result=await db.from("admin_users").upsert({user_id:uid,username,role:"admin"},{onConflict:"user_id"});
        else result=await db.from("admin_users").delete().eq("user_id",uid).eq("role","admin");
        if(result.error) say("rankMessage",result.error.message,true);
        else {say("rankMessage",action==="grant"?"رتبه Admin ثبت شد.":"رتبه Admin لغو شد.");}
      });
    }
  };
  async function loadApplications(db){
    const host=el("applicationsList");
    const {data,error}=await db.from("applications").select("*").order("created_at",{ascending:false}).limit(100);
    if(error){host.textContent="خطا در دریافت فرم‌ها: "+error.message;return;}
    if(!data?.length){host.textContent="هنوز درخواستی ثبت نشده است.";return;}
    host.innerHTML="";
    data.forEach(row=>{
      const card=document.createElement("article");card.className="application";
      const title=document.createElement("h3");title.textContent=row.game_username+" — "+row.game_test;card.append(title);
      const details=document.createElement("p");details.textContent=`سن: ${row.real_age} | روبیکا: ${row.rubika_id} | مهارت: ${row.skill_rating}/10 | وضعیت: ${row.status||"pending"}`;card.append(details);
      const goal=document.createElement("p");goal.textContent=row.join_goal;card.append(goal);
      ["approved","rejected"].forEach(status=>{
        const b=document.createElement("button");b.className="btn small "+(status==="approved"?"primary":"danger");b.textContent=status==="approved"?"تأیید":"رد";
        b.addEventListener("click",async()=>{const {error}=await db.from("applications").update({status}).eq("id",row.id);if(error) alert(error.message);else {b.disabled=true;b.textContent="ثبت شد";}});
        card.append(b);
      });
      host.append(card);
    });
  }
  document.addEventListener("DOMContentLoaded",init);
})();