import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/db';
import { snaps } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import SnapPage from './snap-page';

type Props = {
  params: Promise<{ id: string }>;
};

async function getSnap(id: string) {
  const [snap] = await db.select().from(snaps).where(eq(snaps.id, id));
  return snap;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const snap = await getSnap(id);

  if (!snap) {
    return { title: 'Snap Not Found' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: snap.title,
    description: snap.description || `Pay with Stellar`,
    openGraph: {
      title: snap.title,
      description: snap.description || `Pay with Stellar`,
      type: 'website',
      url: `${appUrl}/s/${id}`,
      images: snap.imageUrl ? [snap.imageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: snap.title,
      description: snap.description || `Pay with Stellar`,
      images: snap.imageUrl ? [snap.imageUrl] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const snap = await getSnap(id);

  if (!snap) {
    notFound();
  }

  return <SnapPage snap={snap} />;
}
