import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../hooks/useProducts';
import { useUsers } from '../hooks/useUsers';
import { api, ApiError } from '../api/client';
import type { ApiWeeklyReport } from '../api/client';
import { getWeekId } from '../utils/isoWeek';
import { validateRun } from '../utils/run';
import { validateEmailDeliverable } from '../utils/emailValidation';
import type { OrderStatus, User } from '../types';
import './Admin.css';

// ── Constantes ─────────────────────────────────────────────
const REGIONS      = ['Región Metropolitana', 'Valparaíso', 'Biobío', 'Araucanía', 'Los Lagos'];
const STAFF_ROLES  = ['admin', 'cajero', 'despachador', 'dueno'] as const;

type Tab = 'productos' | 'clientes' | 'usuarios' | 'pedidos' | 'reportes';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente:  'Pendiente',
  pagado:     'Pagado',
  preparando: 'Preparando',
  en_camino:  'En camino',
  entregado:  'Entregado',
  anulado:    'Anulado',
};

const STATUS_BADGES: Record<OrderStatus, string> = {
  pendiente:  'text-bg-warning',
  pagado:     'text-bg-success',
  preparando: 'text-bg-primary',
  en_camino:  'text-bg-secondary',
  entregado:  'text-bg-dark',
  anulado:    'text-bg-danger',
};

// ── Formulario de producto (categoryId, no slug — lo exige el backend) ──
interface ProductFormState {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  available: boolean;
  featured: boolean;
}

const EMPTY_PRODUCT: ProductFormState = {
  name: '', description: '', price: 0, categoryId: '',
  image: '', available: true, featured: false,
};

// ── Usuarios vacío ──────────────────────────────────────────
interface UserFormState {
  run: string; fullName: string; email: string; password: string;
  phone: string; address: string; commune: string;
  province: string; region: string; birthDate: string;
  gender: 'M' | 'F' | 'OTRO'; role: User['role'];
}

const EMPTY_USER: UserFormState = {
  run: '', fullName: '', email: '', password: '', phone: '',
  address: '', commune: '', province: '', region: '',
  birthDate: '', gender: 'M', role: 'cajero',
};

