
import { GoogleGenAI, Type } from "@google/genai";
import { Product, MakeupCategory, GroundingLink } from "../types";

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface BeautyAnalysis {
  skinToneDescription: string;
  suggestedFoundationHex: string;
  recommendedLipstickShade: string;
  suggestedLipstickHex: string;
  reasoning: string;
}

export const detectFaces = async (base64Image: string): Promise<string[]> => {
  const ai = getAi();
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: "Analyze this image. Are there people? If yes, identify distinct faces. Return a JSON object with a 'faces' array containing a brief, unique physical description for each person found (e.g. 'Woman in red on the left', 'Man with glasses'). If only one person, return an array with one generic string 'The person'." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          faces: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data.faces || [];
  } catch (e) {
    return [];
  }
};

export const getBeautyRecommendations = async (base64Image: string): Promise<BeautyAnalysis> => {
  const ai = getAi();
  const base64Data = base64Image.split(',')[1] || base64Image;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: "Act as a world-class celebrity makeup artist. Analyze the person's skin tone, undertones, and features. Recommend a specific foundation shade (hex) and a complementary lipstick color family (provide a representative hex code). Provide a professional reasoning. Return JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skinToneDescription: { type: Type.STRING },
          suggestedFoundationHex: { type: Type.STRING },
          recommendedLipstickShade: { type: Type.STRING },
          suggestedLipstickHex: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["skinToneDescription", "suggestedFoundationHex", "recommendedLipstickShade", "suggestedLipstickHex", "reasoning"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Analysis failed.");
  }
};

export const scanProductDetails = async (base64Image: string): Promise<{ product: Product, links: GroundingLink[] }> => {
  const ai = getAi();
  const base64Data = base64Image.split(',')[1] || base64Image;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: "Identify this makeup product precisely. Search Google for real swatches and people wearing this exact shade. Determine the most accurate Hex code and finish. Return JSON." }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          brand: { type: Type.STRING },
          name: { type: Type.STRING },
          shade: { type: Type.STRING },
          category: { type: Type.STRING },
          hex: { type: Type.STRING },
          finish: { type: Type.STRING }
        },
        required: ["brand", "name", "shade", "category", "hex", "finish"]
      }
    }
  });

  const links: GroundingLink[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Ref',
    uri: chunk.web?.uri || '#'
  })) || [];

  const productData = JSON.parse(response.text || '{}');
  const product: Product = {
    id: `scan-${Date.now()}`,
    brand: productData.brand,
    name: productData.name,
    category: (productData.category as MakeupCategory) || MakeupCategory.LIPSTICK,
    color: productData.shade,
    hex: productData.hex,
    finish: productData.finish as any,
    description: "AI Researched Product"
  };

  return { product, links };
};

export const applyMakeup = async (base64Image: string, product: Product, intensity: number, targetDescription: string | null = null): Promise<string> => {
  const ai = getAi();
  const base64Data = base64Image.split(',')[1] || base64Image;

  // STRICT IDENTITY PRESERVATION PROMPT
  const prompt = `Task: Apply makeup.
  Product: ${product.brand} ${product.name} (${product.color}, ${product.hex})
  Category: ${product.category}
  Finish: ${product.finish}
  Intensity: ${intensity}%
  ${targetDescription ? `TARGET FACE: Apply makeup ONLY to: "${targetDescription}". Do NOT touch other faces.` : ''}
  
  CRITICAL INSTRUCTIONS:
  1. DO NOT change the person's face, features, identity, expression, or skin texture.
  2. DO NOT change the background, hair, or lighting.
  3. This is an ADDITIVE process. Keep all previous makeup (e.g. lipstick, eyeliner) intact.
  4. Only apply the new ${product.category} to the specific area with ${intensity}% opacity.
  5. The output must look exactly like the input image, but with the specific makeup product applied realistically.
  6. IMPORTANT: If the person's eyes are open, KEEP THEM OPEN. Do not close the eyes to show eyeshadow. Apply it to the visible eyelid area only.
  
  Return the image only. No text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Application failed.");
};

export const applyRecommendedLook = async (base64Image: string, analysis: BeautyAnalysis): Promise<string> => {
  const ai = getAi();
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `Task: Apply full makeup look.
  Foundation: ${analysis.suggestedFoundationHex}
  Lipstick: ${analysis.suggestedLipstickHex}
  
  CRITICAL INSTRUCTIONS:
  1. PRESERVE the exact identity and facial structure of the person in the image.
  2. Do not change hair, background, or eye color.
  3. Apply the makeup naturally, preserving skin pores and texture.
  
  Return the image only. No text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Consultation application failed.");
};
