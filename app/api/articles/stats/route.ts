import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATS_FILE_PATH = path.join(process.cwd(), 'lib', 'article_stats.json');

const ensureStatsFile = () => {
  const dir = path.dirname(STATS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STATS_FILE_PATH)) {
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify({}));
  }
};

export async function GET() {
  try {
    ensureStatsFile();
    const data = fs.readFileSync(STATS_FILE_PATH, 'utf8');
    const stats = JSON.parse(data);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
