import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WakeWord } from '../../services/wake-word';
import { AutoRecorder } from '../../services/auto-recorder';
import { TranscribeApi } from '../../services/transcribe-api';
import { Sound } from '../../services/sound';
import { CommonModule } from '@angular/common';

type AlbaState =
  | 'idle'
  | 'wake-detected'
  | 'listening-command'
  | 'recording'
  | 'processing'
  | 'speaking';

@Component({
  selector: 'app-alba-listener',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alba-listener.html',
  styleUrls: ['./alba-listener.scss'],
})
export class AlbaListener implements OnDestroy {
  state: AlbaState = 'idle';
  transcript = '';
  audioUrl = '';

  private sub?: Subscription;
  private busy = false;
  private cooldown = false;

  constructor(
    private wake: WakeWord,
    private recorder: AutoRecorder,
    private api: TranscribeApi,
    private sound: Sound,
  ) {}

  ngOnInit() {
    this.wake.start();
    this.listenWake();
  }

  start() {
    console.log('START clicado');
    console.log(
      'SpeechRecognition existe?',
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition,
    );
    this.wake.start();
    this.listenWake();
  }

  stop() {
    this.wake.stop();
    this.sub?.unsubscribe();
    this.state = 'idle';
  }

  private listenWake() {
    this.sub = this.wake.wakeHits$.subscribe(async () => {
      if (this.state !== 'idle') return;

      this.state = 'listening-command';

      this.sound.playBeep(900, 120);

      await this.processCommand();
    });
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.state = 'speaking';

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1;

      utterance.onend = () => {
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }

  private isOnlyWakeWord(text: string): boolean {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return (
      normalized === 'alba' ||
      normalized === 'oi alba' ||
      normalized === 'ei alba' ||
      normalized === 'ola alba'
    );
  }

  private async processCommand() {
    try {
      const audioBlob = await this.recorder.recordUtterance({
        maxMs: 6000,
        silenceMs: 1200,
        silenceThreshold: 0.015,
      });

      this.state = 'processing';

      const result = await this.api.transcribe(audioBlob);

      const text = result.question?.trim() ?? '';

      // Se usuário só falou "alba"
      if (this.isOnlyWakeWord(text)) {
        await this.speak('Oi! Como posso ajudar?');
      } else {
         //await this.speak(`Você disse: ${text}`);
        await this.speak(result.answer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.state = 'idle';
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
