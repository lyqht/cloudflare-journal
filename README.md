## Introduction

This project is a **Cloudflare severless worker** with an AI service binding deployed for processing either audio, image or text submitted by users into semantic useful information, especially in the context for _submitting expenses_.

For users that prefer a UI, a simple NextJS web app is created to demonstrate how to upload files and make a POST reques to the Cloudflare worker endpoint.

## How it works

![An image of a green tea bottle is inputted into an "image-to-text" system which describes the bottle and its features. The description is then converted into a structured JSON format with fields like "date," "type," "brand," and "item," most of which are left null except for "type," which is "product," and "item," which is "Green Tea." An audio clip is transcribed by an "audio-to-text" system, with the spoken words "I went to the gym for an hour today. The session cost around 20 dollars." This transcription is then converted into JSON format with fields such as "date," "time," "type," "item," "expenditure," and others, some filled with specific data from the audio input like "type" as "activity," "item" as "gym session," and "expenditure" as 20. A text input reading "2 weeks ago, I went to eat a buffet at Swensens Unlimited at the T2 airport, it's really nice but it costs like $36 per person after GST, and there were 2 of us." is converted directly into a JSON format with details of the dining experience including "date," "time," "type," "item," and "expenditure," among others. The "item" is listed as "Swensens Unlimited," and "expenditure" is doubled to 72, considering two people](./demo/How%20it%20works.png)

## Models used

From [Cloudflare AI Models](https://developers.cloudflare.com/workers-ai/models):

- Image-to-text: [@cf/unum/uform-gen2-qwen-500m](https://developers.cloudflare.com/workers-ai/models/uform-gen2-qwen-500m/)
- Automatic Speech Recognition: [@cf/openai/whisper](https://developers.cloudflare.com/workers-ai/models/whisper/)
- Text Generation: [@hf/thebloke/mistral-7b-instruct-v0.1-awq](https://developers.cloudflare.com/workers-ai/models/mistral-7b-instruct-v0.1/)

## Try out the worker!

The worker is deployed at https://cf-journal.senchatea.workers.dev.

Text input

```bash
curl --location 'https://cf-journal.senchatea.workers.dev?type=text' \
--header 'Content-Type: text/plain' \
--data '2 weeks ago, I went to eat a buffet at Swensens Unlimited at the T2 airport, it'\''s really nice but it costs like $36 per person after GST, and there were 2 of us.'
```

Audio input

```bash
curl --location 'https://cf-journal.senchatea.workers.dev?type=audio' \
--header 'Content-Type: application/octet-stream' \
--header 'Authorization: Bearer pYrzMvsyURxsCUeaQDsa3lSO_tBDQEuiPB3iLEQt' \
--data '@postman-cloud:///1eef4b5b-a64c-4c10-ad4b-5f22c528880b'
```

Image input

```bash
curl --location 'https://cf-journal.senchatea.workers.dev?type=image' \
--header 'Content-Type: application/octet-stream' \
--header 'Authorization: Bearer pYrzMvsyURxsCUeaQDsa3lSO_tBDQEuiPB3iLEQt' \
--data '@postman-cloud:///1eef4b68-e5d7-49e0-a28d-f60b3bd7d70e'
```

## Try it in the web app!

![](./demo/web_demo.gif)

## Resources

These are some resources from Cloudflare that I read up to work on this project.

- [Workers AI LLM Playground](https://playground.ai.cloudflare.com/)
- [Guide on choosing the right
  text generation model](https://developers.cloudflare.com/workers-ai/tutorials/how-to-choose-the-right-text-generation-model/)
