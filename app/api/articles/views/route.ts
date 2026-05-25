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

export async function POST(request: Request) {
  try {
    ensureStatsFile();
    const body = await request.json();
    const { article_id } = body;

    if (!article_id) {
      return NextResponse.json({ success: false, error: 'article_id is required' }, { status: 400 });
    }

    const data = fs.readFileSync(STATS_FILE_PATH, 'utf8');
    const stats = JSON.parse(data);

    if (!stats[article_id]) {
      stats[article_id] = {
        views: 0,
        reactions: { PANAS: 0, APRESIASI: 0, MANTAP: 0 },
        user_reactions: {}
      };
    }

    stats[article_id].views = (stats[article_id].views || 0) + 1;

    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2));
    return NextResponse.json({ success: true, data: stats[article_id] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
