import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import './Home.css';

const featured = PRODUCTS.filter((p) => p.featured && p.available).slice(0, 3);

const CATEGORY_BADGE: Record<string, { label: string; className: string }> = {
  rolls:      { label: 'POPULAR',     className: 'home-badge home-badge--popular' },
  nigiris:    { label: 'TRADICIONAL', className: 'home-badge home-badge--tradicional' },
  temakis:    { label: 'TEMAKI',      className: 'home-badge home-badge--temaki' },
  combos:     { label: 'COMBO',       className: 'home-badge home-badge--combo' },
  bebidas:    { label: 'BEBIDA',      className: 'home-badge home-badge--bebida' },
};

const BENEFITS = [
  { icon: 'bi-truck',          title: 'Despacho gratuito',  desc: 'Dentro de un radio de 3 km de nuestro local en Maipú.' },
  { icon: 'bi-clock',          title: 'Entrega rápida',     desc: 'Pedidos preparados y despachados en menos de 45 minutos.' },
  { icon: 'bi-shield-check',   title: 'Pago seguro',        desc: 'Aceptamos Servipag y depósito bancario con confirmación inmediata.' },
  { icon: 'bi-tag',            title: 'Ofertas exclusivas', desc: 'Promociones y descuentos solo para clientes registrados.' },
];

export default function Home() {
  return (
    <main className="home">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <h1 className="hero__h1">
              El mejor sushi de<br />
              <span className="hero__accent">Maipú</span>
            </h1>
            <p className="hero__sub">
              Experimenta el arte del Shokunin moderno ahora a domicilio.
              Rolls de autor y nigiris frescos preparados al momento.
            </p>
            <div className="hero__actions">
              <Link to="/menu" className="btn btn-danger btn-lg hero__btn-primary">
                <i className="bi bi-cart3" aria-hidden="true" /> Pedir ahora
              </Link>
              <Link to="/menu" className="btn btn-outline-light btn-lg hero__btn-secondary">
                Explorar Menú
              </Link>
            </div>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero__art-ring hero__art-ring--1" />
            <div className="hero__art-ring hero__art-ring--2" />
            <span className="hero__emoji">🍣</span>
          </div>
        </div>

        <div className="hero__wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#fdfaf6" />
          </svg>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────── */}
      <section className="featured-section">
        <div className="container">
          <div className="featured-section__header">
            <div>
              <p className="featured-section__eyebrow">SELECCIÓN DEL CHEF</p>
              <h2 className="featured-section__title">Más pedidos</h2>
            </div>
            <Link to="/menu" className="featured-section__link">
              Ver todo el menú <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="row g-4">
            {featured.map((p) => {
              const badge = CATEGORY_BADGE[p.category];
              return (
                <div key={p.id} className="col-12 col-md-6 col-xl-4 d-flex">
                  <article className={`featured-card${!p.available ? ' featured-card--unavailable' : ''}`}>
                    <div className="featured-card__img-wrap">
                      <img src={p.image} alt={p.name} loading="lazy" />
                      {badge && <span className={badge.className}>{badge.label}</span>}
                      {!p.available && (
                        <div className="featured-card__overlay">No disponible</div>
                      )}
                    </div>

                    <div className="featured-card__body">
                      <h3 className="featured-card__name">{p.name}</h3>
                      <p className="featured-card__desc">{p.description}</p>
                      <div className="featured-card__footer">
                        <span className="featured-card__price">
                          ${p.price.toLocaleString('es-CL')}
                        </span>
                        <button
                          className="btn btn-danger btn-sm featured-card__btn"
                          disabled={!p.available}
                        >
                          <i className="bi bi-plus-lg" aria-hidden="true" /> Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────── */}
      <section className="container py-5">
        <div className="row g-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="col-12 col-sm-6 col-lg-3">
              <div className="benefit-card">
                <i className={`bi ${b.icon} benefit-card__icon`} aria-hidden="true" />
                <h3 className="benefit-card__title">{b.title}</h3>
                <p className="benefit-card__desc">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="cta-register">
        <div className="container cta-register__inner">
          <div>
            <h2>¿Eres cliente nuevo?</h2>
            <p>Regístrate y recibe tu primera entrega con 10% de descuento.</p>
          </div>
          <Link to="/register" className="btn btn-light btn-lg cta-register__btn">
            Registrarme gratis
          </Link>
        </div>
      </section>

    </main>
  );
}
