import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PRODUCTS } from '@/data/catalog'
import { api, ApiError, loadScript } from '@/lib/api'
import { track } from '@/lib/analytics'
import { useMe } from '@/lib/me'
import { SUPPORT_EMAIL } from '@/lib/links'

type CheckoutOrder = { orderId: string; amount: number; keyId: string; name: string; prefill: { email: string; name: string } }
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCheckout = { open: () => void; on: (event: 'payment.failed', cb: () => void) => void }
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout
  }
}

/** Where a logged-out buyer lands after login: the courses page, which reopens checkout. */
export const BUY_AFTER_LOGIN = '/courses?buy=1'

/**
 * Razorpay checkout for the one product on sale. Logged-out visitors are sent to log in first.
 * Access is only granted by the Worker after it verifies the payment signature (or the webhook).
 */
export function useCheckout() {
  const product = PRODUCTS['ai-product']
  const { data: me, isPending } = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const owned = product.grants.every((id) => me?.enrollments.includes(id))

  async function buy() {
    track('buy_course_click', { product: product.id })
    if (!me?.user) {
      navigate(`/login?next=${encodeURIComponent(BUY_AFTER_LOGIN)}`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const [order] = await Promise.all([
        api<CheckoutOrder>('/api/checkout', { productId: product.id }),
        loadScript('https://checkout.razorpay.com/v1/checkout.js'),
      ])
      if (!window.Razorpay) throw new Error('Checkout unavailable')
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'Your Product Manager',
        image: `${location.origin}/apple-touch-icon.png`,
        description: order.name,
        prefill: order.prefill,
        theme: { color: '#8b5cf6' },
        handler: async (result: RazorpayResult) => {
          try {
            const { status } = await api<{ status: string }>('/api/checkout/verify', result)
            if (status !== 'paid') throw new Error(status)
            track('checkout_success', { product: product.id, value: order.amount / 100, currency: 'INR', transaction_id: result.razorpay_payment_id })
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            navigate('/dashboard')
          } catch {
            setError(`Payment received, but access is still being set up. Refresh in a minute; if it persists, email ${SUPPORT_EMAIL} with your payment ID.`)
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', () => setError('The payment did not go through. Please try again or use another method.'))
      checkout.open()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.')
      setBusy(false)
    }
  }

  return { buy, busy, error, owned, ready: !isPending, product }
}
