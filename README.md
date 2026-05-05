# Taskora

**Organizează proiectele. Coordonează echipa. Livrează rezultate.**

Taskora este o platformă completă de management al proiectelor și task-urilor care combină organizarea proiectelor, atribuirea task-urilor și coordonarea echipei într-o singură aplicație intuitivă și eficientă.

## ✨ Caracteristici principale

### 📋 Management al proiectelor

- Creează și organizează proiecte cu deadline-uri clare
- Gestionează echipe și atribuie roluri
- Urmărește progresul proiectelor în timp real

### ✅ Gestionarea task-urilor

- Atribuie task-uri membrilor echipei
- Urmărește stadiul fiecărui task (de la început până la final)
- Organizează activitățile în funcție de priorități și deadline-uri

### 👥 Colaborare în echipă

- Spații de lucru colaborative
- Vizibilitate completă asupra activității echipei
- Notificări inteligente pentru actualizări

### 📧 Gestionarea newsletterelor

- Planifică și organizează newsletterele din cadrul proiectelor
- Coordonează campanii de comunicare

### 📊 Dashboard și statistici

- Dashboard personal pentru utilizatori individuali
- Statistici detaliate pentru manageri
- Vizualizări grafice cu Recharts

### 📅 Integrare calendar

- Vizualizare calendaristică a proiectelor și task-urilor
- Integrare cu FullCalendar

## 🚀 Tehnologii utilizate

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router
- **Stilizare**: Sass/SCSS
- **Backend**: Firebase
- **UI Components**: React Icons
- **Grafice**: Recharts
- **Calendar**: FullCalendar

## 🛠️ Instalare și configurare

### Cerințe preliminare

- Node.js (versiunea 18 sau mai nouă)
- npm sau yarn
- Cont Firebase pentru backend

### Pași de instalare

1. **Clonează repository-ul**

   ```bash
   git clone https://github.com/username/taskora.git
   cd taskora
   ```

2. **Instalează dependențele**

   ```bash
   npm install
   ```

3. **Configurează Firebase**
   - Creează un proiect Firebase în [Firebase Console](https://console.firebase.google.com/)
   - Activează Authentication și Firestore
   - Copiază configurația Firebase în `src/firebase/firebase.ts`

4. **Rulează aplicația în modul dezvoltare**

   ```bash
   npm run dev
   ```

5. **Construiește pentru producție**
   ```bash
   npm run build
   npm run preview
   ```

## 📁 Structura proiectului

```
taskora/
├── public/
│   └── assets/
│       └── images/
├── src/
│   ├── components/          # Componente reutilizabile
│   │   ├── AppMainBar.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── SideNav.tsx
│   ├── firebase/            # Configurație Firebase
│   ├── routes/              # Pagini și rute
│   │   ├── __root.tsx
│   │   ├── index.tsx        # Pagina principală
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── app/             # Rutele aplicației
│   │       ├── dashboard.tsx
│   │       ├── tasks.tsx
│   │       ├── projects.tsx
│   │       ├── employees.tsx
│   │       ├── teams.tsx
│   │       ├── calendar.tsx
│   │       ├── newsletters.tsx
│   │       └── settings.tsx
│   ├── styles/              # Stiluri SCSS
│   │   ├── main.scss
│   │   ├── variables.scss
│   │   ├── mixins.scss
│   │   └── components/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Funcționalități disponibile

### Pentru utilizatori individuali

- Dashboard personal pentru organizarea task-urilor
- Gestionarea priorităților
- Urmărirea progresului activităților

### Pentru echipe mici

- Spații de lucru colaborative
- Atribuirea și urmărirea task-urilor
- Vizibilitate asupra progresului echipei

### Pentru organizații

- Acces bazat pe roluri (manager, membru echipă)
- Statistici detaliate și dashboard-uri
- Gestionarea avansată a echipelor
- Structură organizată a proiectelor

## 🔧 Scripturi disponibile

- `npm run dev` - Rulează aplicația în modul dezvoltare
- `npm run build` - Construiește aplicația pentru producție
- `npm run lint` - Rulează ESLint pentru verificarea codului
- `npm run preview` - Previzualizează build-ul de producție
