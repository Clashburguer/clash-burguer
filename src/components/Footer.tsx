import { Phone, Clock, Bike, Instagram, Heart, FileText, QrCode, DollarSign } from 'lucide-react';
import { RestaurantInfo } from '../types';
import clashLogo from '../assets/images/clash_burguer_king_princess_logo_1792257605760.jpg';

interface FooterProps {
  restaurant: RestaurantInfo;
  onOpenFlyer: () => void;
  onOpenQRModal?: () => void;
  onOpenCashRegister?: () => void;
  showAdminControls?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  restaurant,
  onOpenFlyer,
  onOpenQRModal,
  onOpenCashRegister,
  showAdminControls = false,
}) => {
  return (
    <footer className="bg-white border-t border-pink-100 mt-16 pt-12 pb-24 sm:pb-12 text-gray-600">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-500 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src={clashLogo}
                  alt="Clash Burguer Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Clash <span className="text-pink-600">Burguer</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed">
              Os melhores hambúrgueres artesanais smash no pão brioche amanteigado e a tradição inconfundível do Kikão teféense. Peça pelo cardápio digital e receba rapidinho!
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={restaurant.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-bold transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{restaurant.instagram}</span>
              </a>
              <a
                href={restaurant.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-bold transition-colors"
              >
                <span>TikTok: {restaurant.tiktok}</span>
              </a>
            </div>
          </div>

          {/* Delivery & Hours */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Informações de Entrega
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Bike className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Taxa de Entrega:</span>
                  <span>R$ {restaurant.deliveryFee.toFixed(2).replace('.', ',')} para toda a região</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Tempo Médio:</span>
                  <span>{restaurant.deliveryTime}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Horário:</span>
                  <span>{restaurant.openingHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Orders */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
              Pedidos & WhatsApp
            </h3>
            <p className="text-xs text-gray-500">
              Dúvidas ou encomendas especiais? Fale diretamente com nossa equipe no WhatsApp:
            </p>
            <a
              href={`https://wa.me/${restaurant.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-pink-500/20 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{restaurant.phoneFormatted}</span>
            </a>
            <div className="pt-2 flex flex-col gap-1.5">
              <button
                onClick={onOpenFlyer}
                className="text-xs text-pink-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Panfleto Digital Clash Burguer</span>
              </button>
              {/* Ferramentas do Administrador (Exclusivo do Studio / Admin - Invisível para Clientes) */}
              {showAdminControls && onOpenQRModal && (
                <button
                  onClick={onOpenQRModal}
                  className="text-xs text-gray-700 hover:text-pink-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-pink-600" />
                  <span>QR Codes das Mesas (01 a 04)</span>
                </button>
              )}
              {showAdminControls && onOpenCashRegister && (
                <button
                  onClick={onOpenCashRegister}
                  className="mt-1 text-xs text-pink-700 hover:text-pink-800 font-bold inline-flex items-center gap-1.5 cursor-pointer bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl border border-pink-200 transition-colors w-fit"
                >
                  <DollarSign className="w-3.5 h-3.5 text-pink-600" />
                  <span>Fechamento de Caixa (Administração)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom micro notice */}
        <div className="pt-8 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} {restaurant.name}. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> para {restaurant.name}
          </p>
        </div>
      </div>
    </footer>
  );
};
