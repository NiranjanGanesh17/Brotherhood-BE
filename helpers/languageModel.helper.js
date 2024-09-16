import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
console.log(process.env.HUGGINGFACE_API_KEY,'hug')
export const model = hf.textGeneration({
  model: 'openai-community/gpt2',
  inputs: 'Plan a two-day trip to Madurai',
});
