import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AutoRecorder {

  async recordUtterance(options?: {
    maxMs?: number;
    silenceMs?: number;
    silenceThreshold?: number;
  }): Promise<Blob> {

    const maxMs = options?.maxMs ?? 6000;
    const silenceMs = options?.silenceMs ?? 1200;
    const silenceThreshold = options?.silenceThreshold ?? 0.015;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);

    let lastVoiceTime = Date.now();
    const startTime = Date.now();

    const detectSilence = () => {
      analyser.getFloatTimeDomainData(buffer);

      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }

      const rms = Math.sqrt(sum / buffer.length);
      const now = Date.now();

      if (rms > silenceThreshold) {
        lastVoiceTime = now;
      }

      if (
        now - lastVoiceTime > silenceMs ||
        now - startTime > maxMs
      ) {
        recorder.stop();
        return;
      }

      requestAnimationFrame(detectSilence);
    };

    return new Promise((resolve) => {

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await audioContext.close();

        resolve(new Blob(chunks, { type: 'audio/webm' }));
      };

      recorder.start();
      detectSilence();
    });
  }
}