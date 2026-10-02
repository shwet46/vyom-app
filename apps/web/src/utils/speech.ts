import { Language } from '../types';

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  gender: 'male' | 'female';
  tone: string;
  provider: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'shubh',
    name: 'Voice Assistant',
    label: 'Kirana Voice Partner (Bulbul:v3)',
    gender: 'male',
    tone: 'Conversational, energetic & friendly Kirana teammate',
    provider: 'Sarvam AI',
  },
  {
    id: 'meera',
    name: 'Assistant Voice 2',
    label: 'Gentle Voice (Bulbul:v3)',
    gender: 'female',
    tone: 'Formal & gentle announcement tone',
    provider: 'Sarvam AI',
  },
];

// Active voice is configured to bulbul:v3 shubh
export const ACTIVE_VOICE_ID = 'shubh';

let currentAudio: HTMLAudioElement | null = null;

/**
 * Find the optimal browser voice matching the conversational male Indian persona
 */
export function getShubhVoice(lang: Language = 'hinglish'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Direct match for "shubh" in name if available in engine
  const exactShubh = voices.find((v) => v.name.toLowerCase().includes('shubh'));
  if (exactShubh) return exactShubh;

  // 2. Hindi or Indian English male voices
  const maleKeywords = ['male', 'man', 'madhur', 'rishi', 'prabhat', 'mohan', 'karan', 'natural'];
  const indianMaleVoice = voices.find((v) => {
    const isIndian = v.lang.startsWith('hi') || v.lang.startsWith('mr') || v.lang.includes('IN');
    const hasMaleName = maleKeywords.some((keyword) => v.name.toLowerCase().includes(keyword));
    return isIndian && hasMaleName;
  });
  if (indianMaleVoice) return indianMaleVoice;

  // 3. Any Hindi voice
  const hindiVoice = voices.find((v) => v.lang.startsWith('hi') || v.lang.startsWith('hi-IN'));
  if (hindiVoice) return hindiVoice;

  // 4. Any Indian English voice
  const indianVoice = voices.find((v) => v.lang.includes('IN') || v.lang.includes('hi'));
  if (indianVoice) return indianVoice;

  return null;
}

export interface SpeakOptions {
  lang?: Language;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  rate?: number;
  pitch?: number;
}

/**
 * Request real audio stream from Sarvam bulbul:v3 with speaker shubh
 */
export async function playSarvamTtsAudio(
  text: string,
  options: SpeakOptions = {}
): Promise<boolean> {
  try {
    const langCode =
      options.lang === 'hindi'
        ? 'hi-IN'
        : options.lang === 'marathi'
        ? 'mr-IN'
        : options.lang === 'english'
        ? 'en-IN'
        : 'hi-IN';

    const res = await fetch('/api/v1/copilot/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        target_language_code: langCode,
        speaker: 'shubh',
        model: 'bulbul:v3',
        pace: 1.0,
        speech_sample_rate: 22050,
      }),
    });

    if (!res.ok) return false;

    const blob = await res.blob();
    // Validate blob has real audio stream payload (not 44-byte dummy WAV)
    if (blob.size <= 64) return false;

    const audioUrl = URL.createObjectURL(blob);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onplay = () => options.onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options.onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options.onError?.();
    };

    await audio.play();
    return true;
  } catch (err) {
    console.debug('Sarvam TTS API streaming skipped or fell back to speech synthesis:', err);
    return false;
  }
}

/**
 * Speak text using the Sarvam bulbul:v3 voice profile (with instant browser speech fallback)
 */
export function speakWithShubh(text: string, options: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  // First attempt backend Sarvam bulbul:v3 TTS audio stream
  playSarvamTtsAudio(text, options).then((played) => {
    if (played) return;

    // Fallback to browser SpeechSynthesis API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onStart?.();
      setTimeout(() => options.onEnd?.(), 2500);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const chosenVoice = getShubhVoice(options.lang);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      if (options.lang === 'hindi') utterance.lang = 'hi-IN';
      else if (options.lang === 'marathi') utterance.lang = 'mr-IN';
      else if (options.lang === 'english') utterance.lang = 'en-IN';
      else utterance.lang = 'hi-IN';

      // Conversational pace: 1.0 (pace=1)
      utterance.pitch = options.pitch ?? 0.98;
      utterance.rate = options.rate ?? 1.0;

      utterance.onstart = () => {
        options.onStart?.();
      };
      utterance.onend = () => {
        options.onEnd?.();
      };
      utterance.onerror = () => {
        options.onError?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      options.onError?.();
    }
  });

  return null;
}

export function stopSpeech(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
