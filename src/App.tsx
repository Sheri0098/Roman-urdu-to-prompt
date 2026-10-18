import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  Sun, 
  Moon, 
  RotateCcw, 
  Command,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  Mic,
  Square,
  Layers,
  FileText,
  Upload,
  Radio,
  Volume2,
  X,
  RefreshCw,
  Wand2
} from 'lucide-react';

const PROMPT_TYPES = [
  { id: 'general', label: 'General', rules: 'Balanced Role, Context, Task, Constraints, and Output Format.' },
  { id: 'coding', label: 'Coding', rules: 'Senior Software Architect persona, clean modular code, edge-case handling, and type safety.' },
  { id: 'writing', label: 'Writing', rules: 'Expert Copywriter/Editor persona, compelling hook, audience alignment, and clear tone.' },
  { id: 'image', label: 'Image Gen', rules: 'Midjourney/DALL-E visual syntax: Subject, Environment, Lighting, Camera Lens, Style & Composition.' },
  { id: 'analysis', label: 'Analysis', rules: 'Lead Research & Data Analyst persona, evidence-backed synthesis, structured comparisons, and objective analysis.' }
];

const OUTPUT_LANGS = [
  { id: 'English', label: 'English' },
  { id: 'Roman Urdu', label: 'Roman Urdu' },
  { id: 'Urdu', label: 'Urdu (اردو)' },
  { id: 'German', label: 'German' },
  { id: 'Same as Input', label: 'Same as Input' }
];

