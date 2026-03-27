import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'cliente';

      let isEmployeeOfPartner = false;
      if (!allowedRoles.includes(role)) {
        if (allowedRoles.includes('parceiro')) {
          // Check if user is an employee of a partner
          const { data: empData } = await supabase
            .from('partner_employees')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
            
          if (empData) {
            isEmployeeOfPartner = true;
          }
        }

        if (!isEmployeeOfPartner) {
          // Redirect to the correct dashboard based on actual role
          if (role === 'admin') navigate('/admin', { replace: true });
          else if (role === 'parceiro') navigate('/partner', { replace: true });
          else navigate('/client', { replace: true });
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate, allowedRoles]);

  if (loading || !authorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg, #0a0f1c)',
        color: 'var(--gold, #c9943a)',
        fontFamily: "'Syne', sans-serif",
        fontSize: '1.1rem',
      }}>
        Carregando...
      </div>
    );
  }

  return <>{children}</>;
}
