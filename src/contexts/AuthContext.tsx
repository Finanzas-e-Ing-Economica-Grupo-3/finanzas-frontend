
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      setLoading(true);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          const userId = currentSession?.user?.id;
          if (userId) {
            localStorage.setItem('currentUserId', userId);

            supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .single()
              .then(({ data: profile, error }) => {
                if (!error && profile?.role) {
                  localStorage.setItem('currentUserRole', profile.role);
                } else {
                  localStorage.removeItem('currentUserRole');
                }
              });
          } else {
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('currentUserRole');
          }

          setLoading(false);
        }
      );

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      const userId = currentSession?.user?.id;
      if (userId) {
        localStorage.setItem('currentUserId', userId);

        supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
          .then(({ data: profile, error }) => {
            if (!error && profile?.role) {
              localStorage.setItem('currentUserRole', profile.role);
            } else {
              localStorage.removeItem('currentUserRole');
            }
          });
      } else {
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserRole');
      }

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    let cleanup: (() => void) | undefined;

    setupAuth().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
