import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ShoppingCart, ArrowUpDown } from "lucide-react";
import { MarketplaceBond } from '@/types/investment';
import { formatCurrency, getFrequencyText, getRatingColor } from '@/utils/typeTransformers';

interface BondTableProps {
  bonds: MarketplaceBond[];
  sortBy: string;
  onSort: (sortType: string) => void;
  onViewDetails: (bond: MarketplaceBond) => void;
  onInvest: (bond: MarketplaceBond) => void;
}

export const BondTable: React.FC<BondTableProps> = ({ 
  bonds, 
  sortBy, 
  onSort, 
  onViewDetails, 
  onInvest 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lista de Bonos</span>
          <Badge variant="secondary">{bonds.length} bonos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">
                  <Button variant="ghost" size="sm" onClick={() => onSort(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}>
                    Nombre del Bono
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <Button variant="ghost" size="sm" onClick={() => onSort(sortBy === 'issuer_asc' ? 'issuer_desc' : 'issuer_asc')}>
                    Emisor
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <Button variant="ghost" size="sm" onClick={() => onSort(sortBy === 'interest_rate_desc' ? 'interest_rate_asc' : 'interest_rate_desc')}>
                    Tasa (%)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <Button variant="ghost" size="sm" onClick={() => onSort(sortBy === 'term_asc' ? 'term_desc' : 'term_asc')}>
                    Plazo
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">Moneda</TableHead>
                <TableHead className="font-semibold text-foreground">
                  <Button variant="ghost" size="sm" onClick={() => onSort(sortBy === 'amount_desc' ? 'amount_asc' : 'amount_desc')}>
                    Disponible
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">Min. Inversión</TableHead>
                <TableHead className="font-semibold text-foreground">Rating</TableHead>
                <TableHead className="font-semibold text-foreground">Frecuencia</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonds.map((bond) => (
                <TableRow key={bond.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <TableCell className="font-medium py-4 max-w-[200px]">
                    <div>
                      <p className="font-semibold truncate">{bond.name}</p>
                      <p className="text-xs text-muted-foreground">{bond.amortization_type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{bond.issuer_name}</TableCell>
                  <TableCell className="py-4">
                    <span className="font-mono text-lg font-bold text-bond-green">
                      {bond.interest_rate}%
                    </span>
                  </TableCell>
                  <TableCell className="py-4">{bond.term} años</TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline">{bond.currency}</Badge>
                  </TableCell>
                  <TableCell className="py-4 font-mono">
                    {formatCurrency(bond.available_amount, bond.currency)}
                  </TableCell>
                  <TableCell className="py-4 font-mono text-sm">
                    {formatCurrency(bond.min_investment, bond.currency)}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getRatingColor(bond.rating || 'BBB')}>
                      {bond.rating}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-sm">
                    {getFrequencyText(bond.frequency)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(bond)}
                        className="hover:bg-bond-blue/10 h-8 w-8 p-0"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4 text-bond-blue" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInvest(bond)}
                        className="hover:bg-bond-green/10 h-8 w-8 p-0"
                        title="Invertir"
                        disabled={bond.available_amount <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 text-bond-green" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};