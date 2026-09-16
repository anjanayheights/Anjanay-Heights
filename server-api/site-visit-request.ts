type RequestBody = {
  leadId?: string;
  name?: string;
  phone?: string;
  propertyId?: string;
  propertyName?: string;
  date?: string;
  time?: string;
  note?: string;
};

function normalizePhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const body: RequestBody = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const name = String(body.name || '').trim();
    const phone = normalizePhone(String(body.phone || ''));
    const date = String(body.date || '').trim();
    const time = String(body.time || '').trim();

    if (!name || phone.length !== 12 || !validDate(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return response.status(400).json({ error: 'Name, valid Indian phone, date and time are required.' });
    }

    const leadResponse = await fetch(`https://${request.headers.host}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        property: body.propertyName || body.propertyId || 'Site Visit Request',
        source: 'site-visit',
        next_step: 'Site Visit',
        timeline: 'Immediate',
        requirement: body.note || `Site visit requested for ${date} at ${time}.`,
      }),
    });

    if (!leadResponse.ok) {
      const detail = await leadResponse.text();
      console.error('site-visit lead creation failed', detail);
      return response.status(502).json({ error: 'Unable to create site visit lead.' });
    }

    const leadData = await leadResponse.json();
    const leadId = body.leadId || leadData?.lead?.id || leadData?.id;
    const token = process.env.DASHBOARD_PASSWORD || '';

    if (leadId && token) {
      const base = `https://${request.headers.host}`;
      const metaResponse = await fetch(`${base}/api/lead-meta`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          status: 'Site Visit',
          priority: 'Hot',
          nextAction: 'Confirm Site Visit',
          followUp: date,
          siteVisit: {
            date,
            time,
            propertyId: body.propertyId || '',
            propertyName: body.propertyName || '',
            status: 'Scheduled',
            source: 'website',
          },
        }),
      });

      if (!metaResponse.ok) console.warn('site-visit meta update failed', await metaResponse.text());
    }

    const whatsapp = `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${name}, your Anjanay Heights site visit request${body.propertyName ? ` for ${body.propertyName}` : ''} is received for ${date} at ${time}. We will confirm the visit shortly.`)}`;

    return response.status(201).json({
      ok: true,
      message: 'Site visit request received.',
      leadId: leadId || null,
      date,
      time,
      propertyName: body.propertyName || '',
      whatsapp,
    });
  } catch (error) {
    console.error('site-visit-request error', error);
    return response.status(500).json({ error: 'Unable to process site visit request.' });
  }
}
