import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TranscribeApi {

  //async transcribe(audio: Blob): Promise<{ text: string }>
  async transcribe(audio: Blob): Promise<{ question: string, answer: string }>  {

    const formData = new FormData();
    formData.append('audio', audio, 'audio.webm');

    const response = await fetch(
      `${environment.apiBaseUrl}/api/transcribe`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao transcrever áudio');
    }

    return response.json();
  }
}