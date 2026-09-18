import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Navbar username={session.username} />
      <main className="flex-1 pt-14 pb-16 md:pt-0 md:pb-0 md:ml-56 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
