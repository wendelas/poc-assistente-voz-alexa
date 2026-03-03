import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WakeWord {

  private recognition: any;
  private listening = false;

  private wakeSubject = new Subject<string>();
  wakeHits$ = this.wakeSubject.asObservable();

  constructor(private zone: NgZone) {}

  start() {
    if (this.listening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Web Speech API não suportada (use Chrome).');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = Array.from(last)
        .map((r: any) => r.transcript)
        .join(' ')
        .trim()
        .toLowerCase();
        console.log('Ouvi:', transcript);

      if (this.isWakeWord(transcript)) {
        console.log('WAKE DETECTADO!');
        this.zone.run(() => {
          this.wakeSubject.next(transcript);
        });
      }
    };

    this.recognition.onend = () => {
      if (this.listening) {
        try { this.recognition.start(); } catch {}
      }
    };

    this.recognition.start();
    this.listening = true;
  }

  stop() {
    this.listening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
  }

  private isWakeWord(text: string): boolean {
    const normalized = text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return (
      normalized.includes('alba') ||
      normalized.includes('oi alba') ||
      normalized.includes('ei alba') ||
      normalized.includes('ola alba')
    );
  }
}