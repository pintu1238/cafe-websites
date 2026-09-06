import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('development seed provides eight approved, photo-backed campus cafeterias', async () => {
  const seed = await readFile(path.resolve(process.cwd(), '../database/seed.sql'), 'utf8');
  const shops = [
    ['the-courtyard-cafe', 'photo-1501339847302-ac426a4a7cbb'],
    ['bite-box', 'photo-1517248135467-4c7edcad34c4'],
    ['the-food-hub', 'photo-1552566626-52f8b828add9'],
    ['campus-cravings', 'photo-1515003197210-e0cd71810b5f'],
    ['green-bowl', 'photo-1512621776951-a57141f2eefd'],
    ['north-indian-express', 'photo-1547592180-85f173990554'],
    ['java-junction', 'photo-1461023058943-07fcbe16d735'],
    ['snack-lab', 'photo-1573080496219-bb080dd4f877'],
  ];

  expect(seed.match(/https:\/\/images\.unsplash\.com\/photo-/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
  for (const [slug, imageId] of shops) {
    expect(seed).toContain(`'${slug}'`);
    expect(seed).toContain(imageId);
  }
});
