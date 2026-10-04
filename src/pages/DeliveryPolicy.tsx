import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Digital Delivery',
    body: [
      'YPM provides digital services only: recorded online courses and live one-to-one online sessions. Nothing is shipped physically.',
      'Course access is delivered online, immediately after successful payment, to the account of the email address you purchased with. A confirmation email is sent to the same address.',
    ],
  },
  {
    heading: 'Accessing Your Course',
    body: [
      'Log in at any time with your registered email address to open your dashboard and watch your lectures. Access is personal to you and may not be shared.',
    ],
  },
  {
    heading: 'Delays',
    body: [
      'If your payment succeeded but the course does not appear in your dashboard within 24 hours, write to us with your registered email address and payment reference and we will resolve it.',
    ],
  },
  {
    heading: 'Coaching Sessions',
    body: ['One-to-one sessions take place online at the booked time. The meeting link is shared by email after booking.'],
  },
]

export default function DeliveryPolicy() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      updated="3 October 2026"
      intro="How YPM (Your Product Manager) delivers the courses and sessions you purchase."
      sections={SECTIONS}
    />
  )
}
