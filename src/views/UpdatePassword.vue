<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(false)

onMounted(async () => {
  // Check if we have a session (the link from email should have authenticated the user)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    error.value = "Le lien de réinitialisation est invalide ou a expiré."
  }
})

async function handleUpdatePassword() {
  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas."
    return
  }

  loading.value = true
  error.value = null

  const { error: updateError } = await supabase.auth.updateUser({
    password: password.value
  })

  if (updateError) {
    error.value = updateError.message
  } else {
    success.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-white">
    <!-- Background Decor -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-green-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

    <div class="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
      <!-- Logo/Brand -->
      <div class="flex flex-col items-center mb-10 text-center">
        <div class="w-16 h-16 bg-[#2d6b3f] rounded-2xl flex items-center justify-center shadow-xl mb-4 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
        </div>
        <h1 class="text-3xl font-serif font-bold text-slate-900">Nouveau mot de passe</h1>
        <p class="text-slate-500 mt-2">Définissez votre nouveau mot de passe sécurisé.</p>
      </div>

      <div class="glass rounded-[2rem] p-8 border-white/40 shadow-2xl relative z-10">
        <form v-if="!success && !error" @submit.prevent="handleUpdatePassword" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Nouveau mot de passe</label>
            <input 
              v-model="password" 
              type="password" 
              id="password" 
              required 
              class="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#2d6b3f] focus:bg-white outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-bold text-slate-700 mb-2 ml-1">Confirmer le mot de passe</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              id="confirmPassword" 
              required 
              class="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#2d6b3f] focus:bg-white outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            :disabled="loading"
            class="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center"
          >
            <span v-if="loading" class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            {{ loading ? 'Mise à jour...' : 'Mettre à jour' }}
          </button>
        </form>
        
        <div v-if="success" class="text-center space-y-4 py-4">
          <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-slate-700 font-medium">Mot de passe mis à jour avec succès !</p>
          <p class="text-slate-500 text-sm">Redirection vers la connexion...</p>
        </div>

        <div v-if="error" class="text-center space-y-4 py-4">
          <p class="text-sm text-red-600 bg-red-50/50 py-3 rounded-xl border border-red-100 mb-6">
            {{ error }}
          </p>
          <router-link to="/forgot-password" class="inline-block font-bold text-[#2d6b3f] hover:text-[#235230] transition-colors">
            Réessayer la demande
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles handled globally */
</style>
