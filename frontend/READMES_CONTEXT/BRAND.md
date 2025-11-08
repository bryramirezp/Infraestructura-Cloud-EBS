# 🎨 Colores y Tipografía Oficiales

Se han actualizado todos los colores y fuentes del sistema para usar la paleta y tipografía oficiales de la marca.

---

## 📋 Colores Oficiales

### Paleta Principal

**Azul (Principal)**
- HEX: `#0404E4`
- RGB: `4, 4, 228`
- HSL: `240 97% 45%`
- Uso: Color principal, botones, títulos, enlaces principales

**Gris (Secundario)**
- HEX: `#cfd1d1`
- RGB: `207, 209, 209`
- HSL: `180 2% 82%`
- Uso: Texto secundario, bordes, elementos secundarios

**Negro (Base)**
- HEX: `#000000`
- RGB: `0, 0, 0`
- HSL: `0 0% 0%`
- Uso: Texto principal en modo claro, fondo en modo oscuro

**Blanco (Implícito)**
- HEX: `#FFFFFF`
- RGB: `255, 255, 255`
- HSL: `0 0% 100%`
- Uso: Fondo en modo claro, texto en modo oscuro

---

## 🖋️ Tipografía Oficial

Se define la tipografía oficial para mantener la coherencia y jerarquía de la marca.

**Títulos (Serif)**
- Fuente: Trajan Pro 3
- Uso: Títulos principales, encabezados (`h1`, `h2`, `h3`) y destacados
- Variable: `var(--font-serif)`

**Párrafos (Sans-Serif)**
- Fuente: Sans
- Uso: Texto de párrafos, etiquetas, y elementos de UI (botones, inputs)
- Variable: `var(--font-sans)`

---

## 🎨 Modo Claro (Light Mode)

### Variables CSS Aplicadas
- Tipografía de Párrafos: Sans
- Tipografía de Títulos: Trajan Pro 3
- Fondo: Blanco (`#FFFFFF`) - `0 0% 100%`
- Texto Principal: Negro (`#000000`) - `0 0% 0%`
- Primary (Azul): `#0404E4` - `240 97% 45%`
- Secondary (Gris): `#cfd1d1` - `180 2% 82%`
- Bordes: Gris claro - `180 2% 90%`
- Ring (Focus): Azul oficial - `240 97% 45%`

### Variables CSS (`:root`)

```css
:root {
  /* Tipografía */
  --font-sans: "Sans", sans-serif;
  --font-serif: "Trajan Pro 3", serif;

  /* Colores */
  --background: 0 0% 100%;   /* Blanco */
  --foreground: 0 0% 0%;     /* Negro */
  --primary: 240 97% 45%;    /* Azul #0404E4 */
  --secondary: 180 2% 82%;   /* Gris #cfd1d1 */
  --border: 180 2% 90%;      /* Gris claro */
  --ring: 240 97% 45%;       /* Azul #0404E4 */
}