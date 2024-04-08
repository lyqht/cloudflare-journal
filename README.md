## Introduction

This project is a **Cloudflare severless worker** with an AI service binding deployed for processing either audio, image or text submitted by users into semantic useful information, especially in the context for _submitting expenses_.

## How it works

![](./demo/How%20it%20works.png)

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

## Resources

These are some resources from Cloudflare that I read up to work on this project.

- [Workers AI LLM Playground](https://playground.ai.cloudflare.com/)
- [Guide on choosing the right
  text generation model](https://developers.cloudflare.com/workers-ai/tutorials/how-to-choose-the-right-text-generation-model/)
