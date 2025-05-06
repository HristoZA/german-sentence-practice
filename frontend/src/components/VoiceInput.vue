<template>
  <div class="voice-input-container">
    <!-- Recording state UI -->
    <div v-if="isRecording" class="recording-ui">
      <div class="recording-indicator">
        <div class="recording-dot"></div>
        <span>{{ recordingTime }}s</span>
      </div>
      <div class="recording-controls">
        <button class="control-button stop-button" @click="stopRecording">
          <span class="icon">■</span> Stop
        </button>
      </div>
    </div>

    <!-- Review recorded audio UI -->
    <div v-else-if="audioUrl" class="review-ui">
      <div class="audio-player">
        <audio ref="audioPlayer" :src="audioUrl" controls></audio>
      </div>
      <div class="recording-controls">
        <button
          class="control-button submit-button"
          @click="submitRecording"
          :disabled="isTranscribing"
        >
          <span class="icon">✓</span>
          <span v-if="isTranscribing">Transcribing...</span>
          <span v-else>Submit</span>
        </button>
        <button class="control-button retry-button" @click="startNewRecording">
          <span class="icon">↺</span> Record Again
        </button>
        <button class="control-button cancel-button" @click="cancelRecording">
          <span class="icon">✕</span> Cancel
        </button>
      </div>
    </div>

    <!-- Initial recording UI -->
    <div v-else class="start-ui">
      <button class="control-button record-button" @click="startRecording">
        <span class="icon">●</span> Record
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { transcribeAudio } from "../utils/llm.js";

// Props and emits
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["transcription-complete", "cancel"]);

// State variables
const isRecording = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const audioUrl = ref("");
const audioBlob = ref(null);
const recordingStartTime = ref(null);
const recordingTime = ref(0);
const recordingTimer = ref(null);
const audioPlayer = ref(null);
const isTranscribing = ref(false);

// Start recording function
const startRecording = async () => {
  try {
    // Request audio recording with specific constraints for better compatibility
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // Mono audio for better compatibility
        sampleRate: 16000, // 16kHz sample rate
      },
    });

    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus", // Specify codec explicitly
    });
    audioChunks.value = [];

    mediaRecorder.value.addEventListener("dataavailable", (event) => {
      audioChunks.value.push(event.data);
    });

    mediaRecorder.value.addEventListener("stop", () => {
      // Create a blob with explicit type
      audioBlob.value = new Blob(audioChunks.value, {
        type: "audio/webm;codecs=opus",
      });
      audioUrl.value = URL.createObjectURL(audioBlob.value);
      // Don't automatically transcribe - wait for user to click submit
    });

    // Start recording with small timeslices for more frequent dataavailable events
    mediaRecorder.value.start(100);
    isRecording.value = true;
    recordingStartTime.value = Date.now();

    // Start timer
    recordingTimer.value = setInterval(() => {
      recordingTime.value = Math.floor(
        (Date.now() - recordingStartTime.value) / 1000
      );
    }, 1000);
  } catch (error) {
    console.error("Error accessing microphone:", error);
    alert(
      "Could not access microphone. Please ensure you've granted permission."
    );
  }
};

// Stop recording function
const stopRecording = () => {
  if (!mediaRecorder.value || mediaRecorder.value.state !== "recording") return;

  mediaRecorder.value.stop();
  isRecording.value = false;

  // Stop timer
  clearInterval(recordingTimer.value);

  // Stop all audio tracks
  mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
};

// Start a new recording (discard current recording)
const startNewRecording = () => {
  // Clean up resources
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }

  // Reset state
  audioUrl.value = "";
  audioBlob.value = null;

  // Start new recording
  startRecording();
};

// Cancel recording and close voice input
const cancelRecording = () => {
  // Clean up resources
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }

  // Reset state
  audioUrl.value = "";
  audioChunks.value = [];
  audioBlob.value = null;
  isRecording.value = false;

  // Emit cancel event
  emit("cancel");
};

// Transcribe audio and then submit
const submitRecording = async () => {
  if (!audioBlob.value) return;

  isTranscribing.value = true;

  try {
    // Use the utility function for transcription
    const result = await transcribeAudio(audioBlob.value);

    // Send the transcribed text back to parent component
    if (result) {
      emit("transcription-complete", result);
    } else {
      throw new Error("No transcription returned from server");
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
    alert(`Failed to transcribe audio: ${error.message}`);
  } finally {
    isTranscribing.value = false;
  }
};

// Clean up resources when component unmounts
onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
  }

  if (mediaRecorder.value && mediaRecorder.value.state === "recording") {
    mediaRecorder.value.stop();
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
.voice-input-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.recording-dot {
  width: 16px;
  height: 16px;
  background-color: #dc2626; /* Red */
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.recording-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

.control-button .icon {
  margin-right: 6px;
}

.control-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.record-button {
  background-color: #4f46e5; /* Indigo */
  color: white;
}

.record-button:hover {
  background-color: #4338ca; /* Darker indigo */
}

.stop-button {
  background-color: #dc2626; /* Red */
  color: white;
}

.stop-button:hover {
  background-color: #b91c1c; /* Darker red */
}

.submit-button {
  background-color: #16a34a; /* Green */
  color: white;
}

.submit-button:hover {
  background-color: #15803d; /* Darker green */
}

.retry-button {
  background-color: #f59e0b; /* Amber */
  color: white;
}

.retry-button:hover {
  background-color: #d97706; /* Darker amber */
}

.cancel-button {
  background-color: #9ca3af; /* Gray */
  color: white;
}

.cancel-button:hover {
  background-color: #6b7280; /* Darker gray */
}

.audio-player {
  margin: 10px 0;
  width: 100%;
}

.audio-player audio {
  width: 100%;
}

.transcription-text {
  padding: 10px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin: 10px 0;
  font-style: italic;
}

.transcription-text.loading {
  color: #6b7280;
  text-align: center;
}
</style>
