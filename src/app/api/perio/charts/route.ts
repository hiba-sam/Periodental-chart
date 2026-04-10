import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const getProxyHeaders = () => {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sessionId')?.value || '';
    return {
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${sessionId}`,
    };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const res = await fetch(`${API_URL}/api/perio/charts?${searchParams.toString()}`, {
            headers: getProxyHeaders(),
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const res = await fetch(`${API_URL}/api/perio/charts`, {
            method: 'POST',
            headers: getProxyHeaders(),
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