// ── Componente ──────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState<Tab>('productos');

  // ── Productos ──
  const { products, categories, refetch: refetchProducts } = useProducts();
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // ── Pedidos ──
  const { orders, cancelOrder } = useOrders();
  const { showToast }           = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ── Usuarios / Clientes ──
  const { users, createUser, updateUser, setActive } = useUsers();
  const [userForm, setUserForm]             = useState<UserFormState>(EMPTY_USER);
  const [editUserId, setEditUserId]         = useState<string | null>(null);
  const [showUserForm, setShowUserForm]     = useState(false);
  const [userFormErrors, setUserFormErrors] = useState<Partial<UserFormState>>({});

  // ── Reportes: semana actual (offset 0 = esta semana, -1 = anterior, etc.) ──
  const [weekOffset, setWeekOffset] = useState(0);

  // ─────────────────────────────────────────────────────────
  //  Helpers PRODUCTOS
  // ─────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setProductForm({ ...EMPTY_PRODUCT, categoryId: categories[0]?.id ?? '' });
    setEditProductId(null);
    setShowProductForm(true);
  };

  const openEditProduct = (p: (typeof products)[number]) => {
    const category = categories.find((c) => c.slug === p.category);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      categoryId: category?.id ?? '',
      image: p.image,
      available: p.available,
      featured: p.featured ?? false,
    });
    setEditProductId(p.id);
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || productForm.price <= 0 || !productForm.categoryId) return;
    try {
      if (editProductId !== null) {
        await api.products.update(editProductId, {
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          categoryId: productForm.categoryId,
          imageUrl: productForm.image,
          available: productForm.available,
          featured: productForm.featured,
        });
        showToast('Producto actualizado correctamente.', 'success');
      } else {
        await api.products.create({
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          categoryId: productForm.categoryId,
          imageUrl: productForm.image,
          available: productForm.available,
          featured: productForm.featured,
        });
        showToast('Producto creado correctamente.', 'success');
      }
      await refetchProducts();
      setShowProductForm(false);
      setEditProductId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'No se pudo guardar el producto.', 'danger');
    }
  };

  const toggleAvailability = async (id: string, available: boolean) => {
    await api.products.setAvailability(id, !available);
    await refetchProducts();
  };

  const setProductField = (field: keyof ProductFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.type === 'number'
          ? Number(e.target.value)
          : e.target.value;
      setProductForm((f) => ({ ...f, [field]: value }));
    };

  // ─────────────────────────────────────────────────────────
  //  Helpers USUARIOS
  // ─────────────────────────────────────────────────────────
  const staffUsers  = users.filter((u) => u.role !== 'cliente');
  const clientUsers = users.filter((u) => u.role === 'cliente');

  const openAddUser = (defaultRole: User['role'] = 'cajero') => {
    setUserForm({ ...EMPTY_USER, role: defaultRole });
    setEditUserId(null);
    setShowUserForm(true);
    setUserFormErrors({});
  };

  const openEditUser = (u: User) => {
    setUserForm({
      run: u.run, fullName: u.fullName, email: u.email, password: '',
      phone: u.phone, address: u.address, commune: u.commune,
      province: u.province, region: u.region, birthDate: u.birthDate,
      gender: u.gender, role: u.role,
    });
    setEditUserId(u.id);
    setShowUserForm(true);
    setUserFormErrors({});
  };

  const setUserField = (field: keyof UserFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setUserForm((f) => ({ ...f, [field]: e.target.value }));

  const validateUserForm = (): boolean => {
    const errs: Partial<UserFormState> = {};
    if (!validateRun(userForm.run))          errs.run      = 'RUN inválido';
    if (!userForm.fullName.trim())           errs.fullName = 'Requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) errs.email = 'Correo inválido';
    if (!editUserId && !userForm.password)   errs.password = 'Requerido al crear';
    if (!userForm.phone.trim())              errs.phone    = 'Requerido';
    if (!userForm.address.trim())            errs.address  = 'Requerido';
    if (!userForm.commune.trim())            errs.commune  = 'Requerido';
    if (!userForm.region)                    errs.region   = 'Requerido';
    if (!userForm.birthDate)                 errs.birthDate= 'Requerido';
    setUserFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateUserForm()) return;

    const emailCheck = await validateEmailDeliverable(userForm.email);
    if (!emailCheck.valid) {
      setUserFormErrors((prev) => ({ ...prev, email: emailCheck.reason }));
      showToast(emailCheck.reason, 'danger');
      return;
    }

    try {
      if (editUserId !== null) {
        const original = users.find((u) => u.id === editUserId);
        await updateUser(
          editUserId,
          {
            fullName: userForm.fullName, phone: userForm.phone, address: userForm.address,
            commune: userForm.commune, province: userForm.province, region: userForm.region,
            birthDate: userForm.birthDate, gender: userForm.gender,
          },
          {
            ...(userForm.email !== original?.email ? { email: userForm.email } : {}),
            ...(userForm.role !== original?.role ? { role: userForm.role } : {}),
            ...(userForm.password ? { password: userForm.password } : {}),
          },
        );
        showToast('Usuario actualizado correctamente.', 'success');
      } else {
        await createUser({
          run: userForm.run, fullName: userForm.fullName, email: userForm.email,
          password: userForm.password, phone: userForm.phone, address: userForm.address,
          commune: userForm.commune, province: userForm.province, region: userForm.region,
          birthDate: userForm.birthDate || undefined, gender: userForm.gender, role: userForm.role,
        });
        showToast('Usuario creado correctamente.', 'success');
      }
      setShowUserForm(false);
      setEditUserId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'No se pudo guardar el usuario.', 'danger');
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await setActive(u.id, !u.active);
      showToast(u.active ? 'Usuario desactivado.' : 'Usuario reactivado.', 'info');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.', 'danger');
    }
  };

  // ─────────────────────────────────────────────────────────
  //  Helpers REPORTES
  // ─────────────────────────────────────────────────────────

  // Lunes de la semana actual + weekOffset semanas
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    return `${fmt(weekDays[0])} – ${fmt(weekDays[6])}`;
  }, [weekDays]);

  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // ── Reporte real del backend (Chart.js consume esto, no localStorage) ──
  const [report, setReport] = useState<ApiWeeklyReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = weekOffset === 0
          ? await api.reports.getCurrent()
          : await api.reports.getByWeekId(getWeekId(weekDays[0]));
        if (!cancelled) setReport(data);
      } catch (err) {
        if (cancelled) return;
        // Semana sin ventas registradas → reporte vacío, no es un error real.
        if (err instanceof ApiError && err.statusCode === 404) {
          setReport({
            id: '', weekId: getWeekId(weekDays[0]), totalRevenue: 0, totalOrders: 0,
            dailySales: [], generatedAt: '', updatedAt: '',
          });
        } else {
          showToast('No se pudo cargar el reporte de la semana.', 'danger');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [weekOffset, weekDays, showToast]);

  const reportOrders = useMemo(() => orders.filter((o) => {
    if (o.status === 'anulado') return false;
    const d = new Date(o.createdAt);
    const start = weekDays[0];
    const end   = new Date(weekDays[6]); end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }), [orders, weekDays]);

  const totalSales = Number(report?.totalRevenue ?? 0);
  const totalOrders = report?.totalOrders ?? 0;
  const avgTicket  = totalOrders ? Math.round(totalSales / totalOrders) : 0;

  // ── Chart data: siempre 7 barras (Lun–Dom), alimentadas por report.dailySales ──
  const chartData = useMemo(() => {
    const salesByDay = weekDays.map((day) => {
      const dateStr = day.toISOString().split('T')[0];
      const daily = report?.dailySales.find((ds) => ds.date === dateStr);
      return daily ? Number(daily.revenue) : 0;
    });
    return {
      labels: DAY_NAMES,
      datasets: [{
        label: 'Ventas ($)',
        data: salesByDay,
        backgroundColor: salesByDay.map((v) =>
          v > 0 ? 'rgba(185, 43, 39, 0.80)' : 'rgba(185, 43, 39, 0.18)'
        ),
        borderColor: 'rgba(185, 43, 39, 1)',
        borderWidth: 1.5,
        borderRadius: 6,
      }],
    };
  }, [report, weekDays]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            (ctx.parsed.y ?? 0) > 0 ? ` $${(ctx.parsed.y ?? 0).toLocaleString('es-CL')}` : ' Sin ventas',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) =>
            Number(value) === 0 ? '$0' : `$${Number(value).toLocaleString('es-CL')}`,
        },
      },
    },
  } as const;

  // ─────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────
  return (
    <main className="admin-page container">
      <h1 className="page-title">Panel de administración</h1>

      <div className="admin-tabs nav nav-tabs border-0">
        {(['productos', 'clientes', 'usuarios', 'pedidos', 'reportes'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-tab nav-link ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); setShowProductForm(false); setShowUserForm(false); }}
          >
            {{ productos: '🍱 Productos', clientes: '👤 Clientes', usuarios: '👥 Usuarios', pedidos: '📦 Pedidos', reportes: '📊 Reportes' }[t]}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: PRODUCTOS
      ══════════════════════════════════════════════════════ */}
      {tab === 'productos' && (
        <section className="admin-section">
          <div className="admin-section__header">
            <h2>Gestión de productos</h2>
            <button className="btn btn-primary btn-sm" onClick={openAddProduct}>
              + Nuevo producto
            </button>
          </div>

          {/* Formulario add/edit */}
          {showProductForm && (
            <div className="admin-form card border-0 shadow-sm mb-3">
              <h3 className="admin-form__title">
                {editProductId ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre *</label>
                  <input className="form-control" value={productForm.name}
                    onChange={setProductField('name')} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={productForm.categoryId}
                    onChange={setProductField('categoryId')}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Precio * (CLP)</label>
                  <input className="form-control" type="number" min={0}
                    value={productForm.price} onChange={setProductField('price')} />
                </div>
                <div className="col-12">
                  <label className="form-label">URL de imagen</label>
                  <input className="form-control" value={productForm.image}
                    onChange={setProductField('image')}
                    placeholder="https://..." />
                </div>
                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={2} value={productForm.description}
                    onChange={setProductField('description')} />
                </div>
                <div className="col-md-4 d-flex align-items-center gap-3 mt-2">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="chk-available"
                      checked={productForm.available}
                      onChange={setProductField('available')} />
                    <label className="form-check-label" htmlFor="chk-available">Disponible</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="chk-featured"
                      checked={productForm.featured ?? false}
                      onChange={setProductField('featured')} />
                    <label className="form-check-label" htmlFor="chk-featured">Destacado</label>
                  </div>
                </div>
              </div>
              <div className="admin-form__footer">
                <button className="btn btn-primary btn-sm"
                  onClick={handleSaveProduct}
                  disabled={!productForm.name.trim() || productForm.price <= 0}>
                  Guardar
                </button>
                <button className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setShowProductForm(false); setEditProductId(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="admin-table-wrap card border-0 shadow-sm">
            <table className="admin-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-name">
                        {p.image && <img src={p.image} alt={p.name} />}
                        <div>
                          <div>{p.name}</div>
                          {p.featured && <span className="badge text-bg-warning" style={{ fontSize: '0.7rem' }}>Destacado</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{p.categoryName}</span></td>
                    <td>${p.price.toLocaleString('es-CL')}</td>
                    <td>
                      <button
                        className={`admin-toggle badge border-0 ${p.available ? 'text-bg-success' : 'text-bg-danger'}`}
                        onClick={() => toggleAvailability(p.id, p.available)}
                      >
                        {p.available ? 'Disponible' : 'No disponible'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn btn-outline-primary btn-sm"
                          onClick={() => openEditProduct(p)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CLIENTES
      ══════════════════════════════════════════════════════ */}
      {tab === 'clientes' && (
        <section className="admin-section">
          <div className="admin-section__header">
            <h2>Gestión de clientes</h2>
            <button className="btn btn-primary btn-sm" onClick={() => openAddUser('cliente')}>
              + Nuevo cliente
            </button>
          </div>

          {showUserForm && userForm.role === 'cliente' && (
            <UserForm
              form={userForm} errors={userFormErrors}
              editId={editUserId} isClient
              onChange={setUserField}
              onSave={handleSaveUser}
              onCancel={() => { setShowUserForm(false); setEditUserId(null); }}
            />
          )}

          <div className="admin-table-wrap card border-0 shadow-sm">
            <table className="admin-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>RUN</th><th>Nombre</th><th>Correo</th>
                  <th>Teléfono</th><th>Comuna</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientUsers.length === 0 ? (
                  <tr><td colSpan={7}><div className="admin-empty-row">Sin clientes registrados.</div></td></tr>
                ) : clientUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.run}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{u.commune}</td>
                    <td>
                      <button
                        className={`admin-toggle badge border-0 ${u.active ? 'text-bg-success' : 'text-bg-danger'}`}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.active ? 'Activo' : 'Desactivado'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn btn-outline-primary btn-sm"
                          onClick={() => { openEditUser(u); }}>Editar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: USUARIOS (staff)
      ══════════════════════════════════════════════════════ */}
      {tab === 'usuarios' && (
        <section className="admin-section">
          <div className="admin-section__header">
            <h2>Gestión de usuarios del sistema</h2>
            <button className="btn btn-primary btn-sm" onClick={() => openAddUser('cajero')}>
              + Nuevo usuario
            </button>
          </div>

          {showUserForm && userForm.role !== 'cliente' && (
            <UserForm
              form={userForm} errors={userFormErrors}
              editId={editUserId} isClient={false}
              onChange={setUserField}
              onSave={handleSaveUser}
              onCancel={() => { setShowUserForm(false); setEditUserId(null); }}
            />
          )}

          <div className="admin-table-wrap card border-0 shadow-sm">
            <table className="admin-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Nombre</th><th>Correo</th><th>Rol</th><th>Comuna</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.length === 0 ? (
                  <tr><td colSpan={6}><div className="admin-empty-row">Sin usuarios.</div></td></tr>
                ) : staffUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge text-bg-secondary">{u.role}</span>
                    </td>
                    <td>{u.commune}</td>
                    <td>
                      <button
                        className={`admin-toggle badge border-0 ${u.active ? 'text-bg-success' : 'text-bg-danger'}`}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.active ? 'Activo' : 'Desactivado'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn btn-outline-primary btn-sm"
                          onClick={() => openEditUser(u)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: PEDIDOS
      ══════════════════════════════════════════════════════ */}
      {tab === 'pedidos' && (
        <section className="admin-section">
          <div className="admin-section__header">
            <h2>Gestión de pedidos</h2>
          </div>

          <div className="admin-table-wrap card border-0 shadow-sm">
            <table className="admin-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Estado</th>
                  <th>Total</th><th>Fecha</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6}><div className="admin-empty-row">No hay pedidos.</div></td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(-6).toUpperCase()}</td>
                    <td>{order.customerName}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td>${order.total.toLocaleString('es-CL')}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                    <td>
                      {order.status === 'anulado' ? (
                        <span className="text-muted small">Ya anulado</span>
                      ) : cancelId === order.id ? (
                        <div className="admin-cancel-box">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Motivo de anulación"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={!cancelReason.trim()}
                            onClick={async () => {
                              await cancelOrder(order.id, cancelReason.trim());
                              setCancelId(null);
                              setCancelReason('');
                              showToast('Pedido anulado correctamente.', 'info');
                            }}
                          >Confirmar</button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => { setCancelId(null); setCancelReason(''); }}
                          >Cerrar</button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setCancelId(order.id)}
                        >Anular</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: REPORTES
      ══════════════════════════════════════════════════════ */}
      {tab === 'reportes' && (
        <section className="admin-section">
          <h2>Reporte de ventas</h2>

          {/* ── Navegación de semana ── */}
          <div className="report-week-nav card border-0 shadow-sm">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              ‹ Semana anterior
            </button>
            <span className="report-week-label">{weekLabel}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={weekOffset >= 0}
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              Semana siguiente ›
            </button>
          </div>

          {/* ── KPIs ── */}
          <div className="report-summary">
            <div className="report-kpi card border-0 shadow-sm">
              <span>Ventas totales</span>
              <strong>${totalSales.toLocaleString('es-CL')}</strong>
            </div>
            <div className="report-kpi card border-0 shadow-sm">
              <span>Pedidos completados</span>
              <strong>{reportOrders.length}</strong>
            </div>
            <div className="report-kpi card border-0 shadow-sm">
              <span>Ticket promedio</span>
              <strong>${avgTicket.toLocaleString('es-CL')}</strong>
            </div>
          </div>

          {/* ── Gráfico siempre visible ── */}
          <div className="card border-0 shadow-sm report-chart-wrap">
            <h3 className="report-chart-title">Ventas por día</h3>
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* ── Tabla de pedidos ── */}
          {reportOrders.length > 0 ? (
            <div className="admin-table-wrap card border-0 shadow-sm" style={{ marginTop: '1.5rem' }}>
              <table className="admin-table table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th><th>Fecha</th><th>Cliente</th>
                    <th>Pago</th><th>Estado</th><th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportOrders.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id.slice(-6).toUpperCase()}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString('es-CL')}</td>
                      <td>{o.customerName}</td>
                      <td>{o.paymentMethod ?? '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGES[o.status]}`}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td className="text-end">${o.total.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="report-no-orders">Sin pedidos esta semana.</p>
          )}
        </section>
      )}
    </main>
  );
}

// ── Sub-componente: formulario de usuario ───────────────────
interface UserFormProps {
  form: UserFormState;
  errors: Partial<UserFormState>;
  editId: string | null;
  isClient: boolean;
  onChange: (field: keyof UserFormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function UserForm({ form, errors, editId, isClient, onChange, onSave, onCancel }: UserFormProps) {
  return (
    <div className="admin-form card border-0 shadow-sm mb-3">
      <h3 className="admin-form__title">
        {editId ? 'Editar' : 'Nuevo'} {isClient ? 'cliente' : 'usuario'}
      </h3>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">RUN *</label>
          <input className={`form-control ${errors.run ? 'is-invalid' : ''}`}
            value={form.run} onChange={onChange('run')} placeholder="12.345.678-5"
            disabled={!!editId} title={editId ? 'El RUN no se puede modificar' : undefined} />
          {errors.run && <div className="invalid-feedback">{errors.run}</div>}
        </div>
        <div className="col-md-8">
          <label className="form-label">Nombre completo *</label>
          <input className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
            value={form.fullName} onChange={onChange('fullName')} />
          {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Correo electrónico *</label>
          <input className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            type="email" value={form.email} onChange={onChange('email')} />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Contraseña {editId ? '(dejar vacío para no cambiar)' : '*'}
          </label>
          <input className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            type="password" value={form.password} onChange={onChange('password')}
            placeholder={editId ? '••••••' : ''} />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Teléfono *</label>
          <input className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
            value={form.phone} onChange={onChange('phone')} />
          {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Fecha de nacimiento *</label>
          <input className={`form-control ${errors.birthDate ? 'is-invalid' : ''}`}
            type="date" value={form.birthDate} onChange={onChange('birthDate')} />
          {errors.birthDate && <div className="invalid-feedback">{errors.birthDate}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Sexo</label>
          <select className="form-select" value={form.gender} onChange={onChange('gender')}>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div className="col-12">
          <label className="form-label">Dirección *</label>
          <input className={`form-control ${errors.address ? 'is-invalid' : ''}`}
            value={form.address} onChange={onChange('address')} />
          {errors.address && <div className="invalid-feedback">{errors.address}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Comuna *</label>
          <input className={`form-control ${errors.commune ? 'is-invalid' : ''}`}
            value={form.commune} onChange={onChange('commune')} />
          {errors.commune && <div className="invalid-feedback">{errors.commune}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Provincia</label>
          <input className="form-control" value={form.province} onChange={onChange('province')} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Región *</label>
          <select className={`form-select ${errors.region ? 'is-invalid' : ''}`}
            value={form.region} onChange={onChange('region')}>
            <option value="">Selecciona…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.region && <div className="invalid-feedback">{errors.region}</div>}
        </div>
        {!isClient && (
          <div className="col-md-4">
            <label className="form-label">Rol</label>
            <select className="form-select" value={form.role} onChange={onChange('role')}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="admin-form__footer">
        <button className="btn btn-primary btn-sm" onClick={onSave}>Guardar</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
