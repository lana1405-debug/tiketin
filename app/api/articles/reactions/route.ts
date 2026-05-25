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

const getArticleStats = (stats: any, articleId: string) => {
  if (!stats[articleId]) {
    stats[articleId] = {
      views: 0,
      reactions: { PANAS: 0, APRESIASI: 0, MANTAP: 0 },
      user_reactions: {}
    };
  }
  if (!stats[articleId].reactions) {
    stats[articleId].reactions = { PANAS: 0, APRESIASI: 0, MANTAP: 0 };
  }
  if (!stats[articleId].user_reactions) {
    stats[articleId].user_reactions = {};
  }
  return stats[articleId];
};

export async function GET(request: Request) {
  try {
    ensureStatsFile();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('article_id');
    const userId = searchParams.get('user_id');

    if (!articleId) {
      return NextResponse.json({ success: false, error: 'article_id is required' }, { status: 400 });
    }

    const data = fs.readFileSync(STATS_FILE_PATH, 'utf8');
    const stats = JSON.parse(data);
    const articleStats = getArticleStats(stats, articleId);

    const userReactions = userId ? (articleStats.user_reactions[userId] || []) : [];

    return NextResponse.json({
      success: true,
      reactions: articleStats.reactions,
      user_reactions: userReactions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureStatsFile();
    const body = await request.json();
    const { article_id, user_id, reaction_type } = body;

    if (!article_id || !user_id || !reaction_type) {
      return NextResponse.json({ success: false, error: 'article_id, user_id, and reaction_type are required' }, { status: 400 });
    }

    const data = fs.readFileSync(STATS_FILE_PATH, 'utf8');
    const stats = JSON.parse(data);
    const articleStats = getArticleStats(stats, article_id);

    let userReactionsList: string[] = articleStats.user_reactions[user_id] || [];

    if (userReactionsList.includes(reaction_type)) {
      userReactionsList = userReactionsList.filter(r => r !== reaction_type);
      articleStats.reactions[reaction_type] = Math.max(0, (articleStats.reactions[reaction_type] || 0) - 1);
    } else {
      userReactionsList.push(reaction_type);
      articleStats.reactions[reaction_type] = (articleStats.reactions[reaction_type] || 0) + 1;
    }

    articleStats.user_reactions[user_id] = userReactionsList;
    stats[article_id] = articleStats;

    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2));

    return NextResponse.json({
      success: true,
      reactions: articleStats.reactions,
      user_reactions: userReactionsList
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
