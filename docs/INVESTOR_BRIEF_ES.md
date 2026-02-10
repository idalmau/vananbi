# Vananbi - Informe Técnico para Inversores y Stakeholders

## 1. Resumen Ejecutivo

Vananbi está construido como un **MVP de Validación (Producto Mínimo Viable)** de alto rendimiento. La arquitectura prioriza la **velocidad de lanzamiento** y la **eficiencia de capital**, aprovechando una infraestructura moderna de "Backend-as-a-Service" (BaaS) para minimizar los costes iniciales de ingeniería.

Este documento detalla nuestra capacidad técnica, costes operativos (en Euros) y la hoja de ruta para la escalabilidad.

---

## 2. Arquitectura Actual y Limitaciones

### La Pila Tecnológica (Stack)
-   **Frontend:** Next.js (Framework de React).
-   **Backend:** Supabase (Base de Datos PostgreSQL, Autenticación, Almacenamiento).
-   **Alojamiento:** Vercel (Red Edge).

### Limitaciones Clave (Backend-as-a-Service)
"Alquilamos" nuestra infraestructura. Esto permite que un equipo de 1-2 ingenieros construya lo que usualmente requiere 5-6, pero conlleva compromisos:

1.  **Dependencia del Proveedor:** La lógica central está acoplada a Supabase. Salir más tarde es posible, pero requiere una migración planificada (Fase 3).
2.  **Recursos Compartidos:** El rendimiento es excelente, pero puede variar ligeramente durante picos de tráfico global a menos que paguemoss por instancias dedicadas.

---

## 3. Análisis de Escalabilidad y Capacidad

### Métricas: ¿Por qué "10.000 MAU"?
Estimamos que la configuración "Pro" actual puede manejar **10.000 Usuarios Activos Mensuales (MAU)** de forma segura.
-   **El Límite Técnico:** El plan Pro incluye **500 Conexiones Directas** a la base de datos (fuente: Supabase Pricing).
-   **Conexiones vs Usuarios:** Una conexión NO es un usuario. Varios usuarios pueden compartir conexiones si usamos "Pooling", pero incluso sin optimizar, 500 usuarios haciendo clic *en el mismo milisegundo* es un escenario de tráfico muy alto.
-   **Escenario Real:** Con 10.000 usuarios mensuales, es estadísticamente improbable saturar 500 conexiones simultáneas.
-   **Conclusión:** Estamos seguros para el primer año. *Nota: El límite de "Usuarios Registrados" en Auth es mucho mayor (100.000+), el límite real es la base de datos.*

### Capacidad de Almacenamiento y Base de Datos (Plan Supabase Pro)
El plan Pro de **25 €/mes** cubre un terreno significativo:

| Recurso | Límite Incluido | Capacidad Real (Estimada) | Coste Exceso |
| :--- | :--- | :--- | :--- |
| **Tamaño Base de Datos** | 8 GB | **~5 Millones de Reservas/Anuncios** (El texto es pequeño). | 0,12 € por GB |
| **Almacenamiento Archivos** | 100 GB | **~200.000 Imágenes Alta Res** (500KB media). Cubre ~10k Anuncios (20 fotos c/u). | 0,02 € por GB |
| **Ancho de Banda** | 50 GB | ~100k Vistas de Página (imágenes optimizadas). | 0,09 € por GB |
| **Usuarios Auth** | 100.000 MAU | 100.000 Usuarios Activos. | 0,003 € por usuario |

**Veredicto:** El plan Supabase Pro nos cubre mucho más allá de nuestros objetivos de MVP.

---

## 4. Desglose de Costes (Estimaciones en EUR)

### Costes Operativos Mensuales

| Ítem | Fase 1 (MVP) | Fase 2 (Crecimiento) | Fase 3 (Escala) |
| :--- | :--- | :--- | :--- |
| **Alojamiento (Vercel)** | 18 €/mes (Pro) | 90 € - 450 €/mes | 900 €+/mes |
| **Backend (Supabase)** | 23 €/mes (Pro) | 135 € - 350 €/mes | (Migrado) |
| **Dominio** | 14 €/año | 14 €/año | 14 €/año |
| **Email (Resend)** | Gratuito | 45 €/mes | 180 €+/mes |
| **Mapas (Mapbox/Google)** | Gratuito | 90 € - 450 €/mes | 1.800 €+/mes |
| **TOTAL** | **~45 €/mes** | **~350 € - 1.300 €/mes** | **Variable** |

### Costes de Transacción (Stripe)
-   **Tarjetas Europeas:** 1,5% + 0,25 € por transacción.
-   **Tarjetas No Europeas:** 2,5% + 0,25 € por transacción.

---

## 5. Camino a Producción: ¿Qué falta?

Para lanzar al público, debemos abordar estas brechas específicas:

### Requisitos Inmediatos (Pre-Lanzamiento)
1.  **Stripe Connect (Pagos Marketplace):**
    -   Crucial para dividir legalmente los pagos (El Huésped paga a la Plataforma -> Plataforma toma comisión -> Plataforma paga al Anfitrión).
    -   Requiere integración de KYC (Verificación de Identidad) del Anfitrión.
2.  **Email Transaccional:**
    -   Configurar dominios verificados para la entrega fiable de emails de "Reserva Confirmada".
3.  **Cumplimiento Legal:**
    -   Consentimiento de Cookies GDPR y Política de Privacidad.

### Fase 3: "Traer el Backend a Casa" (La Estrategia de Salida)
Cuando escalemos más allá de 100k usuarios o necesitemos lógica personalizada compleja (matching con IA, algoritmos de seguros complejos):
-   **Desencadenante:** Los costes exceden el salario de un ingeniero DevOps (~60k €/año).
-   **Migración:** Desplegamos nuestra propia Base de Datos (AWS RDS) y Servidor API (Docker/Kubernetes).
-   **Esfuerzo:** 3 meses para un equipo pequeño.
-   **Activo:** Somos dueños de nuestros datos. Migrar de Postgres a Postgres es un procedimiento estándar.

---

## Resumen para Inversores

-   **Tasa de Gasto (Burn Rate):** Extremadamente baja (~45 €/mes coste técnico fijo).
-   **Pista (Runway):** La arquitectura actual soporta el negocio hasta ~5M € en volumen de transacciones sin re-escrituras mayores de ingeniería.
-   **Capacidad:** 100GB de almacenamiento y 8GB de base de datos permiten miles de anuncios antes de pagar un solo céntimo en tarifas por exceso.
