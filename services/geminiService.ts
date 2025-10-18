import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedIdea, SuggestedTheme } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType
        },
    };
};

export const generateProductDescription = async (productImage: { base64: string; mimeType: string }): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Buatkan deskripsi produk untuk gambar ini." },
                fileToGenerativePart(productImage.base64, productImage.mimeType)
            ]
        },
        config: {
            systemInstruction: "You are a professional copywriter. Analyze the product in the image and write a concise, compelling, and SEO-friendly product description in Indonesian. Highlight its key features and potential benefits for customers. Keep it under 500 characters."
        }
    });
    return response.text.trim();
};

export const generateAdHeadline = async (adImage: { base64: string; mimeType: string }, description: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Buatkan satu headline menarik untuk produk ini. Deskripsi: "${description}"` },
                fileToGenerativePart(adImage.base64, adImage.mimeType)
            ]
        },
        config: {
            systemInstruction: "You are a master copywriter specializing in short, high-impact headlines. Based on the product image and description, generate one catchy headline (hook) in Indonesian. It must be very short (max 5 words) and attention-grabbing."
        }
    });
    return response.text.trim().replace(/["*]/g, '');
};

export const generateProductPoses = async (
    productImage: { base64: string; mimeType: string },
    description: string,
    modelImage: { base64: string; mimeType: string } | null,
    theme: string
): Promise<GeneratedIdea[]> => {
    const ai = getAiClient();
    let userQuery = `Analyze this product. Product Description: "${description}"`;
    if (theme) {
        userQuery += `\nPhoto Theme: "${theme}"`;
    }
    const parts = [
        { text: userQuery },
        fileToGenerativePart(productImage.base64, productImage.mimeType)
    ];
    if (modelImage) {
        parts.push(fileToGenerativePart(modelImage.base64, modelImage.mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction: "You are a professional product photographer's AI assistant. Your task is to analyze a product, description, and optionally a model's photo and theme. You MUST strictly adhere to the user's theme if provided. Generate 6 distinct, creative, and professional 'poses' or 'shots'. If a model's photo is provided, you MUST incorporate the model naturally interacting with or presenting the product. For each shot, provide a short, descriptive title (in Indonesian) and a detailed prompt for an AI image generator. The prompt must be in English and designed to create a high-quality, realistic, elegant, and cinematic product photo. Emphasize dramatic lighting, soft focus, sophisticated composition, and a high-end commercial aesthetic. Respond ONLY with a valid JSON array of 6 objects.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "title": { "type": Type.STRING },
                        "prompt": { "type": Type.STRING }
                    },
                    required: ["title", "prompt"]
                }
            }
        }
    });
    
    return JSON.parse(response.text);
};


export const generateImageFromPrompt = async (
    prompt: string,
    baseImage: { base64: string; mimeType: string },
    modelImage: { base64: string; mimeType: string } | null
): Promise<string> => {
    const ai = getAiClient();
    const finalPrompt = `${prompt}, elegant, cinematic, professional product photography, dramatic lighting, 8k, photorealistic`;
    const parts = [
        { text: finalPrompt },
        fileToGenerativePart(baseImage.base64, baseImage.mimeType)
    ];
    if (modelImage) {
        parts.push(fileToGenerativePart(modelImage.base64, modelImage.mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("No image data in response");
    return imagePart.inlineData.data;
};

export const generateSocialCaption = async (
    imageUrl: string,
    description: string,
    theme: string
): Promise<string> => {
    const ai = getAiClient();
    const [header, base64Data] = imageUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Product Description: "${description}"\nPhoto Theme: "${theme}"` },
                fileToGenerativePart(base64Data, mimeType)
            ]
        },
        config: {
            systemInstruction: "You are a creative social media manager. Based on the product photo, description, and theme, write an engaging Instagram caption in Indonesian. It should be appealing, concise, and end with 3-5 relevant hashtags."
        }
    });

    return response.text.trim();
};

