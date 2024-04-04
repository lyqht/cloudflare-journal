/* eslint-disable */
// ../worker-constellation-entry/src/ai/tensor.ts
var TypedArrayProto = Object.getPrototypeOf(Uint8Array);
function isArray(value) {
  return Array.isArray(value) || value instanceof TypedArrayProto;
}
function arrLength(obj) {
  return obj instanceof TypedArrayProto
    ? obj.length
    : obj
        .flat(Infinity)
        .reduce(
          (acc, cur) => acc + (cur instanceof TypedArrayProto ? cur.length : 1),
          0
        );
}
function ensureShape(shape, value) {
  if (shape.length === 0 && !isArray(value)) {
    return;
  }
  const count = shape.reduce((acc, v) => {
    if (!Number.isInteger(v)) {
      throw new Error(
        `expected shape to be array-like of integers but found non-integer element "${v}"`
      );
    }
    return acc * v;
  }, 1);
  if (count != arrLength(value)) {
    throw new Error(
      `invalid shape: expected ${count} elements for shape ${shape} but value array has length ${value.length}`
    );
  }
}
function ensureType(type, value) {
  if (isArray(value)) {
    value.forEach(v => ensureType(type, v));
    return;
  }
  switch (type) {
    case 'bool' /* Bool */: {
      if (typeof value === 'boolean') {
        return;
      }
      break;
    }
    case 'float16' /* Float16 */:
    case 'float32' /* Float32 */: {
      if (typeof value === 'number') {
        return;
      }
      break;
    }
    case 'int8' /* Int8 */:
    case 'uint8' /* Uint8 */:
    case 'int16' /* Int16 */:
    case 'uint16' /* Uint16 */:
    case 'int32' /* Int32 */:
    case 'uint32' /* Uint32 */: {
      if (Number.isInteger(value)) {
        return;
      }
      break;
    }
    case 'int64' /* Int64 */:
    case 'uint64' /* Uint64 */: {
      if (typeof value === 'bigint') {
        return;
      }
      break;
    }
    case 'str' /* String */: {
      if (typeof value === 'string') {
        return;
      }
      break;
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
function serializeType(type, value) {
  if (isArray(value)) {
    return [...value].map(v => serializeType(type, v));
  }
  switch (type) {
    case 'str' /* String */:
    case 'bool' /* Bool */:
    case 'float16' /* Float16 */:
    case 'float32' /* Float32 */:
    case 'int8' /* Int8 */:
    case 'uint8' /* Uint8 */:
    case 'int16' /* Int16 */:
    case 'uint16' /* Uint16 */:
    case 'uint32' /* Uint32 */:
    case 'int32' /* Int32 */: {
      return value;
    }
    case 'int64' /* Int64 */:
    case 'uint64' /* Uint64 */: {
      return value.toString();
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
function deserializeType(type, value) {
  if (isArray(value)) {
    return value.map(v => deserializeType(type, v));
  }
  switch (type) {
    case 'str' /* String */:
    case 'bool' /* Bool */:
    case 'float16' /* Float16 */:
    case 'float32' /* Float32 */:
    case 'int8' /* Int8 */:
    case 'uint8' /* Uint8 */:
    case 'int16' /* Int16 */:
    case 'uint16' /* Uint16 */:
    case 'uint32' /* Uint32 */:
    case 'int32' /* Int32 */: {
      return value;
    }
    case 'int64' /* Int64 */:
    case 'uint64' /* Uint64 */: {
      return BigInt(value);
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
var Tensor = class _Tensor {
  type;
  value;
  name;
  shape;
  constructor(type, value, opts = {}) {
    this.type = type;
    this.value = value;
    ensureType(type, this.value);
    if (opts.shape === void 0) {
      if (isArray(this.value)) {
        this.shape = [arrLength(value)];
      } else {
        this.shape = [];
      }
    } else {
      this.shape = opts.shape;
    }
    ensureShape(this.shape, this.value);
    this.name = opts.name || null;
  }
  static fromJSON(obj) {
    const { type, shape, value, b64Value, name } = obj;
    const opts = { shape, name };
    if (b64Value !== void 0) {
      const value2 = b64ToArray(b64Value, type)[0];
      return new _Tensor(type, value2, opts);
    } else {
      return new _Tensor(type, deserializeType(type, value), opts);
    }
  }
  toJSON() {
    return {
      type: this.type,
      shape: this.shape,
      name: this.name,
      value: serializeType(this.type, this.value)
    };
  }
};
function b64ToArray(base64, type) {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const arrBuffer = new DataView(bytes.buffer).buffer;
  switch (type) {
    case 'float32':
      return new Float32Array(arrBuffer);
    case 'float64':
      return new Float64Array(arrBuffer);
    case 'int32':
      return new Int32Array(arrBuffer);
    case 'int64':
      return new BigInt64Array(arrBuffer);
    default:
      throw Error(`invalid data type for base64 input: ${type}`);
  }
}

// ../worker-constellation-entry/src/ai/templates.ts
var tgTemplates = {
  // ex: https://huggingface.co/TheBloke/deepseek-coder-6.7B-base-AWQ
  bare: {
    system: {
      flag: 2 /* ABSORB_ROLE */
    },
    user: {
      flag: 3 /* APPEND_LAST_SYSTEM */
    },
    assistant: {
      pre: ' ',
      post: ' '
    }
  },
  //
  sqlcoder: {
    system: {
      flag: 2 /* ABSORB_ROLE */
    },
    user: {
      flag: 2 /* ABSORB_ROLE */
    },
    assistant: {
      flag: 2 /* ABSORB_ROLE */
    },
    global: {
      template:
        '### Task\nGenerate a SQL query to answer [QUESTION]{user}[/QUESTION]\n\n### Database Schema\nThe query will run on a database with the following schema:\n{system}\n\n### Answer\nGiven the database schema, here is the SQL query that [QUESTION]{user}[/QUESTION]\n[SQL]'
    }
  },
  // ex: https://huggingface.co/TheBloke/LlamaGuard-7B-AWQ
  inst: {
    system: {
      flag: 2 /* ABSORB_ROLE */
    },
    user: {
      pre: '[INST] ',
      post: ' [/INST]',
      flag: 3 /* APPEND_LAST_SYSTEM */
    },
    assistant: {
      pre: ' ',
      post: ' '
    }
  },
  // https://github.com/facebookresearch/llama/blob/main/llama/generation.py#L340-L361
  // https://replicate.com/blog/how-to-prompt-llama
  // https://huggingface.co/TheBloke/Llama-2-13B-chat-AWQ#prompt-template-llama-2-chat
  llama2: {
    system: {
      pre: '[INST] <<SYS>>\n',
      post: '\n<</SYS>>\n\n'
    },
    user: {
      pre: '<s>[INST] ',
      post: ' [/INST]',
      flag: 1 /* CARRY_SYSTEM_INST */
    },
    assistant: {
      pre: ' ',
      post: '</s>'
    }
  },
  // https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-AWQ
  deepseek: {
    system: {
      post: '\n'
    },
    user: {
      pre: '### Instruction:\n',
      post: '\n'
    },
    assistant: {
      pre: '### Response:\n',
      post: '\n'
    },
    global: {
      post: '### Response:\n'
    }
  },
  // https://huggingface.co/TheBloke/Falcon-7B-Instruct-GPTQ
  falcon: {
    system: {
      post: '\n'
    },
    user: {
      pre: 'User: ',
      post: '\n'
    },
    assistant: {
      pre: 'Assistant: ',
      post: '\n'
    },
    global: {
      post: 'Assistant: \n'
    }
  },
  // https://huggingface.co/TheBloke/openchat_3.5-AWQ#prompt-template-openchat
  openchat: {
    system: {
      flag: 2 /* ABSORB_ROLE */
    },
    user: {
      pre: 'GPT4 User: ',
      post: '<|end_of_turn|>',
      flag: 3 /* APPEND_LAST_SYSTEM */
    },
    assistant: {
      pre: 'GPT4 Assistant: ',
      post: '<|end_of_turn|>'
    },
    global: {
      post: 'GPT4 Assistant:'
    }
  },
  // https://huggingface.co/openchat/openchat#conversation-template
  'openchat-alt': {
    system: {
      flag: 2 /* ABSORB_ROLE */
    },
    user: {
      pre: '<s>Human: ',
      post: '<|end_of_turn|>',
      flag: 3 /* APPEND_LAST_SYSTEM */
    },
    assistant: {
      pre: 'Assistant: ',
      post: '<|end_of_turn|>'
    },
    global: {
      post: 'Assistant: '
    }
  },
  // https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0
  tinyllama: {
    system: {
      pre: '<|system|>\n',
      post: '</s>\n'
    },
    user: {
      pre: '<|user|>\n',
      post: '</s>\n'
    },
    assistant: {
      pre: '<|assistant|>\n',
      post: '</s>\n'
    },
    global: {
      post: '<|assistant|>\n'
    }
  },
  // https://huggingface.co/TheBloke/OpenHermes-2.5-Mistral-7B-AWQ#prompt-template-chatml
  // https://huggingface.co/TheBloke/Orca-2-13B-AWQ#prompt-template-chatml
  chatml: {
    system: {
      pre: '<|im_start|>system\n',
      post: '<|im_end|>\n'
    },
    user: {
      pre: '<|im_start|>user\n',
      post: '<|im_end|>\n'
    },
    assistant: {
      pre: '<|im_start|>assistant\n',
      post: '<|im_end|>\n'
    },
    global: {
      post: '<|im_start|>assistant\n'
    }
  },
  // https://huggingface.co/TheBloke/neural-chat-7B-v3-1-AWQ#prompt-template-orca-hashes
  'orca-hashes': {
    system: {
      pre: '### System:\n',
      post: '\n\n'
    },
    user: {
      pre: '### User:\n',
      post: '\n\n'
    },
    assistant: {
      pre: '### Assistant:\n',
      post: '\n\n'
    },
    global: {
      post: '### Assistant:\n\n'
    }
  },
  // https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-AWQ#prompt-template-codellama
  'codellama-instruct': {
    system: {
      pre: '[INST] ',
      post: '\n'
    },
    user: {
      pre: '[INST] ',
      post: ' [/INST]\n',
      flag: 1 /* CARRY_SYSTEM_INST */
    },
    assistant: {
      post: '\n'
    }
  },
  // https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-AWQ#prompt-template-mistral
  'mistral-instruct': {
    system: {
      pre: '<s>[INST] ',
      post: ' '
    },
    user: {
      pre: '[INST] ',
      post: ' [/INST]',
      flag: 1 /* CARRY_SYSTEM_INST */
    },
    assistant: {
      pre: ' ',
      post: '</s>'
    }
  },
  // https://huggingface.co/TheBloke/zephyr-7B-beta-AWQ#prompt-template-zephyr
  // https://huggingface.co/HuggingFaceH4/zephyr-7b-alpha
  zephyr: {
    system: {
      pre: '<s><|system|>\n',
      post: '</s>\n'
    },
    user: {
      pre: '<|user|>\n',
      post: '</s>\n'
    },
    assistant: {
      pre: '<|assistant|>\n',
      post: '</s>\n'
    },
    global: {
      post: '<|assistant|>\n'
    }
  }
};
var generateTgTemplate = (messages, template) => {
  let prompt = '';
  const state = {
    lastSystem: false,
    systemCount: 0,
    lastUser: false,
    userCount: 0,
    lastAssistant: false,
    assistantCount: 0
  };
  for (const message of messages) {
    switch (message.role) {
      case 'system':
        state.systemCount++;
        state.lastSystem = message.content;
        prompt += applyRole(template, message.role, message.content, state);
        break;
      case 'user':
        state.userCount++;
        state.lastUser = message.content;
        prompt += applyRole(template, message.role, message.content, state);
        break;
      case 'assistant':
        state.assistantCount++;
        state.lastAssistant = message.content;
        prompt += applyRole(template, message.role, message.content, state);
        break;
    }
  }
  prompt = applyRole(template, 'global', prompt, state);
  return prompt;
};
var applyTag = (template, role, type, state) => {
  if (
    type == 'pre' &&
    tgTemplates[template][role].flag == 1 /* CARRY_SYSTEM_INST */ &&
    state.systemCount == 1 &&
    state.userCount == 1
  ) {
    return '';
  }
  return tgTemplates[template][role][type] || '';
};
var applyRole = (template, role, content, state) => {
  if (tgTemplates[template] && tgTemplates[template][role]) {
    if (tgTemplates[template][role].flag == 2 /* ABSORB_ROLE */) return '';
    if (
      tgTemplates[template][role].flag == 3 /* APPEND_LAST_SYSTEM */ &&
      state.lastSystem &&
      state.userCount == 1
    ) {
      content = `${state.lastSystem}${
        [':', '.', '!', '?'].indexOf(state.lastSystem.slice(-1)) == -1
          ? ':'
          : ''
      } ${content}`;
    }
    if (tgTemplates[template][role].template) {
      return tgTemplates[template][role].template
        .replaceAll('{user}', state.lastUser)
        .replaceAll('{system}', state.lastSystem)
        .replaceAll('{assistant}', state.lastAssistant);
    }
    return (
      applyTag(template, role, 'pre', state) +
      (content || '') +
      applyTag(template, role, 'post', state)
    );
  }
  return content || '';
};

// ../worker-constellation-entry/src/ai/tasks/text-generation.ts
var AiTextGeneration = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      oneOf: [
        {
          properties: {
            prompt: {
              type: 'string',
              maxLength: 4096
            },
            raw: {
              type: 'boolean',
              default: false
            },
            stream: {
              type: 'boolean',
              default: false
            },
            max_tokens: {
              type: 'integer',
              default: 256
            }
          },
          required: ['prompt']
        },
        {
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string'
                  },
                  content: {
                    type: 'string',
                    maxLength: 4096
                  }
                },
                required: ['role', 'content']
              }
            },
            stream: {
              type: 'boolean',
              default: false
            },
            max_tokens: {
              type: 'integer',
              default: 256
            }
          },
          required: ['messages']
        }
      ]
    },
    output: {
      oneOf: [
        {
          type: 'object',
          contentType: 'application/json',
          properties: {
            response: {
              type: 'string'
            }
          }
        },
        {
          type: 'string',
          contentType: 'text/event-stream',
          format: 'binary'
        }
      ]
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2 || {
      experimental: true,
      inputsDefaultsStream: {
        max_tokens: 512
      },
      inputsDefaults: {
        max_tokens: 256
      },
      preProcessingArgs: {
        promptTemplate: 'inst',
        defaultContext: ''
      }
    };
  }
  preProcessing() {
    if (this.inputs.stream && this.modelSettings.inputsDefaultsStream) {
      this.inputs = {
        ...this.modelSettings.inputsDefaultsStream,
        ...this.inputs
      };
    } else if (this.modelSettings.inputsDefaults) {
      this.inputs = { ...this.modelSettings.inputsDefaults, ...this.inputs };
    }
    let prompt = '';
    if (this.inputs.messages === void 0) {
      if (this.inputs.raw == true) {
        prompt = this.inputs.prompt;
      } else {
        prompt = generateTgTemplate(
          [
            {
              role: 'system',
              content: this.modelSettings.preProcessingArgs.defaultContext
            },
            { role: 'user', content: this.inputs.prompt }
          ],
          this.modelSettings.preProcessingArgs.promptTemplate
        );
      }
    } else {
      prompt = generateTgTemplate(
        this.inputs.messages,
        this.modelSettings.preProcessingArgs.promptTemplate
      );
    }
    this.preProcessedInputs = {
      prompt,
      max_tokens: this.inputs.max_tokens,
      stream: this.inputs.stream ? true : false
    };
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('str' /* String */, [preProcessedInputs.prompt], {
          shape: [1],
          name: 'INPUT_0'
        }),
        new Tensor('uint32' /* Uint32 */, [preProcessedInputs.max_tokens], {
          // sequence length
          shape: [1],
          name: 'INPUT_1'
        })
      ];
    }
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = {
        response: this.modelSettings.postProcessingFunc(
          response,
          this.preProcessedInputs
        )
      };
    } else {
      this.postProcessedOutputs = { response: response.name.value[0] };
    }
  }
  postProcessingStream(response, inclen) {
    if (this.modelSettings.postProcessingFuncStream) {
      return {
        response: this.modelSettings.postProcessingFuncStream(
          response,
          this.preProcessedInputs,
          inclen
        )
      };
    } else {
      return { response: response.name.value[0] };
    }
  }
};

