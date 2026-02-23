export function usePop() {
    const createOverlay = () => {
        const overlay = document.createElement('div')
        overlay.className = 'pop-overlay fade-in'
        return overlay
    }

    const createCard = () => {
        const card = document.createElement('div')
        card.className = 'pop-card zoom-in'
        card.innerHTML = `
            <div class="pop-content"></div>
        `
        return card
    }

    const pop = (message) => {
        const body = document.body
        const overlay = createOverlay()
        const card = createCard()

        card.querySelector('.pop-content').innerHTML = `<p>${message}</p>`
        const okBtn = document.createElement('button')
        okBtn.className = 'pop-btn-primary'
        okBtn.innerText = 'D\'accord'
        card.appendChild(okBtn)

        overlay.appendChild(card)
        body.appendChild(overlay)

        const close = () => {
            overlay.classList.add('fade-out')
            card.classList.add('zoom-out')
            window.removeEventListener('keydown', handleEsc)
            setTimeout(() => {
                if (overlay.parentNode) body.removeChild(overlay)
            }, 300)
        }

        const handleEsc = (e) => {
            if (e.key === 'Escape') close()
        }

        okBtn.onclick = close
        overlay.onclick = (e) => { if (e.target === overlay) close() }
        window.addEventListener('keydown', handleEsc)
    }

    const confirm = (message) => {
        return new Promise((resolve) => {
            const body = document.body
            const overlay = createOverlay()
            const card = createCard()

            card.querySelector('.pop-content').innerHTML = `<p>${message}</p>`

            const btnGroup = document.createElement('div')
            btnGroup.className = 'pop-btn-group'

            const cancelBtn = document.createElement('button')
            cancelBtn.className = 'pop-btn-secondary'
            cancelBtn.innerText = 'Annuler'

            const confirmBtn = document.createElement('button')
            confirmBtn.className = 'pop-btn-primary'
            confirmBtn.innerText = 'Confirmer'

            btnGroup.appendChild(cancelBtn)
            btnGroup.appendChild(confirmBtn)
            card.appendChild(btnGroup)

            overlay.appendChild(card)
            body.appendChild(overlay)

            const close = (result) => {
                overlay.classList.add('fade-out')
                card.classList.add('zoom-out')
                window.removeEventListener('keydown', handleEsc)
                setTimeout(() => {
                    if (overlay.parentNode) body.removeChild(overlay)
                    resolve(result)
                }, 300)
            }

            const handleEsc = (e) => {
                if (e.key === 'Escape') close(false)
            }

            confirmBtn.onclick = () => close(true)
            cancelBtn.onclick = () => close(false)
            overlay.onclick = (e) => { if (e.target === overlay) close(false) }
            window.addEventListener('keydown', handleEsc)
        })
    }

    return { pop, confirm }
}
