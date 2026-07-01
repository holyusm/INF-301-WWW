import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import './Menu.css';

export default function Menu() {
  const { products, categories, loading, error } = useProducts();
  const [category, setCategory] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = category === 'todos' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchAvail = !onlyAvailable || p.available;
    return matchCat && matchSearch && matchAvail;
  });

  return (
    <main className="menu-page">
      <div className="container">
        <h1 className="page-title">Nuestro Menú</h1>
        <p className="page-subtitle">
          Elige entre {products.length} preparaciones frescas y auténticas
        </p>

        <div className="menu-filters card border-0 shadow-sm">
          <input
            type="text"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-filters__search form-control"
          />

          <div className="menu-filters__cats">
            <button
              className={`menu-filters__cat-btn btn btn-sm rounded-pill ${category === 'todos' ? 'btn-primary active' : 'btn-outline-primary'}`}
              onClick={() => setCategory('todos')}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`menu-filters__cat-btn btn btn-sm rounded-pill ${category === c.slug ? 'btn-primary active' : 'btn-outline-primary'}`}
                onClick={() => setCategory(c.slug)}
              >
                {c.name}
              </button>
            ))}

            <label className="menu-filters__available form-check m-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              <span className="form-check-label">Solo disponibles</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="menu-empty card border-0 shadow-sm">
            <p>Cargando menú…</p>
          </div>
        ) : error ? (
          <div className="menu-empty card border-0 shadow-sm">
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="menu-empty card border-0 shadow-sm">
            <p>No se encontraron productos con ese filtro.</p>
            <button className="btn btn-outline-primary" onClick={() => { setSearch(''); setCategory('todos'); }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((p) => (
              <div key={p.id} className="col-12 col-md-6 col-xl-4 d-flex">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
