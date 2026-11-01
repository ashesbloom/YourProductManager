import { Link, Navigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { CertificateCard } from '@/components/CertificateCard'
import { certDate, useMe } from '@/lib/me'
import { btnPrimary } from '@/components/ui'

// "Download PDF" is the browser's print dialog → Save as PDF. Everything but the certificate is
// hidden when printing (print:hidden here, on the nav and footer, and on the chat bubble in styles.css).
export default function Certificate() {
  const { data: me, isPending } = useMe()
  if (isPending) return <div className="min-h-[60vh] bg-black" />
  if (!me?.user) return <Navigate to="/login?next=/certificate" replace />
  if (!me.certificate) return <Navigate to="/dashboard#certificate" replace />
  const { id, title, completedAt } = me.certificate

  return (
    <div className="bg-black px-4 pb-24 pt-[calc(var(--header-h)+2rem)] text-white print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link to="/dashboard#certificate" className="text-sm font-semibold text-white/60 hover:text-white">
            ← Back to dashboard
          </Link>
          <button type="button" onClick={() => window.print()} className={btnPrimary}>
            <Download size={16} /> Download PDF
          </button>
        </div>
        <CertificateCard unlocked name={me.user.name ?? undefined} completedOn={certDate(completedAt)} certificateId={id} programme={title} />
        <p className="mt-6 text-center text-sm text-white/45 print:hidden">
          In the print dialog, choose “Save as PDF” and landscape orientation.
        </p>
      </div>
    </div>
  )
}
