import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Printer, Download, Globe, AlertCircle, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { VALID_TABLES, getRecommendedBaseUrl, DEFAULT_PUBLIC_URL } from '../utils/tableService';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: string | null;
  onSelectTableForTesting: (table: string) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onSelectTableForTesting,
}) => {
  const [baseUrl, setBaseUrl] = useState<string>(() => getRecommendedBaseUrl());
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState(false);

  // Clean base URL (remove trailing slashes)
  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');

  // Generate QR code data URLs locally via qrcode package whenever cleanBaseUrl changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      for (const tableNum of VALID_TABLES) {
        const fullUrl = `${cleanBaseUrl}?origem=mesa&mesa=${tableNum}`;
        try {
          const dataUrl = await QRCode.toDataURL(fullUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1f2937', // dark slate
              light: '#ffffff', // pure white background
            },
            errorCorrectionLevel: 'M',
          });
          if (isMounted) {
            generated[tableNum] = dataUrl;
          }
        } catch (err) {
          console.error(`Erro ao gerar QR Code para mesa ${tableNum}:`, err);
        }
      }
      if (isMounted) {
        setQrImages(generated);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [cleanBaseUrl, isOpen]);

  if (!isOpen) return null;

  const getTableUrl = (tableNum: string) => {
    return `${cleanBaseUrl}?origem=mesa&mesa=${tableNum}`;
  };

  const handleCopyLink = (tableNum: string) => {
    const tableUrl = getTableUrl(tableNum);
    navigator.clipboard.writeText(tableUrl);
    setCopiedTable(tableNum);
    setTimeout(() => setCopiedTable(null), 2500);
  };

  const handleDownloadQR = (tableNum: string) => {
    const dataUrl = qrImages[tableNum];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_Code_Mesa_${tableNum}_Clash_Burguer.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const isDevUrl = cleanBaseUrl.includes('ais-dev-') || cleanBaseUrl.includes('localhost');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Gerenciador de QR Codes
                </span>
                <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
                  4 Mesas Cadastradas
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black leading-tight mt-0.5">
                QR Codes das Mesas (01 a 04)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Explanation Alert */}
          <div className="bg-pink-50/80 p-3.5 sm:p-4 rounded-2xl border border-pink-100 text-xs text-gray-700 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-pink-900 font-black text-xs sm:text-sm mb-0.5">
                  📱 Como funciona o pedido na mesa:
                </strong>
                <span>
                  O cliente aponta a câmera para a plaquinha da mesa. O site abre com o aviso{' '}
                  <strong className="text-pink-700">"PEDIDO NA MESA"</strong>, oculta endereço e taxa de entrega, e no WhatsApp já envia identificado como{' '}
                  <code className="bg-pink-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-pink-800">
                    🍔 PEDIDO NA MESA | Mesa: 01
                  </code>.
                </span>
              </div>
            </div>
          </div>

          {/* Test & Security explanation for mobile preview */}
          <div className="bg-amber-50/90 border border-amber-200 p-3.5 sm:p-4 rounded-2xl text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <strong className="block text-amber-950 font-black text-xs sm:text-sm">
                  💡 Viu uma mensagem de segurança ou tela de autorização ao escanear com a câmera?
                </strong>
                <p className="text-[12px] leading-relaxed text-amber-900">
                  Isso acontece porque este link atual (<code className="bg-amber-100/80 px-1 rounded text-[11px] font-mono">ais-pre-...run.app</code>) é o ambiente de desenvolvimento privado do Google AI Studio. O Google exige autorização de cookies ou login da sua conta de desenvolvedor (<code className="font-semibold text-amber-950">clashburguerr@gmail.com</code>) para visualizar o pré-lançamento.
                </p>
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <span className="font-bold text-amber-950">Como testar perfeitamente:</span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900">
                    <li>
                      <strong>Teste imediato no navegador:</strong> Clique no botão <em>"Testar Mesa 01 Agora"</em> logo abaixo para ver o cardápio identificar a mesa instantaneamente.
                    </li>
                    <li>
                      <strong>No seu celular:</strong> Se escanear pela câmera, basta clicar em <em>"Close and continue"</em> ou fazer login com sua conta Google vinculada.
                    </li>
                    <li>
                      <strong>No restaurante (em produção):</strong> Quando o cardápio estiver no seu domínio definitivo (ex: <em>clashburguer.com.br</em>), nenhum cliente verá telas de login do Google; ele abrirá direto na hora!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Base URL Configuration Section */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-gray-800">
                <Globe className="w-4 h-4 text-pink-600" />
                <span>Link Base do Cardápio para os QR Codes:</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomUrlOpen(!isCustomUrlOpen)}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-bold underline cursor-pointer self-start sm:self-auto"
              >
                {isCustomUrlOpen ? 'Ocultar ajuste de URL' : 'Alterar / Conferir URL'}
              </button>
            </div>

            {/* Warning if base URL is private dev URL */}
            {isDevUrl && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Atenção:</strong> Usando o link público compartilhado para que celulares externos consigam acessar sem pedir senha do Google.
                </span>
              </div>
            )}

            {isCustomUrlOpen ? (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://sua-url-do-cardapio.com"
                  className="w-full p-2.5 bg-white text-xs sm:text-sm font-mono rounded-xl border border-gray-300 focus:border-pink-500 outline-hidden"
                />
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBaseUrl(DEFAULT_PUBLIC_URL)}
                    className="px-2.5 py-1 bg-pink-100 text-pink-800 hover:bg-pink-200 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Usar Link Público Oficial (ais-pre)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        setBaseUrl(`${window.location.origin}${window.location.pathname.replace(/\/+$/, '')}`);
                      }
                    }}
                    className="px-2.5 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Usar URL Atual do Navegador
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-gray-600 truncate bg-white p-2 rounded-xl border border-gray-200">
                {cleanBaseUrl}
              </div>
            )}
          </div>

          {/* Grid of the 4 tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALID_TABLES.map((tableNum) => {
              const fullUrl = getTableUrl(tableNum);
              const dataUrl = qrImages[tableNum];
              const isCurrent = currentTable === tableNum;

              return (
                <div
                  key={tableNum}
                  className={`p-4 rounded-3xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-pink-500 bg-pink-50/50 shadow-md ring-2 ring-pink-500/20'
                      : 'border-pink-100 bg-white hover:border-pink-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Table Title and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {tableNum}
                        </span>
                        <div>
                          <h4 className="font-black text-gray-900 text-base leading-none">
                            Mesa {tableNum}
                          </h4>
                          <span className="text-[10px] text-pink-600 font-bold">
                            Mesa Cadastrada
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] font-black bg-pink-600 text-white px-2 py-0.5 rounded-full uppercase">
                          Ativa
                        </span>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="w-full aspect-square bg-white p-2.5 rounded-2xl border border-pink-100 shadow-2xs flex items-center justify-center mb-3 group relative">
                      {dataUrl ? (
                        <img
                          src={dataUrl}
                          alt={`QR Code Mesa ${tableNum}`}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                          <QrCode className="w-8 h-8 animate-pulse text-pink-400" />
                          <span className="text-[10px]">Gerando QR...</span>
                        </div>
                      )}
                    </div>

                    {/* Full link representation */}
                    <div className="mb-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="block text-[9px] uppercase font-bold text-gray-400">
                        Link de Acesso:
                      </span>
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-pink-700 hover:underline break-all line-clamp-2"
                        title={fullUrl}
                      >
                        ?origem=mesa&mesa={tableNum}
                      </a>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(tableNum)}
                        className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Copiar URL completa"
                      >
                        {copiedTable === tableNum ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 text-[11px]">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copiar Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadQR(tableNum)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Baixar imagem PNG do QR Code"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Baixar PNG</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTableForTesting(tableNum);
                        onClose();
                      }}
                      className="w-full p-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-opacity cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Testar Mesa {tableNum} Agora</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-pink-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-700 text-xs font-bold hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-pink-600" />
            <span>Imprimir Placas de Mesa</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-extrabold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
