import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export function useFreelancers() {
  const [freelancers, setFreelancers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_freelancer', true);
      setFreelancers(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { freelancers, loading };
}
