import React, { useEffect, useMemo, useState } from 'react';

const EMPTY_VISITOR = { age: '', passType: 'common' };
const ERROR_MESSAGES = {
  INVALID_VISIT_DATE: 'Ingresá una fecha de visita válida.',
  PARK_CLOSED: 'El parque está cerrado en esa fecha. Abre de martes a domingo, excepto el 25 de diciembre y el 1 de enero.',
  VISIT_DATE_IN_PAST: 'La fecha de visita no puede estar en el pasado.',
  VISIT_DATE_TOO_FAR: 'La fecha puede elegirse hasta un mes hacia adelante.',
  SAME_DAY_SALES_CLOSED: 'La compra para hoy está disponible hasta las 17:30.',
  TICKET_LIMIT_EXCEEDED: 'El máximo es de 10 entradas por persona y fecha, contando compras anteriores.',
  PAYMENT_METHOD_REQUIRED: 'Elegí una forma de pago para continuar.',
  VISITORS_REQUIRED: 'Agregá al menos un visitante.',
  INVALID_VISITOR: 'Revisá la edad y el tipo de pase de cada visitante.',
};

function localDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
}

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok && response.status !== 402) {
    const error = new Error(data.error?.message || 'No se pudo procesar la operación.');
    error.code = data.error?.code;
    throw error;
  }
  return { data, status: response.status };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitors, setVisitors] = useState([{ ...EMPTY_VISITOR }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const requestVisitors = useMemo(() => visitors.map(({ age, passType }) => ({ age: Number(age), passType })), [visitors]);
  const canQuote = Boolean(visitDate) && visitors.every((visitor) => visitor.age !== '');

  useEffect(() => {
    fetch('/api/me').then((response) => response.json()).then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setQuote(null);
    if (!canQuote) {
      setQuoteError('');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/quote', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitDate, visitors: requestVisitors }), signal: controller.signal,
        });
        const { data } = await readResponse(response);
        setQuote(data);
        setQuoteError('');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setQuote(null);
          setQuoteError(ERROR_MESSAGES[error.code] || error.message);
        }
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canQuote, visitDate, requestVisitors]);

  function updateVisitor(index, field, value) {
    setVisitors((current) => current.map((visitor, i) => (i === index ? { ...visitor, [field]: value } : visitor)));
    setCompleted(null);
    setMessage('');
  }

  function addVisitor() {
    if (visitors.length < 10) setVisitors((current) => [...current, { ...EMPTY_VISITOR }]);
    setCompleted(null);
    setMessage('');
  }

  function removeVisitor(index) {
    setVisitors((current) => current.filter((_visitor, visitorIndex) => visitorIndex !== index));
    setCompleted(null);
    setMessage('');
  }

  function updatePaymentMethod(value) {
    setPaymentMethod(value);
    setCompleted(null);
    setMessage('');
  }

  async function submitPurchase(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setCompleted(null);
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitDate, visitors: requestVisitors, paymentMethod }),
      });
      const { data, status } = await readResponse(response);
      if (status === 402 || data.status === 'cancelled') {
        setMessage('La tarjeta simulada fue rechazada. No se confirmó la compra; podés elegir otro medio de pago.');
      } else {
        setCompleted(data);
      }
    } catch (error) {
      setMessage(ERROR_MESSAGES[error.code] || error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = canQuote && Boolean(quote) && Boolean(paymentMethod) && !submitting;

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio"><span className="brand-mark">E</span><span><strong>EcoHarmony</strong><small>PARK</small></span></a>
        <div className="session-pill"><span className="session-dot" />{user ? `Hola, ${user.name}` : 'Sesión de visitante'}</div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow">TU PRÓXIMA AVENTURA</span>
            <h1>Un día más cerca<br />de la naturaleza.</h1>
            <p>Elegí la fecha, completá los datos de cada visitante y preparate para descubrir el parque.</p>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>VIVÍ</span><strong>LO<br />NATURAL</strong><i>✳</i></div>
          <div className="hero-hill hero-hill-one" aria-hidden="true" /><div className="hero-hill hero-hill-two" aria-hidden="true" />
        </section>

        <div className="content-grid">
          <form className="purchase-card" onSubmit={submitPurchase}>
            <div className="section-heading"><div><span className="step-label">PASO 1</span><h2>Planificá tu visita</h2></div><span className="heading-icon">✦</span></div>
            <label className="field-label" htmlFor="visit-date">Fecha de visita</label>
            <input id="visit-date" className="date-input" type="date" min={localDate()} value={visitDate}
              onChange={(event) => { setVisitDate(event.target.value); setMessage(''); setCompleted(null); }} required />
            <p className="field-hint">Abierto de martes a domingo. Para hoy, la compra está disponible hasta las 17:30.</p>

            <div className="section-heading visitors-heading"><div><span className="step-label">PASO 2</span><h2>¿Quiénes vienen?</h2></div>
              <span className="visitor-count">{visitors.length} {visitors.length === 1 ? 'visitante' : 'visitantes'}</span></div>
            <div className="visitor-list">
              {visitors.map((visitor, index) => (
                <div className="visitor-row" key={index}>
                  <span className="visitor-number">{String(index + 1).padStart(2, '0')}</span>
                  <label className="visitor-field"><span>Edad</span><input type="number" min="0" step="1" placeholder="Edad" value={visitor.age}
                    onChange={(event) => updateVisitor(index, 'age', event.target.value)} required /></label>
                  <label className="visitor-field pass-field"><span>Tipo de pase</span><select value={visitor.passType}
                    onChange={(event) => updateVisitor(index, 'passType', event.target.value)}>
                    <option value="common">Común</option><option value="vip">VIP</option>
                  </select></label>
                  {visitors.length > 1 && <button className="remove-visitor" type="button" onClick={() => removeVisitor(index)} aria-label={`Quitar visitante ${index + 1}`}>×</button>}
                </div>
              ))}
            </div>
            <button className="add-visitor" type="button" onClick={addVisitor} disabled={visitors.length >= 10}>
              <span>＋</span> Agregar visitante
            </button>
            <p className="field-hint discount-hint">Hasta 3 años ingresan gratis. De 4 a 15 y desde los 60 años, 50% de descuento.</p>

            <div className="section-heading payment-heading"><div><span className="step-label">PASO 3</span><h2>Elegí cómo pagar</h2></div></div>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => updatePaymentMethod('cash')} />
                <span className="payment-icon">$</span><span><strong>Efectivo en boletería</strong><small>Queda pendiente hasta validar el pago.</small></span><i />
              </label>
              <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => updatePaymentMethod('card')} />
                <span className="payment-icon card-icon">▰</span><span><strong>Tarjeta</strong><small>Transacción de prueba simulada.</small></span><i />
              </label>
            </div>

            {(quoteError || message) && <div className="form-alert" role="alert">{message || quoteError}</div>}
            <button className="submit-button" type="submit" disabled={!canSubmit}>{submitting ? 'Procesando…' : 'Continuar con la compra'} <span>→</span></button>
            <p className="secure-note"><span>♧</span> Compra segura · comprobante simulado en modo de prueba</p>
          </form>

          <aside className="summary-card" aria-label="Resumen de compra">
            <div className="summary-top"><span className="summary-kicker">TU EXPERIENCIA</span><span className="summary-flower">✳</span></div>
            <h2>Resumen<br />de compra</h2>
            <div className="summary-line"><span>Fecha elegida</span><strong>{visitDate || 'Seleccioná una fecha'}</strong></div>
            <div className="summary-line"><span>Entradas</span><strong>{visitors.length}</strong></div>
            <div className="summary-line"><span>Forma de pago</span><strong>{paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</strong></div>
            <div className="summary-total"><span>Total</span><strong>{quote ? formatMoney(quote.total) : '—'}</strong></div>
            <div className="summary-note"><span>✦</span><p>El precio se calcula en el servidor según la edad y el pase de cada visitante.</p></div>
            {completed && <div className="purchase-success" role="status"><span className="success-check">✓</span><div>
              <strong>{completed.status === 'pending' ? 'Reserva registrada' : '¡Compra confirmada!'}</strong>
              <p>{completed.status === 'pending' ? 'Pagá en boletería para validar tus entradas.' : 'El pago fue aprobado. El comprobante quedó registrado en modo de prueba.'}</p>
              <small>Operación {completed.id.slice(0, 8)} · {formatMoney(completed.total)}</small>
            </div></div>}
            <div className="summary-decoration" aria-hidden="true"><span>✳</span><span>❋</span><span>✦</span></div>
          </aside>
        </div>
      </main>
      <footer className="footer"><span>EcoHarmony Park</span><span>Un espacio para reconectar con la naturaleza.</span></footer>
    </div>
  );
}
