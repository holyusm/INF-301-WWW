# Rúbrica de Evaluación
## Diseño de Microservicios en BackEnd

---

## 1. Objetivo de la evaluación

Evaluar el diseño arquitectónico de una solución basada en microservicios considerando aspectos estructurales, relaciones entre componentes, cohesión, acoplamiento y especialmente la capacidad de justificar decisiones arquitectónicas mediante alternativas consideradas, descartadas y seleccionadas.

La evaluación no se centra únicamente en el resultado final, sino también en la calidad del razonamiento arquitectónico utilizado para tomar decisiones.

---

## 2. Puntajes generales

| Criterio | Puntaje |
|---|---|
| 1. Diagrama de clases con los microservicios | 15 pts |
| 2. Relaciones, composición y herencia | 10 pts |
| 3. Separación de responsabilidades | 15 pts |
| 4. Estructura de microservicio | 10 pts |
| 5. Alta cohesión de microservicios | 10 pts |
| 6. Bajo acoplamiento de microservicios | 15 pts |
| 7. Justificación (elección, descarte y decisión) | 25 pts |
| **Total** | **100 pts** |

---

## 3. Rúbrica detallada

### 3.1. Diagrama de clases con los microservicios (15 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Presenta un diagrama claro, completo y coherente. Cada microservicio está identificado con sus clases principales, responsabilidades y límites arquitectónicos. | 15 pts |
| Bueno | Presenta un diagrama comprensible con la mayoría de los elementos relevantes, aunque puede faltar detalle menor. | 11 pts |
| Básico | El diagrama existe, pero mezcla responsabilidades o no diferencia claramente clases y microservicios. | 7 pts |
| Insuficiente | El diagrama es incompleto, confuso o no representa correctamente una arquitectura basada en microservicios. | 3 pts |

**Debe justificar:**
- Qué alternativas de división de microservicios consideró.
- Qué alternativa seleccionó.
- Qué alternativas descartó y por qué.

---

### 3.2. Relaciones, composición y herencia (10 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Usa correctamente asociación, agregación, composición y herencia. Las relaciones son coherentes con el dominio y evitan dependencias innecesarias. | 10 pts |
| Bueno | Las relaciones son adecuadas aunque existen pequeños detalles mejorables. | 8 pts |
| Básico | Presenta relaciones, pero algunas son incorrectas o poco justificadas. | 5 pts |
| Insuficiente | Las relaciones son confusas, ausentes o técnicamente incorrectas. | 2 pts |

**Debe justificar:**
- Por qué eligió composición, asociación o herencia.
- Qué relaciones descartó.
- Qué impacto tienen las relaciones en el acoplamiento.

---

### 3.3. Separación de responsabilidades (15 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Cada microservicio posee una responsabilidad clara, única y bien delimitada. No existen mezclas importantes de dominios. | 15 pts |
| Bueno | La separación es adecuada, aunque existen pequeñas superposiciones. | 11 pts |
| Básico | Algunos microservicios concentran demasiadas responsabilidades. | 7 pts |
| Insuficiente | No existe una separación clara o la arquitectura se comporta como un monolito distribuido. | 3 pts |

**Debe justificar:**
- Qué responsabilidades asignó a cada microservicio.
- Qué responsabilidades decidió no incluir.
- Por qué una responsabilidad pertenece a un servicio específico.

---

### 3.4. Estructura de microservicio (10 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Cada microservicio presenta una estructura clara: controlador/API, lógica de negocio, modelos y acceso a datos. | 10 pts |
| Bueno | La estructura es mayormente correcta aunque falta algún componente menor. | 8 pts |
| Básico | La estructura mezcla responsabilidades o presenta organización parcial. | 5 pts |
| Insuficiente | No se evidencia una estructura interna clara de microservicio. | 2 pts |

**Debe justificar:**
- Qué estructura interna seleccionó.
- Qué alternativas de organización descartó.
- Por qué la estructura facilita mantenimiento y evolución.

---

### 3.5. Alta cohesión de microservicios (10 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Las clases y funcionalidades de cada microservicio están altamente relacionadas con su propósito principal. | 10 pts |
| Bueno | La cohesión es adecuada con pocos elementos discutibles. | 8 pts |
| Básico | Existen funcionalidades poco relacionadas dentro de algunos servicios. | 5 pts |
| Insuficiente | Los microservicios agrupan funcionalidades heterogéneas sin criterio claro. | 2 pts |

**Debe justificar:**
- Por qué las clases pertenecen al mismo microservicio.
- Qué clases o funciones fueron descartadas o movidas.
- Cómo la decisión mejora la cohesión.

---

### 3.6. Bajo acoplamiento de microservicios (15 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Los microservicios minimizan dependencias directas y utilizan contratos claros evitando compartir lógica o datos innecesarios. | 15 pts |
| Bueno | Existe bajo acoplamiento general aunque algunas dependencias podrían reducirse. | 11 pts |
| Básico | Existen dependencias fuertes parcialmente identificadas. | 7 pts |
| Insuficiente | Los microservicios presentan dependencias fuertes o comparten lógica/datos sin justificación. | 3 pts |

**Debe justificar:**
- Qué dependencias decidió permitir.
- Qué dependencias descartó.
- Por qué la comunicación elegida reduce acoplamiento.

---

### 3.7. Justificación: elección, descarte y decisión (25 pts)

| Nivel | Descripción | Puntaje |
|---|---|---|
| Excelente | Presenta alternativas reales, explica descartes, justifica la opción seleccionada y conecta la decisión con criterios arquitectónicos. | 25 pts |
| Bueno | Justifica la mayoría de decisiones aunque algunas alternativas están poco desarrolladas. | 19 pts |
| Básico | Describe la solución final pero compara insuficientemente las alternativas. | 12 pts |
| Insuficiente | No existe justificación clara ni análisis de alternativas. | 5 pts |

**Debe incluir obligatoriamente:**
- Alternativas consideradas.
- Alternativas descartadas.
- Justificación técnica del descarte.
- Alternativa seleccionada.
- Justificación de la decisión final.
- Relación de la decisión con cohesión, acoplamiento, mantenibilidad o escalabilidad.

---

## 4. Formato esperado para justificar decisiones

Cada decisión arquitectónica debe documentarse usando el siguiente formato:

**Decisión arquitectónica:**
Separación del microservicio de Inventario.

**Alternativa A:**
Mantener inventario dentro del microservicio de Productos.

**Descarte:**
Se descarta porque mezcla información comercial del producto con disponibilidad operacional, aumentando el acoplamiento.

**Alternativa B:**
Crear un microservicio independiente de Inventario.

**Selección:**
Se selecciona la alternativa B.

**Justificación:**
Permite mayor cohesión, independencia de evolución y reduce el impacto de cambios en stock sobre el catálogo de productos.

---

## 5. Criterio transversal obligatorio

Un trabajo no puede alcanzar el nivel **Excelente** si únicamente presenta diagramas o código sin justificar las decisiones arquitectónicas realizadas.

La evaluación prioriza especialmente:

> *La capacidad de explicar por qué una alternativa fue descartada y por qué la alternativa seleccionada es arquitectónicamente más adecuada para el contexto del problema.*
