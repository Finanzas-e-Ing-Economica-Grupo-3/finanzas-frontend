
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import BondForm from "@/components/bonds/BondForm";
import { Bond } from "@/types/bond";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const EditBond = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bond, setBond] = useState<Bond | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    const fetchBond = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bonds')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          toast.error("Bono no encontrado");
          navigate("/bonds");
          return;
        }
        
        const bondData: Bond = {
          id: data.id,
          name: data.name,
          nominalValue: data.nominal_value,
          interestRate: data.interest_rate,
          term: data.term,
          frequency: data.frequency,
          amortizationType: data.amortization_type as Bond['amortizationType'],
          graceType: data.grace_type as Bond['graceType'],
          gracePeriods: data.grace_periods,
          emissionDate: data.emission_date,
          settings: {
            currency: data.currency as Bond['settings']['currency'],
            interestRateType: data.interest_rate_type as Bond['settings']['interestRateType'],
            capitalization: data.capitalization || undefined
          },
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          userId: data.user_id
        };
        
        setBond(bondData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading bond:", error);
        toast.error("Error al cargar los datos del bono");
        navigate("/bonds");
      }
    };

    fetchBond();
  }, [id, navigate, user]);

  if (loading || !bond) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bond-green"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BondForm initialData={bond} isEditing />
    </AppLayout>
  );
};

export default EditBond;
