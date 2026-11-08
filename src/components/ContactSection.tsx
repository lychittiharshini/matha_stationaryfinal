import React from 'react';
import {
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Share2,
  Bookmark,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { ShopSettings, SocialMediaAccount } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ContactSectionProps {
  settings: ShopSettings;
  socialAccounts: SocialMediaAccount[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings, socialAccounts }) => {
  const { language, t } = useLanguage();

  const activeSocials = socialAccounts.filter((s) => s.isActive);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'pinterest':
        return <Bookmark className="w-4 h-4 text-red-500" />;
      default:
        return <Share2 className="w-4 h-4 text-[#1F3B2E]" />;
    }
  };

  return (
    <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* 9. Contact Section: Get in Touch with Us */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8C7AA] shadow-sm">
        <h2 className="font-brand-title font-bold text-xl sm:text-2xl text-[#1F3B2E] tracking-tight mb-6 pb-3 border-b border-[#F7F3EB]">
          {t.contactHeading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Phone Number */}
          <div className="p-4 rounded-2xl bg-[#F7F3EB] border border-[#D8C7AA] flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-[#1F3B2E] mb-2">
              <Phone className="w-4 h-4 text-[#1F3B2E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3B2E]/70">
                {t.phoneLabel}
              </span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1F3B2E] block">{settings.phone}</span>
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="text-[11px] font-bold text-[#1F3B2E] hover:underline mt-1 inline-block"
              >
                Call Now →
              </a>
            </div>
          </div>

          {/* WhatsApp Contact */}
          <div className="p-4 rounded-2xl bg-[#F7F3EB] border border-[#D8C7AA] flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-emerald-700 mb-2">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3B2E]/70">
                {t.whatsappLabel}
              </span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1F3B2E] block">{settings.whatsapp}</span>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=Hello%20SREE%20DURGA%20MATA`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-800 hover:underline mt-1 inline-block"
              >
                Chat on WhatsApp →
              </a>
            </div>
          </div>

          {/* Gmail Address */}
          <div className="p-4 rounded-2xl bg-[#F7F3EB] border border-[#D8C7AA] flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-[#1F3B2E] mb-2">
              <Mail className="w-4 h-4 text-[#1F3B2E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3B2E]/70">
                {t.emailLabel}
              </span>
            </div>
            <div>
              <a
                href={`mailto:${settings.email}`}
                className="text-xs font-bold text-[#1F3B2E] hover:underline block break-all"
              >
                {settings.email}
              </a>
              <span className="text-[10px] text-[#1F3B2E]/60 block mt-1">Official Enquiry</span>
            </div>
          </div>

          {/* Store Timings */}
          <div className="p-4 rounded-2xl bg-[#F7F3EB] border border-[#D8C7AA] flex flex-col justify-between">
            <div className="flex items-center gap-2.5 text-[#1F3B2E] mb-2">
              <Clock className="w-4 h-4 text-[#1F3B2E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3B2E]/70">
                {t.timingsLabel}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#1F3B2E] block leading-snug">
                {settings.openingHours}
              </span>
              <span className="text-[10px] text-[#1F3B2E]/60 block mt-1">Open All 7 Days</span>
            </div>
          </div>
        </div>

        {/* Dynamic Social Media Accounts (Managed from Admin Portal) */}
        {activeSocials.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#F7F3EB]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F3B2E]/70 block mb-3">
              {t.socialLabel}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {activeSocials.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F3EB] hover:bg-[#E8DCC6] border border-[#D8C7AA] text-xs font-bold text-[#1F3B2E] transition-colors"
                >
                  {getPlatformIcon(soc.platform)}
                  <span>{soc.accountName}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 10. Google Maps Section (Directly below contact section) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8C7AA] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-start sm:items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1F3B2E] shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-xs font-bold text-[#1F3B2E]">
              {settings.address}
            </span>
          </div>

          <a
            href={settings.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#1F3B2E] hover:text-[#2C5241] underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#D8C7AA] bg-[#E8DCC6]/30">
          <iframe
            title="SREE DURGA MATA Location Map"
            src="https://maps.google.com/maps?q=H.+No.+69,+Ilapur+Rd,+Durgamata+Colony,+Hyderabad,+Telangana+502032&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
};