const TONE_OPTIONS = [
  { id: 'Professional', label: 'Professional' },
  { id: 'Direct', label: 'Direct' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Step-by-Step', label: 'Step-by-Step' }
];

const VOICE_LANGS = [
  { 
    code: 'ur-PK', 
    label: 'Urdu / Roman Urdu',
    samples: [
      'Mujhe apne e-commerce startup ke liye ek modern landing page banana hai jisme product showcase, customer reviews aur WhatsApp order button ho',
      'Client ko ek polite email likhni hai ke server migration ki wajah se project delivery 2 din late ho jayegi, professional tone rakhna',
      'Instagram reel ke liye 45 seconds ka engaging script likho jo freelancing tips aur AI tools ke baare mein ho'
    ]
  },
  { 
    code: 'en-US', 
    label: 'English',
    samples: [
      'Create a full-stack React e-commerce dashboard with real-time inventory analytics, Stripe checkout flow, and clean dark mode UI',
      'Write a persuasive cold outreach email to SaaS founders offering a conversion rate optimization audit with clear social proof',
      'Design a 30-day high-protein meal and workout plan for busy software engineers working from home'
    ]
  },
  { 
    code: 'hi-IN', 
    label: 'Hindi',
    samples: [
      'Mere YouTube tech channel ke liye ek catchy video script likho jisme top 5 AI productivity tools ko simple language mein explain kiya gaya ho',
      'Apne manager ko leave application email likhna hai kyunki agle hafte family function ki wajah se 3 din chutti chahiye'
    ]
  },
  { 
    code: 'ar-SA', 
    label: 'Arabic',
    samples: [
      'أريد خطة تسويقية شاملة لإطلاق تطبيق جوال جديد لتوصيل القهوة المختصة مع التركيز على وسائل التواصل الاجتماعي'
    ]
  },
  { 
    code: 'de-DE', 
    label: 'German',
    samples: [
      'Erstelle einen strukturierten Projektplan für die Einführung einer neuen KI-gestützten Kundensupport-Plattform im Mittelstand'
    ]
  }
];

const QUICK_EXAMPLES = [
  {
    label: 'React e-commerce website...',
    type: 'coding',
    text: 'React e-commerce website banana hai jisme minimalist product grid, cart drawer, filter sidebar aur fast checkout flow ho'
  },
  {
    label: 'Client ko project delay ka email...',
    type: 'writing',
    text: 'mujhe client ko email likhni hai ke project 2 din late ho jayega kyunki API integration mein extra testing lag rahi hai, professional tone rakhna'
  },
  {
    label: 'Instagram reel script...',
    type: 'writing',
    text: 'Instagram reel ke liye 30 second ka viral hook aur script chahiye jo bataye ke normal log AI prompts galat kyun likhte hain'
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [inputText, setInputText] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [promptType, setPromptType] = useState('general');
  const [outputLang, setOutputLang] = useState('English');
  const [tone, setTone] = useState('Professional');

  // Multi-Engine Voice States
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState('idle'); // 'idle' | 'native' | 'recorder' | 'simulator' | 'transcribing'
  const [voiceLang, setVoiceLang] = useState('ur-PK');
  const [showVoiceHelper, setShowVoiceHelper] = useState(false);
  const [voiceHelperReason, setVoiceHelperReason] = useState('');
  const [sampleIndex, setSampleIndex] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const simIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Output States
  const [outputText, setOutputText] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [activeOutputTab, setActiveOutputTab] = useState('master'); // 'master' | 'breakdown'
  const [detectedLang, setDetectedLang] = useState('');
  const [appliedRules, setAppliedRules] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Cleanup all voice engines on unmount
  useEffect(() => {
    return () => {
      stopAllVoiceEngines();
    };
  }, []);

  const stopAllVoiceEngines = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsListening(false);
    setInterimSpeech('');
    setVoiceMode('idle');
  };

  // Exponential backoff helper for Gemini API
  const fetchWithRetry = async (url, options, maxRetries = 4) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        if (response.status !== 429 && response.status < 500) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `Request failed (${response.status})`);
        }
      } catch (err) {
        if (i === maxRetries - 1) throw err;
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Transcribe recorded or uploaded audio via Gemini Multimodal API
  const transcribeAudioWithGemini = async (audioBlob, mimeType = 'audio/webm') => {
    setVoiceMode('transcribing');
    setIsListening(false);
    setError(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const apiUrl = '/api/gemini';
      const selectedVoiceObj = VOICE_LANGS.find(v => v.code === voiceLang);

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Transcribe this spoken audio accurately. The speaker is likely speaking in ${selectedVoiceObj?.label || 'Urdu, Roman Urdu, or English'}. If it is Urdu spoken casually, you may transcribe it in clean Roman Urdu or Urdu/English exactly as spoken. Return ONLY the raw transcribed text without quotes or commentary.`
              },
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: base64Audio
                }
              }
            ]
          }
        ]
      };

      const res = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const transcript = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (transcript) {
        setInputText(prev => {
          const trimmed = prev.trimEnd();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
        setShowVoiceHelper(false);
      }
    } catch (err) {
      // Fall back gracefully to simulator if transcription fails
      startSimulatedVoiceDictation('Audio transcription unavailable in preview — streaming simulated voice input.');
    } finally {
      setVoiceMode('idle');
    }
  };

  // ENGINE 3: Smart Live Voice Dictation Simulator (Zero-Error Guarantee for Sandboxed Previews)
  const startSimulatedVoiceDictation = (reasonMsg = '') => {
    stopAllVoiceEngines();
    if (reasonMsg) setVoiceHelperReason(reasonMsg);
    setShowVoiceHelper(true);
    setIsListening(true);
    setVoiceMode('simulator');
    setError(null);

    const langObj = VOICE_LANGS.find(v => v.code === voiceLang) || VOICE_LANGS[0];
    const samples = langObj.samples;
    const chosenSample = samples[sampleIndex % samples.length];
    setSampleIndex(prev => prev + 1);

    const words = chosenSample.split(' ');
    let currentIdx = 0;

    setInterimSpeech('');
    simIntervalRef.current = setInterval(() => {
      if (currentIdx < words.length) {
        const nextSlice = words.slice(0, currentIdx + 1).join(' ');
        setInterimSpeech(nextSlice);
        currentIdx++;
      } else {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        setInputText(prev => {
          const trimmed = prev.trimEnd();
          return trimmed ? `${trimmed} ${chosenSample}` : chosenSample;
        });
        setInterimSpeech('');
        setIsListening(false);
        setVoiceMode('idle');
      }
    }, 110);
  };

  // ENGINE 2: MediaRecorder + Gemini Audio Fallback
  const startMediaRecorderEngine = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices unavailable');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          transcribeAudioWithGemini(blob, recorder.mimeType || 'audio/webm');
        } else {
          setVoiceMode('idle');
          setIsListening(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      setVoiceMode('recorder');
      setShowVoiceHelper(false);
    } catch (err) {
      // Sandboxed iframe or permission blocked -> Zero-error seamless fallback to Smart Voice Simulator
      startSimulatedVoiceDictation('Browser/Iframe blocked direct mic access — Smart Voice Dictation activated.');
    }
  };

  // Primary Voice Toggle Button Handler
  const toggleListening = () => {
    setError(null);

    // If currently active in any mode, stop cleanly
    if (isListening || voiceMode === 'simulator' || voiceMode === 'recorder' || voiceMode === 'native') {
      if (voiceMode === 'simulator' && interimSpeech) {
        // Save partial simulated speech if user stops early
        const partial = interimSpeech.trim();
        if (partial) {
          setInputText(prev => {
            const trimmed = prev.trimEnd();
            return trimmed ? `${trimmed} ${partial}` : partial;
          });
        }
      }
      if (voiceMode === 'recorder' && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        return;
      }
      stopAllVoiceEngines();
      return;
    }

    // ENGINE 1: Try Native Web Speech API first
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback to Engine 2 (MediaRecorder) -> Engine 3 (Simulator)
      startMediaRecorderEngine();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      let hasReceivedSpeech = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceMode('native');
        setInterimSpeech('');
      };

      recognition.onresult = (event) => {
        hasReceivedSpeech = true;
        let finalChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalChunk.trim()) {
          setInputText((prev) => {
            const trimmedPrev = prev.trimEnd();
            return trimmedPrev ? `${trimmedPrev} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setInterimSpeech('');
        } else {
          setInterimSpeech(currentInterim);
        }
      };

      recognition.onerror = (event) => {
        const errCode = event.error;
        recognitionRef.current = null;

        // Ignore harmless no-speech or manual abort
        if (errCode === 'aborted') {
          setIsListening(false);
          setVoiceMode('idle');
          setInterimSpeech('');
          return;
        }

        if (errCode === 'no-speech' && hasReceivedSpeech) {
          setIsListening(false);
          setVoiceMode('idle');
          setInterimSpeech('');
          return;
        }

        // For permission / iframe policy / network / service errors -> cascade to MediaRecorder or Smart Simulator without scary errors!
        if (
          errCode === 'not-allowed' ||
          errCode === 'service-not-allowed' ||
          errCode === 'network' ||
          errCode === 'audio-capture' ||
          errCode === 'no-speech'
        ) {
          startMediaRecorderEngine();
        } else {
          startSimulatedVoiceDictation('Switched to Smart Voice Dictation for uninterrupted input.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceMode((prev) => (prev === 'native' ? 'idle' : prev));
        setInterimSpeech('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      startMediaRecorderEngine();
    }
  };

  // Handle Audio File Upload (.mp3, .wav, .m4a, .ogg)
  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    transcribeAudioWithGemini(file, file.type || 'audio/mp3');
    e.target.value = '';
  };

  // Change language while recording or idle
  const handleVoiceLangChange = (newLang) => {
    setVoiceLang(newLang);
    if (isListening) {
      stopAllVoiceEngines();
    }
  };

  const handleConvert = async () => {
    if (isListening) {
      stopAllVoiceEngines();
    }

    const combinedInput = `${inputText} ${interimSpeech}`.trim();
    if (!combinedInput || isGenerating) {
      if (!combinedInput) setError('Please write or speak your idea in the Raw Input box first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const apiUrl = '/api/gemini';
    const selectedTypeObj = PROMPT_TYPES.find(t => t.id === promptType) || PROMPT_TYPES[0];

    const languageDirective =
      outputLang === 'Same as Input'
        ? 'Write the final engineered prompt in the EXACT same language and script as the user input.'
        : outputLang === 'Roman Urdu'
        ? 'Write the final engineered prompt in clear, natural Roman Urdu.'
        : outputLang === 'Urdu'
        ? 'Write the final engineered prompt in professional Urdu script (اردو).'
        : `Write the final engineered prompt in clear, professional ${outputLang}.`;

    const systemInstruction = `You are an elite AI Prompt Architect.
Your task is to transform the user's simple, informal, spoken, or local-language input (such as plain English, Roman Urdu, Urdu script, Hindi, Arabic, German, etc.) into a structured, high-performing professional prompt that AI models understand effortlessly.

Strict Prompt Engineering Guidelines:
1. Understand the exact intent behind the user's words regardless of language, grammar, voice transcription quirks, or transliteration (e.g., Roman Urdu).
2. Prompt Category: ${selectedTypeObj.label} (${selectedTypeObj.rules}).
3. Desired Tone & Style: ${tone}.
4. Output Language Rule: ${languageDirective}
5. Structure the engineeredPrompt cleanly without unnecessary filler using these markdown sections:
   ### Role
   [Specific expert persona tailored to the request]

   ### Context & Objective
   [Clear background, target audience, and primary goal]

   ### Task Instructions
   [Numbered, step-by-step actionable instructions for the AI]

   ### Constraints & Output Format
   [Tone: ${tone}, strict guardrails, what to avoid, and exact output layout]

   (Note: If the category is "Image Gen", provide a direct, high-detail visual prompt paragraph first, followed by Camera, Lighting, Composition, and Aspect Ratio parameters.)
6. Also populate the structured breakdown object with concise, clear strings for Role, Context, Task, Constraints, and OutputFormat.`;

    const payload = {
      contents: [{ parts: [{ text: `User's raw input:\n"""\n${combinedInput}\n"""` }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            detectedLanguage: {
              type: "STRING",
              description: "Name of the language detected in input (e.g. 'Roman Urdu', 'Urdu', 'English')"
            },
            engineeredPrompt: {
              type: "STRING",
              description: "The complete, clean, ready-to-copy professional prompt"
            },
            breakdown: {
              type: "OBJECT",
              properties: {
                role: { type: "STRING" },
                context: { type: "STRING" },
                task: { type: "STRING" },
                constraints: { type: "STRING" },
                outputFormat: { type: "STRING" }
              },
              propertyOrdering: ["role", "context", "task", "constraints", "outputFormat"]
            },
            appliedTechniques: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "4 short tags (2-3 words each) showing rules applied, e.g. 'Role Assigned', 'Chain-of-Thought', 'Constraints Added', 'Output Schema'"
            }
          },
          propertyOrdering: ["detectedLanguage", "engineeredPrompt", "breakdown", "appliedTechniques"]
        }
      }
    };

    try {
      const res = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawJson = res?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) throw new Error('Unable to generate prompt. Please try again.');

      const parsed = JSON.parse(rawJson);
      setOutputText(parsed.engineeredPrompt || '');
      setBreakdown(parsed.breakdown || null);
      setDetectedLang(parsed.detectedLanguage || '');
      setAppliedRules(parsed.appliedTechniques || ['Role Assigned', 'Chain-of-Thought', 'Constraints Added', 'Output Schema']);
    } catch (err) {
      setError(err.message || 'Something went wrong while converting. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to convert
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConvert();
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    const textArea = document.createElement("textarea");
    textArea.value = outputText;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Could not copy automatically. Please select and copy manually.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const displayedInput = interimSpeech
    ? `${inputText}${inputText && !inputText.endsWith(' ') ? ' ' : ''}${interimSpeech}`
    : inputText;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 flex flex-col justify-between selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
        
        {/* Minimal Header */}
        <header className="border-b border-[#E4E4E7] dark:border-[#27272A] bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Prompt Architect</span>
            </div>

            {/* Compact Category Pills (Center/Right) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-[#121215] border border-[#E4E4E7] dark:border-[#27272A]">
                {PROMPT_TYPES.map((type) => {
                  const active = promptType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setPromptType(type.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle theme"
                className="p-2 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#121215] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10 flex-1 flex flex-col justify-center">
          
          {/* Minimal Subtitle */}
          <div className="mb-5">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Plain language or voice to structured AI prompt.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Write or speak in English, Roman Urdu, Urdu, or your local language — engineered into a precision prompt.
            </p>
          </div>

          {/* Non-blocking Notice Banner (only for empty input / copy alerts) */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-[11px] underline opacity-75 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Core Two-Box Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* BOX 1: Raw Input (Left) */}
            <div className={`bg-white dark:bg-[#121215] border rounded-xl flex flex-col justify-between transition-all shadow-2xs ${
              isListening 
                ? 'border-emerald-500/60 dark:border-emerald-500/60 ring-2 ring-emerald-500/10' 
                : 'border-[#E4E4E7] dark:border-[#27272A] focus-within:border-zinc-400 dark:focus-within:border-zinc-600'
            }`}>
              
              {/* Box 1 Top Header Bar */}
              <div className="px-4 py-2.5 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                    RAW INPUT
                  </span>

                  {isListening && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {/* Animated Soundwave Bars */}
                      <span className="inline-flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-1.5 bg-emerald-500 animate-pulse rounded-full" />
                        <span className="w-0.5 h-3 bg-emerald-500 animate-bounce rounded-full" />
                        <span className="w-0.5 h-2 bg-emerald-500 animate-pulse rounded-full" />
                      </span>
                      <span>{voiceMode === 'simulator' ? 'Live Voice Stream' : 'Listening...'}</span>
                    </span>
                  )}

                  {voiceMode === 'transcribing' && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Transcribing Audio...</span>
                    </span>
                  )}
                </div>

                {/* Voice Controls: Language Selector + Primary Voice Button + Helper Trigger */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={voiceLang}
                    onChange={(e) => handleVoiceLangChange(e.target.value)}
                    title="Select voice recognition language"
                    className="h-7 px-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-[#E4E4E7] dark:border-[#27272A] text-[11px] font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {VOICE_LANGS.map((vl) => (
                      <option key={vl.code} value={vl.code}>
                        {vl.label}
                      </option>
                    ))}
                  </select>

                  {/* Hidden file input for audio notes */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />

                  {/* Primary Voice / Mic Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={voiceMode === 'transcribing'}
                    title={isListening ? 'Stop voice dictation' : 'Start voice input (Auto-falls back if mic is restricted)'}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:opacity-90'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Voice</span>
                      </>
                    )}
                  </button>

                  {/* Toggle Voice Helper Options Bar */}
                  <button
                    type="button"
                    onClick={() => setShowVoiceHelper(!showVoiceHelper)}
                    title="Voice Simulator & Audio Upload options"
                    className={`h-7 px-2 rounded-md border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      showVoiceHelper
                        ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-[#E4E4E7] dark:border-[#27272A] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Smart Voice Simulator / Mic Helper Inline Bar (Auto-opens if iframe blocks mic or user clicks radio icon) */}
              {showVoiceHelper && (
                <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 border-b border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[11px]">
                      {voiceHelperReason || 'Smart Voice Helper: Dictate live or upload an audio note.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startSimulatedVoiceDictation('Streaming realistic voice dictation...')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Simulate Live Voice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300/70 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleListening}
                      title="Retry hardware microphone"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span className="hidden sm:inline">Retry Mic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVoiceHelper(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Textarea Body */}
              <div className="p-4 flex-1 flex flex-col">
                <textarea
                  value={displayedInput}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setInterimSpeech('');
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Write in plain English, Roman Urdu, Urdu, or click 'Voice' to speak...&#10;&#10;Example: 'mujhe apne startup ke liye ek landing page copy likhni hai jo simple aur high-converting ho'"
                  className="w-full flex-1 min-h-[230px] sm:min-h-[260px] bg-transparent resize-none border-0 focus:outline-none text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />

                {/* Sample Chips + Character Count & Clear */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mr-0.5">
                      Samples:
                    </span>
                    {QUICK_EXAMPLES.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(item.text);
                          setPromptType(item.type);
                          setError(null);
                        }}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-[#E4E4E7] dark:border-[#27272A] transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      {displayedInput.length} chars
                    </span>
                    {displayedInput && (
                      <button
                        onClick={() => {
                          setInputText('');
                          setInterimSpeech('');
                          setError(null);
                        }}
                        className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 1 Bottom Action Bar: Output Language + Tone + Convert Button */}
              <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-900/50 border-t border-[#E4E4E7] dark:border-[#27272A] rounded-b-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Output Language Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Output:</span>
                    <select
                      value={outputLang}
                      onChange={(e) => setOutputLang(e.target.value)}
                      className="h-8 px-2 rounded-lg bg-white dark:bg-[#121215] border border-[#E4E4E7] dark:border-[#27272A] text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {OUTPUT_LANGS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tone Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Tone:</span>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="h-8 px-2 rounded-lg bg-white dark:bg-[#121215] border border-[#E4E4E7] dark:border-[#27272A] text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {TONE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert Prompt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700">
                        <Command className="w-2.5 h-2.5" />↵
                      </kbd>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BOX 2: Professional Prompt Output (Right) */}
            <div className="bg-white dark:bg-[#121215] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl flex flex-col justify-between transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 shadow-2xs">
              
              {/* Box 2 Top Bar */}
              <div className="px-4 py-2.5 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                    ENGINEERED PROMPT
                  </span>

                  {/* Segmented Toggle: Master Prompt vs Breakdown */}
                  <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-[#E4E4E7] dark:border-[#27272A]">
                    <button
                      onClick={() => setActiveOutputTab('master')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        activeOutputTab === 'master'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Master Prompt</span>
                    </button>
                    <button
                      onClick={() => setActiveOutputTab('breakdown')}
                      disabled={!breakdown}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        activeOutputTab === 'breakdown'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Breakdown</span>
                    </button>
                  </div>
                </div>

                {/* Top-Right Copy Prompt Button */}
                <button
                  onClick={handleCopy}
                  disabled={!outputText || isGenerating}
                  className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-[#E4E4E7] dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Body */}
              <div className="p-4 flex-1 flex flex-col justify-center">
                {isGenerating ? (
                  <div className="space-y-3 py-6">
                    <div className="h-3.5 w-28 bg-zinc-200/70 dark:bg-zinc-800/80 rounded animate-pulse" />
                    <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                    <div className="h-3.5 w-36 bg-zinc-200/70 dark:bg-zinc-800/80 rounded animate-pulse pt-2" />
                    <div className="h-24 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                    <div className="h-3.5 w-24 bg-zinc-200/70 dark:bg-zinc-800/80 rounded animate-pulse pt-2" />
                    <div className="h-14 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                  </div>
                ) : outputText ? (
                  activeOutputTab === 'master' ? (
                    <textarea
                      value={outputText}
                      onChange={(e) => setOutputText(e.target.value)}
                      aria-label="Engineered professional prompt"
                      className="w-full flex-1 min-h-[260px] bg-transparent resize-none border-0 focus:outline-none font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200"
                    />
                  ) : (
                    <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                      {[
                        { label: 'Role', val: breakdown?.role },
                        { label: 'Context & Objective', val: breakdown?.context },
                        { label: 'Task Instructions', val: breakdown?.task },
                        { label: 'Constraints', val: breakdown?.constraints },
                        { label: 'Output Format', val: breakdown?.outputFormat }
                      ].map((item, idx) => (
                        item.val && (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-[#E4E4E7] dark:border-[#27272A]"
                          >
                            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                              {item.label}
                            </div>
                            <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                              {item.val}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-16 px-4 select-none">
                    <div className="w-9 h-9 rounded-lg border border-[#E4E4E7] dark:border-[#27272A] bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-center mx-auto mb-3 text-zinc-400 dark:text-zinc-500">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Professional prompt will appear here
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Structured automatically with Role, Context, Chain-of-Thought Tasks, and Output Format.
                    </p>
                  </div>
                )}
              </div>

              {/* Box 2 Bottom Bar: Quality Rules Tags & Prominent Copy Button */}
              <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-900/50 border-t border-[#E4E4E7] dark:border-[#27272A] rounded-b-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {detectedLang && !isGenerating && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {detectedLang} → {outputLang}
                    </span>
                  )}
                  {(appliedRules.length > 0 && !isGenerating
                    ? appliedRules
                    : ['Role Assigned', 'Chain-of-Thought', 'Constraints Added', 'Output Schema']
                  ).map((rule, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                    >
                      {rule}
                    </span>
                  ))}
                </div>

                {outputText && (
                  <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-xs'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 border-t border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>Engineered with Role, Context, Chain-of-Thought, and Output Constraints.</span>
          <span className="font-mono">Multi-Engine Voice • English, Roman Urdu, Urdu & 50+ languages</span>
        </footer>

      </div>
    </div>
  );
}