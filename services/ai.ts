import { GoogleGenAI, Modality } from "@google/genai";

// Inicializa o cliente com a API Key do ambiente
// Nota: Em produção, certifique-se de que a chave está restrita ou use um backend proxy.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const aiService = {
  /**
   * Gera um script de mensagem baseado em parâmetros
   */
  generateScriptStream: async function* (
    tipo: string,
    tom: string,
    contexto: string,
    useSearch: boolean = false
  ) {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Aja como um especialista em Copywriting e Vendas para um sistema de IPTV/Streaming.
      Crie uma mensagem curta, direta e eficaz para WhatsApp.
      
      Objetivo: ${tipo}
      Tom de voz: ${tom}
      Contexto adicional: ${contexto}
      
      Regras:
      - Use emojis com moderação.
      - Não use hashtags.
      - Foque na conversão ou resolução do problema.
      - Se for cobrança, seja firme mas educado.
      - Se for venda, foque nos benefícios (futebol, filmes, sem travamento).
      ${useSearch ? '- Use informações atualizadas sobre eventos esportivos, lançamentos de filmes ou notícias relevantes para tornar a mensagem mais impactante.' : ''}
    `;

    try {
      const config: any = {
        temperature: 0.7, // Criatividade balanceada
        maxOutputTokens: 500,
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const responseStream = await ai.models.generateContentStream({
        model: model,
        contents: prompt,
        config: config
      });

      for await (const chunk of responseStream) {
        yield chunk.text;
      }
    } catch (error) {
      console.error("Erro ao gerar script:", error);
      yield "Erro: Não foi possível conectar ao Storm AI. Verifique sua API Key.";
    }
  },

  /**
   * Gera uma imagem baseada em um prompt
   */
  generateImage: async (
    prompt: string, 
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "1:8" | "4:1" | "8:1" = "1:1",
    imageSize: "512px" | "1K" | "2K" | "4K" = "1K"
  ): Promise<string | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: `Crie uma imagem profissional para marketing de IPTV/Streaming: ${prompt}. Estilo moderno, alta resolução, cores vibrantes.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      return null;
    }
  },

  /**
   * Conecta ao Live API para conversas em tempo real
   */
  connectLive: (callbacks: any) => {
    return ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: "Você é o Storm AI, um assistente de voz inteligente para o Storm CRM. Ajude o usuário a gerenciar seus clientes de IPTV, leads e vendas de forma rápida e amigável. Fale de forma natural e profissional.",
      },
    });
  },

  /**
   * Analisa um motivo de não conversão e sugere melhoria
   */
  analyzeObjection: async (objection: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `O cliente não comprou pelo seguinte motivo: "${objection}". 
        Dê uma dica de 1 frase curta para contornar essa objeção no futuro.`
      });
      return response.text;
    } catch (error) {
      return "Não foi possível analisar.";
    }
  }
};