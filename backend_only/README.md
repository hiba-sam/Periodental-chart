# Analyse du Backend, de la Base de Données et des Routes API

Ce dossier contient une extraction exclusive de la logique backend et base de données du projet :
- Schema de base de données (`init.sql`)
- Configuration de connexion à la DB (`db.ts`)
- Routes API Next.js (`api/`)

## 1. Conception de Données et Base de Données (PostgreSQL)
La base de données utilise PostgreSQL (via le paquet `pg`). Le fichier `init.sql` définit la structure relationnelle avec trois tables principales :
- **`patients`** : Stocke les informations de base des patients (`id`, `first_name`, `last_name`, `date_of_birth`).
- **`chart_exams`** : Gère l'historique des examens par patient (`id`, `patient_id`, `exam_date`, `exam_type`), permettant d'avoir des examens initiaux ou de réévaluation.
- **`tooth_sites`** : Contient toutes les données parodontales pour un site donné (profondeur de sondage, récession, attache, saignement, etc). Elle est liée au `patient_id` et potentiellement à l'`exam_id`.

## 2. Routes API Next.js 
Les routes backend extraites comprennent :
- **`/api/patients`**
  - `GET` : Récupère tous les patients existants.
  - `POST` : Crée un nouveau patient.
- **`/api/tooth-sites/batch`**
  - `POST` : Sauvegarde groupée des données de la charte parodontale.

## 3. Mise à jour de la logique de "Batch Saving"
Initialement, la route `/api/tooth-sites/batch/route.ts` supprimait tout l'historique d'un patient avant de sauvegarder.
La logique a été modifiée pour préserver l'historique (`chart_exams`) :
1. Recherche d'un examen (`chart_exams`) pour le patient à la **date du jour**.
2. S'il existe : on supprime uniquement les relevés (`tooth_sites`) de **cet examen spécifique** et on les remplace.
3. S'il n'existe pas : on **crée un nouvel examen** à la date du jour et on y attache les relevés.
Cela permet de conserver les anciennes données parodontales dans le temps pour comparer l'évolution.
