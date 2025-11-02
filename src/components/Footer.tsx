import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { companyInfo, getPhoneLink, getEmailLink } from "@/lib/config/company";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* À propos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">À propos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Location</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/rent" className="text-gray-400 hover:text-white transition-colors">
                  Louer une voiture
                </Link>
              </li>
              <li>
                <Link to="/legal/insurance" className="text-gray-400 hover:text-white transition-colors">
                  Assurance
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white transition-colors">
                  Aide
                </Link>
              </li>
            </ul>
          </div>

          {/* Agences */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Agences</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/become-owner" className="text-gray-400 hover:text-white transition-colors">
                  Rejoindre en tant qu'agence
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/guide" className="text-gray-400 hover:text-white transition-colors">
                  Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-gray-400 hover:text-white transition-colors">
                  Urgence
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Contactez-nous</h4>
              <div className="space-y-2 text-gray-400">
                <a href={getEmailLink()} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>{companyInfo.email}</span>
                </a>
                <a href={getPhoneLink()} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>{companyInfo.phoneDisplay}</span>
                </a>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{companyInfo.address.city}, {companyInfo.address.country}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suivez-nous</h4>
              <div className="flex gap-4">
                {/* Social media links - Add real URLs when accounts are created */}
                <a 
                  href={companyInfo.social.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors" 
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a 
                  href={companyInfo.social.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors" 
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </a>
                <a 
                  href={companyInfo.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors" 
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a 
                  href={companyInfo.social.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors" 
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} RAKB. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link to="/legal/insurance" className="text-gray-400 hover:text-white transition-colors">
                Assurance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

