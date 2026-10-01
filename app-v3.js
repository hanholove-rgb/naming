(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const STORAGE = "dugeunAI-v2";
  const DEFAULT = {
    personaId: "haeun", userName: "친구", score: 18, scene: "home",
    voice: true, memories: [], history: [], lastReply: "",
    daily: { date: "", gain: 0 }
  };
  let state = { ...DEFAULT };
  let currentEmotion = "neutral";

  const LipSync = (() => {
    let timer = null;
    let currentPersona = "haeun";
    let currentEmotion = "neutral";
    let resizeBound = false;

    // Coordinates are normalized to the original portrait.
    // They are mapped to the visible image on every resize.
    const anchors = {
      haeun:{x:.505,y:.355,scale:1.00},
      seojun:{x:.502,y:.335,scale:.96},
      yuri:{x:.505,y:.350,scale:.98}
    };

    const sequences = {
      neutral:["closed","small","mid","small"],
      smile:["closed","small","mid","small"],
      happy:["small","mid","open","mid","small"],
      shy:["closed","small","closed","small"],
      concern:["closed","small","mid","small"],
      serious:["closed","small","mid","closed"],
      thinking:["closed","small","closed","mid"],
      surprised:["round","open","round","small"]
    };

    const wrap = () => $("#portraitWrap");
    const layer = () => $("#mouthLayer");
    const mouth = () => $("#mouthShape");
    const portrait = () => $("#heroPortrait");

    function updatePosition(){
      const w=wrap(), l=layer(), img=portrait();
      if(!w || !l || !img || !img.naturalWidth || !img.naturalHeight) return;

      const box=w.getBoundingClientRect();
      const nw=img.naturalWidth, nh=img.naturalHeight;
      const scale=Math.min(box.width/nw,box.height/nh); // object-fit: contain
      const rw=nw*scale, rh=nh*scale;
      const ox=(box.width-rw)/2;
      const oy=(box.height-rh)/2;
      const an=anchors[currentPersona] || anchors.haeun;

      l.style.left=(ox+rw*an.x)+"px";
      l.style.top=(oy+rh*an.y)+"px";
      l.style.setProperty("--lip-scale",Math.max(.72,Math.min(1.35,(rw/900)*an.scale)));
    }

    function setPersona(personaId){
      currentPersona=personaId || "haeun";
      const w=wrap();
      if(w){
        w.classList.remove("persona-haeun","persona-seojun","persona-yuri");
        w.classList.add("persona-"+currentPersona);
      }
      requestAnimationFrame(updatePosition);
      if(!resizeBound){
        resizeBound=true;
        window.addEventListener("resize",updatePosition,{passive:true});
      }
    }

    function setFrame(frame){
      const el=mouth();
      if(el) el.className="mouth-shape m-"+frame;
    }

    function stop(){
      if(timer){ clearInterval(timer); timer=null; }
      setFrame("closed");
      const l=layer(), w=wrap();
      if(l) l.classList.add("lip-hidden");
      if(w) w.classList.remove("speaking");
    }

    function start({personaId=currentPersona,emotion=currentEmotion}={}){
      stop();
      currentEmotion=emotion || "neutral";
      setPersona(personaId);
      updatePosition();
      const seq=sequences[currentEmotion] || sequences.neutral;
      const l=layer(), w=wrap();
      if(l) l.classList.remove("lip-hidden");
      if(w) w.classList.add("speaking");
      let step=0;
      const tick=()=>{
        setFrame(seq[step++ % seq.length]);
        if(Math.random()<.12){
          setTimeout(()=>{ if(timer) setFrame("closed"); },45);
        }
      };
      tick();
      timer=setInterval(tick,105);
    }

    return {start,stop,setPersona,updatePosition};
  })();

  const PORTRAITS = {
    haeun: "assets/v3/haeun-neutral.avif?v=stable7",
    seojun: "assets/v3/seojun-neutral.avif?v=stable7",
    yuri: "assets/v3/yuri-neutral.avif?v=stable7"
  };
  const FALLBACK_PORTRAIT = PORTRAITS.haeun;

  const emotionLabel = {
    neutral:"편안함", smile:"미소", happy:"기쁨", shy:"살짝 부끄러움",
    concern:"걱정·공감", serious:"진지함", thinking:"생각 중", surprised:"놀람"
  };
  const emotionEmoji = {
    neutral:"🙂", smile:"😊", happy:"😄", shy:"☺️",
    concern:"😌", serious:"🫶", thinking:"🤔", surprised:"😮"
  };

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if(saved) state = { ...DEFAULT, ...saved };
      if(!Array.isArray(state.memories)) state.memories = [];
      if(!Array.isArray(state.history)) state.history = [];
      state.memories = state.memories.map(m => typeof m === "string"
        ? {type:"MEMORY",content:m,importance:.6,createdAt:Date.now(),lastUsedAt:0}
        : m);
    }catch(e){
      console.warn("상태 복원 실패", e);
      state = { ...DEFAULT };
    }
  }
  function save(){
    try{ localStorage.setItem(STORAGE, JSON.stringify(state)); }
    catch(e){ console.warn("상태 저장 실패", e); }
  }
  function today(){ return new Date().toISOString().slice(0,10); }
  function toast(text){
    const el = $("#toast");
    if(!el) return;
    el.textContent = text;
    el.classList.add("on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("on"), 1800);
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function prepareImage(img){
    if(!img) return;
    img.decoding = "async";
    img.onload = () => {
      img.style.opacity = "1";
      img.style.visibility = "visible";
      img.dataset.failed = "0";
      requestAnimationFrame(() => LipSync.place(state.personaId));
    };
    img.onerror = () => {
      if(img.dataset.failed === "1"){
        img.style.visibility = "hidden";
        return;
      }
      img.dataset.failed = "1";
      if(!img.src.includes("haeun-neutral.avif")){
        img.src = FALLBACK_PORTRAIT;
      }else{
        img.style.visibility = "hidden";
      }
    };
  }

  function loadPartnerPortraits(){
    Object.entries(PORTRAITS).forEach(([id,src]) => {
      document.querySelectorAll('[data-photo="'+id+'"]').forEach(img => {
        prepareImage(img);
        if(!img.src.includes(src.split("?")[0])) img.src = src;
      });
    });
  }

  function setMainPortrait(id){
    const img = $("#heroPortrait");
    if(!img) return;
    const src = PORTRAITS[id] || FALLBACK_PORTRAIT;
    if(img.src && img.src.includes(src.split("?")[0])) return;
    img.dataset.failed = "0";
    prepareImage(img);
    img.src = src;
  }

  function relationLevel(){
    if(window.DugeunAI && typeof DugeunAI.relationshipLevel === "function"){
      return DugeunAI.relationshipLevel(state.score);
    }
    if(state.score < 25) return "첫 만남";
    if(state.score < 45) return "조금 친해짐";
    if(state.score < 70) return "설레는 사이";
    if(state.score < 90) return "많이 가까움";
    return "특별한 사이";
  }
  function renderRelation(oldLevel){
    const next = relationLevel();
    if($("#relLevel")) $("#relLevel").textContent = next;
    if($("#score")) $("#score").textContent = Math.round(state.score);
    if($("#meterFill")) $("#meterFill").style.width = Math.round(state.score) + "%";
    if(oldLevel && oldLevel !== next) toast("관계가 ‘"+next+"’ 단계가 되었어요 ♥");
  }
  function addScore(delta){
    const date = today();
    if(!state.daily || state.daily.date !== date) state.daily = {date,gain:0};
    const room = Math.max(0, 8 - (state.daily.gain || 0));
    const actual = Math.min(room, Number(delta || 0));
    if(actual <= 0) return;
    const old = relationLevel();
    state.score = Math.min(100, state.score + actual);
    state.daily.gain += actual;
    renderRelation(old);
    save();
  }

  function addMessage(role,text,persist=true){
    const messages = $("#messages");
    if(!messages) return;
    const el = document.createElement("div");
    el.className = "msg " + role;
    el.innerHTML = escapeHtml(text);
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    if(persist){
      state.history.push({role,text,at:Date.now()});
      state.history = state.history.slice(-50);
      save();
    }
  }
  function renderHistory(){
    const messages = $("#messages");
    if(!messages) return;
    messages.innerHTML = "";
    state.history.forEach(m => addMessage(m.role,m.text,false));
  }

  function saveMemories(candidates){
    let added = 0;
    for(const c of candidates || []){
      if(Number(c.importance || 0) < .55) continue;
      if(state.memories.some(m => m.content === c.content)) continue;
      state.memories.push({...c,createdAt:Date.now(),lastUsedAt:0});
      added++;
    }
    state.memories = state.memories.slice(-18);
    if(added) toast(added === 1 ? "새로운 내용을 기억했어요 ✨" : added+"개의 내용을 기억했어요 ✨");
    renderMemories();
    save();
  }
  function renderMemories(){
    if($("#memCount")) $("#memCount").textContent = state.memories.length + "개";
    if($("#settingsMemCount")) $("#settingsMemCount").textContent = state.memories.length + "개";
    const box = $("#memories");
    if(!box) return;
    box.innerHTML = "";
    if(!state.memories.length){
      box.innerHTML = '<span class="empty">취향·취미·관심사를 말하면 기억해요.</span>';
      return;
    }
    state.memories.slice(-6).reverse().forEach(m => {
      const el = document.createElement("span");
      el.className = "mem";
      el.title = (m.type || "MEMORY") + " · 중요도 " + Math.round(Number(m.importance || 0) * 100);
      el.textContent = m.content;
      box.appendChild(el);
    });
  }

  function setEmotion(em){
    currentEmotion = em || "neutral";
    const img = $("#heroPortrait");
    if(img) img.className = "hero-portrait emotion-" + currentEmotion;
    const chip = $("#emotionChip");
    if(chip) chip.textContent = (emotionEmoji[currentEmotion] || "🙂") + " " + (emotionLabel[currentEmotion] || "편안함");
  }

  function setScene(){
    const scene = window.DugeunAI && DugeunAI.SCENES
      ? (DugeunAI.SCENES[state.scene] || DugeunAI.SCENES.home)
      : {name:"영상통화"};
    const stage = $("#stage");
    if(stage) stage.className = "stage" + (state.scene === "home" ? "" : " " + state.scene);
    if($("#sceneChip")) $("#sceneChip").textContent = "● " + scene.name;
  }

  function setPersona(){
    const p = window.DugeunAI && DugeunAI.PERSONAS ? DugeunAI.PERSONAS[state.personaId] : null;
    if($("#partnerName")) $("#partnerName").textContent = p ? p.name : state.personaId;
    setMainPortrait(state.personaId);
    LipSync.setPersona(state.personaId);
    setEmotion("neutral");
  }

  function speak(text){
    if(!state.voice){
      LipSync.stop();
      return;
    }

    // Start immediately. Some browsers delay or omit SpeechSynthesis onstart.
    LipSync.start({personaId:state.personaId,emotion:currentEmotion});
    const lipStop=()=>LipSync.stop();

    if(window.DugeunVoice && typeof DugeunVoice.speak==="function"){
      DugeunVoice.speak(text,{
        personaId:state.personaId,
        emotion:currentEmotion,
        onStart:()=>LipSync.start({personaId:state.personaId,emotion:currentEmotion}),
        onEnd:lipStop
      }).catch?.(lipStop);
      if($("#voiceName") && typeof DugeunVoice.getVoiceName==="function"){
        $("#voiceName").textContent=DugeunVoice.getVoiceName();
      }
      return;
    }

    if(!("speechSynthesis" in window)){ lipStop(); return; }
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang="ko-KR";
    u.rate=state.personaId==="seojun"?.90:state.personaId==="yuri"?.98:.93;
    u.pitch=state.personaId==="seojun"?.95:state.personaId==="yuri"?1.08:1.04;
    const ko=speechSynthesis.getVoices().find(v=>/^ko/i.test(v.lang));
    if(ko) u.voice=ko;
    u.onstart=()=>LipSync.start({personaId:state.personaId,emotion:currentEmotion});
    u.onend=lipStop;
    u.onerror=lipStop;
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
    try{
      if(!window.DugeunAI || typeof DugeunAI.generateReply !== "function"){
        throw new Error("Demo AI 엔진이 준비되지 않았습니다.");
      }
      result = DugeunAI.generateReply(contextFor(message));
    }catch(e){
      console.error("AI 응답 오류:", e);
      result = {
        reply:"잠깐 생각이 꼬였네요. 한 번만 다시 말해줄래요?",
        emotion:"thinking", scoreDelta:0, memoryCandidates:[]
      };
    }
    setTimeout(() => {
      addMessage("ai",result.reply);
      state.lastReply = result.reply;
      if($("#subtitle")) $("#subtitle").textContent = result.reply;
      setEmotion(result.emotion || "neutral");
      saveMemories(result.memoryCandidates);
      addScore(result.scoreDelta || 0);
      save();
      speak(result.reply);
    }, 280 + Math.min(520,message.length * 7));
  }

  function enterApp(){
    const nameInput = $("#userName");
    state.userName = ((nameInput ? nameInput.value : state.userName) || "친구").trim().slice(0,12) || "친구";
    save();
    if($("#landing")) $("#landing").classList.add("hidden");
    if($("#app")) $("#app").classList.remove("hidden");
    setPersona();
    setScene();
    renderRelation();
    renderMemories();
    renderHistory();
    if($("#voiceToggle")) $("#voiceToggle").checked = state.voice;
    if($("#voiceIcon")) $("#voiceIcon").textContent = state.voice ? "🔊" : "🔇";

    if(!state.history.length){
      const p = window.DugeunAI && DugeunAI.PERSONAS ? DugeunAI.PERSONAS[state.personaId] : null;
      const first = p && Array.isArray(p.greetings) && p.greetings.length
        ? p.greetings[Math.floor(Math.random()*p.greetings.length)]
        : "안녕하세요. 오늘은 어떤 얘기를 해볼까요?";
      addMessage("ai",first);
      state.lastReply = first;
      if($("#subtitle")) $("#subtitle").textContent = first;
      setEmotion("smile");
      save();
      speak(first);
    }else{
      const last = [...state.history].reverse().find(m => m.role === "ai");
      if(last && $("#subtitle")) $("#subtitle").textContent = last.text;
    }
  }

  function initSpeech(){
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $("#mic");
    if(!mic) return;
    if(!R){
      mic.classList.add("unsupported");
      mic.title = "이 브라우저에서는 음성 인식을 지원하지 않습니다.";
      return;
    }
    mic.onclick = () => {
      try{
        const r = new R();
        r.lang = "ko-KR";
        r.interimResults = false;
        r.maxAlternatives = 1;
        r.onstart = () => toast("듣고 있어요…");
        r.onresult = e => {
          const input = $("#messageInput");
          if(input){
            input.value = e.results[0][0].transcript;
            input.focus();
          }
        };
        r.onerror = () => toast("음성 인식을 사용할 수 없어요.");
        r.start();
      }catch(e){
        console.warn("음성 입력 오류:", e);
        toast("마이크를 사용할 수 없어요.");
      }
    };
  }

  loadState();
  loadPartnerPortraits();

  const hero = $("#heroPortrait");
  if(hero){
    prepareImage(hero);
    hero.src = PORTRAITS[state.personaId] || FALLBACK_PORTRAIT;
  }
  LipSync.setPersona(state.personaId);
  if($("#userName")) $("#userName").value = state.userName || "친구";

  $$(".partner").forEach(btn => {
    btn.classList.toggle("sel",btn.dataset.id === state.personaId);
    btn.onclick = () => {
      $$(".partner").forEach(x => x.classList.remove("sel"));
      btn.classList.add("sel");
      state.personaId = btn.dataset.id;
      save();
    };
  });

  if($("#start")) $("#start").onclick = enterApp;

  if($("#chatForm")) $("#chatForm").onsubmit = e => {
    e.preventDefault();
    const input = $("#messageInput");
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    input.value = "";
    addMessage("user",text);
    setEmotion("thinking");
    if($("#subtitle")) $("#subtitle").textContent = "생각 중…";
    respond(text);
  };

  if($("#dateBtn")) $("#dateBtn").onclick = () => $("#dateModal") && $("#dateModal").classList.remove("hidden");
  $$("[data-scene]").forEach(btn => btn.onclick = () => {
    state.scene = btn.dataset.scene;
    setScene();
    save();
    if($("#dateModal")) $("#dateModal").classList.add("hidden");
    const scene = window.DugeunAI && DugeunAI.SCENES ? DugeunAI.SCENES[state.scene] : null;
    const msg = (scene ? scene.name : "데이트") + "로 장면을 바꿨어요. 분위기가 조금 달라졌네요.";
    addMessage("ai",msg);
    if($("#subtitle")) $("#subtitle").textContent = msg;
    setEmotion("smile");
    speak(msg);
  });

  if($("#settings")) $("#settings").onclick = () => $("#settingsModal") && $("#settingsModal").classList.remove("hidden");
  $$("[data-close]").forEach(btn => btn.onclick = () => {
    const target = $("#" + btn.dataset.close);
    if(target) target.classList.add("hidden");
  });
  $$(".modal").forEach(m => m.onclick = e => {
    if(e.target === m) m.classList.add("hidden");
  });

  if($("#voiceBtn")) $("#voiceBtn").onclick = () => {
    state.voice = !state.voice;
    save();
    if($("#voiceToggle")) $("#voiceToggle").checked = state.voice;
    if($("#voiceIcon")) $("#voiceIcon").textContent = state.voice ? "🔊" : "🔇";
    if(!state.voice){
      LipSync.stop();
      if(window.DugeunVoice && typeof DugeunVoice.stop === "function") DugeunVoice.stop();
      else if("speechSynthesis" in window) speechSynthesis.cancel();
    }
    toast(state.voice ? "AI 음성을 켰어요" : "AI 음성을 껐어요");
  };

  if($("#voiceToggle")) $("#voiceToggle").onchange = e => {
    state.voice = e.target.checked;
    save();
    if($("#voiceIcon")) $("#voiceIcon").textContent = state.voice ? "🔊" : "🔇";
    if(!state.voice){
      LipSync.stop();
      if(window.DugeunVoice && typeof DugeunVoice.stop === "function") DugeunVoice.stop();
      else if("speechSynthesis" in window) speechSynthesis.cancel();
    }
  };

  if($("#clearMemory")) $("#clearMemory").onclick = () => {
    state.memories = [];
    save();
    renderMemories();
    toast("기억을 초기화했어요.");
  };

  if($("#clearAll")) $("#clearAll").onclick = () => {
    LipSync.stop();
    if(window.DugeunVoice && typeof DugeunVoice.stop === "function") DugeunVoice.stop();
    localStorage.removeItem(STORAGE);
    location.reload();
  };

  initSpeech();
  if(window.DugeunVoice){
    if(typeof DugeunVoice.refreshVoices === "function") DugeunVoice.refreshVoices();
    setTimeout(() => {
      if($("#voiceName") && typeof DugeunVoice.getVoiceName === "function"){
        $("#voiceName").textContent = DugeunVoice.getVoiceName();
      }
    },400);
  }

  if(state.history && state.history.length) enterApp();
})();