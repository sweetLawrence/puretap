import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
// import Navbar from './Navbar'
// import Footer from './Footer'
import { useMediaQuery } from '@mantine/hooks'
// import MobileNav from './MobileNav'

const Layout = () => {
  const { pathname } = useLocation()
  const isSmallScreen = useMediaQuery('(max-width: 640px)')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <div>
      {/* {isSmallScreen ? <MobileNav /> : <Navbar />} */}

      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}

    </div>
  )
}

export default Layout
