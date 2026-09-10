En tu ejemplo:

* Vos Noah (8/3/2009) → sos **grande de 2009**  
   porque estás entre julio 2008 y junio 2009\.  
* Miguel (13/8/2008) → también entra en esa misma camada.

Entonces ustedes pertenecen a la misma “generación deportiva”.

---

# **La regla REAL**

## **Si sos GRANDE:**

* 1° → Menores  
* 2° → Menores  
* 3° → Cadetes  
* 4° → Cadetes  
* 5° → Juveniles  
* 6° → Juveniles

## **Si sos CHICO:**

* 1° → Menores  
* 2° → Menores  
* 3° → Menores  
* 4° → Cadetes  
* 5° → Cadetes  
* 6° → Juveniles

---

# **Verificación con ustedes**

## **Miguel (grande)**

* 2022 → Menores ✅  
* 2023 → Cadetes ✅  
* 2024 → Cadetes ✅  
* 2025 → Juveniles ✅  
* 2026 → Juveniles ✅

Hace:

* 1 Menores  
* 2 Cadetes  
* 2 Juveniles

---

## **Noah (chico dentro del curso)**

* 2022 → Menores ✅  
* 2023 → Menores ✅  
* 2024 → Cadetes ✅  
* 2025 → Cadetes ✅  
* 2026 → Juveniles ✅

Hace:

* 2 Menores  
* 2 Cadetes  
* 1 Juveniles

---

# **Cómo programarlo en la web**

La forma más fácil:

## **Paso 1**

Detectar si es GRANDE o CHICO.

### **Regla:**

Si nació:

* entre julio y diciembre → GRANDE  
* entre enero y junio → CHICO

Porque el corte es julio.

---

# **Fórmula**

const esGrande \= mesNacimiento \>= 7;  
---

# **Luego según el año escolar**

## **GRANDES**

| Año | Categoría |
| ----- | ----- |
| 1 | Menores |
| 2 | Menores |
| 3 | Cadetes |
| 4 | Cadetes |
| 5 | Juveniles |
| 6 | Juveniles |

## **CHICOS**

| Año | Categoría |
| ----- | ----- |
| 1 | Menores |
| 2 | Menores |
| 3 | Menores |
| 4 | Cadetes |
| 5 | Cadetes |
| 6 | Juveniles |

---

# **Código final simple**

function categoria(anioEscolar, mesNacimiento) {

 const esGrande \= mesNacimiento \>= 7;

 if (esGrande) {  
   if (anioEscolar \<= 2\) return "Menores";  
   if (anioEscolar \<= 4\) return "Cadetes";  
   return "Juveniles";  
 }

 // chicos  
 if (anioEscolar \<= 3\) return "Menores";  
 if (anioEscolar \<= 5\) return "Cadetes";  
 return "Juveniles";  
}

Ejemplos:

categoria(3, 8\) // Miguel → Cadetes  
categoria(3, 3\) // Noah → Menores

\--------

- Utilizar Año de escolaridad  
- (Año actual) \- (Año de nacimiento) \= n  
  Verificar para n según tabla de arriba. Son pocos resultados, no hay mucho problema