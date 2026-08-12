import { ChefHat, Mail, Phone } from "lucide-react";
import { KEYS } from "../utils/keys";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background py-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <ChefHat size={22} className="text-white" />
            </div>
            <p className="text-sm text-gray-400">
              © {year} ChopMe. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={`tel:${KEYS.CONTACT_PHONE_NUMBER}`}
              className="inline-flex items-center gap-2.5 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
                <Phone size={16} />
              </span>
              <span>{KEYS.CONTACT_PHONE_NUMBER}</span>
            </a>
            <a
              href={`mailto:${KEYS.CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2.5 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
                <Mail size={16} />
              </span>
              <span>{KEYS.CONTACT_EMAIL}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
