import { createBrowserRouter, Navigate } from 'react-router';
import { Splash } from './components/auth/Splash';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Onboarding } from './components/auth/Onboarding';
import { RequireAuth } from './components/auth/RequireAuth';
import { Layout } from './components/layout/Layout';
import { HomeFeed } from './components/home/HomeFeed';
import { TeamsList } from './components/teams/TeamsList';
import { TeamProfile } from './components/teams/TeamProfile';
import { CreateTeam } from './components/teams/CreateTeam';
import { MatchesList } from './components/matches/MatchesList';
import { ChallengeScreen } from './components/matches/ChallengeScreen';
import { MatchScheduling } from './components/matches/MatchScheduling';
import { PreMatch } from './components/matches/PreMatch';
import { SubmitResult } from './components/matches/SubmitResult';
import { PlayerProfile } from './components/profile/PlayerProfile';
import { EditProfile } from './components/profile/EditProfile';
import { PlayerPublicProfile } from './components/profile/PlayerPublicProfile';
import { Notifications } from './components/notifications/Notifications';
import { Discover } from './components/discover/Discover';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app" replace /> },
  { path: '/splash', element: <Splash /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    path: '/app',
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true, element: <HomeFeed /> },
      { path: 'teams', element: <TeamsList /> },
      { path: 'teams/:id', element: <TeamProfile /> },
      { path: 'teams/create', element: <CreateTeam /> },
      { path: 'matches', element: <MatchesList /> },
      { path: 'matches/challenge', element: <ChallengeScreen /> },
      { path: 'matches/:id/pre', element: <PreMatch /> },
      { path: 'matches/:id/schedule', element: <MatchScheduling /> },
      { path: 'matches/:id/result', element: <SubmitResult /> },
      { path: 'profile', element: <PlayerProfile /> },
      { path: 'profile/edit', element: <EditProfile /> },
      { path: 'players/:id', element: <PlayerPublicProfile /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'discover', element: <Discover /> },
    ],
  },
  { path: '*', element: <Navigate to="/splash" replace /> },
]);