// ../worker-constellation-entry/src/ai/tasks/text-classification.ts
var AiTextClassification = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        text: {
          type: 'string'
        }
      },
      required: ['text']
    },
    output: {
      type: 'array',
      contentType: 'application/json',
      items: {
        type: 'object',
        properties: {
          score: {
            type: 'number'
          },
          label: {
            type: 'string'
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('str' /* String */, [preProcessedInputs.text], {
          shape: [1],
          name: 'input_text'
        })
      ];
    }
  }
  postProcessing(response) {
    this.postProcessedOutputs = [
      {
        label: 'NEGATIVE',
        score: response.logits.value[0][0]
      },
      {
        label: 'POSITIVE',
        score: response.logits.value[0][1]
      }
    ];
  }
};

// ../worker-constellation-entry/src/ai/tasks/text-embeddings.ts
var AiTextEmbeddings = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        text: {
          oneOf: [
            { type: 'string' },
            {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 100
            }
          ]
        }
      },
      required: ['text']
    },
    output: {
      type: 'object',
      contentType: 'application/json',
      properties: {
        shape: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        data: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'number'
            }
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor(
          'str' /* String */,
          Array.isArray(preProcessedInputs.text)
            ? preProcessedInputs.text
            : [preProcessedInputs.text],
          {
            shape: [
              Array.isArray(preProcessedInputs.text)
                ? preProcessedInputs.text.length
                : [preProcessedInputs.text].length
            ],
            name: 'input_text'
          }
        )
      ];
    }
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = this.modelSettings.postProcessingFunc(
        response,
        this.preProcessedInputs
      );
    } else {
      this.postProcessedOutputs = {
        shape: response.embeddings.shape,
        data: response.embeddings.value
      };
    }
  }
};

