<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function handleLogin() {
  loading.value = true
  error.value = null
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (loginError) {
    error.value = loginError.message
    loading.value = false
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-slate-50">
    <!-- Background Decor -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

    <div class="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
      <!-- Logo/Brand -->
      <div class="flex flex-col items-center mb-10 text-center">
        <router-link to="/" class="group">
          <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-4 group-hover:-rotate-6 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
        </router-link>
        <h1 class="text-3xl font-serif font-bold text-slate-900">Content de vous revoir</h1>
        <p class="text-slate-500 mt-2">Connectez-vous pour organiser vos covoiturages.</p>
      </div>

      <div class="glass rounded-[2rem] p-8 border-white/40 shadow-2xl relative z-10">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Adresse email</label>
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              required 
              class="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              placeholder="michel@entreprise.com"
            />
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2 ml-1">
              <label for="password" class="text-sm font-bold text-slate-700">Mot de passe</label>
              <router-link to="/forgot-password" class="text-xs text-indigo-600 hover:underline font-semibold">Mot de passe oublié ?</router-link>
            </div>
            <input 
              v-model="password" 
              type="password" 
              id="password" 
              required 
              class="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            :disabled="loading"
            class="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center"
          >
            <span v-if="loading" class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
        
        <p v-if="error" class="mt-6 text-sm text-red-600 text-center bg-red-50/50 py-3 rounded-xl border border-red-100">
          {{ error }}
        </p>

        <div class="mt-10 pt-8 border-t border-slate-100 text-center">
          <p class="text-slate-500 text-sm">
            Vous n'avez pas encore de compte ? 
            <router-link to="/signup" class="font-bold text-indigo-600 hover:text-indigo-700 ml-1">Créer un compte</router-link>
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
