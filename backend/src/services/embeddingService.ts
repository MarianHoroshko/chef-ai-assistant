import { FeatureExtractionPipeline, pipeline } from '@xenova/transformers';

const task = 'feature-extraction';
const model = 'Xenova/all-MiniLM-L6-v2';
let instance: FeatureExtractionPipeline | null = null;

export const getVector = async (text: string) => {
  if (!instance) {
    instance = await pipeline(task, model);
  }

  const output = await instance(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
};
