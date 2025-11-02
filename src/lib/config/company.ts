/**
 * Configuration centralisée des informations de la company RAKB
 * Mettez à jour ce fichier pour changer les informations partout dans l'application
 */

export const companyInfo = {
  name: "RAKB",
  fullName: "RAKB - Location de Véhicules au Maroc",
  
  // Contact
  email: "contact@rakb.ma",
  phone: "+212 6 00 00 00 00",
  phoneFormatted: "+212 6 00 00 00 00",
  phoneDisplay: "+212 6 00 00 00 00",
  
  // Adresse
  address: {
    street: "123 Avenue Mohammed V",
    city: "Casablanca",
    country: "Maroc",
    full: "123 Avenue Mohammed V, Casablanca, Maroc"
  },
  
  // Horaires d'ouverture
  businessHours: {
    weekdays: "Du lundi au vendredi, de 9h à 18h",
    weekend: "Samedi de 9h à 13h",
    emergency: "Service d'urgence 24/7"
  },
  
  // Social Media
  social: {
    facebook: "https://facebook.com/rakb.ma",
    twitter: "https://twitter.com/rakb_ma",
    instagram: "https://instagram.com/rakb.ma",
    linkedin: "https://linkedin.com/company/rakb"
  },
  
  // Autres
  website: "https://rakb.ma",
  supportEmail: "support@rakb.ma",
  legalEmail: "legal@rakb.ma"
};

/**
 * Helper pour obtenir le lien tel: pour les numéros de téléphone
 */
export const getPhoneLink = (phone: string = companyInfo.phone) => {
  return `tel:${phone.replace(/\s/g, "")}`;
};

/**
 * Helper pour obtenir le lien mailto: pour les emails
 */
export const getEmailLink = (email: string = companyInfo.email) => {
  return `mailto:${email}`;
};

