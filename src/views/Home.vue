<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'
import { formatDate } from '../main'

const router = useRouter()
const user = ref(null)
const profile = ref(null)
const company = ref(null)
const loading = ref(true)
const fetchError = ref(null)
const meetings = ref([])

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
    
    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.value.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      fetchError.value = profileError.message
    }

    if (profileData) {
      profile.value = profileData
      company.value = profileData.companies
      
      if (profileData.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }
    }

    // Fetch meetings
    const { data: meetingData, error: meetingError } = await supabase
      .from('events')
      .select('*')
      .eq('companie', company.value?.id)

    if (meetingError) {
      console.error('Error fetching meetings:', meetingError)
    } else {
      meetings.value = meetingData || []
    }
  }
  loading.value = false
})

async function handleLogout() {
  await supabase.auth.signOut()
  window.location.reload() // Reload to clear states and show landing
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Navigation Bar -->
    <nav class="sticky top-0 z-50 glass border-b border-green-100/50 px-4 sm:px-6 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center gap-2">
        <div class="flex items-center space-x-2 flex-shrink-0">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-[#2d6b3f] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight">Covoit<span class="hidden sm:inline">'Entreprise</span></span>
        </div>
        
        <div class="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <template v-if="!user">
            <router-link to="/login" class="text-slate-600 font-semibold hover:text-[#2d6b3f] transition-colors text-xs sm:text-base whitespace-nowrap">Connexion</router-link>
            <router-link to="/signup" class="btn-primary text-xs sm:text-base py-2 sm:py-3 px-3 sm:px-6 whitespace-nowrap flex-shrink-0">S'inscrire</router-link>
          </template>
          <template v-else>
            <button @click="handleLogout" class="cursor-pointer btn-secondary py-2 text-xs sm:text-sm border-0 bg-transparent text-slate-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0">Déconnexion</button>
          </template>
        </div>
      </div>
    </nav>

    <!-- LANDING VIEW (Guest) -->
    <div v-if="!user" class="pt-20 pb-40">
      <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div class="animate-in fade-in slide-in-from-left duration-1000">
          <span class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-green-50 text-[#2d6b3f] mb-6">
            ✨ Optimisez vos déplacements corporate
          </span>
          <h1 class="text-6xl font-serif text-slate-900 leading-[1.1] mb-8">
            Le covoiturage intelligent pour votre <span class="text-[#2d6b3f] underline decoration-green-200 underline-offset-8">entreprise</span>.
          </h1>
          <p class="text-xl text-slate-600 mb-12 leading-relaxed max-w-lg">
            Facilitez les trajets de vos employés vers vos réunions et événements. Une solution simple, écologique et collaborative pour booster la cohésion d'équipe.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <router-link to="/signup" class="btn-primary text-center px-10">Démarrer maintenant</router-link>
            <a href="#concept" class="btn-secondary text-center px-10">Découvrir le concept</a>
          </div>
        </div>
        
        <div class="relative animate-in fade-in slide-in-from-right duration-1000">
          <div class="absolute -top-10 -left-10 w-40 h-40 bg-green-50 rounded-full blur-3xl opacity-50"></div>
          <div class="hidden absolute -bottom-10 -right-10 w-40 h-40 bg-green-50 rounded-full blur-3xl opacity-50"></div>
          <div class="relative glass rounded-[2.5rem] p-4 group overflow-hidden border-2 border-white">
            <div class="aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center p-12 relative overflow-hidden">
               <!-- Abstract illustration placeholder with vehicle/connection vibe -->
               <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full text-green-300 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </div>
            
            <div class="hidden absolute bottom-10 right-10 glass p-4 rounded-2xl shadow-xl border border-green-100/50 flex items-center space-x-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="text-sm">
                <p class="font-bold text-slate-900">32 trajets optimisés</p>
                <p class="text-slate-500 text-xs">Ce matin, Chez Google France</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div id="concept" class="max-w-7xl mx-auto px-6 mt-40">
        <div class="text-center mb-20">
          <h2 class="text-4xl font-serif text-slate-900 mb-4">Pourquoi choisir Covoit'Entreprise ?</h2>
          <p class="text-lg text-slate-500">Un outil pensé pour les défis modernes du monde professionnel.</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="card group hover:border-indigo-200">
            <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-inherit" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-4">Gain de temps</h3>
            <p class="text-slate-500 leading-relaxed">Centralisez l'organisation des départs en réunion. Plus de mails interminables pour savoir qui prend sa voiture.</p>
          </div>

          <div class="card group hover:border-sky-200">
            <div class="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 mb-8 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-inherit" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-4">Éco-responsable</h3>
            <p class="text-slate-500 leading-relaxed">Réduisez l'empreinte carbone de votre entreprise en optimisant le remplissage des véhicules de fonction.</p>
          </div>

          <div class="card group hover:border-emerald-200">
            <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-inherit" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-4">Cohésion d'équipe</h3>
            <p class="text-slate-500 leading-relaxed">Favorisez les échanges informels entre collègues durant les trajets. Un trajet partagé est un lien créé.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- AUTHENTICATED DASHBOARD (User) -->
    <div v-else class="max-w-7xl mx-auto px-6 py-12">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-[#2d6b3f] animate-pulse">
        <div class="w-12 h-12 border-4 border-[#2d6b3f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span class="text-lg font-medium">Préparation de votre espace...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="fetchError" class="max-w-2xl mx-auto card text-center border-red-100 bg-red-50/50">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 text-red-600">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        <h2 class="text-2xl font-bold text-red-900 mb-2">Oups, une erreur !</h2>
        <p class="text-red-700 mb-8">{{ fetchError }}</p>
        <button @click="handleLogout" class="btn-primary bg-red-600 hover:bg-red-700 shadow-red-200">Se déconnecter</button>
      </div>

      <!-- Main Dashboard -->
      <div v-else-if="profile" class="space-y-12 animate-in fade-in duration-700">
        <!-- User Welcome / Status -->
        <div class="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div v-if="profile.status === 'pending'" class="flex-grow glass border-yellow-200 p-8 rounded-3xl">
             <div class="flex items-center space-x-4 mb-4">
               <div class="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <div>
                 <h2 class="text-2xl font-bold text-slate-900">En attente de validation</h2>
                 <p class="text-slate-500">Votre accès est en cours d'examen par l'admin de <span class="text-[#2d6b3f] font-bold">{{ company?.name }}</span>.</p>
               </div>
             </div>
          </div>
          
          <div v-else class="flex-grow">
            <h1 class="text-4xl font-serif text-slate-900 mb-2">Bonjour, <span class="text-[#2d6b3f]">{{ profile.first_name }}</span> ! 👋</h1>
            <p class="text-lg text-slate-500">Bienvenue dans votre espace <span class="font-bold underline decoration-green-200">{{ company?.name }}</span>.</p>
          </div>
        </div>

        <!-- Meetings Section (for Approved Users) -->
        <div v-if="profile.status === 'approved'" class="space-y-8">
          <div class="flex justify-between items-center bg-green-50/50 p-6 rounded-3xl">
            <h2 class="text-2xl font-bold text-slate-900">Réunions à venir</h2>
            <span class="px-4 py-1.5 bg-[#2d6b3f] text-white text-xs font-bold rounded-full uppercase tracking-widest">{{ meetings.length }} événement(s)</span>
          </div>

          <div v-if="meetings.length === 0" class="card border-dashed border-2 border-slate-200 text-center py-20 bg-slate-50/50">
             <p class="text-slate-400 italic">Aucune réunion prévue prochainement.</p>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="meeting in meetings" :key="meeting.id" 
              class="card group cursor-pointer hover:border-[#2d6b3f] hover:-translate-y-1 transition-all duration-300"
              @click="router.push(`/meeting/${meeting.id}`)"
            >
              <h3 class="text-xl font-bold text-slate-900 mb-6 group-hover:text-[#2d6b3f] transition-colors">{{ meeting.title }}</h3>
              <div class="space-y-3">
                <div class="flex items-center text-slate-500 text-sm">
                  <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-green-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {{ formatDate(meeting.date).date }}
                </div>
                <div class="flex items-center text-slate-500 text-sm">
                  <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-green-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {{ formatDate(meeting.date).time }}
                </div>
              </div>
              
              <div class="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                 <span class="text-[#2d6b3f] text-sm font-bold">Voir les voitures</span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Profile not found fallback -->
      <div v-else-if="user && !profile" class="max-w-md mx-auto card text-center border-yellow-100 bg-yellow-50/50">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6 text-yellow-600">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-2">Profil manquant</h2>
        <p class="text-slate-600 mb-8">Nous avons trouvé votre compte, mais vos informations de profil semblent absentes.</p>
        <button @click="handleLogout" class="btn-primary">Retour à l'accueil</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed, using global utilities and animations from style.css */
</style>
