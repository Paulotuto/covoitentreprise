<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '../main'

const route = useRoute()
const router = useRouter()

const meeting = ref(null)
const eventVehicles = ref([])
const userProfiles = ref({})
const loading = ref(true)
const error = ref(null)
const user = ref(null)

// For global chat
const meetingMessages = ref([])
const newMessage = ref('')
const chatContainer = ref(null)

// For vehicle comments
const vehicleCommentsMap = ref({}) // vehicleId -> comments[]
const newCommentMap = ref({})    // vehicleId -> draft text
const commentContainers = ref({})
let commentInterval = null

const newVehicleName = ref('')
const creatingVehicle = ref(false)

/**
 * Initialisation des données
 */
onMounted(async () => {
  try {
    loading.value = true
    
    // 1. Récupération de l'utilisateur
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
    } else {
      router.push('/login')
      return
    }

    await loadMeetingData()
    await fetchMeetingMessages()
    await refreshAllVehicleComments()

    // 1s auto-refresh for all discussion spaces
    commentInterval = setInterval(() => {
      fetchMeetingMessages()
      refreshAllVehicleComments()
    }, 1000)

  } catch (err) {
    console.error('Initialisation error:', err)
    error.value = "Erreur lors de l'initialisation."
  } finally {
    loading.value = false
  }
})

import { onUnmounted, nextTick } from 'vue'
onUnmounted(() => {
  if (commentInterval) clearInterval(commentInterval)
})

/**
 * Chargement de la réunion, des véhicules et des profils
 */
async function loadMeetingData() {
  const meetingId = route.params.id
  
  // Fetch Meeting and Vehicles in parallel
  const [meetingRes, vehiclesRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', meetingId).single(),
    supabase.from('event_vehicles').select('*').eq('event', meetingId)
  ])

  if (meetingRes.error) throw meetingRes.error
  if (vehiclesRes.error) throw vehiclesRes.error

  meeting.value = meetingRes.data
  eventVehicles.value = vehiclesRes.data || []

  // Initialize comment maps
  eventVehicles.value.forEach(v => {
    if (!newCommentMap.value[v.id]) newCommentMap.value[v.id] = ''
    if (!vehicleCommentsMap.value[v.id]) vehicleCommentsMap.value[v.id] = []
  })

  // Collect all unique user IDs from all vehicles
  const allUserIds = [...new Set(eventVehicles.value.flatMap(v => v.users || []))]
  
  if (user.value && !allUserIds.includes(user.value.id)) {
    allUserIds.push(user.value.id)
  }

  if (allUserIds.length > 0) {
    await fetchProfiles(allUserIds)
  }
}

