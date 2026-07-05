'use client'

import { useNav } from '@/store/nav'

export function Footer() {
  const { go } = useNav()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t hairline bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 sm:col-span-1">
            <button onClick={() => go({ name: 'home' })} className="font-serif text-2xl tracking-tight hover:text-oxblood transition-colors text-left">
              Bulletin
            </button>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Local classifieds, scoped by region. Dense, fast, and considered.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2.5">
              Browse
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => go({ name: 'browse' })} className="hover:text-oxblood transition-colors">All listings</button></li>
              <li><button onClick={() => go({ name: 'browse', category: 'for-sale' })} className="hover:text-oxblood transition-colors">For sale</button></li>
              <li><button onClick={() => go({ name: 'browse', category: 'housing' })} className="hover:text-oxblood transition-colors">Housing</button></li>
              <li><button onClick={() => go({ name: 'browse', category: 'jobs' })} className="hover:text-oxblood transition-colors">Jobs</button></li>
              <li><button onClick={() => go({ name: 'browse', category: 'services' })} className="hover:text-oxblood transition-colors">Services</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2.5">
              Post
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => go({ name: 'post' })} className="hover:text-oxblood transition-colors">Create listing</button></li>
              <li><button onClick={() => go({ name: 'account' })} className="hover:text-oxblood transition-colors">Manage (anonymous)</button></li>
              <li><span className="text-muted-foreground">30-day auto-expiry</span></li>
              <li><span className="text-muted-foreground">Up to 12 photos</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2.5">
              About
            </h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><button onClick={() => go({ name: 'settings' })} className="hover:text-oxblood transition-colors">Settings</button></li>
              <li>Community-moderated</li>
              <li>Anonymous email relay</li>
              <li>No tracking, no ads</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t hairline">
          <p className="font-mono text-[11px] text-muted-foreground">
            © {year} Bulletin — local classifieds.
          </p>
        </div>
      </div>
    </footer>
  )
}
