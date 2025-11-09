# 📚 Plataforma Digital Escuela Bíblica Salem

## 🌎 El Por Qué (La Necesidad del Negocio)

El problema central es que la Escuela Bíblica Salem (EBS) opera actualmente con materiales académicos en formato físico. Esto genera varias limitaciones de negocio:

- **Alcance Limitado**: Dificulta el acceso inmediato a los contenidos, la actualización del material y la llegada a estudiantes remotos.

- **Falta de Métrica**: El modelo tradicional impide implementar métricas de desempeño y un seguimiento individualizado del alumno.

- **Acreditación Difícil**: Complica la estandarización de la acreditación e impacta la capacidad de certificar formalmente a los estudiantes.

- **Barrera de Costo**: Las soluciones digitales existentes en el mercado o son costosas o no se adaptan a las necesidades de una institución con recursos limitados.

## 🎯 El Para Qué (Objetivos y Beneficios)

El objetivo principal del proyecto es implementar una plataforma digital de cursos y evaluaciones para:

- Digitalizar los materiales académicos existentes.
- Facilitar la enseñanza bíblica en una modalidad 100% online.
- Fortalecer el proceso de formación espiritual de los estudiantes.
- Proveer una experiencia accesible, interactiva y medible.

El beneficio final esperado es **"contribuir al crecimiento de la obra y a la expansión del Evangelio"** mediante la estandarización de la evaluación y la mejora en la motivación y participación de los alumnos.

## ⚙️ El Cómo (Lógica de Funcionamiento y Reglas de Negocio)

Así es como la plataforma funcionará desde la perspectiva del negocio y del usuario:

### 1. Gestión de Cursos y Contenido

- Los alumnos podrán consultar una lista de cursos (materias) disponibles, cada uno con su nombre y descripción (RF-02).
- Cada curso contará con guías de estudio asociadas (específicamente, no libros de autores) que el alumno podrá descargar o visualizar (RF-05).

### 2. Lógica de Evaluación y Acreditación (Reglas Clave)

- **Evaluación**: El aprendizaje se valida mediante cuestionarios en formato de formulario (RF-01, RF-03). El sistema genera una calificación automática basada en las respuestas correctas.

- **Regla de Aprobación**: Para aprobar un curso, el alumno debe obtener una calificación mínima del **80%** (RF-03).

- **Regla de Intentos**: El alumno tiene un máximo de **3 intentos** por curso para alcanzar esa calificación (RF-03).

- **Certificación**: Si el alumno aprueba (cumple la regla del 80% en 3 intentos o menos), el sistema le emitirá automáticamente un certificado digital en formato descargable (RF-04).

- **Recursamiento**: Se contempla la funcionalidad de que un usuario pueda "recursar" el módulo si no aprueba (RF-11).

### 3. Seguimiento y Motivación del Alumno

- **Plazos**: Los alumnos tendrán un período definido para completar sus tareas, las cuales ya están predefinidas por el maestro (RF-10).

- **Progreso Individual**: Cada alumno podrá ver su propio avance mediante barras de progreso expresadas en porcentaje (RF-06).

- **Progreso Comparativo**: El sistema permitirá a los alumnos comparar su progreso con el de otros estudiantes (RF-07).

- **Métricas**: Se mostrarán métricas de desempeño y puntuaciones visibles (RF-08).

- **Interacción**: La plataforma incluirá un foro de comentarios (RF-09) y enviará correos automáticos de recordatorio y motivación (RF-09).

- **Enfoque**: Se añadirá un "modo concentración" (descrito como "apagar luces") para ayudar al estudio (RF-09).

### 4. Roles de Usuario

El sistema se administrará con tres roles principales (RF-12):

1. **Alumno** (el usuario final que consume cursos)
2. **Coordinador**
3. **Administrador**

---

## 📋 Resumen de Requisitos Funcionales

| ID | Descripción |
|---|---|
| RF-01 | Cuestionarios en formato de formulario |
| RF-02 | Lista de cursos con nombre y descripción |
| RF-03 | Sistema de calificación automática (80% mínimo, 3 intentos) |
| RF-04 | Generación automática de certificados digitales |
| RF-05 | Descarga/visualización de guías de estudio |
| RF-06 | Barra de progreso individual |
| RF-07 | Comparación de progreso entre estudiantes |
| RF-08 | Visualización de métricas de desempeño |
| RF-09 | Foro de comentarios, correos automáticos y modo concentración |
| RF-10 | Gestión de plazos para tareas predefinidas |
| RF-11 | Funcionalidad de recursamiento |
| RF-12 | Sistema de roles (Alumno, Coordinador, Administrador) |