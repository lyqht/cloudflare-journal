import type { Request } from '@cloudflare/workers-types/experimental';

/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
export async function readRequestBody(request: Request) {
	const contentType = request.headers.get('content-type');

	if (contentType == null) {
		return '';
	}

	if (contentType.includes('application/json')) {
		return JSON.stringify(await request.json());
	} else if (contentType.includes('application/text') || contentType.includes('text/html') || contentType.includes('text/plain')) {
		return request.text();
	} else if (contentType.includes('form')) {
		const formData = await request.formData();
		const body: Record<string, string> = {};
		for (const entry of formData.entries()) {
			body[entry[0]] = entry[1].toString();
		}
		return JSON.stringify(body);
	}
	return ''
}

/**
 * Retrieves the value of a specified parameter from the provided request.
 *
 * @param request - The incoming request object.
 * @param property - The name of the parameter to retrieve.
 * @returns The value of the specified parameter, or `undefined` if the parameter is not present.
 */
export const getRequestParam = (request: Request, property: string) => {
	const { searchParams } = new URL(request.url);
	return searchParams.get(property);
}

/**
 * Fetches the result of running a text through a image-to-text model.
 *
 * @param ai - The AI instance to use for the operation.
 * @param blob - The image data as an ArrayBufferLike.
 * @returns A Promise that resolves to the text result of the AI operation.
 */
export const fetchImageToTextResult = async (ai: any, blob: ArrayBufferLike): Promise<string> => {
	const imageToTextInput = {
		image: [...new Uint8Array(blob)],
	};

	const imageToTextResponse = await ai.run('@cf/unum/uform-gen2-qwen-500m', imageToTextInput);
	return imageToTextResponse.description as string
}

/**
 * Fetches the result of running an audio file through a speech-to-text model.
 *
 * @param ai - The AI service instance.
 * @param blob - The audio data to be processed.
 * @returns A promise that resolves to the speech-to-text result as a string.
 */
export const fetchSpeechToTextResult = async (ai: any, blob: ArrayBufferLike): Promise<string> => {
	const speechToTextInput = {
		audio: [...new Uint8Array(blob)],
	};

	const speechToTextResponse = await ai.run('@cf/openai/whisper', speechToTextInput);
	const interpretedText = speechToTextResponse.text as string;
	return interpretedText
}

const TEXT_GENERATION_MODEL_PROMPT = `
	You are an AI that strictly conforms to responses in JSON formatted strings.
	Your responses consist of valid JSON syntax, with no other comments, explainations, reasoning, or dialogue not consisting of valid JSON.
	You will be given a text, which you need to infer the following fields:
	1. 'date' in the 'YYYY-MM-DD' format,
	2. 'time' in the 'HH:MM' format,
	3. 'type' which should either be "activity" or "product",
	4. 'item', the name of the product or activity mentioned in the text,
	5. 'expenditure', the cost of the item.
	6. If the type is "activity", try to infer the field 'duration' for how long the activity went on, and also the fields for 'startDate', 'endDate' and the 'company'.
	7. If the type is "product", try to infer the fields 'manufactureDate', 'expiryDate' and 'brand'.
	If you cannot interpret the text for any of these fields, return the field with a null value in the JSON.
`

const sanitizedTextGenerationModelPrompt = TEXT_GENERATION_MODEL_PROMPT.replace(/\n/g, '');

/**
 * Fetches the result of running a text through a text generation model.
 * @description This is used to interpret useful information from text returned from other models.
 *
 * @param ai - The AI service instance.
 * @param textToBeInterpreted - The text to be interpreted.
 * @returns A promise that resolves to the interpreted text as a string.
 */
export const fetchTextInterpretationResult = async (ai: any, textToBeInterpreted: string): Promise<string> => {
	const textAnalysisInput = {
		messages: [
			{
				role: 'system',
				content: `${sanitizedTextGenerationModelPrompt}. Note that today is ${new Date().toDateString()} and now is ${new Date().toTimeString()}.`,
			},
			{
				role: 'user',
				content: textToBeInterpreted,
			},
		],
	};
	const textAnalysisResponse = await ai.run('@hf/thebloke/mistral-7b-instruct-v0.1-awq', textAnalysisInput);
	const jsonResult = JSON.parse(textAnalysisResponse.response);
	return jsonResult
}
