//  ----------------  ETAPA DE RED ---------------- 
// ---------------- CASO DE PRUEBA 10 ----------------
const { validarCantidadEntradas } = require('./compraEntradas');

describe('Validación de cantidad de entradas', () => {
  test('TC-10: debería lanzar un error cuando la cantidad de entradas es mayor a 10', () => {
    // Arrange (Preparar)
    const cantidadSolicitada = 11;

    // Act & Assert (Actuar y Verificar)
    expect(() => {
      validarCantidadEntradas(cantidadSolicitada);
    }).toThrow('La cantidad de entradas no puede ser mayor a 10');
  });
});