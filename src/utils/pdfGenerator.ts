import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bond, CashFlow, BondAnalysis } from '@/types/bond';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Función para agregar cabecera a cada página
function addHeader(doc: jsPDF): void {
  doc.setFillColor(30, 64, 175); // Azul primario
  doc.rect(0, 0, 210, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BONDFLOW', 20, 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Valoración de Bonos', 150, 10);
}

export function generateBondReportPDF(
  bond: Bond,
  cashFlow: CashFlow[],
  analysis: BondAnalysis
): void {
  const doc = new jsPDF();
  
  // Configurar fuente
  doc.setFont('helvetica');
  
  // PÁGINA 1: Información básica del bono
  addHeader(doc);
  
  // Título principal
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175); // Azul primario
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE COMPLETO DE BONO', 20, 30);
  
  // Línea decorativa
  doc.setDrawColor(16, 185, 129); // Verde accent
  doc.setLineWidth(1);
  doc.line(20, 35, 190, 35);
  
  // Información básica del bono
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Bono', 20, 50);
  
  doc.setFontSize(11);
  const basicInfo = [
    ['Nombre del Bono:', bond.name],
    ['Valor Nominal:', formatCurrency(bond.nominalValue, bond.settings.currency)],
    ['Tasa de Interés:', `${bond.interestRate}% ${bond.settings.interestRateType === 'Effective' ? 'Efectiva' : 'Nominal'}`],
    ['Plazo:', `${bond.term} años`],
    ['Frecuencia de Pago:', `${getFrequencyText(bond.frequency)}`],
    ['Tipo de Amortización:', getAmortizationText(bond.amortizationType)],
    ['Tipo de Gracia:', getGraceText(bond.graceType)],
    ['Períodos de Gracia:', bond.gracePeriods.toString()],
    ['Fecha de Emisión:', formatDate(bond.emissionDate)],
    ['Moneda:', getCurrencyWithSymbol(bond.settings.currency)]
  ];
  
  if (bond.settings.capitalization) {
    basicInfo.push(['Capitalización:', bond.settings.capitalization]);
  }
  
  let yPosition = 60;
  basicInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // Métricas de análisis
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Análisis Financiero', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  const analysisInfo = [
    ['Precio de Mercado:', formatCurrency(analysis.marketPrice, bond.settings.currency)],
    ['Duración (Macaulay):', `${analysis.duration.toFixed(2)} años`],
    ['Duración Modificada:', `${analysis.modifiedDuration.toFixed(2)} años`],
    ['Convexidad:', analysis.convexity.toFixed(2)],
    ['TCEA (Costo Efectivo):', `${(analysis.effectiveCostRate * 100).toFixed(2)}%`],
    ['TREA (Rendimiento Efectivo):', `${(analysis.effectiveYieldRate * 100).toFixed(2)}%`]
  ];
  
  analysisInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // PÁGINA 2: Flujo de caja
  doc.addPage();
  addHeader(doc);
  
  // Título de flujo de caja
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Flujo de Caja Detallado', 20, 30);
  
  // Tabla resumen antes del detalle
  // Exclude period 0 from interest, amortization, and payment totals
  const operationalPeriods = cashFlow.slice(1); // Exclude period 0
  const summaryTableData = [
    ['Total de Períodos', `${cashFlow.length} (incluyendo emisión)`],
    ['Períodos Operacionales', operationalPeriods.length.toString()],
    ['Total Intereses', formatCurrency(operationalPeriods.reduce((sum, flow) => sum + flow.interest, 0), bond.settings.currency)],
    ['Total Amortización', formatCurrency(operationalPeriods.reduce((sum, flow) => sum + flow.amortization, 0), bond.settings.currency)],
    ['Total Pagos (sin emisión)', formatCurrency(operationalPeriods.reduce((sum, flow) => sum + flow.payment, 0), bond.settings.currency)],
    ['Pago Promedio', formatCurrency(operationalPeriods.reduce((sum, flow) => sum + flow.payment, 0) / operationalPeriods.length, bond.settings.currency)],
    ['Primer Pago', formatDate(cashFlow[0]?.date || '')],
    ['Último Pago', formatDate(cashFlow[cashFlow.length - 1]?.date || '')]
  ];
  
  autoTable(doc, {
    startY: 35,
    head: [['Concepto', 'Valor']],
    body: summaryTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // Verde
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 50
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 60, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 60 }
    },
    margin: { left: 35, right: 35 }
  });
  
  // Espacio entre tablas
  const summaryTableFinalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Preparar datos de la tabla principal
  const tableData = cashFlow.map((flow, index) => [
    flow.period.toString(), // Use flow.period instead of index + 1
    formatDate(flow.date),
    formatCurrency(flow.initialBalance, bond.settings.currency),
    formatCurrency(flow.interest, bond.settings.currency),
    formatCurrency(flow.amortization, bond.settings.currency),
    formatCurrency(flow.payment, bond.settings.currency),
    formatCurrency(flow.finalBalance, bond.settings.currency)
  ]);
  
  // Configurar tabla principal
  autoTable(doc, {
    startY: summaryTableFinalY,
    head: [['Período', 'Fecha', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Saldo Final']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175], // Azul primario
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Gris muy claro
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'right', cellWidth: 24 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'right', cellWidth: 24 }
    },
    margin: { left: 12, right: 12 }
  });
  
  // PÁGINA 3: Resumen Ejecutivo
  doc.addPage();
  addHeader(doc);
  
  // Calcular totales para el resumen (excluding period 0)
  const operationalFlows = cashFlow.slice(1); // Exclude period 0
  const totalInterest = operationalFlows.reduce((sum, flow) => sum + flow.interest, 0);
  const totalPayments = operationalFlows.reduce((sum, flow) => sum + flow.payment, 0);
  const totalAmortization = operationalFlows.reduce((sum, flow) => sum + flow.amortization, 0);
  
  // Título principal de la página
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Verde accent
  doc.text('RESUMEN EJECUTIVO', 20, 30);
  
  // Línea decorativa
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(20, 33, 190, 33);
  
  let currentY = 45;
  
  // Sección 1: Datos de la Inversión
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('DATOS DE LA INVERSIÓN', 20, currentY);
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const investmentData = [
    `• Capital inicial: ${formatCurrency(bond.nominalValue, bond.settings.currency)}`,
    `• Plazo total: ${bond.term} años (${cashFlow.length - 1} períodos operacionales + emisión)`,
    `• Tasa de interés: ${bond.interestRate}% ${bond.settings.interestRateType === 'Effective' ? 'Efectiva' : 'Nominal'}`,
    `• Frecuencia de pago: ${getFrequencyText(bond.frequency)}`,
    `• Períodos de gracia: ${bond.gracePeriods} (${getGraceText(bond.graceType)})`
  ];
  
  investmentData.forEach(text => {
    doc.text(text, 25, currentY);
    currentY += 6;
  });
  
  // Sección 2: Flujos de Efectivo
  currentY += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 127); // Rosa/magenta
  doc.text('FLUJOS DE EFECTIVO', 20, currentY);
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const cashFlowData = [
    `• Total de intereses pagados: ${formatCurrency(totalInterest, bond.settings.currency)}`,
    `• Total de amortización: ${formatCurrency(totalAmortization, bond.settings.currency)}`,
    `• Total de pagos realizados: ${formatCurrency(totalPayments, bond.settings.currency)}`,
    `• Promedio de pago por período: ${formatCurrency(totalPayments / cashFlow.length, bond.settings.currency)}`,
    `• Costo financiero total: ${formatCurrency(totalPayments - bond.nominalValue, bond.settings.currency)}`
  ];
  
  cashFlowData.forEach(text => {
    doc.text(text, 25, currentY);
    currentY += 6;
  });
  
  // Verificar si necesitamos una nueva página para análisis de rentabilidad
  if (currentY > 180) {
    doc.addPage();
    addHeader(doc);
    currentY = 30;
  } else {
    currentY += 10;
  }
  
  // Sección 3: Análisis de Rentabilidad
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Verde
  doc.text('ANÁLISIS DE RENTABILIDAD', 20, currentY);
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const profitabilityData = [
    `• TCEA (Costo Efectivo Anual): ${(analysis.effectiveCostRate * 100).toFixed(2)}%`,
    `• TREA (Rendimiento Efectivo Anual): ${(analysis.effectiveYieldRate * 100).toFixed(2)}%`,
    `• Precio de mercado actual: ${formatCurrency(analysis.marketPrice, bond.settings.currency)}`,
    `• Prima/Descuento vs. Nominal: ${formatCurrency(analysis.marketPrice - bond.nominalValue, bond.settings.currency)} (${(((analysis.marketPrice - bond.nominalValue) / bond.nominalValue) * 100).toFixed(2)}%)`,
    `• Duración de Macaulay: ${analysis.duration.toFixed(2)} años`,
    `• Duración Modificada: ${analysis.modifiedDuration.toFixed(2)} años (sensibilidad al precio)`,
    `• Convexidad: ${analysis.convexity.toFixed(2)} (curvatura de la relación precio-rendimiento)`
  ];
  
  profitabilityData.forEach(text => {
    doc.text(text, 25, currentY);
    currentY += 6;
  });
  
  // Verificar si necesitamos una nueva página para las conclusiones
  if (currentY > 220) {
    doc.addPage();
    addHeader(doc);
    currentY = 30;
  }
  
  // Sección 4: Conclusiones
  currentY += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(168, 85, 247); // Púrpura
  doc.text('CONCLUSIONES', 20, currentY);
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const conclusions = [];
  
  // Análisis automático de rentabilidad
  if (analysis.effectiveYieldRate > analysis.effectiveCostRate) {
    conclusions.push('• Inversión atractiva: La TREA supera a la TCEA, indicando rentabilidad positiva.');
  } else {
    conclusions.push('• Inversión con costo: La TCEA supera a la TREA, evalúe otras alternativas.');
  }
  
  // Análisis de precio
  if (analysis.marketPrice > bond.nominalValue) {
    conclusions.push('• El bono cotiza con prima, el mercado valora positivamente este instrumento.');
  } else if (analysis.marketPrice < bond.nominalValue) {
    conclusions.push('• El bono cotiza con descuento, oportunidad de compra a precio reducido.');
  } else {
    conclusions.push('• El bono cotiza a la par, precio de mercado igual al valor nominal.');
  }
  
  // Análisis de sensibilidad
  if (analysis.modifiedDuration > 5) {
    conclusions.push('• Alta sensibilidad: Cambios en tasas de interés impactarán significativamente el precio.');
  } else if (analysis.modifiedDuration > 2) {
    conclusions.push('• Sensibilidad moderada: Cambios en tasas tendrán impacto controlado en el precio.');
  } else {
    conclusions.push('• Baja sensibilidad: El precio es relativamente estable ante cambios en tasas.');
  }
  
  conclusions.forEach(text => {
    doc.text(text, 25, currentY);
    currentY += 6;
  });
  
  // Pie de página con información adicional
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    
    // Línea separadora del pie
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, 280, 190, 280);
    
    // Información del pie
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`Generado por BondFlow - ${dateStr}`, 20, 285);
    doc.text(`Página ${i} de ${pageCount}`, 170, 285);
    
    // Disclaimer en la primera página
    if (i === 1) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Este reporte es generado automáticamente con fines informativos. Consulte con un asesor financiero antes de tomar decisiones de inversión.', 20, 290);
    }
  }
  
  // Descargar el PDF
  const fileName = `${bond.name.replace(/[^a-zA-Z0-9]/g, '_')}_reporte_completo.pdf`;
  doc.save(fileName);
}

// Funciones auxiliares modificadas
function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'USD': return 'US$';
    case 'PEN': return 'S/.';
    case 'EUR': return '€';
    default: return '';
  }
}

// Nueva función para mostrar moneda con símbolo
function getCurrencyWithSymbol(currency: string): string {
  switch (currency) {
    case 'USD': return 'USD (US$)';
    case 'PEN': return 'PEN (S/.)';
    case 'EUR': return 'EUR (€)';
    default: return currency;
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${getCurrencySymbol(currency)} ${formatNumber(amount)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getFrequencyText(frequency: number): string {
  switch (frequency) {
    case 1: return 'Anual';
    case 2: return 'Semestral';
    case 4: return 'Trimestral';
    case 12: return 'Mensual';
    default: return `${frequency} veces al año`;
  }
}

function getAmortizationText(type: string): string {
  switch (type) {
    case 'American': return 'Americano (al vencimiento)';
    default: return type;
  }
}

function getGraceText(type: string): string {
  switch (type) {
    case 'None': return 'Sin gracia';
    case 'Partial': return 'Gracia parcial';
    case 'Total': return 'Gracia total';
    default: return type;
  }
}