// ../worker-constellation-entry/src/ai/tasks/translation.ts
var AiTranslation = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        text: {
          type: 'string'
        },
        source_lang: {
          type: 'string',
          default: 'en'
        },
        target_lang: {
          type: 'string'
        }
      },
      required: ['text', 'target_lang']
    },
    output: {
      type: 'object',
      contentType: 'application/json',
      properties: {
        translated_text: {
          type: 'string'
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('str' /* String */, [preProcessedInputs.text], {
          shape: [1, 1],
          name: 'text'
        }),
        new Tensor(
          'str' /* String */,
          [preProcessedInputs.source_lang || 'en'],
          {
            shape: [1, 1],
            name: 'source_lang'
          }
        ),
        new Tensor('str' /* String */, [preProcessedInputs.target_lang], {
          shape: [1, 1],
          name: 'target_lang'
        })
      ];
    }
  }
  postProcessing(response) {
    this.postProcessedOutputs = { translated_text: response.name.value[0] };
  }
};

// ../worker-constellation-entry/src/ai/tasks/speech-recognition.ts
var AiSpeechRecognition = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      oneOf: [
        { type: 'string', format: 'binary' },
        {
          type: 'object',
          properties: {
            audio: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      ]
    },
    output: {
      type: 'object',
      contentType: 'application/json',
      properties: {
        text: {
          type: 'string'
        },
        word_count: {
          type: 'number'
        },
        words: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: {
                type: 'string'
              },
              start: {
                type: 'number'
              },
              end: {
                type: 'number'
              }
            }
          }
        }
      },
      required: ['text']
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('uint8' /* Uint8 */, preProcessedInputs.audio, {
          shape: [1, preProcessedInputs.audio.length],
          name: 'audio'
        })
      ];
    }
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = this.modelSettings.postProcessingFunc(
        response,
        this.preProcessedInputs
      );
    } else {
      this.postProcessedOutputs = { text: response.name.value[0].trim() };
    }
  }
};

