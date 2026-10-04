import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Information We Collect',
    body: [
      'When you interact with YPM, we may collect personal information such as your name, email address, phone number, professional background details, and any information you voluntarily provide through forms, consultation requests, or course registrations. If you make a purchase, payment-related details are processed securely through third-party payment gateways.',
      'We may also collect non-personal information automatically, including browser type, device information, IP address, and usage data such as pages visited and time spent on the website. This information helps us understand user behavior and improve the overall learning experience.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    body: [
      'The information we collect is used to deliver and improve our services. This includes responding to inquiries, providing access to courses and coaching sessions, scheduling consultations, processing payments, and sharing relevant updates about programs or offerings.',
      'We may also use your information to enhance website functionality, personalize user experience, and communicate important service-related notifications. YPM does not sell, rent, or trade your personal information to third parties for marketing purposes.',
    ],
  },
  {
    heading: 'Payment and Financial Information',
    body: [
      'All financial transactions on the YPM website are processed through secure third-party payment providers. YPM does not store or have direct access to your full credit or debit card details. Payment gateways operate under their own privacy and security policies, and we encourage users to review those policies when making transactions.',
    ],
  },
  {
    heading: 'Communication and Marketing',
    body: [
      'When you submit your contact details through our website, you agree to receive communication related to your inquiry, enrollment, or engagement with YPM. This may include course updates, mentoring information, announcements, and relevant educational resources.',
      'You may opt out of receiving non-essential communications at any time by following the unsubscribe instructions provided in our emails or by contacting us directly.',
    ],
  },
  {
    heading: 'Data Protection and Security',
    body: [
      'YPM takes reasonable administrative and technical measures to protect your information from unauthorized access, misuse, disclosure, or alteration. While we strive to safeguard your data, no method of electronic transmission or storage is entirely secure. Therefore, we cannot guarantee absolute security, but we remain committed to maintaining strong protective practices.',
    ],
  },
  {
    heading: 'Third-Party Services and Links',
    body: [
      'Our website may contain links to third-party platforms or services, including payment providers and external resources. YPM is not responsible for the privacy practices or content of these external websites. We encourage users to review the privacy policies of any third-party sites they access.',
    ],
  },
  {
    heading: 'Data Retention',
    body: [
      'We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy, including legal, accounting, or reporting requirements. When information is no longer required, we take appropriate steps to securely delete or anonymize it.',
    ],
  },
  {
    heading: 'Your Rights and Choices',
    body: [
      'You have the right to request access to the personal information we hold about you, request corrections to inaccurate information, or ask for deletion of your data, subject to applicable legal requirements. To exercise these rights, you may contact us through the official communication channels listed on our website.',
    ],
  },
  {
    heading: 'Policy Updates',
    body: [
      'YPM reserves the right to update or modify this Privacy Policy as needed to reflect changes in legal requirements, operational practices, or service offerings. Any updates will be posted on this page with a revised “Last Updated” date. Continued use of the website after such changes constitutes acceptance of the updated policy.',
    ],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="2 March 2026"
      intro="YPM (Your Product Manager) values your trust and is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, store, and safeguard your information when you access our website, enroll in our programs, or engage with our coaching and consulting services. By using this website, you consent to the practices described below."
      sections={SECTIONS}
    />
  )
}
