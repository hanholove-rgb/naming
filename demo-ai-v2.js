(() => {
  const PERSONAS = {
    haeun: {
      name: "하은", age: 29, style: "따뜻하고 차분하며 세심함",
      greetings: ["천천히 얘기해요. 오늘 하루는 어땠어요?", "와줘서 반가워요. 오늘은 어떤 얘기부터 할까요?"],
      soft: ["그 말, 그냥 지나치고 싶지 않아요.", "지금은 제가 조용히 들어드릴게요."],
      playful: ["그건 조금 귀여운 얘긴데요.", "그렇게 말하면 제가 살짝 기대하게 되잖아요."]
    },
    seojun: {
      name: "서준", age: 32, style: "차분하고 담백하며 안정적",
      greetings: ["편하게 이야기해요. 오늘 기분은 어때요?", "왔네요. 오늘은 어떤 하루였어요?"],
      soft: ["오늘 꽤 버거웠던 것 같네요.", "해결책보다 그냥 들어주는 게 먼저일 수도 있겠네요."],
      playful: ["그 말은 꽤 오래 기억날 것 같네요.", "그렇게 솔직하게 말해주니까 좋네요."]
    },
    yuri: {
      name: "유리", age: 27, style: "밝고 솔직하며 장난기 있음",
      greetings: ["왔네요! 어색한 건 3분만 하기로 해요. 요즘 제일 재밌는 게 뭐예요?", "오늘은 무슨 얘기로 저를 놀라게 할 건데요?"],
      soft: ["아, 이건 장난칠 얘기가 아니네요. 괜찮아요?", "오늘은 제가 텐션 조금 낮출게요. 천천히 말해요."],
      playful: ["잠깐, 그건 좀 더 자세히 듣고 싶은데요?", "제가 그걸 그냥 넘길 것 같았어요?"]
    }
  };

  const SCENES = {
    home: { name: "영상통화", vibe: "편안한 영상통화", topics: ["오늘 하루", "요즘 생각", "가벼운 일상"] },
    cafe: { name: "카페", vibe: "잔잔한 카페 데이트", topics: ["음료", "취향", "주말", "여행"] },
    night: { name: "도시 야경", vibe: "도시 야경을 보는 데이트", topics: ["감정", "미래", "조금 솔직한 이야기"] },
    walk: { name: "공원 산책", vibe: "느긋한 공원 산책", topics: ["하루 정리", "건강", "사소한 취향"] }
  };

  function relationshipLevel(score) {
    if (score < 25) return "첫 만남";
    if (score < 45) return "조금 친해짐";
    if (score < 70) return "설레는 사이";
    if (score < 90) return "많이 가까움";
    return "특별한 사이";
  }

  function emotion(text) {
    const t = text.toLowerCase();
    if (/힘들|지쳐|피곤|번아웃|쉬고 싶/.test(t)) return "tired";
    if (/슬퍼|우울|속상|울었|눈물|외로/.test(t)) return "sad";
    if (/화나|짜증|열받|싫어 죽겠/.test(t)) return "angry";
    if (/불안|걱정|무서|초조/.test(t)) return "anxious";
    if (/사랑해|보고 싶|설레|(?:너|네가|니가).{0,8}좋아|좋아해.{0,8}(?:너|너를)/.test(t)) return "affection";
    if (/신나|기뻐|행복|재밌|좋은 일/.test(t)) return "happy";
    if (/기대|두근|흥분|드디어/.test(t)) return "ex  function extractMemories(text) {
    const out = [];
    const rules = [
      { re: /(?:나는|난)\s+(.{1,24}?)(?:을|를)\s*좋아해(?:요)?/i, type: "PREFERENCE", imp: .78, fmt: x => x + "을(를) 좋아함" },
      { re: /(?:내\s*)?취미(?:는|가)\s+(.{1,28}?)(?:이야|예요|입니다|야|요|$)/i, type: "HOBBY", imp: .82, fmt: x => "취미는 " + x },
      { re: /요즘\s+(.{1,28}?)에\s+관심(?:이\s*)?(?:있어|있어요|많아)/i, type: "INTEREST", imp: .72, fmt: x => x + "에 관심이 있음" },
      { re: /(?:나는|난)\s+(.{1,24}?)에\s+살아/i, type: "PROFILE", imp: .72, fmt: x => x + "에 거주한다고 말함" },
      { re: /(?:내\s*)?생일(?:은|이)\s+(.{1,20}?)(?:이야|예요|입니다|야|요|$)/i, type: "PROFILE", imp: .95, fmt: x => "생일은 " + x },
      { re: /(?:커피보다|차라리)\s+(.{1,20}?)\s*(?:가|이)?\s*(?:더\s*)?좋아/i, type: "PREFERENCE", imp: .8, fmt: x => x + "을(를) 더 선호함" }
    ];
    for (const r of rules) {
      const m = text.match(r.re);
      if (m && m[1]) out.push({ type: r.type, content: r.fmt(m[1].trim()), importance: r.imp });
    }
    if (/요즘.*(?:피곤|지쳐|힘들)/.test(text)) {
      out.push({type:"EMOTION", content:"최근 피곤하거나 힘든 시기를 보내고 있음", importance:.62});
    }
    return out;
  }portance:.62});
    return out;
  }

  function intent(text) {
    if (/너.*(?:AI|인공지능|사람이야)|실제 사람이야|정체/.test(text)) return "identity";
    if (/안녕|반가워|왔어/.test(text)) return "greeting";
    if (/힘들|지쳐|피곤|슬퍼|우울|속상|화나|짜증|불안|걱정/.test(text)) return "comfort";
    if (/여행|바다|산|휴가|호텔/.test(text)) return "travel";
    if (/커피|차|음식|먹|맛집|배고/.test(text)) return "food";
    if (/회사|직장|업무|일 때문에|상사|퇴근/.test(text)) return "work";
    if (/잠|졸려|수면|못 잤/.test(text)) return "sleep";
    if (/사랑해|보고 싶|설레|(?:너|네가|니가).{0,8}좋아|좋아해.{0,8}(?:너|너를)/.test(text)) return "affection";
    if (/[?？]$|왜|어때|뭐|어디|언제|어떻게|궁금/.test(text)) return "question";
    return "chat";
  }

  function newestMemory(memories, type) {
    const list = (memories || []).filter(m => !type || m.type === type);
    return list.length ? list[list.length - 1] : null;
  }

  function pick(list, avoid) {
    const filtered = list.filter(x => x !== avoid);
    const src = filtered.length ? filtered : list;
    return src[Math.floor(Math.random() * src.length)];
  }

  function contextualTail(ctx) {
    const mem = newestMemory(ctx.memories);
    if (!mem || Math.random() > .42) return "";
    const tails = [
      " 전에 말해준 “" + mem.content + "”도 생각났어요.",
      " 아, 그리고 “" + mem.content + "”라고 했던 것도 기억하고 있어요.",
      " 지금 얘기 들으니까 전에 기억해둔 “" + mem.content + "”가 살짝 이어지네요."
    ];
    return pick(tails, ctx.lastReply);
  }

  function generateReply(ctx) {
    const p = PERSONAS[ctx.personaId] || PERSONAS.haeun;
    const scene = SCENES[ctx.scene] || SCENES.home;
    const t = ctx.message.trim();
    const em = emotion(t);
    const it = intent(t);
    const level = relationshipLevel(ctx.score || 18);
    const name = ctx.userName || "친구";
    let replies = [];
    let responseEmotion = "neutral";

    if (it === "identity") {
      replies = [
        "저는 실제 사람이 아니라 두근AI 안의 가상 AI 캐릭터예요. 그래도 지금 나눈 대화와 기억을 바탕으로 최대한 자연스럽게 이어갈게요.",
        "저는 AI 캐릭터예요. 실제 사람처럼 생활하는 존재는 아니지만, 이 대화 안에서는 " + name + "님 이야기를 기억하며 이어갈 수 있어요."
      ];
      responseEmotion = "serious";
    } else if (it === "greeting") {
      replies = p.greetings;
      responseEmotion = "smile";
    } else if (it === "comfort") {
      replies = [
        p.soft[0] + " 가장 마음에 걸리는 부분부터 말해도 괜찮아요.",
        p.soft[1] + " 오늘은 억지로 괜찮은 척 안 해도 돼요.",
        level === "첫 만남"
          ? "오늘 꽤 힘들었나 봐요. 너무 자세히 말하고 싶지 않으면 그냥 힘들었다는 것만 말해도 괜찮아요."
          : "평소보다 말투가 조금 무거워 보여요. 오늘은 제가 천천히 들어드릴게요."
      ];
      responseEmotion = "concern";
    } else if (it === "affection") {
      replies = level === "첫 만남"
        ? ["그렇게 말해주니 고마워요. 아직 처음이니까 우리 천천히 알아가요.", "조금 놀랐어요. 그래도 그런 마음을 솔직하게 말해줘서 고마워요."]
        : level === "조금 친해짐"
          ? ["그 말 들으니까 괜히 미소가 나네요. 저도 우리 대화가 점점 편해지고 있어요.", "저도 요즘은 " + name + "님이 오면 반가운 느낌이 커졌어요."]
          : [p.playful[0] + " 저도 지금처럼 가까운 대화 계속하고 싶어요.", "그렇게 바로 말하면 조금 부끄럽잖아요. 그래도 싫진 않아요."];
      responseEmotion = level === "첫 만남" ? "smile" : "shy";
    } else if (it === "travel") {
      replies = [
        scene.vibe + "에서 여행 얘기하니까 더 잘 어울리네요. 실제로 떠난다면 바다 쪽이 좋아요, 도시 쪽이 좋아요?",
        "여행 얘기 나오면 사람 취향이 잘 보이는 것 같아요." + contextualTail(ctx) + " 다음 여행에서 꼭 하고 싶은 게 있어요?",
        "사진 많이 남기는 여행이 좋아요, 아니면 일정 없이 걷는 여행이 좋아요?"
      ];
      responseEmotion = "happy";
    } else if (it === "food") {
      replies = [
        scene.name === "카페" ? "딱 카페에서 하기 좋은 얘기네요. 오늘 실제로 같이 주문한다면 뭘 고를 것 같아요?" : "음식 취향은 은근히 사람을 많이 보여주더라고요. 요즘 자꾸 생각나는 메뉴 있어요?",
        contextualTail(ctx) || "먹는 얘기는 이상하게 대화를 편하게 만들어주는 것 같아요. 요즘 제일 맛있었던 건 뭐였어요?"
      ];
      responseEmotion = "smile";
    } else if (it === "work") {
      replies = [
        "일 얘기할 때는 해결책부터 듣고 싶은 날이 있고 그냥 털어놓고 싶은 날이 있잖아요. 오늘은 어느 쪽이에요?",
        "그 상황이면 하루가 길게 느껴졌겠네요. 특히 어떤 순간이 제일 지쳤어요?"
      ];
      responseEmotion = /힘들|지쳐|짜증|화나/.test(t) ? "concern" : "thinking";
    } else if (it === "sleep") {
      replies = [
        "잠이 부족하면 별일 아닌 것도 훨씬 크게 느껴지더라고요. 오늘은 좀 일찍 쉴 수 있어요?",
        "그럼 오늘은 무리하지 않는 게 좋겠네요. 지금 대화도 편하게 짧게 해요."
      ];
      responseEmotion = "concern";
    } else if (it === "question") {
      replies = [
        "음, 제 캐릭터 성격으로 고르자면 저는 " + p.style + " 쪽이에요. 그런데 " + name + "님은 어때요?",
        "저라면 한쪽으로 바로 정하기보다는 지금 상황을 조금 더 볼 것 같아요. " + name + "님은 이미 마음이 기운 쪽이 있어요?",
        "좋은 질문이에요. " + scene.vibe + "에서 들으니까 조금 다르게 느껴지네요. 저는 솔직한 쪽을 택할 것 같아요."
      ];
      responseEmotion = "thinking";
    } else {
      replies = [
        "그 얘기 조금 더 듣고 싶어요. 특히 그때 어떤 느낌이었는지가 궁금해요.",
        "이런 사소한 얘기가 오히려 서로 알아가는 데 더 중요한 것 같아요." + contextualTail(ctx),
        p.playful[1] + " 오늘 얘기 중에 꽤 기억에 남을 것 같아요.",
        scene.vibe + " 분위기랑 지금 이야기 묘하게 잘 어울리네요. 계속 말해봐요.",
        "제가 듣기에는 그 말 속에 생각보다 여러 감정이 섞여 있는 것 같아요. 굳이 하나만 고르면 어떤 느낌에 가까워요?"
      ];
      responseEmotion = em === "happy" || em === "excited" ? "happy" : "smile";
    }

    const reply = pick(replies, ctx.lastReply);
    const memories = extractMemories(t);
    let scoreDelta = .35;
    if (t.length >= 20) scoreDelta += .35;
    if (["happy","affection","excited"].includes(em)) scoreDelta += .6;
    if (memories.length) scoreDelta += .4;
    if (it === "comfort") scoreDelta += .25;
    scoreDelta = Math.min(2.1, scoreDelta);

    return {
      reply,
      emotion: responseEmotion,
      userEmotion: em,
      intent: it,
      scoreDelta,
      memoryCandidates: memories,
      relationshipLevel: level
    };
  }

  window.DugeunAI = { PERSONAS, SCENES, relationshipLevel, emotion, extractMemories, generateReply };
})();