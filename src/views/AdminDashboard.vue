<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'
import { formatDate } from '../main'

const router = useRouter()
const adminProfile = ref(null)
const pendingUsers = ref([])
const loading = ref(true)
const events = ref([])

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    router.push('/login')
    return
  }

  // 1. Fetch admin profile and their company first
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status, company_id, companies(id, name)')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profileData || profileData.role !== 'admin') {
    console.error('Erreur profil admin:', profileError)
    router.push('/')
    return
  }

  adminProfile.value = profileData

  // 2. Now fetch events for this company
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      date,
      companie (
        id,
        name
      )
    `)
    .eq('companie', adminProfile.value.company_id)

  if (eventsError) {
    console.error('Erreur chargement événements:', eventsError)
  } else {
    events.value = eventsData
  }

  // 3. Fetch pending users
  await fetchPendingUsers()
  
  loading.value = false
})

async function fetchPendingUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, status, role, company_id')
    .eq('company_id', adminProfile.value.company_id)
    .eq('status', 'pending')
  
  if (!error) {
    pendingUsers.value = data
  }
}

async function handleAction(userId, newStatus) {
  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId)

  if (!error) {
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId)
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-white pb-20">
    <!-- Admin Header -->
    <header class="glass sticky top-0 z-50 border-b border-green-100/50 px-6 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-[#2d6b3f] rounded-2xl flex items-center justify-center shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
             </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900">Espace Administration</h1>
            <p class="text-[#2d6b3f] text-xs font-bold uppercase tracking-widest">{{ adminProfile?.companies?.name }}</p>
          </div>
        </div>
        
        <button @click="handleLogout" class="cursor-pointer text-slate-500 hover:text-red-600 font-bold transition-colors text-sm px-4 py-2 rounded-xl hover:bg-red-50">
          Déconnexion
        </button>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 mt-12">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-[#2d6b3f] animate-pulse">
        <div class="w-12 h-12 border-4 border-[#2d6b3f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span class="text-lg font-medium">Chargement des données administratives...</span>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar/Stats -->
        <div class="lg:col-span-1 space-y-6">
           <div class="card bg-[#2d6b3f] p-8 text-white shadow-green-100">
              <h3 class="text-green-50 text-sm font-bold uppercase tracking-widest mb-6">Résumé</h3>
              <div class="space-y-6">
                <div>
                  <div class="text-4xl font-serif font-bold">{{ pendingUsers.length }}</div>
                  <div class="text-green-100 text-sm mt-1 font-medium">Demandes en attente</div>
                </div>
                <div>
                  <div class="text-4xl font-serif font-bold">{{ events.length }}</div>
                  <div class="text-green-100 text-sm mt-1 font-medium">Événements planifiés</div>
                </div>
              </div>
           </div>
           
           <div class="card p-8 bg-white">
              <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Besoin d'aide ?</h3>
              <p class="text-slate-600 text-sm leading-relaxed">En tant qu'administrateur, vous pouvez valider les nouveaux employés et consulter les événements de votre entreprise.</p>
           </div>
        </div>

        <!-- Main Content (Tables) -->
        <div class="lg:col-span-2 space-y-12">
          <!-- Pending Users -->
          <section>
            <div class="flex items-center justify-between mb-6 px-2">
              <h2 class="text-2xl font-bold text-slate-900 flex items-center">
                Inscriptions à valider
                <span class="ml-3 w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold">{{ pendingUsers.length }}</span>
              </h2>
            </div>
            
            <div class="card p-0 overflow-hidden bg-white border-slate-100">
              <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <tr>
                    <th class="px-8 py-4">Collaborateur</th>
                    <th class="px-8 py-4 text-center">Décision</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="user in pendingUsers" :key="user.id" class="hover:bg-green-50/30 transition-colors group">
                    <td class="px-8 py-6">
                      <div class="flex items-center">
                        <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#2d6b3f] font-bold mr-4 group-hover:bg-[#2d6b3f] group-hover:text-white transition-colors">
                          {{ user.first_name[0] }}{{ user.last_name[0] }}
                        </div>
                        <div>
                          <div class="font-bold text-slate-900">{{ user.first_name }} {{ user.last_name }}</div>
                          <div class="text-xs text-slate-400">Demande d'accès employé</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <div class="flex justify-center space-x-2">
                        <button 
                          @click="handleAction(user.id, 'approved')"
                          class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Valider"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button 
                          @click="handleAction(user.id, 'rejected')" 
                          class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Refuser"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="pendingUsers.length === 0">
                    <td colspan="2" class="px-8 py-16 text-center text-slate-400 italic">
                       Toutes les demandes ont été traitées. Belle journée !
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Events Listing -->
          <section>
            <div class="flex items-center justify-between mb-6 px-2">
              <h2 class="text-2xl font-bold text-slate-900 flex items-center">
                Planning des événements
                <span class="ml-3 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-bold">{{ events.length }}</span>
              </h2>
            </div>

            <div v-if="events.length === 0" class="card border-dashed border-2 border-slate-200 py-12 text-center bg-slate-50/50">
               <p class="text-slate-400 italic font-medium">Aucun événement n'est encore enregistré pour votre entreprise.</p>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="r in events" :key="r.id" class="card p-6 bg-white hover:border-green-200 transition-colors flex justify-between items-center group">
                <div>
                  <h3 class="font-bold text-slate-900 group-hover:text-[#2d6b3f] transition-colors">{{ r.title }}</h3>
                  <div class="flex items-center mt-2 text-xs text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate(r.date).date }} à {{ formatDate(r.date).time }}
                  </div>
                </div>
                <button @click="router.push(`/meeting/${r.id}`)" class="cursor-pointer p-2 bg-slate-50 text-slate-400 hover:bg-[#2d6b3f] hover:text-white rounded-lg transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                   </svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed, using global utilities and animations from style.css */
</style>
