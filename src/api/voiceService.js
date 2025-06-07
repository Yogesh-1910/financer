let recognition;
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false; // True for continuous listening
  recognition.lang = 'en-US';
  recognition.interimResults = false; // True for live interim results
  recognition.maxAlternatives = 1;
} else {
  console.warn("Speech Recognition not supported by this browser.");
}

export const startListening = () => {
  return new Promise((resolve, reject) => {
    if (!recognition) {
      return reject(new Error("Speech Recognition not supported."));
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
      stopListeningInternal(); // Stop after getting a result for this simple case
    };

    recognition.onerror = (event) => {
      reject(event.error);
      stopListeningInternal();
    };
    
    recognition.onend = () => {
      // Can be used to auto-restart if continuous is true
      // For now, just signals recognition has stopped
    };

    try {
        recognition.start();
    } catch (e) {
        // Handle cases where it might already be started or other issues
        console.error("Error starting recognition:", e);
        reject(new Error("Could not start voice recognition. It might already be active or an issue occurred."));
    }
  });
};

// Internal stop to avoid issues if called externally when not active
const stopListeningInternal = () => {
  if (recognition) {
    try {
        recognition.stop();
    } catch (e) {
        // console.warn("Error stopping recognition, might not be active:", e);
    }
  }
};

// Call this if you want an explicit stop button
export const stopListening = () => {
    stopListeningInternal();
};

export const speakText = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: configure voice, pitch, rate
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices[0]; // Choose a voice
    // utterance.pitch = 1;
    // utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech Synthesis not supported by this browser.");
  }
};