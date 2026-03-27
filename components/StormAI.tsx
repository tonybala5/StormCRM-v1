import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/ai';
import { Sparkles, Copy, RefreshCw, Send, Bot, MessageSquare, Image as ImageIcon, Mic, MicOff, Search, Download, Globe } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const StormAI: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'scripts' | 'images' | 'voice'>('scripts');
  
  // Scripts State
  const [tipo, setTipo] = useState('Vendas');
  const [tom, setTom] = useState('Persuasivo');
  const [contexto, setContexto] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [resultado, setResultado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Images State
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "1:8" | "4:1" | "8:1">('1:1');
  const [imageSize, setImageSize] = useState<"512px" | "1K" | "2K" | "4K">('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Voice State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState('Clique para iniciar conversa');
  const [isRecording, setIsRecording] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contexto.trim()) return;

    setIsLoading(true);
    setResultado('');
    setCopied(false);

    try {
      const stream = aiService.generateScriptStream(tipo, tom, contexto, useSearch);
      
      for await (const chunk of stream) {
        setResultado(prev => prev + (chunk || ''));
      }
    } catch (err) {
      setResultado("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await aiService.generateImage(imagePrompt, aspectRatio, imageSize);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        addToast('Imagem gerada com sucesso!', 'success');
      } else {
        addToast('Erro ao gerar imagem.', 'error');
      }
    } catch (err) {
      addToast('Erro ao conectar com o gerador de imagens.', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLive = async () => {
    if (isLive) {
      stopLive();
    } else {
      startLive();
    }
  };

  const startLive = async () => {
    try {
      setLiveStatus('Conectando...');
      
      // Setup Audio Context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      liveSessionRef.current = await aiService.connectLive({
        onopen: () => {
          setIsLive(true);
          setLiveStatus('Ouvindo...');
          startRecording();
        },
        onmessage: async (message: any) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            playAudioChunk(base64Audio);
          }
          if (message.serverContent?.interrupted) {
            // Handle interruption if needed
          }
        },
        onclose: () => {
          stopLive();
        },
        onerror: (err: any) => {
          console.error('Live Error:', err);
          addToast('Erro na conexão de voz.', 'error');
          stopLive();
        }
      });
    } catch (err) {
      console.error('Failed to start live:', err);
      addToast('Erro ao acessar microfone ou conectar.', 'error');
      stopLive();
    }
  };

  const stopLive = () => {
    setIsLive(false);
    setLiveStatus('Clique para iniciar conversa');
    setIsRecording(false);
    
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);

      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);

      processor.onaudioprocess = (e) => {
        if (!isLive || !liveSessionRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        liveSessionRef.current.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
    } catch (err) {
      console.error('Recording error:', err);
      addToast('Erro ao gravar áudio.', 'error');
    }
  };

  const playAudioChunk = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    
    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
    buffer.getChannelData(0).set(floatData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  useEffect(() => {
    return () => stopLive();
  }, []);

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
             <Bot className="w-8 h-8 text-storm-purple" />
             Storm AI
           </h2>
           <p className="text-text-secondary text-sm mt-1">
             Inteligência Artificial avançada para o seu negócio.
           </p>
        </div>

        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'scripts' ? 'bg-storm-purple text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <MessageSquare className="w-4 h-4" />
            Scripts
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'images' ? 'bg-storm-purple text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Imagens
          </button>
          <button 
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'voice' ? 'bg-storm-purple text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Mic className="w-4 h-4" />
            Voz (Beta)
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Left Panel: Configuration */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
          {activeTab === 'scripts' && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-lg">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Objetivo da Mensagem</label>
                  <select 
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
                  >
                    <option value="Vendas">Vendas / Oferta</option>
                    <option value="Cobranca">Cobrança / Renovação</option>
                    <option value="Suporte">Suporte Técnico</option>
                    <option value="Recuperacao">Recuperação de Ex-Cliente</option>
                    <option value="Boas-vindas">Boas-vindas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Tom de Voz</label>
                  <select 
                    value={tom}
                    onChange={(e) => setTom(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
                  >
                    <option value="Persuasivo">🔥 Persuasivo (Vendas)</option>
                    <option value="Profissional">👔 Profissional (Padrão)</option>
                    <option value="Amigavel">🤝 Amigável/Próximo</option>
                    <option value="Urgente">⏰ Urgente/Escassez</option>
                    <option value="Engraçado">😂 Descontraído/Engraçado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Contexto / Detalhes</label>
                  <textarea 
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    rows={4}
                    placeholder="Ex: Cliente Marcos, teste acabou ontem, oferecer plano trimestral com desconto."
                    className="w-full bg-bg-tertiary border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-storm-cyan" />
                    <span className="text-xs font-bold text-text-primary">Google Search Grounding</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setUseSearch(!useSearch)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${useSearch ? 'bg-storm-cyan' : 'bg-border'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useSearch ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !contexto.trim()}
                  className={`
                    w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
                    ${isLoading || !contexto.trim() ? 'bg-bg-tertiary text-text-secondary cursor-not-allowed' : 'bg-gradient-to-r from-storm-purple to-storm-cyan hover:shadow-lg hover:shadow-storm-purple/20'}
                  `}
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isLoading ? 'Gerando Mágica...' : 'Gerar Script'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-lg">
              <form onSubmit={handleGenerateImage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">O que você quer criar?</label>
                  <textarea 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={4}
                    placeholder="Ex: Um robô futurista assistindo futebol em uma TV 4K, estilo neon cyberpunk."
                    className="w-full bg-bg-tertiary border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Proporção</label>
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full bg-bg-tertiary border border-border rounded-lg p-2 text-sm text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
                    >
                      <option value="1:1">1:1 (Quadrado)</option>
                      <option value="9:16">9:16 (Stories)</option>
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="4:3">4:3 (Clássico)</option>
                      <option value="3:4">3:4 (Retrato)</option>
                      <option value="1:4">1:4 (Ultra Vertical)</option>
                      <option value="4:1">4:1 (Ultra Horizontal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Qualidade</label>
                    <select 
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as any)}
                      className="w-full bg-bg-tertiary border border-border rounded-lg p-2 text-sm text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
                    >
                      <option value="512px">512px (Rápido)</option>
                      <option value="1K">1K (Padrão)</option>
                      <option value="2K">2K (HD)</option>
                      <option value="4K">4K (Ultra HD)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className={`
                    w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
                    ${isGeneratingImage || !imagePrompt.trim() ? 'bg-bg-tertiary text-text-secondary cursor-not-allowed' : 'bg-gradient-to-r from-storm-purple to-storm-cyan hover:shadow-lg hover:shadow-storm-purple/20'}
                  `}
                >
                  {isGeneratingImage ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  {isGeneratingImage ? 'Criando Imagem...' : 'Gerar Imagem'}
                </button>
              </form>
              
              <div className="mt-4 p-3 bg-storm-cyan/10 border border-storm-cyan/20 rounded-lg">
                <p className="text-[10px] text-storm-cyan font-medium leading-tight">
                  As imagens são geradas usando o modelo Gemini 3.1 Flash Image Preview para máxima qualidade e fidelidade ao prompt.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-lg flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isLive ? 'bg-storm-purple shadow-[0_0_30px_rgba(168,85,247,0.5)] scale-110' : 'bg-bg-tertiary border border-border'}`}>
                {isLive ? <Mic className="w-10 h-10 text-white animate-pulse" /> : <MicOff className="w-10 h-10 text-text-secondary" />}
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-2">Conversa em Tempo Real</h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Fale com o Storm AI para tirar dúvidas, pedir dicas de vendas ou gerenciar seus dados usando apenas a voz.
              </p>

              <button 
                onClick={toggleLive}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all ${isLive ? 'bg-storm-red hover:bg-storm-red/90' : 'bg-storm-purple hover:bg-storm-purple/90 shadow-lg shadow-storm-purple/20'}`}
              >
                {isLive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isLive ? 'Encerrar Conversa' : 'Iniciar Conversa'}
              </button>
              
              <div className="mt-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-storm-green animate-ping' : 'bg-text-secondary'}`} />
                <span className="text-xs font-medium text-text-secondary">{liveStatus}</span>
              </div>
            </div>
          )}

          <div className="bg-storm-purple/10 border border-storm-purple/20 rounded-xl p-4">
            <p className="text-xs text-storm-purple/80 leading-relaxed">
              <strong>Storm AI v3.1:</strong> Agora com suporte a geração de imagens, busca em tempo real e conversas por voz.
            </p>
          </div>
        </div>

        {/* Right Panel: Result */}
        <div className="flex-1 flex flex-col bg-bg-secondary border border-border rounded-xl overflow-hidden relative shadow-2xl min-h-0">
          <div className="p-4 border-b border-border bg-bg-tertiary flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === 'scripts' && <MessageSquare className="w-5 h-5 text-text-secondary" />}
              {activeTab === 'images' && <ImageIcon className="w-5 h-5 text-text-secondary" />}
              {activeTab === 'voice' && <Mic className="w-5 h-5 text-text-secondary" />}
              <span className="font-semibold text-text-primary">
                {activeTab === 'scripts' ? 'Script Gerado' : activeTab === 'images' ? 'Galeria Storm' : 'Transcrição da Conversa'}
              </span>
            </div>
            {activeTab === 'scripts' && resultado && (
              <button 
                onClick={handleCopy}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-storm-cyan/10 text-storm-cyan hover:bg-storm-cyan/20 transition-colors flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            )}
            {activeTab === 'images' && generatedImage && (
              <a 
                href={generatedImage}
                download="storm-ai-image.png"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-storm-green/10 text-storm-green hover:bg-storm-green/20 transition-colors flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Baixar Imagem
              </a>
            )}
          </div>

          <div className="flex-1 p-6 relative overflow-y-auto bg-bg-primary/50">
            {activeTab === 'scripts' && (
              <>
                {!resultado && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary opacity-30 pointer-events-none">
                    <Sparkles className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Aguardando sua ideia...</p>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-text-primary leading-relaxed text-lg">
                  {resultado}
                  {isLoading && (
                    <span className="inline-block w-2 h-5 ml-1 align-middle bg-storm-purple animate-pulse"/>
                  )}
                </div>
              </>
            )}

            {activeTab === 'images' && (
              <div className="h-full flex flex-col items-center justify-center">
                {isGeneratingImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-storm-cyan border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary animate-pulse">Pintando sua obra de arte...</p>
                  </div>
                ) : generatedImage ? (
                  <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
                    <img 
                      src={generatedImage} 
                      alt="Gerada por Storm AI" 
                      className="w-full rounded-2xl shadow-2xl border border-border"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-text-secondary opacity-30">
                    <ImageIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Sua imagem aparecerá aqui</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                {isLive ? (
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-1 items-end h-12">
                      {[...Array(8)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-2 bg-storm-purple rounded-full animate-bounce" 
                          style={{ 
                            height: `${20 + Math.random() * 80}%`,
                            animationDelay: `${i * 0.1}s`
                          }} 
                        />
                      ))}
                    </div>
                    <p className="text-xl font-medium text-text-primary">Storm AI está ouvindo...</p>
                    <p className="text-sm text-text-secondary max-w-xs">
                      Experimente perguntar: "Como posso vender mais planos trimestrais?" ou "Quantos leads eu tenho hoje?"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-text-secondary opacity-30">
                    <Mic className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Inicie a conversa para ver a atividade</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === 'scripts' && resultado && !isLoading && (
             <div className="p-4 border-t border-border bg-bg-tertiary flex justify-end gap-3">
               <button onClick={() => setResultado('')} className="text-sm text-text-secondary hover:text-text-primary px-3 py-2">
                 Limpar
               </button>
               <button className="px-4 py-2 bg-storm-green hover:bg-storm-green/90 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
                 <Send className="w-4 h-4" />
                 Enviar no WhatsApp
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StormAI;
