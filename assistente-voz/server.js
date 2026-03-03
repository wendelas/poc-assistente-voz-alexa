import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import fetch from "node-fetch";
import OpenAI, { toFile } from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

let openai;
if (proxyUrl) {
  const agent = new HttpsProxyAgent(proxyUrl);

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: agent,
  });

  console.log("Usando proxy:", proxyUrl);
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("Sem proxy configurado");
}

const openai2 = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("API KEY carregada?", !!process.env.OPENAI_API_KEY);

app.get("/health", (_, res) => res.json({ ok: true }));

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo "audio" é obrigatório' });
    }

    const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
    fs.writeFileSync(tempPath, req.file.buffer);

    // 1️⃣ TRANSCRIÇÃO
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    form.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();
    fs.unlinkSync(tempPath);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const userText = data.text?.trim();

    console.log('Transcrição:', userText);

    // 2️⃣ CHAMADA PARA LLM
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é Alba, uma assistente por voz inteligente e objetiva.'
          },
          {
            role: 'user',
            content: userText
          }
        ],
        temperature: 0.3
      })
    });

    const completionData = await completion.json();

    if (!completion.ok) {
      console.error('Erro LLM:', completionData);
      return res.status(500).json(completionData);
    }

    const answer = completionData.choices[0].message.content;

    console.log('Resposta:', answer);

    res.json({
      question: userText,
      answer
    });

  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).json({
      error: 'Falha ao processar',
      detail: err?.message
    });
  }
});


app.post('/api/transcribe-ok', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo "audio" é obrigatório' });
    }

    const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
    fs.writeFileSync(tempPath, req.file.buffer);

    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    form.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json(); // ← agora declaramos antes de usar

    fs.unlinkSync(tempPath);

    if (!response.ok) {
      console.error('Erro da OpenAI:', data);
      return res.status(response.status).json(data);
    }

    console.log('Transcrição OK:', data);

    res.json({ text: data.text });

  } catch (err) {
    console.error('Erro manual fetch:', err);
    res.status(500).json({
      error: 'Falha ao transcrever',
      detail: err?.message
    });
  }
});


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend on http://localhost:${port}`));