export const generateVideoPrompt = async (
    imageUrl: string,
    description: string,
    theme: string
): Promise<string> => {
    const ai = getAiClient();
    const [header, base64Data] = imageUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Product Description: "${description}"\nPhoto Theme: "${theme}"` },
                fileToGenerativePart(base64Data, mimeType)
            ]
        },
        config: {
            systemInstruction: "You are an AI video generation expert. Analyze the provided image, its theme, and the product description. Your task is to generate a concise image-to-video prompt in English. The prompt must strictly follow the formula: \"subject + what it's doing (action) + background + camera movement\". Infer the most logical and visually appealing motion from the static image for the 'action' part. Then, add a suitable 'camera movement' to make the shot more cinematic (e.g., 'slow zoom in', 'panning from left to right', 'dolly shot forward'). Be creative and focus on creating a dynamic, cinematic shot."
        }
    });

    return response.text.trim();
};

export const generateVirtualTryOn = async (
    productImage: { base64: string; mimeType: string },
    modelImage: { base64: string; mimeType: string }
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Dengan menggunakan foto produk dan foto model yang tersedia, buatlah sebuah gambar fotorealistis baru di mana model tersebut sedang mengenakan atau menggunakan produk tersebut. Pastikan hasilnya berkualitas tinggi dan terlihat seperti sesi pemotretan profesional. Pertahankan penampilan model dan detail produk.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(productImage.base64, productImage.mimeType),
                fileToGenerativePart(modelImage.base64, modelImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("No image data in response");
    return imagePart.inlineData.data;
};

export const generateFashionPose = async (
    modelImage: { base64: string; mimeType: string },
    poseDescription: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Berdasarkan gambar model yang disediakan, hasilkan gambar baru dengan model yang melakukan pose fesyen sesuai deskripsi berikut: '${poseDescription}'. Jangan mengubah pakaian, latar belakang, atau properti apa pun. Hanya ubah pose model.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(modelImage.base64, modelImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("No image data in response");
    return imagePart.inlineData.data;
};


export const getAdVariations = async (
    adImage: { base64: string; mimeType: string },
    headline: string,
    description: string,
    theme: string
): Promise<GeneratedIdea[]> => {
    const ai = getAiClient();
    let userQuery = `Headline: "${headline}"\nDescription: "${description}"`;
    if (theme) {
        userQuery += `\nAd Theme: "${theme}"`;
    }
    const parts = [
        { text: userQuery },
        fileToGenerativePart(adImage.base64, adImage.mimeType)
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction: "You are an expert AI graphic designer for social media ads. Analyze the product image, headline, description, and optional theme. Generate 6 distinct ad variations. For each, provide a JSON object with a 'title' (short name in Indonesian) and a 'prompt' (detailed English prompt for an image generation AI). The prompt MUST instruct the AI to place the provided headline and a key phrase from the description onto the original image in a specific, visually appealing way. Describe text placement (e.g., 'top-center', 'bottom-left'), font style (e.g., 'bold sans-serif', 'elegant script'), color scheme, and any subtle background enhancements (e.g., 'add a soft glow'). Ensure text is legible and complements the image. The original product in the image must not be altered. Respond ONLY with a valid JSON array of 6 objects.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "title": { "type": Type.STRING },
                        "prompt": { "type": Type.STRING }
                    },
                    required: ["title", "prompt"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateAdImageWithText = async (
    baseImage: { base64: string; mimeType: string },
    prompt: string,
    headline: string,
    description: string
): Promise<string> => {
    const ai = getAiClient();
    const finalPrompt = `${prompt}. The headline text to add is: "${headline}". A key phrase from the description to add is: "${description}". Ensure the text is clearly visible and beautifully integrated.`;
    const parts = [
        { text: finalPrompt },
        fileToGenerativePart(baseImage.base64, baseImage.mimeType)
    ];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("No image data in response");
    return imagePart.inlineData.data;
};

export const changeImageBackground = async (
    productImage: { base64: string; mimeType: string },
    backgroundPrompt: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Carefully analyze the provided image to identify the main subject. Do not change the subject. Replace the original background with a new one based on this description: '${backgroundPrompt}'. The final image should be photorealistic and seamlessly blended.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(productImage.base64, productImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("No image data in response");
    return imagePart.inlineData.data;
};

export const suggestThemes = async (productCategory: string): Promise<SuggestedTheme[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on current visual trends for e-commerce, suggest 5 creative and distinct photography themes for the product category: "${productCategory}".`,
        config: {
            tools: [{googleSearch: {}}],
            systemInstruction: "You are an expert creative director and market trend analyst. Based on real-time search trends, generate 5 distinct, trending, and visually appealing photo themes for the given product category. For each theme, provide a short, catchy title (in English) and a one-sentence description of the aesthetic (in English). Respond ONLY with a valid JSON array of objects.",
        }
    });

    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    return JSON.parse(jsonString);
};