// ../worker-constellation-entry/src/ai/tasks/data/labels.ts
var resnetLabels = [
  'TENCH',
  'GOLDFISH',
  'WHITE SHARK',
  'TIGER SHARK',
  'HAMMERHEAD SHARK',
  'ELECTRIC RAY',
  'STINGRAY',
  'ROOSTER',
  'HEN',
  'OSTRICH',
  'BRAMBLING',
  'GOLDFINCH',
  'HOUSE FINCH',
  'SNOWBIRD',
  'INDIGO FINCH',
  'ROBIN',
  'BULBUL',
  'JAY',
  'MAGPIE',
  'CHICKADEE',
  'WATER OUZEL',
  'KITE',
  'BALD EAGLE',
  'VULTURE',
  'GREAT GREY OWL',
  'FIRE SALAMANDER',
  'NEWT',
  'EFT',
  'SPOTTED SALAMANDER',
  'AXOLOTL',
  'BULL FROG',
  'TREE FROG',
  'TAILED FROG',
  'LOGGERHEAD',
  'LEATHERBACK TURTLE',
  'MUD TURTLE',
  'TERRAPIN',
  'BOX TURTLE',
  'BANDED GECKO',
  'COMMON IGUANA',
  'AMERICAN CHAMELEON',
  'WHIPTAIL',
  'AGAMA',
  'FRILLED LIZARD',
  'ALLIGATOR LIZARD',
  'GILA MONSTER',
  'GREEN LIZARD',
  'AFRICAN CHAMELEON',
  'KOMODO DRAGON',
  'AFRICAN CROCODILE',
  'AMERICAN ALLIGATOR',
  'TRICERATOPS',
  'THUNDER SNAKE',
  'RINGNECK SNAKE',
  'HOGNOSE SNAKE',
  'GREEN SNAKE',
  'KING SNAKE',
  'GARTER SNAKE',
  'WATER SNAKE',
  'VINE SNAKE',
  'NIGHT SNAKE',
  'BOA',
  'ROCK PYTHON',
  'COBRA',
  'GREEN MAMBA',
  'SEA SNAKE',
  'HORNED VIPER',
  'DIAMONDBACK',
  'SIDEWINDER',
  'TRILOBITE',
  'HARVESTMAN',
  'SCORPION',
  'GARDEN SPIDER',
  'BARN SPIDER',
  'GARDEN SPIDER',
  'BLACK WIDOW',
  'TARANTULA',
  'WOLF SPIDER',
  'TICK',
  'CENTIPEDE',
  'GROUSE',
  'PTARMIGAN',
  'RUFFED GROUSE',
  'PRAIRIE CHICKEN',
  'PEACOCK',
  'QUAIL',
  'PARTRIDGE',
  'AFRICAN GREY',
  'MACAW',
  'COCKATOO',
  'LORIKEET',
  'COUCAL',
  'BEE EATER',
  'HORNBILL',
  'HUMMINGBIRD',
  'JACAMAR',
  'TOUCAN',
  'DRAKE',
  'MERGANSER',
  'GOOSE',
  'BLACK SWAN',
  'TUSKER',
  'ECHIDNA',
  'PLATYPUS',
  'WALLABY',
  'KOALA',
  'WOMBAT',
  'JELLYFISH',
  'SEA ANEMONE',
  'BRAIN CORAL',
  'FLATWORM',
  'NEMATODE',
  'CONCH',
  'SNAIL',
  'SLUG',
  'SEA SLUG',
  'CHITON',
  'CHAMBERED NAUTILUS',
  'DUNGENESS CRAB',
  'ROCK CRAB',
  'FIDDLER CRAB',
  'KING CRAB',
  'AMERICAN LOBSTER',
  'SPINY LOBSTER',
  'CRAYFISH',
  'HERMIT CRAB',
  'ISOPOD',
  'WHITE STORK',
  'BLACK STORK',
  'SPOONBILL',
  'FLAMINGO',
  'LITTLE BLUE HERON',
  'AMERICAN EGRET',
  'BITTERN',
  'CRANE',
  'LIMPKIN',
  'EUROPEAN GALLINULE',
  'AMERICAN COOT',
  'BUSTARD',
  'RUDDY TURNSTONE',
  'RED-BACKED SANDPIPER',
  'REDSHANK',
  'DOWITCHER',
  'OYSTERCATCHER',
  'PELICAN',
  'KING PENGUIN',
  'ALBATROSS',
  'GREY WHALE',
  'KILLER WHALE',
  'DUGONG',
  'SEA LION',
  'CHIHUAHUA',
  'JAPANESE SPANIEL',
  'MALTESE DOG',
  'PEKINESE',
  'SHIH-TZU',
  'BLENHEIM SPANIEL',
  'PAPILLON',
  'TOY TERRIER',
  'RHODESIAN RIDGEBACK',
  'AFGHAN HOUND',
  'BASSET',
  'BEAGLE',
  'BLOODHOUND',
  'BLUETICK',
  'COONHOUND',
  'WALKER HOUND',
  'ENGLISH FOXHOUND',
  'REDBONE',
  'BORZOI',
  'IRISH WOLFHOUND',
  'ITALIAN GREYHOUND',
  'WHIPPET',
  'IBIZAN HOUND',
  'NORWEGIAN ELKHOUND',
  'OTTERHOUND',
  'SALUKI',
  'SCOTTISH DEERHOUND',
  'WEIMARANER',
  'STAFFORDSHIRE BULLTERRIER',
  'STAFFORDSHIRE TERRIER',
  'BEDLINGTON TERRIER',
  'BORDER TERRIER',
  'KERRY BLUE TERRIER',
  'IRISH TERRIER',
  'NORFOLK TERRIER',
  'NORWICH TERRIER',
  'YORKSHIRE TERRIER',
  'WIRE-HAIRED FOX TERRIER',
  'LAKELAND TERRIER',
  'SEALYHAM TERRIER',
  'AIREDALE',
  'CAIRN',
  'AUSTRALIAN TERRIER',
  'DANDIE DINMONT',
  'BOSTON BULL',
  'MINIATURE SCHNAUZER',
  'GIANT SCHNAUZER',
  'STANDARD SCHNAUZER',
  'SCOTCH TERRIER',
  'TIBETAN TERRIER',
  'SILKY TERRIER',
  'WHEATEN TERRIER',
  'WHITE TERRIER',
  'LHASA',
  'RETRIEVER',
  'CURLY-COATED RETRIEVER',
  'GOLDEN RETRIEVER',
  'LABRADOR RETRIEVER',
  'CHESAPEAKE BAY RETRIEVER',
  'SHORT-HAIRED POINTER',
  'VISLA',
  'ENGLISH SETTER',
  'IRISH SETTER',
  'GORDON SETTER',
  'BRITTANY SPANIEL',
  'CLUMBER',
  'ENGLISH SPRINGER',
  'WELSH SPRINGER SPANIEL',
  'COCKER SPANIEL',
  'SUSSEX SPANIEL',
  'IRISH WATERSPANIEL',
  'KUVASZ',
  'SCHIPPERKE',
  'GROENENDAEL',
  'MALINOIS',
  'BRIARD',
  'KELPIE',
  'KOMONDOR',
  'OLD ENGLISH SHEEPDOG',
  'SHETLAND SHEEPDOG',
  'COLLIE',
  'BORDER COLLIE',
  'BOUVIER DES FLANDRES',
  'ROTTWEILER',
  'GERMAN SHEPHERD',
  'DOBERMAN',
  'MINIATURE PINSCHER',
  'GREATER SWISS MOUNTAIN DOG',
  'BERNESE MOUNTAIN DOG',
  'APPENZELLER',
  'ENTLEBUCHER',
  'BOXER',
  'BULL MASTIFF',
  'TIBETAN MASTIFF',
  'FRENCH BULLDOG',
  'GREAT DANE',
  'SAINT BERNARD',
  'ESKIMO DOG',
  'MALAMUTE',
  'SIBERIAN HUSKY',
  'DALMATIAN',
  'AFFENPINSCHER',
  'BASENJI',
  'PUG',
  'LEONBERG',
  'NEWFOUNDLAND',
  'GREAT PYRENEES',
  'SAMOYED',
  'POMERANIAN',
  'CHOW',
  'KEESHOND',
  'BRABANCON GRIFFON',
  'PEMBROKE',
  'CARDIGAN',
  'TOY POODLE',
  'MINIATURE POODLE',
  'STANDARD POODLE',
  'MEXICAN HAIRLESS',
  'TIMBER WOLF',
  'WHITE WOLF',
  'RED WOLF',
  'COYOTE',
  'DINGO',
  'DHOLE',
  'AFRICAN HUNTING DOG',
  'HYENA',
  'RED FOX',
  'KIT FOX',
  'ARCTIC FOX',
  'GREY FOX',
  'TABBY',
  'TIGER CAT',
  'PERSIAN CAT',
  'SIAMESE CAT',
  'EGYPTIAN CAT',
  'COUGAR',
  'LYNX',
  'LEOPARD',
  'SNOW LEOPARD',
  'JAGUAR',
  'LION',
  'TIGER',
  'CHEETAH',
  'BROWN BEAR',
  'AMERICAN BLACK BEAR',
  'ICE BEAR',
  'SLOTH BEAR',
  'MONGOOSE',
  'MEERKAT',
  'TIGER BEETLE',
  'LADYBUG',
  'GROUND BEETLE',
  'LONG-HORNED BEETLE',
  'LEAF BEETLE',
  'DUNG BEETLE',
  'RHINOCEROS BEETLE',
  'WEEVIL',
  'FLY',
  'BEE',
  'ANT',
  'GRASSHOPPER',
  'CRICKET',
  'WALKING STICK',
  'COCKROACH',
  'MANTIS',
  'CICADA',
  'LEAFHOPPER',
  'LACEWING',
  'DRAGONFLY',
  'DAMSELFLY',
  'ADMIRAL',
  'RINGLET',
  'MONARCH',
  'CABBAGE BUTTERFLY',
  'SULPHUR BUTTERFLY',
  'LYCAENID',
  'STARFISH',
  'SEA URCHIN',
  'SEA CUCUMBER',
  'WOOD RABBIT',
  'HARE',
  'ANGORA',
  'HAMSTER',
  'PORCUPINE',
  'FOX SQUIRREL',
  'MARMOT',
  'BEAVER',
  'GUINEA PIG',
  'SORREL',
  'ZEBRA',
  'HOG',
  'WILD BOAR',
  'WARTHOG',
  'HIPPOPOTAMUS',
  'OX',
  'WATER BUFFALO',
  'BISON',
  'RAM',
  'BIGHORN',
  'IBEX',
  'HARTEBEEST',
  'IMPALA',
  'GAZELLE',
  'ARABIAN CAMEL',
  'LLAMA',
  'WEASEL',
  'MINK',
  'POLECAT',
  'BLACK-FOOTED FERRET',
  'OTTER',
  'SKUNK',
  'BADGER',
  'ARMADILLO',
  'THREE-TOED SLOTH',
  'ORANGUTAN',
  'GORILLA',
  'CHIMPANZEE',
  'GIBBON',
  'SIAMANG',
  'GUENON',
  'PATAS',
  'BABOON',
  'MACAQUE',
  'LANGUR',
  'COLOBUS',
  'PROBOSCIS MONKEY',
  'MARMOSET',
  'CAPUCHIN',
  'HOWLER MONKEY',
  'TITI',
  'SPIDER MONKEY',
  'SQUIRREL MONKEY',
  'MADAGASCAR CAT',
  'INDRI',
  'INDIAN ELEPHANT',
  'AFRICAN ELEPHANT',
  'LESSER PANDA',
  'GIANT PANDA',
  'BARRACOUTA',
  'EEL',
  'COHO',
  'ROCK BEAUTY',
  'ANEMONE FISH',
  'STURGEON',
  'GAR',
  'LIONFISH',
  'PUFFER',
  'ABACUS',
  'ABAYA',
  'ACADEMIC GOWN',
  'ACCORDION',
  'ACOUSTIC GUITAR',
  'AIRCRAFT CARRIER',
  'AIRLINER',
  'AIRSHIP',
  'ALTAR',
  'AMBULANCE',
  'AMPHIBIAN',
  'ANALOG CLOCK',
  'APIARY',
  'APRON',
  'ASHCAN',
  'ASSAULT RIFLE',
  'BACKPACK',
  'BAKERY',
  'BALANCE BEAM',
  'BALLOON',
  'BALLPOINT',
  'BAND AID',
  'BANJO',
  'BANNISTER',
  'BARBELL',
  'BARBER CHAIR',
  'BARBERSHOP',
  'BARN',
  'BAROMETER',
  'BARREL',
  'BARROW',
  'BASEBALL',
  'BASKETBALL',
  'BASSINET',
  'BASSOON',
  'BATHING CAP',
  'BATH TOWEL',
  'BATHTUB',
  'BEACH WAGON',
  'BEACON',
  'BEAKER',
  'BEARSKIN',
  'BEER BOTTLE',
  'BEER GLASS',
  'BELL COTE',
  'BIB',
  'BICYCLE-BUILT-FOR-TWO',
  'BIKINI',
  'BINDER',
  'BINOCULARS',
  'BIRDHOUSE',
  'BOATHOUSE',
  'BOBSLED',
  'BOLO TIE',
  'BONNET',
  'BOOKCASE',
  'BOOKSHOP',
  'BOTTLECAP',
  'BOW',
  'BOW TIE',
  'BRASS',
  'BRASSIERE',
  'BREAKWATER',
  'BREASTPLATE',
  'BROOM',
  'BUCKET',
  'BUCKLE',
  'BULLETPROOF VEST',
  'BULLET TRAIN',
  'BUTCHER SHOP',
  'CAB',
  'CALDRON',
  'CANDLE',
  'CANNON',
  'CANOE',
  'CAN OPENER',
  'CARDIGAN',
  'CAR MIRROR',
  'CAROUSEL',
  'CARPENTERS KIT',
  'CARTON',
  'CAR WHEEL',
  'CASH MACHINE',
  'CASSETTE',
  'CASSETTE PLAYER',
  'CASTLE',
  'CATAMARAN',
  'CD PLAYER',
  'CELLO',
  'CELLULAR TELEPHONE',
  'CHAIN',
  'CHAINLINK FENCE',
  'CHAIN MAIL',
  'CHAIN SAW',
  'CHEST',
  'CHIFFONIER',
  'CHIME',
  'CHINA CABINET',
  'CHRISTMAS STOCKING',
  'CHURCH',
  'CINEMA',
  'CLEAVER',
  'CLIFF DWELLING',
  'CLOAK',
  'CLOG',
  'COCKTAIL SHAKER',
  'COFFEE MUG',
  'COFFEEPOT',
  'COIL',
  'COMBINATION LOCK',
  'COMPUTER KEYBOARD',
  'CONFECTIONERY',
  'CONTAINER SHIP',
  'CONVERTIBLE',
  'CORKSCREW',
  'CORNET',
  'COWBOY BOOT',
  'COWBOY HAT',
  'CRADLE',
  'CRANE',
  'CRASH HELMET',
  'CRATE',
  'CRIB',
  'CROCK POT',
  'CROQUET BALL',
  'CRUTCH',
  'CUIRASS',
  'DAM',
  'DESK',
  'DESKTOP COMPUTER',
  'DIAL TELEPHONE',
  'DIAPER',
  'DIGITAL CLOCK',
  'DIGITAL WATCH',
  'DINING TABLE',
  'DISHRAG',
  'DISHWASHER',
  'DISK BRAKE',
  'DOCK',
  'DOGSLED',
  'DOME',
  'DOORMAT',
  'DRILLING PLATFORM',
  'DRUM',
  'DRUMSTICK',
  'DUMBBELL',
  'DUTCH OVEN',
  'ELECTRIC FAN',
  'ELECTRIC GUITAR',
  'ELECTRIC LOCOMOTIVE',
  'ENTERTAINMENT CENTER',
  'ENVELOPE',
  'ESPRESSO MAKER',
  'FACE POWDER',
  'FEATHER BOA',
  'FILE',
  'FIREBOAT',
  'FIRE ENGINE',
  'FIRE SCREEN',
  'FLAGPOLE',
  'FLUTE',
  'FOLDING CHAIR',
  'FOOTBALL HELMET',
  'FORKLIFT',
  'FOUNTAIN',
  'FOUNTAIN PEN',
  'FOUR-POSTER',
  'FREIGHT CAR',
  'FRENCH HORN',
  'FRYING PAN',
  'FUR COAT',
  'GARBAGE TRUCK',
  'GASMASK',
  'GAS PUMP',
  'GOBLET',
  'GO-KART',
  'GOLF BALL',
  'GOLFCART',
  'GONDOLA',
  'GONG',
  'GOWN',
  'GRAND PIANO',
  'GREENHOUSE',
  'GRILLE',
  'GROCERY STORE',
  'GUILLOTINE',
  'HAIR SLIDE',
  'HAIR SPRAY',
  'HALF TRACK',
  'HAMMER',
  'HAMPER',
  'HAND BLOWER',
  'HAND-HELD COMPUTER',
  'HANDKERCHIEF',
  'HARD DISC',
  'HARMONICA',
  'HARP',
  'HARVESTER',
  'HATCHET',
  'HOLSTER',
  'HOME THEATER',
  'HONEYCOMB',
  'HOOK',
  'HOOPSKIRT',
  'HORIZONTAL BAR',
  'HORSE CART',
  'HOURGLASS',
  'IPOD',
  'IRON',
  'JACK-O-LANTERN',
  'JEAN',
  'JEEP',
  'JERSEY',
  'JIGSAW PUZZLE',
  'JINRIKISHA',
  'JOYSTICK',
  'KIMONO',
  'KNEE PAD',
  'KNOT',
  'LAB COAT',
  'LADLE',
  'LAMPSHADE',
  'LAPTOP',
  'LAWN MOWER',
  'LENS CAP',
  'LETTER OPENER',
  'LIBRARY',
  'LIFEBOAT',
  'LIGHTER',
  'LIMOUSINE',
  'LINER',
  'LIPSTICK',
  'LOAFER',
  'LOTION',
  'LOUDSPEAKER',
  'LOUPE',
  'LUMBERMILL',
  'MAGNETIC COMPASS',
  'MAILBAG',
  'MAILBOX',
  'MAILLOT',
  'MAILLOT',
  'MANHOLE COVER',
  'MARACA',
  'MARIMBA',
  'MASK',
  'MATCHSTICK',
  'MAYPOLE',
  'MAZE',
  'MEASURING CUP',
  'MEDICINE CHEST',
  'MEGALITH',
  'MICROPHONE',
  'MICROWAVE',
  'MILITARY UNIFORM',
  'MILK CAN',
  'MINIBUS',
  'MINISKIRT',
  'MINIVAN',
  'MISSILE',
  'MITTEN',
  'MIXING BOWL',
  'MOBILE HOME',
  'MODEL T',
  'MODEM',
  'MONASTERY',
  'MONITOR',
  'MOPED',
  'MORTAR',
  'MORTARBOARD',
  'MOSQUE',
  'MOSQUITO NET',
  'MOTOR SCOOTER',
  'MOUNTAIN BIKE',
  'MOUNTAIN TENT',
  'MOUSE',
  'MOUSETRAP',
  'MOVING VAN',
  'MUZZLE',
  'NAIL',
  'NECK BRACE',
  'NECKLACE',
  'NIPPLE',
  'NOTEBOOK',
  'OBELISK',
  'OBOE',
  'OCARINA',
  'ODOMETER',
  'OIL FILTER',
  'ORGAN',
  'OSCILLOSCOPE',
  'OVERSKIRT',
  'OXCART',
  'OXYGEN MASK',
  'PACKET',
  'PADDLE',
  'PADDLEWHEEL',
  'PADLOCK',
  'PAINTBRUSH',
  'PAJAMA',
  'PALACE',
  'PANPIPE',
  'PAPER TOWEL',
  'PARACHUTE',
  'PARALLEL BARS',
  'PARK BENCH',
  'PARKING METER',
  'PASSENGER CAR',
  'PATIO',
  'PAY-PHONE',
  'PEDESTAL',
  'PENCIL BOX',
  'PENCIL SHARPENER',
  'PERFUME',
  'PETRI DISH',
  'PHOTOCOPIER',
  'PICK',
  'PICKELHAUBE',
  'PICKET FENCE',
  'PICKUP',
  'PIER',
  'PIGGY BANK',
  'PILL BOTTLE',
  'PILLOW',
  'PING-PONG BALL',
  'PINWHEEL',
  'PIRATE',
  'PITCHER',
  'PLANE',
  'PLANETARIUM',
  'PLASTIC BAG',
  'PLATE RACK',
  'PLOW',
  'PLUNGER',
  'POLAROID CAMERA',
  'POLE',
  'POLICE VAN',
  'PONCHO',
  'POOL TABLE',
  'POP BOTTLE',
  'POT',
  'POTTERS WHEEL',
  'POWER DRILL',
  'PRAYER RUG',
  'PRINTER',
  'PRISON',
  'PROJECTILE',
  'PROJECTOR',
  'PUCK',
  'PUNCHING BAG',
  'PURSE',
  'QUILL',
  'QUILT',
  'RACER',
  'RACKET',
  'RADIATOR',
  'RADIO',
  'RADIO TELESCOPE',
  'RAIN BARREL',
  'RECREATIONAL VEHICLE',
  'REEL',
  'REFLEX CAMERA',
  'REFRIGERATOR',
  'REMOTE CONTROL',
  'RESTAURANT',
  'REVOLVER',
  'RIFLE',
  'ROCKING CHAIR',
  'ROTISSERIE',
  'RUBBER ERASER',
  'RUGBY BALL',
  'RULE',
  'RUNNING SHOE',
  'SAFE',
  'SAFETY PIN',
  'SALTSHAKER',
  'SANDAL',
  'SARONG',
  'SAX',
  'SCABBARD',
  'SCALE',
  'SCHOOL BUS',
  'SCHOONER',
  'SCOREBOARD',
  'SCREEN',
  'SCREW',
  'SCREWDRIVER',
  'SEAT BELT',
  'SEWING MACHINE',
  'SHIELD',
  'SHOE SHOP',
  'SHOJI',
  'SHOPPING BASKET',
  'SHOPPING CART',
  'SHOVEL',
  'SHOWER CAP',
  'SHOWER CURTAIN',
  'SKI',
  'SKI MASK',
  'SLEEPING BAG',
  'SLIDE RULE',
  'SLIDING DOOR',
  'SLOT',
  'SNORKEL',
  'SNOWMOBILE',
  'SNOWPLOW',
  'SOAP DISPENSER',
  'SOCCER BALL',
  'SOCK',
  'SOLAR DISH',
  'SOMBRERO',
  'SOUP BOWL',
  'SPACE BAR',
  'SPACE HEATER',
  'SPACE SHUTTLE',
  'SPATULA',
  'SPEEDBOAT',
  'SPIDER WEB',
  'SPINDLE',
  'SPORTS CAR',
  'SPOTLIGHT',
  'STAGE',
  'STEAM LOCOMOTIVE',
  'STEEL ARCH BRIDGE',
  'STEEL DRUM',
  'STETHOSCOPE',
  'STOLE',
  'STONE WALL',
  'STOPWATCH',
  'STOVE',
  'STRAINER',
  'STREETCAR',
  'STRETCHER',
  'STUDIO COUCH',
  'STUPA',
  'SUBMARINE',
  'SUIT',
  'SUNDIAL',
  'SUNGLASS',
  'SUNGLASSES',
  'SUNSCREEN',
  'SUSPENSION BRIDGE',
  'SWAB',
  'SWEATSHIRT',
  'SWIMMING TRUNKS',
  'SWING',
  'SWITCH',
  'SYRINGE',
  'TABLE LAMP',
  'TANK',
  'TAPE PLAYER',
  'TEAPOT',
  'TEDDY',
  'TELEVISION',
  'TENNIS BALL',
  'THATCH',
  'THEATER CURTAIN',
  'THIMBLE',
  'THRESHER',
  'THRONE',
  'TILE ROOF',
  'TOASTER',
  'TOBACCO SHOP',
  'TOILET SEAT',
  'TORCH',
  'TOTEM POLE',
  'TOW TRUCK',
  'TOYSHOP',
  'TRACTOR',
  'TRAILER TRUCK',
  'TRAY',
  'TRENCH COAT',
  'TRICYCLE',
  'TRIMARAN',
  'TRIPOD',
  'TRIUMPHAL ARCH',
  'TROLLEYBUS',
  'TROMBONE',
  'TUB',
  'TURNSTILE',
  'TYPEWRITER KEYBOARD',
  'UMBRELLA',
  'UNICYCLE',
  'UPRIGHT',
  'VACUUM',
  'VASE',
  'VAULT',
  'VELVET',
  'VENDING MACHINE',
  'VESTMENT',
  'VIADUCT',
  'VIOLIN',
  'VOLLEYBALL',
  'WAFFLE IRON',
  'WALL CLOCK',
  'WALLET',
  'WARDROBE',
  'WARPLANE',
  'WASHBASIN',
  'WASHER',
  'WATER BOTTLE',
  'WATER JUG',
  'WATER TOWER',
  'WHISKEY JUG',
  'WHISTLE',
  'WIG',
  'WINDOW SCREEN',
  'WINDOW SHADE',
  'WINDSOR TIE',
  'WINE BOTTLE',
  'WING',
  'WOK',
  'WOODEN SPOON',
  'WOOL',
  'WORM FENCE',
  'WRECK',
  'YAWL',
  'YURT',
  'WEB SITE',
  'COMIC BOOK',
  'CROSSWORD PUZZLE',
  'STREET SIGN',
  'TRAFFIC LIGHT',
  'BOOK JACKET',
  'MENU',
  'PLATE',
  'GUACAMOLE',
  'CONSOMME',
  'HOT POT',
  'TRIFLE',
  'ICE CREAM',
  'ICE LOLLY',
  'FRENCH LOAF',
  'BAGEL',
  'PRETZEL',
  'CHEESEBURGER',
  'HOTDOG',
  'MASHED POTATO',
  'HEAD CABBAGE',
  'BROCCOLI',
  'CAULIFLOWER',
  'ZUCCHINI',
  'SPAGHETTI SQUASH',
  'ACORN SQUASH',
  'BUTTERNUT SQUASH',
  'CUCUMBER',
  'ARTICHOKE',
  'BELL PEPPER',
  'CARDOON',
  'MUSHROOM',
  'GRANNY SMITH',
  'STRAWBERRY',
  'ORANGE',
  'LEMON',
  'FIG',
  'PINEAPPLE',
  'BANANA',
  'JACKFRUIT',
  'CUSTARD APPLE',
  'POMEGRANATE',
  'HAY',
  'CARBONARA',
  'CHOCOLATE SAUCE',
  'DOUGH',
  'MEAT LOAF',
  'PIZZA',
  'POTPIE',
  'BURRITO',
  'RED WINE',
  'ESPRESSO',
  'CUP',
  'EGGNOG',
  'ALP',
  'BUBBLE',
  'CLIFF',
  'CORAL REEF',
  'GEYSER',
  'LAKESIDE',
  'PROMONTORY',
  'SANDBAR',
  'SEASHORE',
  'VALLEY',
  'VOLCANO',
  'BALLPLAYER',
  'GROOM',
  'SCUBA DIVER',
  'RAPESEED',
  'DAISY',
  'LADY SLIPPER',
  'CORN',
  'ACORN',
  'HIP',
  'BUCKEYE',
  'CORAL FUNGUS',
  'AGARIC',
  'GYROMITRA',
  'STINKHORN',
  'EARTHSTAR',
  'HEN-OF-THE-WOODS',
  'BOLETE',
  'EAR',
  'TOILET TISSUE'
];

