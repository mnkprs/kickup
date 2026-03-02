  🔴 High priority — core flows                                                                                                                                                                                                 
                                                                                                                                                                                                                              
  ┌────────────────────┬─────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────┐                                                                                 
  │      Feature       │      v1 route       │                                          What it does                                          │                                                                                 
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                 
  │ Send Challenge     │ /matches/challenge  │ 4-step wizard: pick your team → pick opponent → format/area → review. Calls send_challenge RPC │                                                                                 
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Accept Challenge   │ Match detail        │ Away team captain accepts a pending_challenge match                                            │
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Propose Time/Venue │ Match detail        │ Captain sets date/time/location on a scheduling match                                          │
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Submit Result      │ /matches/:id/result │ Score entry, MVP pick, goal/assist tracking per player                                         │
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Create Tournament  │ /tournaments/create │ Form for field owners only: name, format, max teams, dates, area, prize                        │
  ├────────────────────┼─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Onboarding flow    │ /onboarding         │ Post-signup wizard: position, area, nationality, DOB, height, foot                             │
  └────────────────────┴─────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘

  🟡 Medium priority — discovery & social

  ┌──────────────────────────────────────┬──────────────┬─────────────────────────────────────────────────────────────────────────┐
  │               Feature                │   v1 route   │                              What it does                               │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Discover page                        │ /discover    │ 3 tabs: Freelancers (invite to team), Teams (challenge), Open Matches   │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Freelancer toggle                    │ Profile      │ "Available for Open Spots" on/off — sets is_freelancer on profiles      │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Teams searching for opponent on home │ Home         │ "Challenge Open" section showing teams with searching_for_opponent=true │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Players Near You on home             │ Home         │ Freelancers in your area                                                │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Public player profile                │ /players/:id │ View another player's stats/profile                                     │
  └──────────────────────────────────────┴──────────────┴─────────────────────────────────────────────────────────────────────────┘

  🟠 Medium priority — team management

  ┌───────────────────────────────┬─────────────┬────────────────────────────────────────────────────────────────────┐
  │            Feature            │     v1      │                            What it does                            │
  ├───────────────────────────────┼─────────────┼────────────────────────────────────────────────────────────────────┤
  │ Team roster management        │ Team detail │ Captain: invite freelancers, accept/remove members, assign captain │
  ├───────────────────────────────┼─────────────┼────────────────────────────────────────────────────────────────────┤
  │ Join team request             │ Team detail │ Player applies to join a team (calls apply_to_team RPC)            │
  ├───────────────────────────────┼─────────────┼────────────────────────────────────────────────────────────────────┤
  │ Searching for opponent toggle │ Team detail │ Captain toggles searching_for_opponent on the team                 │
  └───────────────────────────────┴─────────────┴────────────────────────────────────────────────────────────────────┘

  🔵 Lower priority

  ┌────────────────────┬────────────────┬───────────────────────────────────────────────────────────────────┐
  │      Feature       │       v1       │                           What it does                            │
  ├────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────┤
  │ Admin panel        │ Profile        │ Approve/reject field owner applications, resolve disputed matches │
  ├────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────┤
  │ Match lineups      │ Match detail   │ Add players to a match lineup                                     │
  ├────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────┤
  │ Notifications page │ /notifications │ In-app notification feed                