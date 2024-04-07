import type { ExecutionContext, Request } from '@cloudflare/workers-types/experimental';
import { fetchImageToTextResult, fetchSpeechToTextResult, fetchTextInterpretationResult, getRequestParam, readRequestBody } from './utils';
// @ts-ignore
import { Ai } from './vendor/@cloudflare/ai.js';

const acceptedTypes = ['audio', 'image', 'text'];


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const typeParam = getRequestParam(request, 'type');

		if (request.method !== 'POST' || typeParam == null || !acceptedTypes.includes(typeParam)) {
			return new Response(`Expected a POST request with a type parameter of "audio" | "image" | "text"`, { status: 400 });
		}

		const ai = new Ai(env.AI);
		if (typeParam === 'audio') {
			const blob = await request.arrayBuffer();

			/* Speech to text */
			const interpretedText = await fetchSpeechToTextResult(ai, blob);
			/* Text to formatted JSON */
			const jsonResult = await fetchTextInterpretationResult(ai, interpretedText);
			return Response.json(jsonResult);
		}
		else if (typeParam === 'image') {
			const blob = await request.arrayBuffer();

			/* Image to text */
			const interpretedText = await fetchImageToTextResult(ai, blob);
			/* Text to formatted JSON */
			const jsonResult = await fetchTextInterpretationResult(ai, interpretedText);
			return Response.json(jsonResult);
		}
		else if (typeParam === 'text') {
			const text = await readRequestBody(request);
			if (text === '') {
				return new Response(`Invalid text given for interpretation`, { status: 400 });
			}
			const jsonResult = await fetchTextInterpretationResult(ai, text);
			return Response.json(jsonResult);
		}
	},
};
