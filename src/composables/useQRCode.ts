import { ref } from 'vue'
import QRCode from 'qrcode'

export function useQRCode() {
  const showQR = ref(false)
  const qrDataUrl = ref('')
  const qrLoading = ref(false)

  async function generateQR() {
    if (qrDataUrl.value) return
    qrLoading.value = true
    try {
      const url = window.location.href
      qrDataUrl.value = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1a5c2e',
          light: '#f8faf6'
        }
      })
    } finally {
      qrLoading.value = false
    }
  }

  function toggleQR() {
    showQR.value = !showQR.value
    if (showQR.value) {
      generateQR()
    }
  }

  return { showQR, qrDataUrl, qrLoading, generateQR, toggleQR }
}
