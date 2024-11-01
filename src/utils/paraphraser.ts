import OpenAI from 'openai';
import type { ParaphrasingError } from '../types/subtitle';

let openai: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string): void => {
  try {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  } catch (error) {
    const err = new Error('Failed to initialize OpenAI client') as ParaphrasingError;
    err.details = error;
    throw err;
  }
};

export async function paraphraseText(text: string): Promise<string> {
  if (!openai) {
    const err = new Error('OpenAI not initialized. Please set API key first.') as ParaphrasingError;
    throw err;
  }

  try {
    // Find and store HTML tags
    const tagRegex = /(<[^>]+>.*?<\/[^>]+>)/g;
    const tags: string[] = [];
    const processedText = text.replace(tagRegex, (match) => {
      tags.push(match);
      return `__TAG${tags.length - 1}__`;
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that paraphrases text while maintaining the same meaning. Keep the tone and style similar but use different wording. Preserve any placeholders in the format __TAG{number}__."
        },
        {
          role: "user",
          content: `Paraphrase this text: "${processedText}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    let paraphrasedText = completion.choices[0].message.content?.trim() || '';
    paraphrasedText = paraphrasedText.replace(/^["']|["']$/g, '');

    // Restore HTML tags
    tags.forEach((tag, index) => {
      paraphrasedText = paraphrasedText.replace(`__TAG${index}__`, tag);
    });

    return paraphrasedText;
  } catch (error) {
    const err = new Error('Failed to paraphrase text') as ParaphrasingError;
    err.details = error;
    throw err;
  }
}