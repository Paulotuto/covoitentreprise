import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

import { usePop } from './composables/usePop'

const updateSW = registerSW({
    async onNeedRefresh() {
        const isConfirmed = await usePop().confirm('Une nouvelle version est disponible. Voulez-vous actualiser ?')
        if (isConfirmed) {
            updateSW()
        }
    },
    onOfflineReady() {
        console.log('L\'application est prête à être utilisée hors ligne.')
    },
})

const app = createApp(App)
app.use(router)
app.mount('#app')


export function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return {
        date: date.toLocaleDateString('fr-FR'),
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
}