// ../worker-constellation-entry/src/ai/tasks/image-classification.ts
var AiImageClassification = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      oneOf: [
        { type: 'string', format: 'binary' },
        {
          type: 'object',
          properties: {
            image: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      ]
    },
    output: {
      type: 'array',
      contentType: 'application/json',
      items: {
        type: 'object',
        properties: {
          score: {
            type: 'number'
          },
          label: {
            type: 'string'
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
          shape: [1, preProcessedInputs.image.length],
          name: 'input'
        })
      ];
    }
  }
  postProcessing(response) {
    const labels = [];
    const scores = response.output.value[0];
    for (const s in scores)
      labels.push({ label: resnetLabels[s], score: scores[s] });
    labels.sort((a, b) => {
      return b.score - a.score;
    });
    this.postProcessedOutputs = labels.slice(0, 5);
  }
};

// ../worker-constellation-entry/src/ai/tasks/image-to-text.ts
var AiImageToText = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      oneOf: [
        { type: 'string', format: 'binary' },
        {
          type: 'object',
          properties: {
            image: {
              type: 'array',
              items: {
                type: 'number'
              }
            },
            prompt: {
              type: 'string'
            },
            max_tokens: {
              type: 'integer',
              default: 512
            }
          }
        }
      ]
    },
    output: {
      type: 'object',
      contentType: 'application/json',
      properties: {
        description: {
          type: 'string'
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor(
          'int32' /* Int32 */,
          [
            preProcessedInputs.max_tokens ||
              this.schema.input.oneOf.filter(f => f.type == 'object')[0]
                .properties.max_tokens.default
          ],
          {
            shape: [1],
            name: 'max_tokens'
          }
        ),
        new Tensor('str' /* String */, [preProcessedInputs.prompt], {
          shape: [1],
          name: 'prompt'
        }),
        new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
          shape: [1, preProcessedInputs.image.length],
          name: 'image'
        })
      ];
    }
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = {
        description: this.modelSettings.postProcessingFunc(
          response,
          this.preProcessedInputs
        )
      };
    } else {
      this.postProcessedOutputs = { description: response.name.value[0] };
    }
  }
};

