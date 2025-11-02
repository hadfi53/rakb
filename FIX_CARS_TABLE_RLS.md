# Fix RLS Policies for Cars Table

## Problème identifié

La table `cars` a une politique RLS qui limite l'accès uniquement aux utilisateurs authentifiés (`TO authenticated`). Cela empêche les visiteurs anonymes de voir les voitures disponibles.

## Solution : Mettre à jour la politique RLS

Exécutez cette requête SQL dans l'éditeur SQL de Supabase :

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Anyone can view available cars" ON public.cars;

-- Créer une nouvelle politique qui permet à tous (y compris les utilisateurs anonymes) de voir les voitures disponibles
CREATE POLICY "Anyone can view available cars"
ON public.cars FOR SELECT
TO public
USING (available = true);

-- Garder les autres politiques pour l'authentification
-- Les utilisateurs authentifiés peuvent créer leurs propres voitures
DROP POLICY IF EXISTS "Users can create their own cars" ON public.cars;
CREATE POLICY "Users can create their own cars"
ON public.cars FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Les utilisateurs authentifiés peuvent modifier leurs propres voitures
DROP POLICY IF EXISTS "Users can update their own cars" ON public.cars;
CREATE POLICY "Users can update their own cars"
ON public.cars FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Les utilisateurs authentifiés peuvent supprimer leurs propres voitures
DROP POLICY IF EXISTS "Users can delete their own cars" ON public.cars;
CREATE POLICY "Users can delete their own cars"
ON public.cars FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
```

## Vérification

Après avoir exécuté ces commandes, testez :

1. Ouvrez le site en navigation privée (non connecté)
2. Essayez de voir la liste des voitures
3. Les voitures devraient maintenant s'afficher

## Note importante

Si vous avez encore des problèmes, vérifiez que :
- La table `cars` existe bien
- Les données dans `cars` ont `available = true`
- Aucune autre politique RLS n'interfère

Pour voir toutes les politiques RLS actuelles :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cars';
```
