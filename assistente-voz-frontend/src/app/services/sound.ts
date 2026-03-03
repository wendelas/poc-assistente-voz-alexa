import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Sound {

  playBeep(frequency: number = 880, duration: number = 120) {

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.value = 0.2;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, duration);
  }
}
