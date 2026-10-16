//  ----------------  ETAPA GREEN ---------------- 
// ---------------- CASO DE PRUEBA 10 ----------------
const validarCantidadEntradas = (cantidad) => {
  if (cantidad > 10) {
    throw new Error('La cantidad de entradas no puede ser mayor a 10');
  }
  return true;
};

module.exports = {
  validarCantidadEntradas,
};

// ---------------- ETAPA REFACTORY ---------------- 
// ---------------- CASO DE PRUEBA 10 ---------------- 
// ---------------- LEERLO ----------------
// Para que la estapa refactory funcione deben descomentarla y comentar la del green, ya que son la misma
// funcion, pero la del refactory es con el codigo mas limpio
// const MAXIMO_ENTRADAS_POR_COMPRA = 10;

// const MENSAJES_ERROR = {
//   LIMITE_ENTRADAS_SUPERADO: `La cantidad de entradas no puede ser mayor a ${MAXIMO_ENTRADAS_POR_COMPRA}`,
// };

// const validarCantidadEntradas = (cantidad) => {
//   if (cantidad > MAXIMO_ENTRADAS_POR_COMPRA) {
//     throw new Error(MENSAJES_ERROR.LIMITE_ENTRADAS_SUPERADO);
//   }
//   return true;
// };

// module.exports = {
//   MAXIMO_ENTRADAS_POR_COMPRA,
//   MENSAJES_ERROR,
//   validarCantidadEntradas,
// };