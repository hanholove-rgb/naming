(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const STORAGE = "dugeunAI-v2";
  const DEFAULT = {
    personaId: "haeun", userName: "친구", score: 18, scene: "home",
    voice: true, memories: [], history: [], lastReply: "",
    daily: { date: "", gain: 0 }
  };
  let state = {...DEFAULT};

  const emotionLabel = {
    neutral:"편안함", smile:"미소", happy:"기쁨", shy:"살짝 부끄러움",
    concern:"걱정·공감", serious:"진지함", thinking:"생각 중", surprised:"놀람"
  };
  const emotionEmoji = {
    neutral:"🙂", smile:"😊", happy:"😄", shy:"☺️", concern:"😌",
    serious:"🫶", thinking:"🤔", surprised:"😮"
  };

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if(saved) state = {...DEFAULT, ...saved};
      if(!Array.isArray(state.memories)) state.memories=[];
      state.memories = state.memories.map(m => typeof m === "string"
        ? {type:"MEMORY",content:m,importance:.6,createdAt:Date.now(),lastUsedAt:0}
        : m);
    }catch(e){ state={...DEFAULT}; }
  }
  function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function toast(text){
    const el=$("#toast"); el.textContent=text; el.classList.add("on");
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("on"),1800);
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }

  async function loadPortrait(id){
    const res = await fetch("assets/"+id+".b64?v=2");
    if(!res.ok) throw new Error("asset "+id+" "+res.status);
    const b64=(await res.text()).trim();
    return "data:image/webp;base64,"+b64;
  }
  async function loadAllPortraits(){
    const ids=["haeun","seojun","yuri"];
    await Promise.all(ids.map(async id=>{
      try{
        const src=await loadPortrait(id);
        $$('[data-photo="'+id+'"]').forEach(img=>img.src=src);
        if(state.personaId===id) $("#heroPortrait").src=src;
      }catch(e){ console.warn(e); }
    }));
  }

  function relationLevel(){ return DugeunAI.relationshipLevel(state.score); }
  function renderRelation(oldLevel){
    const next=relationLevel();
    $("#relLevel").textContent=next;
    $("#score").textContent=Math.round(state.score);
    $("#meterFill").style.width=Math.round(state.score)+"%";
    if(oldLevel && oldLevel!==next) toast("관계가 ‘"+next+"’ 단계가 되었어요 ♥");
  }
  function addScore(delta){
    const date=today();
    if(state.daily.date!==date) state.daily={date,gain:0};
    const room=Math.max(0,8-state.daily.gain);
    const actual=Math.min(room,delta);
    if(actual>0){
      const old=relationLevel();
      state.score=Math.min(100,state.score+actual);
      state.daily.gain+=actual;
      renderRelation(old);
      save();
    }
  }

  function addMessage(role,text,persist=true){
    const el=document.createElement("div");
    el.className="msg "+role;
    el.innerHTML=escapeHtml(text);
    $("#messages").appendChild(el);
    $("#messages").scrollTop=$("#messages").scrollHeight;
    if(persist){
      state.history.push({role,text,at:Date.now()});
      state.history=state.history.slice(-50);
      save();
    }
  }
  function renderHistory(){
    $("#messages").innerHTML="";
    state.history.forEach(m=>addMessage(m.role,m.text,false));
  }

  function saveMemories(candidates){
    let added=0;
    for(const c of candidates||[]){
      if((c.importance||0)<.55) continue;
      const exists=state.memories.some(m=>m.content===c.content);
      if(exists) continue;
      state.memories.push({...c,createdAt:Date.now(),lastUsedAt:0});
      added++;
    }
    state.memories=state.memories.slice(-18);
    if(added) toast(added===1?"새로운 내용을 기억했어요 ✨":added+"개의 내용을 기억했어요 ✨");
    renderMemories(); save();
  }
  function renderMemories(){
    $("#memCount").textContent=state.memories.length+"개";
    const settingsCount=$("#settingsMemCount");
    if(settingsCount) settingsCount.textContent=state.memories.length+"개";
    $("#memories").innerHTML="";
    if(!state.memories.length){
      $("#memories").innerHTML='<span class="empty">취향·취미·관심사를 말하면 기억해요.</span>';
      return;
    }
    state.memories.slice(-6).reverse().forEach(m=>{
      const el=document.createElement("span");
      el.className="mem";
      el.title=m.type+" · 중요도 "+Math.round((m.importance||0)*100);
      el.textContent=m.content;
      $("#memories").appendChild(el);
    });
  }

  function setEmotion(em){
    const img=$("#heroPortrait");
    img.className="hero-portrait emotion-"+em;
    $("#emotionChip").textContent=(emotionEmoji[em]||"🙂")+" "+(emotionLabel[em]||"편안함");
  }
  function setScene(){
    const s=DugeunAI.SCENES[state.scene]||DugeunAI.SCENES.home;
    $("#stage").className="stage"+(state.scene==="home"?"":" "+state.scene);
    $("#sceneChip").textContent="● "+s.name;
  }
  function setPersona(){
    const p=DugeunAI.PERSONAS[state.personaId];
    $("#partnerName").textContent=p.name;
    const src=$('[data-photo="'+state.personaId+'"]')?.src;
    if(src) $("#heroPortrait").src=src;
  }

  function speak(text){
    if(!state.voice || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang="ko-KR"; u.rate=.96; u.pitch=1;
    const voices=speechSynthesis.getVoices();
    const v=voices.find(x=>/ko-KR/i.test(x.lang));
    if(v) u.voice=v;
    u.onstart=()=>$("#heroPortrait").style.transform="scale(1.018)";
    u.onend=u.onerror=()=>$("#heroPortrait").style.transform="";
    speechSynthesis.speak(u);
  }

  function contextFor(message){
    return {
      personaId:state.personaId,
      userName:state.userName,
      score:state.score,
      relationshipLevel:relationLevel(),
      scene:state.scene,
      memories:state.memories.slice(-10),
      recentMessages:state.history.slice(-12),
      lastReply:state.lastReply,
      message
    };
  }
  function respond(message){
    let result;
    try{ result=DugeunAI.generateReply(contextFor(message)); }
    catch(e){
      console.error(e);
      result={reply:"잠깐 생각이 꼬였네요. 한 번만 다시 말해줄래요?",emotion:"thinking",scoreDelta:0,memoryCandidates:[]};
    }
    setTimeout(()=>{
      addMessage("ai",result.reply);
      state.lastReply=result.reply;
      $("#subtitle").textContent=result.reply;
      setEmotion(result.emotion||"neutral");
      saveMemories(result.memoryCandidates);
      addScore(result.scoreDelta||0);
      save();
      speak(result.reply);
    },280+Math.min(520,message.length*7));
  }

  function enterApp(){
    state.userName=($("#userName").value||"친구").trim().slice(0,12)||"친구";
    save();
    $("#landing").classList.add("hidden");
    $("#app").classList.remove("hidden");
    setPersona(); setScene(); renderRelation(); renderMemories(); renderHistory();
    $("#voiceToggle").checked=state.voice;
    $("#voiceIcon").textContent=state.voice?"🔊":"🔇";
    if(!state.history.length){
      const p=DugeunAI.PERSONAS[state.personaId];
      const first=p.greetings[Math.floor(Math.random()*p.greetings.length)];
      addMessage("ai",first);
      state.lastReply=first;
      $("#subtitle").textContent=first;
      setEmotion("smile");
      save(); speak(first);
    }else{
      const last=[...state.history].reverse().find(m=>m.role==="ai");
      if(last) $("#subtitle").textContent=last.text;
    }
  }

  function initSpeech(){
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!R){
      $("#mic").classList.add("unsupported");
      $("#mic").title="이 브라우저에서는 음성 인식을 지원하지 않습니다.";
      return;
    }
    $("#mic").onclick=()=>{
      try{
        const r=new R(); r.lang="ko-KR"; r.interimResults=false; r.maxAlternatives=1;
        r.onstart=()=>toast("듣고 있어요…");
        r.onresult=e=>{ $("#messageInput").value=e.results[0][0].transcript; $("#messageInput").focus(); };
        r.onerror=()=>toast("음성 인식을 사용할 수 없어요.");
        r.start();
      }catch(e){ toast("마이크를 사용할 수 없어요."); }
    };
  }

  loadState();
  $("#userName").value=state.userName||"친구";
  $$(".partner").forEach(btn=>{
    btn.classList.toggle("sel",btn.dataset.id===state.personaId);
    btn.onclick=()=>{
      $$(".partner").forEach(x=>x.classList.remove("sel"));
      btn.classList.add("sel"); state.personaId=btn.dataset.id; save();
    };
  });
  $("#start").onclick=enterApp;
  $("#chatForm").onsubmit=e=>{
    e.preventDefault();
    const input=$("#messageInput");
    const text=input.value.trim(); if(!text) return;
    input.value="";
    addMessage("user",text);
    setEmotion("thinking");
    $("#subtitle").textContent="생각 중…";
    respond(text);
  };

  $("#dateBtn").onclick=()=>$("#dateModal").classList.remove("hidden");
  $$("[data-scene]").forEach(btn=>btn.onclick=()=>{
    state.scene=btn.dataset.scene; setScene(); save();
    $("#dateModal").classList.add("hidden");
    const scene=DugeunAI.SCENES[state.scene];
    const msg=scene.name+"로 장면을 바꿨어요. 분위기가 조금 달라졌네요.";
    addMessage("ai",msg); $("#subtitle").textContent=msg; setEmotion("smile"); speak(msg);
  });

  $("#settings").onclick=()=>$("#settingsModal").classList.remove("hidden");
  $$("[data-close]").forEach(btn=>btn.onclick=()=>$("#"+btn.dataset.close).classList.add("hidden"));
  $$(".modal").forEach(m=>m.onclick=e=>{ if(e.target===m)m.classList.add("hidden"); });

  $("#voiceBtn").onclick=()=>{
    state.voice=!state.voice; save();
    $("#voiceToggle").checked=state.voice; $("#voiceIcon").textContent=state.voice?"🔊":"🔇";
    if(!state.voice && "speechSynthesis" in window) speechSynthesis.cancel();
    toast(state.voice?"AI 음성을 켰어요":"AI 음성을 껐어요");
  };
  $("#voiceToggle").onchange=e=>{
    state.voice=e.target.checked; save(); $("#voiceIcon").textContent=state.voice?"🔊":"🔇";
  };
  $("#clearMemory").onclick=()=>{
    state.memories=[]; save(); renderMemories(); toast("기억을 초기화했어요.");
  };
  $("#clearAll").onclick=()=>{
    localStorage.removeItem(STORAGE); location.reload();
  };

  initSpeech();
  loadAllPortraits().then(()=>{
    if(state.history.length) enterApp();
  }).catch(()=>{
    if(state.history.length) enterApp();
  });
})();