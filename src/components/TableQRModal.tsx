import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Sparkles, Printer } from 'lucide-react';
import { VALID_TABLES } from '../utils/tableService';

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
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  if (!isOpen) return null;

  // Base URL for generating links and QR codes
  const getBaseOrigin = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }
    return '';
  };

  const baseOrigin = getBaseOrigin();

  const handleCopyLink = (tableNum: string) => {
    const tableUrl = `${baseOrigin}?origem=mesa&mesa=${tableNum}`;
    navigator.clipboard.writeText(tableUrl);
    setCopiedTable(tableNum);
    setTimeout(() => setCopiedTable(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Gerenciador de Mesas
                </span>
              </div>
              <h3 className="text-xl font-black leading-tight mt-0.5">
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
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-100 text-xs text-gray-700 leading-relaxed">
            <strong className="block text-pink-900 font-black mb-1">
              📱 Como funciona para os seus clientes:
            </strong>
            Ao apontar a câmera do celular para o QR Code da mesa correspondente, o site abre automaticamente identificado como <strong>"PEDIDO NA MESA"</strong>, sem cobrar taxa de entrega nem pedir endereço. O pedido é enviado diretamente para o WhatsApp com o número da mesa!
          </div>

          {/* Grid of the 4 tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALID_TABLES.map((tableNum) => {
              const tableUrl = `${baseOrigin}?origem=mesa&mesa=${tableNum}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                tableUrl
              )}`;
              const isCurrent = currentTable === tableNum;

              return (
                <div
                  key={tableNum}
                  className={`p-4 rounded-3xl border transition-all ${
                    isCurrent
                      ? 'border-pink-500 bg-pink-50/50 shadow-md ring-2 ring-pink-500/20'
                      : 'border-pink-100 bg-white hover:border-pink-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-sm flex items-center justify-center">
                        {tableNum}
                      </span>
                      <div>
                        <h4 className="font-black text-gray-900 text-base leading-none">
                          Mesa {tableNum}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium">
                          ?origem=mesa&mesa={tableNum}
                        </span>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-black bg-pink-600 text-white px-2 py-0.5 rounded-full uppercase">
                        Ativa Agora
                      </span>
                    )}
                  </div>

                  {/* QR Code Preview */}
                  <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl border border-pink-100 shadow-2xs flex items-center justify-center mb-3">
                    <img
                      src={qrImageUrl}
                      alt={`QR Code Mesa ${tableNum}`}
                      className="w-full h-full object-contain rounded-xl"
                      loading="lazy"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(tableNum)}
                      className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedTable === tableNum ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTableForTesting(tableNum);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Testar Mesa</span>
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
            <span>Imprimir QR Codes</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-extrabold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
