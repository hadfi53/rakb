# Système de notification par email pour Rakeb

Ce document explique comment configurer et utiliser le système de notification par email de Rakeb.

## Configuration de la base de données

Pour que le système d'email fonctionne correctement, vous devez créer les tables nécessaires dans votre base de données Supabase. Suivez ces étapes :

1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans la section "SQL Editor"
3. Créez une nouvelle requête
4. Copiez et collez le code SQL suivant :

```sql
-- Création de l'extension uuid-ossp si elle n'existe pas déjà
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table email_logs pour stocker les logs d'emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  related_id UUID,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table email_queue pour stocker les emails en attente d'envoi
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ updated_at automatiquement
CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Accorder les permissions nécessaires
GRANT ALL ON public.email_queue TO authenticated;
GRANT ALL ON public.email_logs TO authenticated;
```

5. Exécutez la requête en cliquant sur le bouton "Run"

## Utilisation du système d'email

Le système d'email de Rakeb comprend les composants suivants :

1. **EmailService** : Service principal pour envoyer et gérer les emails
2. **EmailProcessor** : Composant qui traite périodiquement les emails en file d'attente
3. **EmailDashboard** : Interface d'administration pour gérer les emails (accessible uniquement aux administrateurs)

### Ajouter un email à la file d'attente

```typescript
import { EmailService } from '@/services/email-service';

// Ajouter un email à la file d'attente
await EmailService.queueCustomEmail(
  'destinataire@example.com',
  'Sujet de l\'email',
  '<p>Contenu HTML de l\'email</p>',
  'Contenu texte de l\'email',
  'id-de-reference', // Optionnel
  'type-de-reference' // Optionnel
);
```

### Traiter manuellement les emails en file d'attente

```typescript
import { EmailService } from '@/services/email-service';

// Traiter jusqu'à 10 emails en file d'attente
const nombreTraites = await EmailService.processEmailQueue(10);
console.log(`${nombreTraites} emails traités`);
```

### Accéder au tableau de bord des emails

Le tableau de bord des emails est accessible à l'URL `/admin/emails` pour les utilisateurs ayant le rôle d'administrateur.

## Dépannage

Si vous rencontrez des erreurs liées aux tables d'email, assurez-vous que :

1. Vous avez exécuté le script SQL pour créer les tables
2. Votre utilisateur a les permissions nécessaires pour accéder aux tables
3. Les noms des tables et des colonnes correspondent à ceux utilisés dans le code

Pour plus d'informations, consultez les logs de l'application. 