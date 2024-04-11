import { NextRequest, NextResponse } from "next/server";

const CF_WORKER_URL = "https://cf-journal.senchatea.workers.dev"

export async function POST(request: NextRequest) {
    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded." });
    }

    // Determine the content type to be analyzed by the Cloudflare worker
    let contentType = file.type;
    let typeParam = '';
    if (contentType.startsWith('image/')) {
        typeParam = 'image';
    } else if (contentType.startsWith('audio/')) {
        typeParam = 'audio';
    } else {
        // Assuming everything else is text
        contentType = 'text/plain';
        typeParam = 'text';
    }

    const endpoint = `${CF_WORKER_URL}?type=${typeParam}`;
    const headers = {
        'Content-Type': contentType === 'text/plain' ? 'text/plain' : 'application/octet-stream',
    };

    // Prepare the body
    let body;
    if (typeParam === 'text') {
        // Assuming the file object has a method to read as text for simplicity
        body = await file.text();
    } else {
        body = Buffer.from(await file.arrayBuffer());
    }

    // Make the request to the Cloudflare worker
    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        return NextResponse.json({ success: false, error: "Cloudflare worker failed to analyse the given data." });
    }

    const cfResponse = await response.json();

    return NextResponse.json<{success: boolean; data: Expense }>({ success: true, data: cfResponse});
}
