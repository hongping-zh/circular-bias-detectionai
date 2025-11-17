
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.NUMBER,
            description: 'A circularity score from 0.0 to 1.0, where 1.0 indicates very high circularity.'
        },
        explanation: {
            type: Type.STRING,
            description: 'A detailed explanation of the circular bias found, referencing specific parts of the text.'
        },
        highlightedText: {
            type: Type.STRING,
            description: 'The original generated text, but with the circularly biased sections wrapped in <mark> tags.'
        }
    },
    required: ['score', 'explanation', 'highlightedText'],
};

const systemInstruction = `You are an expert AI assistant specializing in detecting circular reasoning and confirmation bias in text. Your task is to analyze a 'Generated Text' against a 'Reference Text' and identify passages where the generated text relies too heavily on the reference, essentially repeating information without adding new value or insight. 
- A high score (e.g., 0.8-1.0) means the generated text is almost a direct copy or very minor paraphrase of the reference.
- A medium score (e.g., 0.4-0.7) means the text borrows heavily but has some original structure.
- A low score (e.g., 0.0-0.3) means the text is original and uses the reference appropriately as a source.
You must return your analysis in a structured JSON format.`;


export const detectCircularBias = async (generatedText: string, referenceText: string): Promise<AnalysisResult> => {
    try {
        const prompt = `
            Please analyze the following texts for circular bias.

            Reference Text:
            ---
            ${referenceText}
            ---

            Generated Text:
            ---
            ${generatedText}
            ---

            Provide your analysis in the required JSON format.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as AnalysisResult;

        // Basic validation
        if (typeof parsedResult.score !== 'number' || typeof parsedResult.explanation !== 'string' || typeof parsedResult.highlightedText !== 'string') {
            throw new Error("Invalid JSON structure received from API.");
        }
        
        return parsedResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get analysis from the AI model. The model might be overloaded or the input is invalid.");
    }
};
