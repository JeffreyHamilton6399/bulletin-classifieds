'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useNav } from '@/store/nav'
import { Header } from '@/components/marketplace/Header'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { HomeView } from '@/components/marketplace/HomeView'
import { BrowseView } from '@/components/marketplace/BrowseView'
import { ListingDetail } from '@/components/marketplace/ListingDetail'
import { PostListing } from '@/components/marketplace/PostListing'
import { Footer } from '@/components/marketplace/Footer'

export default function Home() {
  const { view } = useNav()

  const showCategoryNav = view.name === 'home' || view.name === 'browse'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {showCategoryNav && <CategoryNav />}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey(view)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {view.name === 'home' && <HomeView />}
            {view.name === 'browse' && (
              <BrowseView initialCategory={view.category} initialQ={view.q} />
            )}
            {view.name === 'listing' && <ListingDetail id={view.id} />}
            {view.name === 'post' && <PostListing />}
            {view.name === 'account' && <HomeView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}

function viewKey(view: ReturnType<typeof useNav>['view']): string {
  switch (view.name) {
    case 'home': return 'home'
    case 'browse': return `browse-${view.category || ''}-${view.q || ''}`
    case 'listing': return `listing-${view.id}`
    case 'post': return 'post'
    case 'account': return 'account'
  }
}
