import emailjs from '@emailjs/browser';
import type { Order } from '../types';

interface UserData {
  fullName: string;
  email: string;
}

export async function sendOrderReceipt(order: Order, user: UserData): Promise<boolean> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('Faltan claves de EmailJS, omitiendo envío de correo.', { serviceId, templateId, publicKey });
    return false;
  }

  try {
    const itemsHtml = order.items
      .map((item) => `${item.productName} (x${item.quantity}) - $${(item.unitPrice * item.quantity).toLocaleString('es-CL')}`)
      .join('\n');

    // Mapear HTML para la tabla de la boleta de correo
    const itemsListHtmlTable = order.items
      .map((item) => `
        <table width="100%" style="font-size: 13px; font-family: 'Courier New', Courier, monospace; margin-bottom: 5px;">
          <tr>
            <td width="50%">${item.productName}</td>
            <td width="20%">${item.quantity}</td>
            <td width="30%" style="text-align: right;">$${(item.unitPrice * item.quantity).toLocaleString('es-CL')}</td>
          </tr>
        </table>
      `)
      .join('');

    const templateParams = {
      to_name: user.fullName || 'Cliente',
      to_email: user.email,
      order_id: String(order.id).padStart(8, '0'),
      order_date: new Date(order.createdAt).toLocaleString('es-CL'),
      items_list: itemsHtml,
      items_list_html: itemsListHtmlTable, // Variable para inyectar rows HTML
      total_amount: order.total.toLocaleString('es-CL'),
      delivery_address: order.address,
      payment_method: order.paymentMethod?.toUpperCase() || 'PAGADO'
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log('Correo enviado correctamente!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return false;
  }
}

