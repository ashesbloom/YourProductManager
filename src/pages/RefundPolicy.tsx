import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Course Enrollments',
    body: [
      'Course content is digital and becomes available immediately after payment. Course enrollments are therefore non-refundable once access has been granted, unless stated otherwise on the specific course page.',
      'Please watch the free preview lectures before enrolling to make sure the course is right for you.',
    ],
  },
  {
    heading: 'Duplicate or Unfulfilled Payments',
    body: [
      'If you were charged more than once for the same course, or your payment succeeded but you did not receive access, write to us with your registered email address and payment reference. Verified duplicate or unfulfilled payments are refunded in full.',
    ],
  },
  {
    heading: 'Coaching and Mock Interview Sessions',
    body: [
      'Sessions can be rescheduled with at least 24 hours’ notice. Fees for sessions that have taken place, or that are missed without notice, are non-refundable.',
    ],
  },
  {
    heading: 'Cancellations',
    body: [
      'A course purchase cannot be cancelled once access has been granted. If you cancel a payment before it completes, no amount is charged and no access is granted.',
    ],
  },
  {
    heading: 'Refund Processing',
    body: [
      'Approved refunds are issued to the original payment method within 5–7 working days. The time taken for the amount to reflect in your account depends on your bank or card issuer.',
    ],
  },
]

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      updated="3 October 2026"
      intro="This policy explains when payments made to YPM (Your Product Manager) can be refunded or cancelled. Please read it together with our Terms & Conditions."
      sections={SECTIONS}
    />
  )
}
