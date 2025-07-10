import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ShoppingCart } from "lucide-react";
import { MarketplaceBond } from '@/types/investment';
import { CashFlow, BondAnalysis } from "@/types/bond";
import { formatCurrency, getFrequencyText, getRatingColor } from '@/utils/typeTransformers';

interface BondDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bond: MarketplaceBond | null;
    cashFlow: CashFlow[];
    bondAnalysis: BondAnalysis | null;
    onDownloadPDF: () => void;
    onInvest: (bond: MarketplaceBond) => void;
}

export const BondDetailModal: React.FC<BondDetailModalProps> = ({
    open,
    onOpenChange,
    bond,
    cashFlow,
    bondAnalysis,
    onDownloadPDF,
    onInvest
}) => {
    if (!bond) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {bond.name}
                        <Badge className={getRatingColor(bond.rating || 'BBB')}>
                            {bond.rating}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Análisis Detallado del Bono</h3>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={onDownloadPDF}
                            disabled={!cashFlow.length || !bondAnalysis}
                        >
                            📄 Descargar PDF
                        </Button>
                    </div>

                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info">Información</TabsTrigger>
                            <TabsTrigger value="analysis">Análisis</TabsTrigger>
                            <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-bond-blue">Información Básica</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Emisor:</span>
                                            <span className="text-sm font-medium">{bond.issuer_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Valor Nominal:</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(bond.nominal_value, bond.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Tasa de Interés:</span>
                                            <span className="text-sm font-medium">
                                                {bond.interest_rate}% {bond.interest_rate_type === 'Effective' ? 'Efectiva' : 'Nominal'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Plazo:</span>
                                            <span className="text-sm font-medium">{bond.term} años</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Frecuencia:</span>
                                            <span className="text-sm font-medium">{getFrequencyText(bond.frequency)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-bond-green">Detalles de Inversión</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Disponible:</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(bond.available_amount, bond.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Mín. Inversión:</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(bond.min_investment, bond.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Fecha Emisión:</span>
                                            <span className="text-sm font-medium">
                                                {new Date(bond.emission_date).toLocaleDateString('es-PE')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Tipo Amortización:</span>
                                            <span className="text-sm font-medium">{bond.amortization_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Período Gracia:</span>
                                            <span className="text-sm font-medium">
                                                {bond.grace_type === 'None' ? 'Sin gracia' :
                                                    `${bond.grace_type} (${bond.grace_periods} períodos)`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="analysis" className="space-y-4">
                            {bondAnalysis ? (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-bond-blue">Métricas de Riesgo</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Duración:</span>
                                                <span className="text-sm font-medium">
                                                    {bondAnalysis.duration !== undefined && !isNaN(bondAnalysis.duration)
                                                        ? `${bondAnalysis.duration.toFixed(2)} años`
                                                        : "No disponible"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Duración Modificada:</span>
                                                <span className="text-sm font-medium">
                                                    {bondAnalysis.modifiedDuration !== undefined && !isNaN(bondAnalysis.modifiedDuration)
                                                        ? `${bondAnalysis.modifiedDuration.toFixed(2)} años`
                                                        : "No disponible"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Convexidad:</span>
                                                <span className="text-sm font-medium">
                                                    {bondAnalysis.convexity !== undefined && !isNaN(bondAnalysis.convexity)
                                                        ? bondAnalysis.convexity.toFixed(2)
                                                        : "No disponible"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-bond-green">Rentabilidad</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">TCEA (Emisor):</span>
                                                <span className="text-sm font-medium">{bondAnalysis.effectiveCostRate?.toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">TREA (Inversor):</span>
                                                <span className="text-sm font-medium">{bondAnalysis.effectiveYieldRate?.toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Precio de Mercado:</span>
                                                <span className="text-sm font-medium">
                                                    {formatCurrency(bondAnalysis.marketPrice || 0, bond.currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Calculando análisis...</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="cashflow" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-bond-blue">Flujo de Caja Proyectado</h4>
                                {cashFlow.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {cashFlow.length} períodos
                                    </Badge>
                                )}
                            </div>
                            {cashFlow.length > 0 ? (
                                <div className="border rounded-lg">
                                    <div className="overflow-x-auto overflow-y-auto max-h-96">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                <TableRow>
                                                    <TableHead className="min-w-[80px] text-center">Período</TableHead>
                                                    <TableHead className="min-w-[110px] text-center">Fecha</TableHead>
                                                    <TableHead className="min-w-[120px] text-right">Saldo Inicial</TableHead>
                                                    <TableHead className="min-w-[100px] text-right">Interés</TableHead>
                                                    <TableHead className="min-w-[120px] text-right">Amortización</TableHead>
                                                    <TableHead className="min-w-[100px] text-right">Cuota</TableHead>
                                                    <TableHead className="min-w-[120px] text-right">Saldo Final</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cashFlow.map((flow, index) => (
                                                    <TableRow
                                                        key={flow.period}
                                                        className={`${index % 2 === 0 ? 'bg-muted/30' : ''} hover:bg-muted/50 transition-colors`}
                                                    >
                                                        <TableCell className="text-center font-medium">{flow.period}</TableCell>
                                                        <TableCell className="text-center text-sm">
                                                            {new Date(flow.date).toLocaleDateString('es-PE', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-right">
                                                            {formatCurrency(flow.initialBalance, bond.currency)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-right text-green-600">
                                                            {formatCurrency(flow.interest, bond.currency)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-right text-blue-600">
                                                            {formatCurrency(flow.amortization, bond.currency)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-right font-bold text-purple-600">
                                                            {formatCurrency(flow.payment, bond.currency)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-right">
                                                            {formatCurrency(flow.finalBalance, bond.currency)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="border-t bg-muted/20 p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Total Intereses</p>
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(
                                                        cashFlow.reduce((sum, flow) => sum + flow.interest, 0),
                                                        bond.currency
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Total Amortización</p>
                                                <p className="font-bold text-blue-600">
                                                    {formatCurrency(
                                                        cashFlow.reduce((sum, flow) => sum + flow.amortization, 0),
                                                        bond.currency
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Total Pagos</p>
                                                <p className="font-bold text-purple-600">
                                                    {formatCurrency(
                                                        cashFlow.reduce((sum, flow) => sum + flow.payment, 0),
                                                        bond.currency
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Valor Nominal</p>
                                                <p className="font-bold">
                                                    {formatCurrency(bond.nominal_value, bond.currency)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bond-blue mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">Calculando flujo de caja...</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            className="flex-1 bg-bond-green text-black hover:bg-bond-green/80"
                            onClick={() => {
                                onOpenChange(false);
                                onInvest(bond);
                            }}
                            disabled={bond.available_amount <= 0}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Invertir Ahora
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};