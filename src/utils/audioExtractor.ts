/**
 * Utility to extract clean audio from video/audio files in the browser
 * and convert to 16kHz mono WAV base64 string for Gemini API.
 */

export async function extractAudioFromVideo(
  file: File
): Promise<{ base64Audio: string; mimeType: string }> {
  try {
    // If the file is already an audio file, convert directly to base64
    if (file.type.startsWith('audio/')) {
      const base64 = await fileToBase64(file);
      return {
        base64Audio: base64,
        mimeType: file.type || 'audio/wav',
      };
    }

    // Try decoding audio from video file via Web Audio API
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      try {
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const wavBlob = audioBufferToWav(decodedBuffer);
        const base64 = await blobToBase64(wavBlob);
        await audioCtx.close();
        return {
          base64Audio: base64,
          mimeType: 'audio/wav',
        };
      } catch (decodeErr) {
        console.warn('AudioContext decode failed, falling back to direct video base64:', decodeErr);
        await audioCtx.close().catch(() => {});
      }
    }

    // Fallback: Send video directly as base64 (Gemini 3.8 Flash supports video natively)
    const base64 = await fileToBase64(file);
    return {
      base64Audio: base64,
      mimeType: file.type || 'video/mp4',
    };
  } catch (err) {
    console.error('Failed to extract audio from video:', err);
    // Ultimate fallback
    const base64 = await fileToBase64(file);
    return {
      base64Audio: base64,
      mimeType: file.type || 'video/mp4',
    };
  }
}

/**
 * Converts an AudioBuffer to a 16-bit PCM Mono WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer, targetSampleRate = 16000): Blob {
  const numChannels = 1; // Mono is optimal for speech recognition and Gemini
  const sourceSampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0);

  // Resample to targetSampleRate if needed
  let samples: Float32Array;
  if (sourceSampleRate !== targetSampleRate) {
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(channelData.length / ratio);
    samples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * ratio);
      samples[i] = channelData[sourceIndex] || 0;
    }
  } else {
    samples = channelData;
  }

  // 16-bit PCM WAV has 2 bytes per sample
  const byteRate = targetSampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = samples.length * 2;
  const bufferLength = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier 'RIFF'
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier & file length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type 'WAVE'
  writeString(view, 8, 'WAVE');
  // format chunk identifier 'fmt '
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, targetSampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier 'data'
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
