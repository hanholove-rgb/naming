(() => {
  let voices = [];
  let stoppedToken = 0;

  const profiles = {
    haeun: { rate: 0.93, pitch: 1.04 },
    seojun: { rate: 0.91, pitch: 0.97 },
    yuri: { rate: 0.99, pitch: 1.06 }
  };

  function refreshVoices() {
    if (!("speechSynthesis" in window)) return [];
    voices = window.speechSynthesis.getVoices() || [];
    return voices;
  }

  function scoreVoice(v) {
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    let score = 0;
    if (lang === "ko-kr") score += 100;
    else if (lang.startsWith("ko")) score += 75;
    else return -999;

    if (/natural|neural|online/.test(name)) score += 60;
    if (/microsoft/.test(name)) score += 35;
    if (/google/.test(name)) score += 25;
    if (/heami|sunhi|injoon|hyunsu|jiwon|seoyeon/.test(name)) score += 20;
    if (!v.localService) score += 8;
    return score;
  }

  function bestKoreanVoice() {
    if (!voices.length) refreshVoices();
    const candidates = voices
      .map(v => ({ v, score: scoreVoice(v) }))
      .filter(x => x.score > -999)
      .sort((a, b) => b.score - a.score);
    return candidates[0]?.v || null;
  }

  function chunkText(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    const parts = clean.match(/[^.!?。！？]+[.!?。！？]?/g) || [clean];
    const chunks = [];
    let buf = "";
    for (const raw of parts) {
      const p = raw.trim();
      if (!p) continue;
      if ((buf + " " + p).trim().length <= 82) {
        buf = (buf + " " + p).trim();
      } else {
        if (buf) chunks.push(buf);
        if (p.length <= 100) buf = p;
        else {
          for (let i = 0; i < p.length; i += 90) chunks.push(p.slice(i, i + 90));
          buf = "";
        }
      }
    }
    if (buf) chunks.push(buf);
    return chunks;
  }

  function stop() {
    stoppedToken++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) return Promise.resolve(false);
    stop();
    const token = stoppedToken;
    const chunks = chunkText(text);
    if (!chunks.length) return Promise.resolve(false);

    const base = profiles[options.personaId] || profiles.haeun;
    let rate = base.rate;
    let pitch = base.pitch;
    const emotion = options.emotion || "neutral";

    if (emotion === "concern") rate -= 0.045;
    if (emotion === "serious" || emotion === "thinking") rate -= 0.025;
    if (emotion === "happy") rate += 0.025;
    if (emotion === "shy") { rate -= 0.015; pitch += 0.015; }

    rate = Math.max(0.82, Math.min(1.05, rate));
    pitch = Math.max(0.88, Math.min(1.12, pitch));

    const voice = bestKoreanVoice();

    return new Promise(resolve => {
      let i = 0;
      const next = () => {
        if (token !== stoppedToken) return resolve(false);
        if (i >= chunks.length) {
          options.onEnd?.();
          return resolve(true);
        }

        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = "ko-KR";
        u.rate = rate;
        u.pitch = pitch;
        u.volume = 1;
        if (voice) u.voice = voice;

        u.onstart = () => {
          if (i === 0) options.onStart?.();
        };
        u.onend = () => {
          i++;
          setTimeout(next, emotion === "serious" || emotion === "concern" ? 125 : 75);
        };
        u.onerror = () => {
          options.onEnd?.();
          resolve(false);
        };
        window.speechSynthesis.speak(u);
      };
      next();
    });
  }

  function getVoiceName() {
    const v = bestKoreanVoice();
    return v ? v.name : "브라우저 기본 한국어 음성";
  }

  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  window.DugeunVoice = {
    speak,
    stop,
    refreshVoices,
    getVoiceName,
    neuralTTSConfigured: false
  };
})();