import { TranslationResponse } from '../types';

export const getSimplifiedTranslation = async (inputText: string): Promise<TranslationResponse> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'translate',
        text: inputText
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if(data.error) {
        return { 
            traduccionSimplificada: "", 
            error: data.error 
        };
    }
    
    return data as TranslationResponse;

  } catch (error) {
    console.error("Error fetching translation:", error);
    if (error instanceof Error) {
        return {
            traduccionSimplificada: "",
            error: `Error al procesar la solicitud: ${error.message}`
        };
    }
    return {
        traduccionSimplificada: "",
        error: "Ocurrió un error desconocido. Por favor, inténtelo de nuevo."
    };
  }
};

export const generateVisualExplanation = async (inputText: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'visual_explanation',
        text: inputText
      }),
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl || null;

  } catch (error) {
    console.error("Error requesting image:", error);
    throw error;
  }
};

export const generateInfographicPrompt = async (inputText: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'infographic_prompt',
        text: inputText
      }),
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt || "";
  } catch (error) {
    console.error("Error requesting prompt:", error);
    throw error;
  }
};