import { NextRequest, NextResponse } from 'next/server';

// Launch27 API types (based on their documentation)
interface Launch27BookingRequest {
  // Customer info
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  // Service details
  service: {
    id?: number; // Service ID from Launch27 (you'll need to create services in their dashboard)
    name: string;
    price: number;
    duration?: number; // in minutes
  };
  // Scheduling
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24h format)
  end_time?: string; // HH:MM (24h format)
  // Payment
  payment: {
    method: 'card'; // or 'cash', 'check'
    card_token?: string; // If using Stripe/payment gateway integration
    amount: number;
  };
  // Additional
  frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly';
  notes?: string;
  addons?: Array<{
    name: string;
    price: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiKey = process.env.LAUNCH27_API_KEY;
    const baseUrl = process.env.LAUNCH27_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'Launch27 API credentials not configured' },
        { status: 500 }
      );
    }

    // Build the Launch27 booking payload
    const bookingPayload: Launch27BookingRequest = {
      customer: {
        first_name: body.contact.first,
        last_name: body.contact.last,
        email: body.contact.email,
        phone: body.contact.phone,
        address: body.contact.address,
        city: body.contact.city || 'New York City',
        state: body.contact.state || 'NY',
        zip: body.contact.zip,
      },
      service: {
        name: body.serviceName || 'Manhattan Mint Cleaning',
        price: body.total,
        duration: body.hours ? body.hours * 60 : undefined,
      },
      date: body.date,
      start_time: body.start,
      end_time: body.end,
      payment: {
        method: 'card',
        amount: body.total,
        // Note: For PCI compliance, you should use Launch27's payment gateway integration
        // or tokenize the card client-side before sending to your API
      },
      frequency: body.frequency,
      notes: [
        body.notes,
        body.contact.apt ? `Apt: ${body.contact.apt}` : '',
        body.contact.entry ? `Entry: ${body.contact.entry}` : '',
        body.contact.entryNotes ? `Entry notes: ${body.contact.entryNotes}` : '',
        body.addons && body.addons.length > 0 
          ? `Add-ons: ${body.addons.map((a: any) => a.label).join(', ')}` 
          : '',
      ].filter(Boolean).join(' | '),
      addons: body.addons?.map((addon: any) => ({
        name: addon.label,
        price: addon.price,
      })),
    };

    // Call Launch27 API
    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // Or 'X-API-Key' depending on Launch27's auth method
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Launch27 API error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to create booking',
          details: errorData,
        },
        { status: response.status }
      );
    }

    const booking = await response.json();

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      confirmationNumber: booking.confirmation_number,
      message: 'Booking created successfully',
    });

  } catch (error) {
    console.error('Error creating Launch27 booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
