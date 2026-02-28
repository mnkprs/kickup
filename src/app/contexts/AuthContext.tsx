import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Team } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  captainTeam: Team | null  // team where user is active captain
  playerTeam: Team | null   // any team user is an active member of
  loading: boolean
  needsOnboarding: boolean  // true for OAuth users who haven't filled profile yet
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  captainTeam: null,
  playerTeam: null,
  loading: true,
  needsOnboarding: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [captainTeam, setCaptainTeam] = useState<Team | null>(null)
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileData = async (user: User) => {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Auto-sync Google profile photo for OAuth users
    if (p && !p.avatar_url && user.user_metadata?.avatar_url) {
      await supabase.from('profiles').update({ avatar_url: user.user_metadata.avatar_url }).eq('id', user.id)
      p.avatar_url = user.user_metadata.avatar_url
    }

    const { data: captainTm } = await supabase
      .from('team_members')
      .select('teams(*)')
      .eq('player_id', user.id)
      .eq('role', 'captain')
      .eq('status', 'active')
      .maybeSingle()

    const { data: memberTm } = await supabase
      .from('team_members')
      .select('teams(*)')
      .eq('player_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    setProfile(p ?? null)
    setCaptainTeam((captainTm?.teams as unknown as Team) ?? null)
    setPlayerTeam((memberTm?.teams as unknown as Team) ?? null)
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
        setPlayerTeam(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfileData(session.user)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCaptainTeam(null)
    setPlayerTeam(null)
  }

  const needsOnboarding = !loading && !!session && !!profile && !profile.area

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, captainTeam, playerTeam, loading, needsOnboarding, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