// ../worker-constellation-entry/src/ai/tasks/object-detection.ts
var AiObjectDetection = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      oneOf: [
        { type: 'string', format: 'binary' },
        {
          type: 'object',
          properties: {
            image: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          }
        }
      ]
    },
    output: {
      type: 'array',
      contentType: 'application/json',
      items: {
        type: 'object',
        properties: {
          score: {
            type: 'number'
          },
          label: {
            type: 'string'
          },
          box: {
            type: 'object',
            properties: {
              xmin: {
                type: 'number'
              },
              ymin: {
                type: 'number'
              },
              xmax: {
                type: 'number'
              },
              ymax: {
                type: 'number'
              }
            }
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
          shape: [1, preProcessedInputs.image.length],
          name: 'input'
        })
      ];
    }
  }
  postProcessing(response) {
    const scores = response.scores.value[0].map((score, i) => {
      return {
        score,
        label: response.name.value[response.labels.value[0][i]],
        box: {
          xmin: response.boxes.value[0][i][0],
          ymin: response.boxes.value[0][i][1],
          xmax: response.boxes.value[0][i][2],
          ymax: response.boxes.value[0][i][3]
        }
      };
    });
    this.postProcessedOutputs = scores.sort((a, b) => {
      return b.score - a.score;
    });
  }
};

