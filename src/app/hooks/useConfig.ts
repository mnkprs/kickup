import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AreaGroup {
  city: string;
  areas: string[];
}

const CITY_ORDER = ['Athens', 'Thessaloniki'];

export function useAreas() {
  const [groups, setGroups] = useState<AreaGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('areas').select('name, city').order('name');
      const raw = (data ?? []) as { name: string; city: string }[];
      const map = new Map<string, string[]>();
      for (const { name, city } of raw) {
        if (!map.has(city)) map.set(city, []);
        map.get(city)!.push(name);
      }
      const ordered: AreaGroup[] = CITY_ORDER
        .filter(c => map.has(c))
        .map(c => ({ city: c, areas: map.get(c)! }));
      for (const [city, areas] of map.entries()) {
        if (!CITY_ORDER.includes(city)) ordered.push({ city, areas });
      }
      setGroups(ordered);
      setLoading(false);
    };
    fetch();
  }, []);

  // flat list for components that just need all area names
  const areas = groups.flatMap(g => g.areas);

  return { groups, areas, loading };
}

export function useAvatarColors() {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('avatar_colors').select('hex').order('sort');
      setColors((data ?? []).map((r: { hex: string }) => r.hex));
      setLoading(false);
    };
    fetch();
  }, []);

  return { colors, loading };
}

export function useTeamEmojis() {
  const [emojis, setEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('team_emojis').select('emoji').order('sort');
      setEmojis((data ?? []).map((r: { emoji: string }) => r.emoji));
      setLoading(false);
    };
    fetch();
  }, []);

  return { emojis, loading };
}
