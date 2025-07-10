import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart } from "lucide-react";
import { MarketplaceBond } from '@/types/investment';
import { formatCurrency, getFrequencyText, getRatingColor } from '@/utils/typeTransformers';

interface BondCardProps {
  bond: MarketplaceBond;
  onViewDetails: (bond: MarketplaceBond) => void;
  onInvest: (bond: MarketplaceBond) => void;
}

export const BondCard: React.FC<BondCardProps> = ({ bond, onViewDetails, onInvest }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{bond.name}</CardTitle>
            <p className="text-sm text-muted-foreground">por {bond.issuer_name}</p>
          </div>
          <Badge className={getRatingColor(bond.rating || 'BBB')}>
            {bond.rating}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tasa de Interés</p>
            <p className="text-xl font-bold text-bond-green">{bond.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plazo</p>
            <p className="text-lg font-semibold">{bond.term} años</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disponible</p>
            <p className="text-sm font-medium">{formatCurrency(bond.available_amount, bond.currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mín. Inversión</p>
            <p className="text-sm font-medium">{formatCurrency(bond.min_investment, bond.currency)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Pagos</p>
          <p className="text-sm">{getFrequencyText(bond.frequency)} • {bond.amortization_type}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(bond)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalles
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-bond-green text-black hover:bg-bond-green/80"
            onClick={() => onInvest(bond)}
            disabled={bond.available_amount <= 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Invertir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};