// ../worker-constellation-entry/src/ai/tasks/text-to-image.ts
var AiTextToImage = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string'
        },
        image: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        mask: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        num_steps: {
          type: 'integer',
          default: 20,
          maximum: 20
        },
        strength: {
          type: 'number',
          default: 1
        },
        guidance: {
          type: 'number',
          default: 7.5
        }
      },
      required: ['prompt']
    },
    output: {
      type: 'string',
      contentType: 'image/png',
      format: 'binary'
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      let tokens = [
        new Tensor('str' /* String */, [preProcessedInputs.prompt], {
          shape: [1],
          name: 'input_text'
        }),
        new Tensor(
          'int32' /* Int32 */,
          [
            preProcessedInputs.num_steps ||
              this.schema.input.properties.num_steps.default
          ],
          {
            shape: [1],
            name: 'num_steps'
          }
        )
      ];
      if (preProcessedInputs.image) {
        tokens = [
          ...tokens,
          ...[
            new Tensor('str' /* String */, [''], {
              shape: [1],
              name: 'negative_prompt'
            }),
            new Tensor(
              'float32' /* Float32 */,
              [
                preProcessedInputs.strength ||
                  this.schema.input.properties.strength.default
              ],
              {
                shape: [1],
                name: 'strength'
              }
            ),
            new Tensor(
              'float32' /* Float32 */,
              [
                preProcessedInputs.guidance ||
                  this.schema.input.properties.guidance.default
              ],
              {
                shape: [1],
                name: 'guidance'
              }
            ),
            new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
              shape: [1, preProcessedInputs.image.length],
              name: 'image'
            })
          ]
        ];
      }
      if (preProcessedInputs.mask) {
        tokens = [
          ...tokens,
          ...[
            new Tensor('uint8' /* Uint8 */, preProcessedInputs.mask, {
              shape: [1, preProcessedInputs.mask.length],
              name: 'mask_image'
            })
          ]
        ];
      }
      return tokens;
    }
  }
  OldgenerateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      if (preProcessedInputs.image && preProcessedInputs.mask) {
        return [
          new Tensor('str' /* String */, [preProcessedInputs.prompt], {
            shape: [1],
            name: 'input_text'
          }),
          new Tensor('str' /* String */, [''], {
            shape: [1],
            name: 'negative_prompt'
          }),
          new Tensor(
            'int32' /* Int32 */,
            [preProcessedInputs.num_steps || 20],
            {
              shape: [1],
              name: 'num_steps'
            }
          ),
          new Tensor(
            'float32' /* Float32 */,
            [preProcessedInputs.strength || 1],
            {
              shape: [1],
              name: 'strength'
            }
          ),
          new Tensor(
            'float32' /* Float32 */,
            [preProcessedInputs.guidance || 7.5],
            {
              shape: [1],
              name: 'guidance'
            }
          ),
          new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
            shape: [1, preProcessedInputs.image.length],
            name: 'image'
          }),
          new Tensor('uint8' /* Uint8 */, preProcessedInputs.mask, {
            shape: [1, preProcessedInputs.mask.length],
            name: 'mask_image'
          })
        ];
      } else if (preProcessedInputs.image) {
        return [
          new Tensor('str' /* String */, [preProcessedInputs.prompt], {
            shape: [1],
            name: 'input_text'
          }),
          new Tensor('str' /* String */, [''], {
            shape: [1],
            name: 'negative_prompt'
          }),
          new Tensor(
            'float32' /* Float32 */,
            [preProcessedInputs.strength || 1],
            {
              shape: [1],
              name: 'strength'
            }
          ),
          new Tensor(
            'float32' /* Float32 */,
            [preProcessedInputs.guidance || 7.5],
            {
              shape: [1],
              name: 'guidance'
            }
          ),
          new Tensor('uint8' /* Uint8 */, preProcessedInputs.image, {
            shape: [1, preProcessedInputs.image.length],
            name: 'image'
          }),
          new Tensor(
            'int32' /* Int32 */,
            [preProcessedInputs.num_steps || 20],
            {
              shape: [1],
              name: 'num_steps'
            }
          )
        ];
      } else {
        return [
          new Tensor('str' /* String */, [preProcessedInputs.prompt], {
            shape: [1],
            name: 'input_text'
          }),
          new Tensor(
            'int32' /* Int32 */,
            [preProcessedInputs.num_steps || 20],
            {
              shape: [1],
              name: 'num_steps'
            }
          )
        ];
      }
    }
  }
  postProcessing(response) {
    this.postProcessedOutputs = new Uint8Array(response.output_image.value);
  }
};

// ../worker-constellation-entry/src/ai/tasks/sentence-similarity.ts
var AiSentenceSimilarity = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        source: {
          type: 'string'
        },
        sentences: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: ['source', 'sentences']
    },
    output: {
      type: 'array',
      contentType: 'application/json',
      items: {
        type: 'number'
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor('str' /* String */, [preProcessedInputs.source], {
          shape: [1],
          name: 'source_sentence'
        }),
        new Tensor('str' /* String */, preProcessedInputs.sentences, {
          shape: [preProcessedInputs.sentences.length],
          name: 'sentences'
        })
      ];
    }
  }
  postProcessing(response) {
    this.postProcessedOutputs = response.scores.value;
  }
};

