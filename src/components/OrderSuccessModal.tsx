import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import { RestaurantInfo } from '../types';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
  whatsappUrl: string;
  restaurant: RestaurantInfo;
  onReset: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  messageText,
  whatsappUrl,
  restaurant,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReopen = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDone = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 flex flex-col items-center text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pedido Gerado com Sucesso!</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            Seu pedido está pronto para envio!
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Abrimos o WhatsApp da <strong>{restaurant.name}</strong> com todos os detalhes prontos. Basta clicar em enviar!
          </p>
        </div>

        {/* WhatsApp Big CTA Button */}
        <div className="w-full space-y-2 pt-2">
          <button
            onClick={handleReopen}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Abrir WhatsApp Novamente</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-2xl border border-gray-200 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Mensagem copiada para a área de transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Copiar texto do pedido (caso precise colar)</span>
              </>
            )}
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="w-full text-left bg-pink-50/50 p-3 rounded-2xl border border-pink-100/70 max-h-36 overflow-y-auto text-[11px] font-mono text-gray-600 whitespace-pre-wrap">
          {messageText}
        </div>

        {/* Finish / Continue Button */}
        <button
          onClick={handleDone}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Continuar no Cardápio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
