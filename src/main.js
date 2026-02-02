import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('Une nouvelle version est disponible. Voulez-vous actualiser ?')) {
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