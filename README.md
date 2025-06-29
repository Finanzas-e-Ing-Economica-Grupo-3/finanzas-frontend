# BondFlow

## Descripción

Bond Vista Navigator es una aplicación web moderna para la gestión y análisis de bonos corporativos. Diseñada para profesionales financieros e inversionistas, esta herramienta permite calcular, visualizar y gestionar diferentes tipos de bonos con una interfaz intuitiva y elegante.

## Características

- **Gestión de bonos**: Crear, editar y eliminar bonos corporativos
- **Cálculos avanzados**: Duración, duración modificada, convexidad, TCEA, TREA
- **Visualización de flujos de caja**: Tablas detalladas de flujos y gráficos
- **Tipos de bonos soportados**: 
  - Amortización Alemana, Francesa y Americana
  - Periodos de gracia parcial y total
  - Diferentes frecuencias de pago
- **Múltiples monedas**: USD, PEN, EUR
- **Exportación de informes**: Impresión de reportes detallados

## Tecnologías

- **Frontend**: React, TypeScript, Vite
- **Estilos**: Tailwind CSS
- **Autenticación**: Supabase Auth
- **Base de datos**: Supabase PostgreSQL
- **Componentes UI**: Radix UI

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Finanzas-e-Ing-Economica-Grupo-3/finanzas-frontend

# Entrar al directorio
cd finanzas-frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev