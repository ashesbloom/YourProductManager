import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Use of Website and Services',
    body: [
      'YPM provides educational content, structured courses, and private coaching sessions focused on Product Management and strategic thinking. All materials, resources, and services are intended for personal learning and professional development purposes only. By using this website, you agree to use it lawfully and in a manner that does not infringe upon the rights of others or restrict their access to the platform.',
      'You must be at least 15 years old to enroll in programs or book coaching services.',
    ],
  },
  {
    heading: 'Course Enrollment and Access',
    body: [
      'Upon successful enrollment and payment, you will receive access to the purchased course according to the format described (recorded, lecture-based, self-paced, or otherwise specified). Course access is granted solely to the registered participant and may not be shared, transferred, distributed, or resold.',
      'YPM reserves the right to modify course content, structure, or materials to improve quality and relevance. Such updates do not entitle users to refunds or compensation.',
    ],
  },
  {
    heading: '1:1 Coaching and Custom Sessions',
    body: [
      'Private coaching and strategy sessions are scheduled based on mutual availability. Session structure, duration, and frequency are defined through prior alignment and agreement. Participants are expected to attend sessions on time and provide reasonable notice in case of rescheduling.',
      'Coaching services are professional development engagements and do not constitute therapy, legal advice, financial advice, or employment placement services.',
      'YPM reserves the right to decline or discontinue coaching engagements if conduct is inappropriate, disrespectful, or misaligned with the scope of services.',
    ],
  },
  {
    heading: 'Payments and Fees',
    body: [
      'All payments must be made in full before access to courses or coaching services is granted, unless otherwise agreed in writing. Payments are processed through secure third-party payment gateways. YPM does not store full credit or debit card details.',
      'For certain private coaching or consultation engagements, payments may be accepted directly through the official personal account of Khushbu Sharma, as communicated during the booking or confirmation process. Such transactions are considered valid and authorized only when confirmed directly by YPM.',
      'Pricing is subject to change at any time without prior notice. However, changes will not affect purchases that have already been completed and confirmed.',
    ],
  },
  {
    heading: 'Refund Policy',
    body: [
      'Unless explicitly stated otherwise on the specific product or service page, course enrollments and coaching sessions are non-refundable. Due to the intellectual nature of digital content and personalized services, refunds are generally not provided once access has been granted or sessions have commenced.',
      'Any exceptions are made solely at the discretion of YPM.',
    ],
  },
  {
    heading: 'Intellectual Property',
    body: [
      'All content provided through YPM — including course materials, videos, frameworks, documents, branding, and written resources — is the intellectual property of YPM and Khushbu Sharma.',
      'You may not reproduce, distribute, record, share, modify, or commercially use any material without prior written permission. Unauthorized distribution or misuse may result in termination of access and legal action.',
    ],
  },
  {
    heading: 'No Guarantees or Employment Claims',
    body: [
      'YPM provides structured education and professional guidance. However, we do not guarantee job placements, salary increases, promotions, or specific career outcomes. Results depend on individual effort, background, market conditions, and application of learning.',
      'All testimonials shared on the website represent individual experiences and do not guarantee similar outcomes for every participant.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    body: [
      'YPM shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use of our website, courses, or coaching services. Users participate voluntarily and assume full responsibility for their professional decisions and actions.',
    ],
  },
  {
    heading: 'Confidentiality',
    body: [
      'Information shared during private coaching sessions will be treated with professional discretion. However, participants are responsible for ensuring they do not disclose confidential information belonging to their employers or third parties during sessions.',
    ],
  },
  {
    heading: 'Modifications to Terms',
    body: [
      'YPM reserves the right to update or modify these Terms and Conditions at any time. Updates will be reflected on this page with a revised “Last Updated” date. Continued use of the website or services constitutes acceptance of any changes.',
    ],
  },
  {
    heading: 'Governing Law',
    body: [
      'These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India. Any disputes arising from the use of this website or services shall fall under the jurisdiction of the appropriate courts in India.',
    ],
  },
]

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="2 March 2026"
      intro="Welcome to YPM (Your Product Manager). By accessing this website, enrolling in any course, or engaging in coaching or consulting services offered by YPM, you agree to the following Terms and Conditions. Please read them carefully before proceeding."
      sections={SECTIONS}
    />
  )
}
