// @ts-ignore
import { Ai } from './vendor/@cloudflare/ai.js';
import type { Request, ExecutionContext } from '@cloudflare/workers-types/experimental';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Check if the incoming request has a body
		if (request.method !== 'POST') {
			return new Response('Expected a POST request with audio file', { status: 400 });
		}

		/* Speech to text */
		// Read the request body as an ArrayBuffer
		const blob = await request.arrayBuffer();
		const ai = new Ai(env.AI);
		const speechToTextInput = {
			audio: [...new Uint8Array(blob)],
		};

		const speechToTextResponse = await ai.run('@cf/openai/whisper', speechToTextInput);
		const interpretedText = speechToTextResponse.text;

		/* Text analysis */
		const textAnalysisInput = {
			messages: [
				{
					role: 'system',
					content:
						"You are an AI that strictly conforms to responses in JSON formatted strings. Your responses consist of valid JSON syntax, with no other comments, explainations, reasoninng, or dialogue not consisting of valid JSON.You will be given a text to create JSON of this format [{'date': 'YYYY-MM-DD', 'activity': 'name of activity', 'expenditure': 'cost' }, ...]. Only return the JSON response without any description",
				},
				{
					role: 'user',
					content: interpretedText,
				},
			],
		};
		const textAnalysisResponse = await ai.run('@cf/meta/llama-2-7b-chat-int8', textAnalysisInput)
		const jsonResult = JSON.parse(textAnalysisResponse.response);

		return Response.json(jsonResult);
	},
};
