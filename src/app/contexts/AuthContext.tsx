import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Team } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  captainTeam: Team | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  captainTeam: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [captainTeam, setCaptainTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileData = async (user: User) => {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    const { data: tm } = await supabase
      .from('team_members')
      .select('teams(*)')
      .eq('player_id', user.id)
      .eq('role', 'captain')
      .maybeSingle()
    setProfile(p ?? null)
    setCaptainTeam((tm?.teams as unknown as Team) ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfileData(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfileData(session.user)
      } else {
        setProfile(null)
        setCaptainTeam(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCaptainTeam(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, captainTeam, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
