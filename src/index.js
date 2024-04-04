import { Ai } from './vendor/@cloudflare/ai.js';

export default {
  async fetch(request, env) {
    const audioResponse = await fetch(
      'https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav'
    );
    const blob = await audioResponse.arrayBuffer();

    const ai = new Ai(env.AI);
    const inputs = {
      audio: [...new Uint8Array(blob)]
    };
    const response = await ai.run('@cf/openai/whisper', inputs);

    return Response.json({ inputs, response });
  }
};
