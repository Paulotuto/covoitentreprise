<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const companyId = ref('')
const companySearch = ref('')
const showSuggestions = ref(false)
const companies = ref([])
const loading = ref(false)
const error = ref(null)

const filteredCompanies = computed(() => {
  if (!companySearch.value) return []
  const search = companySearch.value.toLowerCase()
  return companies.value.filter(c => c.name.toLowerCase().includes(search))
})

function selectCompany(company) {
  companyId.value = company.id
  companySearch.value = company.name
  showSuggestions.value = false
}

function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

onMounted(async () => {
  const { data, error: companiesError } = await supabase.from('companies').select('*')
  if (companiesError) {
    console.error('Error fetching companies:', companiesError)
  } else {
    companies.value = data
  }
})

async function handleSignup() {
  loading.value = true
  error.value = null
  
  try {
    // Basic validation
    if (!companyId.value) {
      throw new Error("Veuillez sélectionner une entreprise dans la liste suggérée.")
    }

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          first_name: firstName.value,
          last_name: lastName.value,
          company_id: companyId.value,
          role: 'employee'
        }
      }
    })

    if (signupError) throw signupError

    const user = authData.user
    if (!user) throw new Error("Erreur d'authentification.")

    // NOTE: Le profil est désormais créé automatiquement via un trigger SQL 
    // côté base de données (sur auth.users) pour éviter les erreurs RLS.
    
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen py-20 flex items-center justify-center px-6 relative overflow-hidden bg-white">
    <!-- Background Decor -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-green-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

    <div class="w-full max-w-xl animate-in fade-in slide-in-from-bottom duration-700">
      <!-- Logo/Brand -->
      <div class="flex flex-col items-center mb-10 text-center">
        <router-link to="/" class="group">
          <div class="w-16 h-16 bg-[#2d6b3f] rounded-2xl flex items-center justify-center shadow-xl mb-4 group-hover:-rotate-6 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
        </router-link>
        <h1 class="text-3xl font-serif font-bold text-slate-900">Rejoindre l'aventure</h1>
        <p class="text-slate-500 mt-2">Créez votre compte employé en quelques secondes.</p>
      </div>

      <div class="glass rounded-[2rem] p-10 border-white/40 shadow-2xl relative z-10">
        <form @submit.prevent="handleSignup" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="firstName" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Prénom</label>
              <input v-model="firstName" type="text" id="firstName" required class="input-modern" placeholder="Michel" />
            </div>
            <div>
              <label for="lastName" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Nom</label>
              <input v-model="lastName" type="text" id="lastName" required class="input-modern" placeholder="Dupont" />
            </div>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Email professionnel</label>
            <input v-model="email" type="email" id="email" required class="input-modern" placeholder="michel@entreprise.com" />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Mot de passe</label>
            <input v-model="password" type="password" id="password" required class="input-modern" placeholder="••••••••" />
          </div>

          <!-- Company Selection (Autocomplete only) -->
          <div class="bg-green-50/50 p-6 rounded-3xl border border-green-100 space-y-4 mt-8">
            <div class="relative">
              <label for="company" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Mon entreprise</label>
              <div class="relative">
                <input 
                  v-model="companySearch" 
                  type="text" 
                  id="company" 
                  required 
                  class="input-modern" 
                  placeholder="Tapez le nom de votre entreprise..."
                  @focus="showSuggestions = true"
                  @blur="handleBlur"
                  autocomplete="off"
                />
                
                <!-- Suggestions Dropdown -->
                <div 
                  v-if="showSuggestions && filteredCompanies.length > 0" 
                  class="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl max-h-60 overflow-y-auto"
                >
                  <ul class="py-2">
                    <li 
                      v-for="c in filteredCompanies" 
                      :key="c.id"
                      @click="selectCompany(c)"
                      class="px-5 py-3 hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div class="font-bold text-slate-900">{{ c.name }}</div>
                    </li>
                  </ul>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-2 px-1 italic">
                Note : Votre compte devra être validé par votre administrateur avant de pouvoir accéder aux réunions.
              </p>
            </div>
          </div>
          
          <button 
            type="submit" 
            :disabled="loading"
            class="btn-primary cursor-pointer w-full py-4 text-lg mt-8 flex items-center justify-center"
          >
            <span v-if="loading" class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            {{ loading ? 'S\'inscrire...' : "Créer mon compte" }}
          </button>
        </form>
        
        <p v-if="error" class="mt-6 text-sm text-red-600 text-center bg-red-50/50 py-3 rounded-xl border border-red-100">
          {{ error }}
        </p>

        <div class="mt-10 pt-8 border-t border-slate-100 text-center">
          <p class="text-slate-500 text-sm">
            Vous avez déjà un compte ? 
            <router-link to="/login" class="font-bold text-[#2d6b3f] hover:text-[#235230] ml-1">Se connecter</router-link>
          </p>
        </div>
      </div>

      <router-link to="/" class="mt-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </router-link>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed, using global utilities and animations from style.css */
</style>
