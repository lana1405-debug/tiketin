import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'lib', 'admin_logs.json');

const ensureLogFile = () => {
  const dir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE_PATH)) {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([]));
  }
};

export async function GET() {
  try {
    ensureLogFile();
    const data = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const logs = JSON.parse(data);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureLogFile();
    const body = await request.json();
    const { action, admin_id, admin_name, details } = body;

    const newLog = {
      id: Math.random().toString(36).substring(2, 11),
      action,
      admin_id: admin_id || 'unknown',
      admin_name: admin_name || 'Admin',
      details: details || '',
      timestamp: new Date().toISOString(),
    };

    const data = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const logs = JSON.parse(data);
    logs.unshift(newLog); // Newest logs first

    // Limit log size to 200 items
    if (logs.length > 200) {
      logs.pop();
    }

    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
    return NextResponse.json({ success: true, data: newLog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