async function fetchProfiles(ids) {
  const { data, error: profError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', ids)

  if (profError) {
    console.error('Erreur profils:', profError)
    return
  }

  const newProfiles = { ...userProfiles.value }
  data.forEach(p => {
    newProfiles[p.id] = p
  })
  userProfiles.value = newProfiles
}

async function handleToggleRegistration(vehicleId) {
  if (!user.value) return

  const vehicle = eventVehicles.value.find(v => v.id === vehicleId)
  if (!vehicle) return

  const isAlreadyRegistered = vehicle.users?.includes(user.value.id)
  let updatedUsers = []

  if (isAlreadyRegistered) {
    updatedUsers = vehicle.users.filter(id => id !== user.value.id)
  } else {
    // Optimization: remove from others locally first to avoid parallel ghosts
    for (const v of eventVehicles.value) {
      if (v.users?.includes(user.value.id)) {
        v.users = v.users.filter(id => id !== user.value.id)
        await supabase.from('event_vehicles').update({ users: v.users }).eq('id', v.id)
      }
    }
    updatedUsers = [...(vehicle.users ?? []), user.value.id]
  }

  const { error: updateError } = await supabase
    .from('event_vehicles')
    .update({ users: updatedUsers })
    .eq('id', vehicleId)

  if (updateError) {
    console.error('Erreur mise à jour inscription:', updateError)
    return
  }

  vehicle.users = updatedUsers
  if (!userProfiles.value[user.value.id]) {
    await fetchProfiles([user.value.id])
  }
}

async function handleCreateVehicle() {
  if (!newVehicleName.value.trim() || !user.value) return
  
  creatingVehicle.value = true
  try {
    const { data, error: insertError } = await supabase
      .from('event_vehicles')
      .insert({
        name: newVehicleName.value.trim(),
        event: route.params.id,
        users: []
      })
      .select()
      .single()

    if (insertError) throw insertError
    eventVehicles.value.push(data)
    newVehicleName.value = ''
  } catch (err) {
    console.error('Erreur création véhicule:', err)
    alert("Erreur lors de la création du véhicule.")
  } finally {
    creatingVehicle.value = false
  }
}

function getParticipantName(userId) {
  const profile = userProfiles.value[userId]
  return profile ? `${profile.first_name}` : '...'
}

async function fetchMeetingMessages() {
  const { data, error: msgError } = await supabase
    .from('meeting_messages')
    .select('*')
    .eq('event_id', route.params.id)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('Erreur chargement messages:', msgError)
    return
  }

  const isAtBottom = chatContainer.value 
    ? chatContainer.value.scrollHeight - chatContainer.value.scrollTop <= chatContainer.value.clientHeight + 100
    : true

  meetingMessages.value = data || []
  
  // Auto-scroll if was already at bottom
  if (isAtBottom) {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
  
  // Update profiles for any new message senders
  const messageUserIds = [...new Set(meetingMessages.value.map(m => m.user_id))]
  const unknownIds = messageUserIds.filter(id => !userProfiles.value[id])
  if (unknownIds.length > 0) {
    await fetchProfiles(unknownIds)
  }
}

async function handleSendMessage() {
  if (!newMessage.value.trim() || !user.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''

  const { data, error: sendError } = await supabase
    .from('meeting_messages')
    .insert({
      event_id: route.params.id,
      user_id: user.value.id,
      content: content
    })
    .select()
    .single()

  if (sendError) {
    console.error('Erreur envoi message:', sendError)
    return
  }

  meetingMessages.value.push(data)
  
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

async function refreshAllVehicleComments() {
  if (eventVehicles.value.length === 0) return

  const vehicleIds = eventVehicles.value.map(v => v.id)
  const { data, error: commError } = await supabase
    .from('vehicle_comments')
    .select('*')
    .in('vehicle_id', vehicleIds)
    .order('created_at', { ascending: true })

  if (commError) {
    console.error('Erreur chargement commentaires:', commError)
    return
  }

  // Check which containers were at bottom before update
  const scrollStatus = {}
  vehicleIds.forEach(id => {
    const el = commentContainers.value[id]
    scrollStatus[id] = el ? (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) : true
  })

  // Regroup by vehicle
  const newMap = {}
  vehicleIds.forEach(id => newMap[id] = [])
  data?.forEach(c => {
    if (newMap[c.vehicle_id]) {
      newMap[c.vehicle_id].push(c)
    }
  })
  vehicleCommentsMap.value = newMap

  // Restore scroll for those that were at bottom
  nextTick(() => {
    vehicleIds.forEach(id => {
      if (scrollStatus[id]) {
        const el = commentContainers.value[id]
        if (el) el.scrollTop = el.scrollHeight
      }
    })
  })

  // Ensure profiles for comment authors
  const authorIds = [...new Set(data?.map(c => c.user_id) || [])]
  const unknownIds = authorIds.filter(id => !userProfiles.value[id])
  if (unknownIds.length > 0) {
    await fetchProfiles(unknownIds)
  }
}

async function handleSendComment(vehicleId) {
  const content = newCommentMap.value[vehicleId]?.trim()
  if (!content || !user.value) return

  newCommentMap.value[vehicleId] = ''

  const { data, error: sendError } = await supabase
    .from('vehicle_comments')
    .insert({
      vehicle_id: vehicleId,
      user_id: user.value.id,
      content: content
    })
    .select()
    .single()

  if (sendError) {
    console.error('Erreur envoi commentaire:', sendError)
    return
  }

  // Optimistic update
  if (!vehicleCommentsMap.value[vehicleId]) vehicleCommentsMap.value[vehicleId] = []
  vehicleCommentsMap.value[vehicleId].push(data)

  nextTick(() => {
    const el = commentContainers.value[vehicleId]
    if (el) el.scrollTop = el.scrollHeight
  })
}

function goBack() {
  router.push('/')
}

function formatMsgTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-screen pb-20 bg-slate-50">
    <!-- Navbar -->
    <nav class="glass border-b border-indigo-100/50 px-6 py-4 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <button @click="goBack" class="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </button>
        
        <div class="hidden md:flex items-center space-x-2">
           <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-sm font-serif font-bold text-slate-900 tracking-tight">Covoit'Entreprise</span>
        </div>
      </div>
    </nav>

    <div class="max-w-5xl mx-auto px-6 mt-12">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-indigo-600 animate-pulse">
        <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span class="text-lg font-medium">Récupération des trajets en cours...</span>
      </div>

      <!-- Content -->
      <div v-else-if="meeting" class="animate-in fade-in duration-700">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div class="space-y-4">
            <span class="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-100">
              Événement d'entreprise
            </span>
            <h1 class="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
              {{ meeting.title }}
            </h1>
            <div class="flex items-center gap-6 text-slate-500 font-medium">
              <span class="flex items-center">
                <div class="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center mr-2 border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {{ formatDate(meeting.date).date }}
              </span>
              <span class="flex items-center">
                <div class="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center mr-2 border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {{ formatDate(meeting.date).time }}
              </span>
            </div>
          </div>

          <!-- Quick Add Vehicle -->
          <div class="glass p-3 rounded-2xl flex items-center gap-2 border-white/50 animate-in slide-in-from-right duration-500 delay-200">
            <input 
              v-model="newVehicleName"
              type="text"
              placeholder="Nom de votre voiture..."
              class="px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm w-48 sm:w-64 transition-all"
              @keyup.enter="handleCreateVehicle"
            />
            <button 
              @click="handleCreateVehicle"
              :disabled="creatingVehicle || !newVehicleName.trim()"
              class="btn-primary py-2.5 px-6 rounded-xl text-xs whitespace-nowrap shadow-indigo-100"
            >
              {{ creatingVehicle ? '...' : '+ Ajouter' }}
            </button>
          </div>
        </div>

        <!-- Global Chat Section -->
        <div class="mb-16 animate-in slide-in-from-bottom duration-700 delay-300">
          <div class="glass border-indigo-100/50 rounded-[2.5rem] p-8 shadow-sm">
            <h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              Discussion générale
            </h2>
            
            <div 
              ref="chatContainer"
              class="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2 custom-scrollbar"
            >
              <div v-if="meetingMessages.length === 0" class="text-center py-8 text-slate-400 italic">
                Aucun message pour l'instant. Lancez la discussion !
              </div>
              <div 
                v-for="msg in meetingMessages" 
                :key="msg.id" 
                class="flex flex-col"
                :class="msg.user_id === user?.id ? 'items-end' : 'items-start'"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {{ userProfiles[msg.user_id]?.first_name || '...' }}
                  </span>
                  <span class="text-[10px] text-slate-300">{{ formatMsgTime(msg.created_at) }}</span>
                </div>
                <div 
                  class="px-4 py-2.5 rounded-2xl text-sm max-w-[80%] shadow-sm"
                  :class="msg.user_id === user?.id 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <input 
                v-model="newMessage"
                type="text"
                placeholder="Votre message..."
                class="flex-grow px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm transition-all"
                @keyup.enter="handleSendMessage"
              />
              <button 
                @click="handleSendMessage"
                :disabled="!newMessage.trim()"
                class="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Vehicle List -->
        <h2 class="text-2xl font-bold text-slate-900 mb-8 flex items-center">
           Voitures disponibles
           <span class="ml-4 w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">{{ eventVehicles.length }}</span>
        </h2>

        <div v-if="eventVehicles.length === 0" class="card border-dashed border-2 border-slate-200 py-20 text-center bg-slate-50/50">
           <p class="text-slate-400 italic">Personne n'a encore proposé de covoiturage pour cet événement.</p>
           <p class="text-slate-400 text-sm mt-1">Soyez le premier à proposer votre voiture ci-dessus !</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            v-for="vehicle in eventVehicles"
            :key="vehicle.id"
            class="card bg-white p-8 rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden relative"
          >
            <!-- Background Decoration -->
            <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div class="flex justify-between items-start mb-8 relative">
              <div>
                <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Voiture de</span>
                <h3 class="text-2xl font-bold text-slate-900">
                  {{ vehicle.name }}
                </h3>
              </div>
              <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>

            <div class="flex-grow space-y-4 mb-8 relative">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Passagers :</p>
              <div v-if="!vehicle.users || vehicle.users.length === 0" class="text-slate-400 italic text-sm py-2">
                Aucun passager pour l'instant
              </div>
              <ul class="flex flex-wrap gap-2 mb-6">
                <li
                  v-for="userId in (vehicle.users ?? [])"
                  :key="userId"
                  class="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold border border-indigo-100 shadow-sm animate-in zoom-in duration-300"
                >
                  <div class="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                  {{ getParticipantName(userId) }}
                </li>
              </ul>

              <!-- Vehicle Comments -->
              <div class="pt-6 border-t border-slate-50">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Commentaires :</p>
                <div 
                  :ref="el => { if (el) commentContainers[vehicle.id] = el }"
                  class="space-y-3 max-h-[150px] overflow-y-auto mb-4 pr-1 custom-scrollbar"
                >
                  <div v-if="!vehicleCommentsMap[vehicle.id] || vehicleCommentsMap[vehicle.id].length === 0" class="text-[11px] text-slate-300 italic">
                    Pas encore de commentaires.
                  </div>
                  <div 
                    v-for="comm in vehicleCommentsMap[vehicle.id]" 
                    :key="comm.id"
                    class="bg-slate-50/50 p-3 rounded-xl border border-slate-100"
                  >
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-[9px] font-bold text-indigo-400 uppercase">{{ userProfiles[comm.user_id]?.first_name || '...' }}</span>
                      <span class="text-[8px] text-slate-300">{{ formatMsgTime(comm.created_at) }}</span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ comm.content }}</p>
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <input 
                    v-model="newCommentMap[vehicle.id]"
                    type="text"
                    placeholder="Écrire..."
                    class="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-[11px] transition-all"
                    @keyup.enter="handleSendComment(vehicle.id)"
                  />
                  <button 
                    @click="handleSendComment(vehicle.id)"
                    :disabled="!newCommentMap[vehicle.id]?.trim()"
                    class="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Registration Action -->
            <button
              class="w-full mt-auto py-4 px-6 rounded-2xl font-bold transition-all duration-300 transform active:scale-[0.98] border-2 shadow-sm"
              :class="vehicle.users?.includes(user?.id) 
                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200' 
                : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-200 hover:shadow-lg'"
              @click="handleToggleRegistration(vehicle.id)"
            >
              {{ vehicle.users?.includes(user?.id) ? 'Désinscription' : 'Réserver une place' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="card bg-red-50 border-red-100 text-center py-20 max-w-2xl mx-auto">
         <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
         </div>
         <h2 class="text-3xl font-serif text-red-900 mb-2">Erreur Fatale</h2>
         <p class="text-red-700 mb-8">{{ error }}</p>
         <button @click="goBack" class="btn-primary bg-red-600 hover:bg-red-700 shadow-red-200">Retour au dashboard</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
