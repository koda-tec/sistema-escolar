'use client'
import { useState } from 'react'

export default function BotonPagoMP() {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/checkout', { method: 'POST' })
            const data = await res.json()
            
            if (data.init_point) {
                window.location.href = data.init_point
            } else {
                alert("No se pudo generar el pago. Reintente en unos minutos.")
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    return (
        <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
            {loading ? 'Procesando...' : 'Activar por $30.000'}
        </button>
    )
}