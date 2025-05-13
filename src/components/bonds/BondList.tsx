
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface BondListItem {
  id: string;
  name: string;
  nominal_value: number;
  interest_rate: number;
  term: number;
  amortization_type: string;
  currency: string;
  emission_date: string;
}

const BondList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bonds, setBonds] = useState<BondListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBonds = async () => {
      try {
        setLoading(true);
        if (!user) return;

        const { data, error } = await supabase
          .from('bonds')
          .select('id, name, nominal_value, interest_rate, term, amortization_type, currency, emission_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setBonds(data || []);
      } catch (error) {
        console.error('Error fetching bonds:', error);
        toast.error('Error al cargar los bonos');
      } finally {
        setLoading(false);
      }
    };

    fetchBonds();
  }, [user]);

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD":
        return "$";
      case "PEN":
        return "S/";
      case "EUR":
        return "€";
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return `${getCurrencySymbol(currency)} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bond-green"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bonos</CardTitle>
        <Button 
          className="bg-bond-green text-black hover:bg-bond-green/80"
          onClick={() => navigate("/bonds/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Bono
        </Button>
      </CardHeader>
      <CardContent>
        {bonds.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Valor Nominal</TableHead>
                <TableHead>Tasa (%)</TableHead>
                <TableHead>Plazo (años)</TableHead>
                <TableHead>Amortización</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonds.map((bond) => (
                <TableRow key={bond.id}>
                  <TableCell className="font-medium">{bond.name}</TableCell>
                  <TableCell>{formatCurrency(bond.nominal_value, bond.currency)}</TableCell>
                  <TableCell>{bond.interest_rate}%</TableCell>
                  <TableCell>{bond.term}</TableCell>
                  <TableCell>
                    {bond.amortization_type === "French"
                      ? "Francés"
                      : bond.amortization_type === "German"
                      ? "Alemán"
                      : "Americano"}
                  </TableCell>
                  <TableCell>{new Date(bond.emission_date).toLocaleDateString('es-PE')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/bonds/${bond.id}`)}
                    >
                      <FileText className="h-4 w-4 text-bond-blue" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No hay bonos registrados aún.</p>
            <Button
              variant="link"
              className="mt-2 text-bond-blue"
              onClick={() => navigate("/bonds/new")}
            >
              Crear primer bono
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BondList;
