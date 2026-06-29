// Retro cybernetic voice engine

let isVoiceMuted = false;

export function toggleVoiceMute() {
  isVoiceMuted = !isVoiceMuted;
  if (isVoiceMuted && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  return isVoiceMuted;
}

export function getVoiceMutedState() {
  return isVoiceMuted;
}

export function speakRetro(text: string) {
  if (isVoiceMuted || !window.speechSynthesis) return;

  // Cancel current speech
  window.speechSynthesis.cancel();

  // Clean text from excessive symbols
  const cleanText = text.replace(/[_*#`[\]]/g, " ");

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Try to find a robotic/monotone sounding voice (like Google UK English Male, Microsoft David, or some generic synth)
  const voices = window.speechSynthesis.getVoices();
  const retroVoice = voices.find(v => 
    v.name.includes("Google US English") || 
    v.name.includes("Male") || 
    v.name.includes("Robot") || 
    v.lang.startsWith("en")
  );

  if (retroVoice) {
    utterance.voice = retroVoice;
  }

  // Cryptic retro robotic modulation settings
  utterance.rate = 0.88; // Slow pace
  utterance.pitch = 0.65; // Deep or hollow drone
  utterance.volume = 0.9;

  window.speechSynthesis.speak(utterance);
}
