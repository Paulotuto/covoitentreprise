# 🚗 Covoit'Entreprise

**Covoit'Entreprise** est une plateforme intelligente de covoiturage corporate conçue pour optimiser les déplacements professionnels. Elle permet aux collaborateurs d'une même entreprise d'organiser et de partager leurs trajets vers des réunions, des conférences ou des événements d'entreprise de manière simple, écologique et collaborative.

---

## ✨ Fonctionnalités Clés

- **🏠 Landing Page Dynamique :** Présentation du concept et des avantages du covoiturage en entreprise.
- **🔐 Authentification Multi-tenant :** Système d'inscription et de connexion segmenté par entreprise.
- **🛡️ Dashboard Administrateur :** Validation manuelle des nouveaux employés par l'administrateur de l'entreprise pour garantir la sécurité.
- **📅 Gestion des Événements :** Visualisation des réunions à venir et des options de covoiturage disponibles.
- **🚘 Système de Carpooling :** Proposez votre véhicule ou réservez une place dans la voiture d'un collègue en un clic.
- **💬 Discussions en Temps Réel :** 
  - Espace de discussion global pour chaque événement.
  - Chat dédié à chaque véhicule pour coordonner les détails du trajet.
- **🔄 Rafraîchissement Automatique :** Mise à jour en temps réel des messages et des inscriptions (intervalles de 1s).

---

## 🛠️ Stack Technique

- **Frontend :** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Build Tool :** [Vite 7](https://vitejs.dev/)
- **Styling :** [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend & Auth :** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Real-time)
- **Routing :** [Vue Router 4](https://router.vuejs.org/)

---

## 🚀 Installation et Configuration

### 1. Cloner le projet
```bash
git clone git@github.com:Paulotuto/covoitentreprise.git
cd covoitentreprise
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet et ajoutez vos identifiants Supabase :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

---

## 📸 Aperçu de l'interface

Le projet utilise un design "Glassmorphism" moderne avec des animations fluides pour une expérience utilisateur premium.

---

## 📝 Licence

Ce projet est sous licence MIT.
