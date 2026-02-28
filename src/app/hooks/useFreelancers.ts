import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createDataStore } from '../lib/dataStore';
import type { Profile } from '../types/database';

const store = createDataStore<Profile[]>();

const FETCHER = async (): Promise<Profile[]> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_freelancer', true);
  return data ?? [];
};

export function useFreelancers() {
  const [freelancers, setFreelancers] = useState<Profile[]>(() => store.get() ?? []);
  const [loading, setLoading] = useState(!store.isFresh());

  useEffect(() => {
    if (store.isFresh()) {
      setFreelancers(store.get()!);
      setLoading(false);
      return;
    }
    setLoading(true);
    store.fetch(FETCHER).then(data => {
      setFreelancers(data);
      setLoading(false);
    });
    return store.subscribe(() => {
      const d = store.get();
      if (d) setFreelancers(d);
    });
  }, []);

  return { freelancers, loading };
}