// ../worker-constellation-entry/src/ai/tasks/summarization.ts
var AiSummarization = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  // run ./scripts/gen-validators.ts if you change the schema
  schema = {
    input: {
      type: 'object',
      properties: {
        input_text: {
          type: 'string'
        },
        max_length: {
          type: 'integer',
          default: 1024
        }
      },
      required: ['input_text']
    },
    output: {
      type: 'object',
      contentType: 'application/json',
      properties: {
        summary: {
          type: 'string'
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors(preProcessedInputs) {
    if (this.modelSettings.generateTensorsFunc) {
      return this.modelSettings.generateTensorsFunc(preProcessedInputs);
    } else {
      return [
        new Tensor(
          'int32' /* Int32 */,
          [
            preProcessedInputs.max_length ||
              this.schema.input.properties.max_length.default
          ],
          {
            // sequence length
            shape: [1],
            name: 'max_length'
          }
        ),
        new Tensor('str' /* String */, [preProcessedInputs.input_text], {
          shape: [1],
          name: 'input_text'
        })
      ];
    }
  }
  postProcessing(response) {
    this.postProcessedOutputs = { summary: response.name.value[0] };
  }
};

// ../worker-constellation-entry/src/ai/catalog.ts
var chatDefaultContext =
  "A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.";
var codeDefaultContext =
  'Write code to solve the following coding problem that obeys the constraints and passes the example test cases. Please wrap your code answer using   ```:';
var vLLMGenerateTensors = preProcessedInputs => {
  const tensors = [
    new Tensor('str' /* String */, [preProcessedInputs.prompt], {
      shape: [1],
      name: 'text_input'
    }),
    new Tensor(
      'str' /* String */,
      [`{"max_tokens": ${preProcessedInputs.max_tokens}}`],
      {
        // sequence length
        shape: [1],
        name: 'sampling_parameters'
      }
    )
  ];
  if (preProcessedInputs.stream) {
    tensors.push(
      new Tensor('bool' /* Bool */, true, {
        name: 'stream'
      })
    );
  }
  return tensors;
};
var tgiPostProc = (response, ignoreTokens) => {
  let r = response['generated_text'].value[0];
  if (ignoreTokens) {
    for (const i in ignoreTokens) r = r.replace(ignoreTokens[i], '');
  }
  return r;
};
var defaultvLLM = {
  type: 'vllm',
  inputsDefaultsStream: {
    max_tokens: 512
  },
  inputsDefaults: {
    max_tokens: 512
  },
  preProcessingArgs: {
    promptTemplate: 'bare',
    defaultContext: ''
  },
  generateTensorsFunc: preProcessedInputs =>
    vLLMGenerateTensors(preProcessedInputs),
  postProcessingFunc: (r, inputs) =>
    r['name'].value[0].slice(inputs.prompt.length),
  postProcessingFuncStream: (r, inputs, inclen) => {
    const token = r['name'].value[0];
    const len = inclen(token.length);
    const lastLen = len - token.length;
    if (len < inputs.prompt.length) return;
    if (lastLen >= inputs.prompt.length) return token;
    return token.slice(inputs.prompt.length - lastLen);
  }
};
var defaultTGI = (promptTemplate, defaultContext, ignoreTokens) => {
  return {
    type: 'tgi',
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate,
      defaultContext
    },
    postProcessingFunc: (r, inputs) => tgiPostProc(r, ignoreTokens),
    postProcessingFuncStream: (r, inputs, len) => tgiPostProc(r, ignoreTokens)
  };
};
var modelMappings = {
  'text-classification': {
    models: [
      '@cf/huggingface/distilbert-sst-2-int8',
      '@cf/jpmorganchase/roberta-spam'
    ],
    class: AiTextClassification,
    id: '19606750-23ed-4371-aab2-c20349b53a60'
  },
  'text-to-image': {
    models: [
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      '@cf/runwayml/stable-diffusion-v1-5-inpainting',
      '@cf/runwayml/stable-diffusion-v1-5-img2img',
      '@cf/lykon/dreamshaper-8-lcm',
      '@cf/bytedance/stable-diffusion-xl-lightning'
    ],
    class: AiTextToImage,
    id: '3d6e1f35-341b-4915-a6c8-9a7142a9033a'
  },
  'sentence-similarity': {
    models: ['@hf/sentence-transformers/all-minilm-l6-v2'],
    class: AiSentenceSimilarity,
    id: '69bf4e84-441e-401a-bdfc-256fd54d0fff'
  },
  'text-embeddings': {
    models: [
      '@cf/baai/bge-small-en-v1.5',
      '@cf/baai/bge-base-en-v1.5',
      '@cf/baai/bge-large-en-v1.5',
      '@hf/baai/bge-base-en-v1.5'
    ],
    class: AiTextEmbeddings,
    id: '0137cdcf-162a-4108-94f2-1ca59e8c65ee'
  },
  'speech-recognition': {
    models: ['@cf/openai/whisper'],
    class: AiSpeechRecognition,
    id: 'dfce1c48-2a81-462e-a7fd-de97ce985207'
  },
  'image-classification': {
    models: ['@cf/microsoft/resnet-50'],
    class: AiImageClassification,
    id: '00cd182b-bf30-4fc4-8481-84a3ab349657'
  },
  'object-detection': {
    models: ['@cf/facebook/detr-resnet-50'],
    class: AiObjectDetection,
    id: '9c178979-90d9-49d8-9e2c-0f1cf01815d4'
  },
  'text-generation': {
    models: [
      '@cf/meta/llama-2-7b-chat-int8',
      '@cf/mistral/mistral-7b-instruct-v0.1',
      '@cf/meta/llama-2-7b-chat-fp16',
      '@hf/thebloke/llama-2-13b-chat-awq',
      '@hf/thebloke/zephyr-7b-beta-awq',
      '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
      '@hf/thebloke/codellama-7b-instruct-awq',
      '@hf/thebloke/openchat_3.5-awq',
      '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
      '@hf/thebloke/starling-lm-7b-alpha-awq',
      '@hf/thebloke/orca-2-13b-awq',
      '@hf/thebloke/neural-chat-7b-v3-1-awq',
      '@hf/thebloke/llamaguard-7b-awq',
      '@hf/thebloke/deepseek-coder-6.7b-base-awq',
      '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
      '@cf/deepseek-ai/deepseek-math-7b-base',
      '@cf/deepseek-ai/deepseek-math-7b-instruct',
      '@cf/defog/sqlcoder-7b-2',
      '@cf/openchat/openchat-3.5-0106',
      '@cf/tiiuae/falcon-7b-instruct',
      '@cf/thebloke/discolm-german-7b-v1-awq',
      '@cf/qwen/qwen1.5-0.5b-chat',
      '@cf/qwen/qwen1.5-1.8b-chat',
      '@cf/qwen/qwen1.5-7b-chat-awq',
      '@cf/qwen/qwen1.5-14b-chat-awq',
      '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
      '@cf/microsoft/phi-2',
      '@cf/thebloke/yarn-mistral-7b-64k-awq'
    ],
    class: AiTextGeneration,
    id: 'c329a1f9-323d-4e91-b2aa-582dd4188d34'
  },
  translation: {
    models: ['@cf/meta/m2m100-1.2b'],
    class: AiTranslation,
    id: 'f57d07cb-9087-487a-bbbf-bc3e17fecc4b'
  },
  summarization: {
    models: ['@cf/facebook/bart-large-cnn'],
    class: AiSummarization,
    id: '6f4e65d8-da0f-40d2-9aa4-db582a5a04fd'
  },
  'image-to-text': {
    models: ['@cf/unum/uform-gen2-qwen-500m'],
    class: AiImageToText,
    id: '882a91d1-c331-4eec-bdad-834c919942a8'
  }
};
var modelSettings = {
  // TGIs
  '@hf/thebloke/deepseek-coder-6.7b-instruct-awq': defaultTGI(
    'deepseek',
    codeDefaultContext,
    ['<|EOT|>']
  ),
  '@hf/thebloke/deepseek-coder-6.7b-base-awq': defaultTGI(
    'bare',
    codeDefaultContext
  ),
  '@hf/thebloke/llamaguard-7b-awq': defaultTGI('inst', chatDefaultContext),
  '@hf/thebloke/openchat_3.5-awq': {
    ...defaultTGI('openchat', chatDefaultContext),
    experimental: true
  },
  '@hf/thebloke/openhermes-2.5-mistral-7b-awq': defaultTGI(
    'chatml',
    chatDefaultContext,
    ['<|im_end|>']
  ),
  '@hf/thebloke/starling-lm-7b-alpha-awq': {
    ...defaultTGI('openchat', chatDefaultContext, ['<|end_of_turn|>']),
    experimental: true
  },
  '@hf/thebloke/orca-2-13b-awq': {
    ...defaultTGI('chatml', chatDefaultContext),
    experimental: true
  },
  '@hf/thebloke/neural-chat-7b-v3-1-awq': defaultTGI(
    'orca-hashes',
    chatDefaultContext
  ),
  '@hf/thebloke/llama-2-13b-chat-awq': defaultTGI('llama2', chatDefaultContext),
  '@hf/thebloke/zephyr-7b-beta-awq': defaultTGI('zephyr', chatDefaultContext),
  '@hf/thebloke/mistral-7b-instruct-v0.1-awq': defaultTGI(
    'mistral-instruct',
    chatDefaultContext
  ),
  '@hf/thebloke/codellama-7b-instruct-awq': defaultTGI(
    'llama2',
    codeDefaultContext
  ),
  // vLLMs
  '@cf/thebloke/yarn-mistral-7b-64k-awq': {
    ...defaultvLLM,
    ...{ experimental: true }
  },
  '@cf/microsoft/phi-2': defaultvLLM,
  '@cf/defog/sqlcoder-7b-2': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'sqlcoder',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/deepseek-ai/deepseek-math-7b-base': defaultvLLM,
  '@cf/deepseek-ai/deepseek-math-7b-instruct': defaultvLLM,
  '@cf/tiiuae/falcon-7b-instruct': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'falcon',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/thebloke/discolm-german-7b-v1-awq': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'chatml',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/qwen/qwen1.5-14b-chat-awq': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'chatml',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/qwen/qwen1.5-0.5b-chat': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'chatml',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/qwen/qwen1.5-1.8b-chat': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'chatml',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/qwen/qwen1.5-7b-chat-awq': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'chatml',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/tinyllama/tinyllama-1.1b-chat-v1.0': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'tinyllama',
        defaultContext: chatDefaultContext
      }
    }
  },
  '@cf/openchat/openchat-3.5-0106': {
    ...defaultvLLM,
    ...{
      preProcessingArgs: {
        promptTemplate: 'openchat-alt',
        defaultContext: chatDefaultContext
      }
    }
  },
  // Others
  '@cf/unum/uform-gen2-qwen-500m': {
    postProcessingFunc: (response, inputs) => {
      return response.name.value[0].replace('<|im_end|>', '');
    }
  },
  '@cf/jpmorganchase/roberta-spam': {
    experimental: true
  },
  '@hf/sentence-transformers/all-minilm-l6-v2': {
    experimental: true
  },
  '@hf/baai/bge-base-en-v1.5': {
    postProcessingFunc: (r, inputs) => {
      return {
        shape: r.data.shape,
        data: r.data.value
      };
    }
  },
  '@cf/meta/llama-2-7b-chat-fp16': {
    inputsDefaultsStream: {
      max_tokens: 2500
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: 'llama2',
      defaultContext: chatDefaultContext
    }
  },
  '@cf/meta/llama-2-7b-chat-int8': {
    inputsDefaultsStream: {
      max_tokens: 1800
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: 'llama2',
      defaultContext: chatDefaultContext
    }
  },
  '@cf/openai/whisper': {
    postProcessingFunc: (response, inputs) => {
      if (response['word_count']) {
        return {
          text: response['name'].value.join('').trim(),
          word_count: parseInt(response['word_count'].value),
          words: response['name'].value.map((w, i) => {
            return {
              word: w.trim(),
              start: response['timestamps'].value[0][i][0],
              end: response['timestamps'].value[0][i][1]
            };
          })
        };
      } else {
        return {
          text: response['name'].value.join('').trim()
        };
      }
    }
  },
  '@cf/mistral/mistral-7b-instruct-v0.1': {
    inputsDefaultsStream: {
      max_tokens: 1800
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: 'mistral-instruct',
      defaultContext: chatDefaultContext
    }
  }
};

// src/sdk.ts
var InferenceUpstreamError = class extends Error {
  httpCode;
  constructor(message, httpCode) {
    super(message);
    this.name = 'InferenceUpstreamError';
    this.httpCode = httpCode;
  }
};
var Ai = class {
  binding;
  options;
  logs;
  lastRequestId;
  constructor(binding, options = {}) {
    if (binding) {
      this.binding = binding;
      this.options = options;
      this.lastRequestId = '';
    } else {
      throw new Error(
        'Ai binding is undefined. Please provide a valid binding.'
      );
    }
  }
  async run(model, inputs) {
    const body = JSON.stringify({
      inputs,
      options: {
        debug: this.options?.debug
      }
    });
    const fetchOptions = {
      method: 'POST',
      body,
      headers: {
        // @ts-ignore Backwards sessionOptions compatibility
        ...(this.options?.sessionOptions?.extraHeaders || {}),
        ...(this.options?.extraHeaders || {}),
        'content-encoding': 'application/json',
        // 'content-encoding': 'gzip',
        'cf-consn-sdk-version': '1.1.0',
        'cf-consn-model-id': `${
          this.options.prefix ? `${this.options.prefix}:` : ''
        }${model}`
      }
    };
    const res = await this.binding.fetch(
      'http://workers-binding.ai/run?version=2',
      fetchOptions
    );
    this.lastRequestId = res.headers.get('cf-ai-req-id');
    if (inputs.stream) {
      if (!res.ok) {
        throw new InferenceUpstreamError(await res.text(), res.status);
      }
      return res.body;
    } else {
      if (this.options.debug) {
        let parsedLogs = [];
        try {
          parsedLogs = JSON.parse(atob(res.headers.get('cf-ai-logs')));
        } catch (e) {}
        this.logs = parsedLogs;
      }
      if (!res.ok) {
        throw new InferenceUpstreamError(await res.text(), res.status);
      }
      const decompressed = await new Response(
        res.body.pipeThrough(new DecompressionStream('gzip'))
      );
      const contentType = res.headers.get('content-type');
      if (!contentType) {
        console.log(
          'Your current wrangler version has a known issue when using in local dev mode, please update to the latest.'
        );
        try {
          return await decompressed.clone().json();
        } catch (e) {
          return decompressed.body;
        }
      }
      if (res.headers.get('content-type') === 'application/json') {
        return await decompressed.json();
      }
      return decompressed.body;
    }
  }
  getLogs() {
    return this.logs;
  }
};
export { Ai, InferenceUpstreamError, modelMappings };
