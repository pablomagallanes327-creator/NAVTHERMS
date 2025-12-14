import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: API_KEY not configured' });
  }

  const { action, text } = req.body;
  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. TRADUCCIÓN SIMPLIFICADA
    if (action === 'translate') {
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          traduccionSimplificada: {
            type: Type.STRING,
            description: "Explicación simple del texto para un cadete, máximo 80 palabras."
          },
          listaPorPasos: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de pasos si el texto describe un procedimiento. Array vacío si no aplica.",
            nullable: true
          },
          glosario: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                termino: { type: Type.STRING, description: "El término técnico o jerga naval." },
                definicion: { type: Type.STRING, description: "La definición simplificada del término." }
              },
              required: ["termino", "definicion"]
            },
            description: "Glosario con un máximo de 5 términos y sus definiciones. Array vacío si no aplica.",
            nullable: true
          },
          error: {
              type: Type.STRING,
              description: "Mensaje de error si la información no se encuentra en el texto proporcionado. Ejemplo: 'No tengo información sobre ese tema en el documento proporcionado.'",
              nullable: true
          }
        },
        required: ["traduccionSimplificada"]
      };

      const prompt = `
      Eres un instructor naval experto y traductor de jerga técnica. Tu misión es ayudar a cadetes nuevos, sin experiencia técnica, a entender párrafos de manuales navales. Tu tono debe ser claro, didáctico y alentador.

      Analiza el siguiente texto de un manual naval y proporciona una respuesta estructurada en formato JSON. Basa tu respuesta *exclusivamente* en la información contenida en el texto proporcionado.

      Texto del manual:
      """
      ${text}
      """

      Tu respuesta debe seguir estas reglas estrictas:
      1.  **traduccionSimplificada**: Proporciona una explicación del texto en lenguaje simple y directo, como si se lo explicaras a un cadete novato. Esta explicación no debe superar las 80 palabras.
      2.  **listaPorPasos**: Si el texto describe un procedimiento o una secuencia de acciones, extráelo y preséntalo como una lista de pasos cortos y claros. Si no hay un procedimiento, omite este campo o déjalo como un array vacío.
      3.  **glosario**: Identifica un máximo de 5 términos técnicos o jerga naval clave del texto. Para cada término, proporciona una definición muy breve y fácil de entender. Si no hay términos técnicos claros, omite este campo o déjalo como un array vacío.
      4.  **Control de Información**: Si el texto de entrada no contiene suficiente información para responder o para extraer los elementos solicitados, tu respuesta JSON debe contener un campo 'error' con el valor "No tengo información sobre ese tema en el documento proporcionado.". No inventes información.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      
      let jsonText = response.text.trim();
      // Limpiar bloques de código markdown si el modelo los incluye por error
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
      }

      return res.status(200).json(JSON.parse(jsonText));
    }

    // 2. EXPLICACIÓN VISUAL
    else if (action === 'visual_explanation') {
      const prompt = `
        Genera una ilustración técnica educativa, estilo diagrama de manual, para explicar visualmente el siguiente concepto naval a un cadete. 
        
        Reglas estrictas de la imagen:
        1. Estilo: Diagrama técnico limpio, claro y esquemático.
        2. Contenido: Representación visual del concepto.
        3. PROHIBIDO TEXTO: La imagen NO debe contener absolutamente nada de texto, palabras, letras, números ni etiquetas. Solo la ilustración gráfica pura.
        
        Concepto a ilustrar:
        ${text}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
      return res.status(200).json({ imageUrl });
    }

    // 3. PROMPT INFOGRAFÍA
    else if (action === 'infographic_prompt') {
      const prompt = `
        Actúa como un ingeniero de prompts experto para IA generativa de imágenes (como Midjourney, DALL-E 3 o Imagen).
        
        Tu tarea es escribir un PROMPT TÉCNICO DETALLADO EN ESPAÑOL para generar una INFOGRAFÍA PROFESIONAL basada en el siguiente texto naval.
        
        Reglas para la redacción del prompt:
        1.  **Idioma del Prompt**: El texto del prompt debe estar COMPLETAMENTE EN ESPAÑOL.
        2.  **Contenido de la Infografía**: Describe una infografía que contenga explicaciones visuales y textuales. Especifica explícitamente: "Texto en la imagen en ESPAÑOL, etiquetas claras en ESPAÑOL, títulos en ESPAÑOL".
        3.  **Estilo**: Solicita un estilo de "Infografía corporativa técnica", "Alta resolución", "Diseño limpio y moderno".
        4.  **Negative Prompt**: Incluye al final del prompt una sección obligatoria que diga: 
            "--no English text, text in english, foreign text, gibberish, blurry text, watermarks".
        
        Estructura sugerida para el prompt que generarás:
        "[Descripción del tema central] + [Estilo visual detallado] + [Instrucción de texto en Español] + [Paleta de colores] + [Negative Prompt]"

        Texto naval base para la infografía:
        "${text}"

        SALIDA: Devuelve únicamente el texto del prompt generado.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return res.status(200).json({ prompt: response.text.trim() });
    }
    
    else {
      return res.status(400).json({ error: 'Acción no válida' });
    }

  } catch (error) {
    console.error("Error en API:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Error desconocido" });
  }
}