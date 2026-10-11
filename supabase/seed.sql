-- Seed: invented example data for ShortDramaIndex.
-- All titles, platforms, people and links are fictional. Remove with supabase/unseed.sql before launch.
-- Ratings, list counts and community numbers are left at zero on purpose.

insert into public.platforms (slug, name, url, icon, is_official, description) values
  ('lumen-tv', 'Lumen TV', 'https://example.com/lumentv', null, true, 'Fictional streaming platform used for example data.'),
  ('reelway', 'Reelway', 'https://example.com/reelway', null, true, 'Fictional streaming platform used for example data.'),
  ('shortline', 'Shortline', 'https://example.com/shortline', null, true, 'Fictional streaming platform used for example data.'),
  ('youtube', 'YouTube', 'https://www.youtube.com', null, false, 'Generic uploader example. Uploaded copies are not necessarily licensed.');

insert into public.tags (slug, name) values
  ('ceo-romance', 'CEO romance'),
  ('hidden-identity', 'Hidden identity'),
  ('contract-marriage', 'Contract marriage'),
  ('revenge', 'Revenge'),
  ('second-chance', 'Second chance'),
  ('urban-fantasy', 'Urban fantasy'),
  ('family-drama', 'Family drama'),
  ('time-loop', 'Time loop');

insert into public.series (slug, title, romanized_title, original_language, origin_country, year, episode_count, avg_episode_minutes, synopsis, production_status, visibility) values
  ('reborn-heiress-strikes-back', 'Reborn Heiress Strikes Back', 'Chong Sheng Qian Jin Ni Xi Lu', 'zh', 'CN', 2024, 95, 2, 'Betrayed by her stepsister and discarded by her fiancé, Jiang Ning wakes up five years in the past on the eve of her ruin and plots meticulous retribution.', 'completed', 'public'),
  ('billionaires-secret-fiancee', 'The Billionaire''s Secret Fiancée', 'Yin Cang De Hao Men Wei Hun Qi', 'zh', 'CN', 2024, 82, 2, 'She hides her engagement to the company''s CEO to keep her career her own. When a rival exposes it, both must decide what the secret is worth.', 'completed', 'public'),
  ('tycoons-discarded-ex-wife', 'The Tycoon''s Discarded Ex-Wife', 'Qian Fu Zong Cai De Qi Qi', 'zh', 'CN', 2023, 88, 2, 'Three years after a cold divorce, a woman returns as the investor her ex-husband needs to save his company.', 'completed', 'public'),
  ('midnight-boardroom-romance', 'Midnight Boardroom Romance', 'Hanbam-ui Hoeuisil Romaenseu', 'ko', 'KR', 2024, 60, 3, 'Two executives forced to share a late-night merger deal discover the deal is the least secret thing in the room.', 'completed', 'public'),
  ('accidental-empress-in-metropolis', 'Accidental Empress in Metropolis', 'Yi Wai Chuan Yue De Xian Dai Nv Huang', 'zh', 'CN', 2024, 75, 2, 'An empress wakes in a modern city with her memories intact and must learn phones, rent and office politics before an old rival finds her.', 'ongoing', 'public'),
  ('billionaire-undercover', 'The Billionaire Undercover', null, 'es', 'MX', 2024, 90, 2, 'A wealthy heir takes a job at his own company under a false name to find out who has been sabotaging it.', 'completed', 'public'),
  ('twin-heirs-swap-destiny', 'Twin Heirs Swap Destiny', 'Shuang Sheng Ji Cheng Ren Huan Ming Yun', 'zh', 'CN', 2023, 70, 2, 'Twin heirs are switched at birth. Decades later, each must live the other''s life to uncover why.', 'completed', 'public'),
  ('whispers-of-the-shadow-heir', 'Whispers of the Shadow Heir', 'An Ye Zhi Zi: Ying Zhi Ji Cheng Ren', 'zh', 'CN', 2024, 66, 2, 'The quiet son of a fallen family trains in secret to take back the empire built on his father''s name.', 'completed', 'public'),
  ('loop-of-the-last-summer', 'Loop of the Last Summer', 'Saigo no Natsu no Ruupu', 'ja', 'JP', 2024, 48, 3, 'A student relives the last day of summer until she learns what she must say to her best friend.', 'completed', 'public'),
  ('contract-marriage-with-the-rival-ceo', 'Contract Marriage with the Rival CEO', 'Raibeol Daepyowaui Gyeyak Gyeolhon', 'ko', 'KR', 2023, 55, 3, 'Rival CEOs sign a one-year marriage contract to settle a merger, then break every rule in it.', 'completed', 'public'),
  ('heiress-reborn-revenge-duplicate', 'Heiress Reborn Revenge', null, 'zh', 'CN', 2024, 95, 2, 'Duplicate entry kept hidden to demonstrate a merge redirect.', 'completed', 'hidden');

insert into public.aliases (series_id, text, language, script, source_url, source_label, status)
select s.id, v.text, v.language, v.script, v.source_url, v.source_label, v.status
from (values
  ('reborn-heiress-strikes-back', '重生千金逆袭录', 'zh', 'Hans', 'https://example.com/shortline/series/2001', 'Shortline listing', 'verified'),
  ('reborn-heiress-strikes-back', 'Reborn Heiress Strikes Back', 'en', null, 'https://example.com/lumentv/series/101', 'Lumen TV listing', 'verified'),
  ('reborn-heiress-strikes-back', 'El Regreso de la Heredera', 'es', null, 'https://example.com/reelway/series/301', 'Reelway listing', 'verified'),
  ('reborn-heiress-strikes-back', 'Vengeance of Miss Jiang', 'en', null, 'https://example.com/community/post/501', 'Community report', 'pending'),
  ('billionaires-secret-fiancee', '隐藏的豪门未婚妻', 'zh', 'Hans', 'https://example.com/shortline/series/2002', 'Shortline listing', 'verified'),
  ('billionaires-secret-fiancee', 'The Billionaire''s Secret Fiancée', 'en', null, 'https://example.com/lumentv/series/102', 'Lumen TV listing', 'verified'),
  ('billionaires-secret-fiancee', '숨겨진 재벌 약혼녀', 'ko', 'Hang', 'https://example.com/reelway/series/302', 'Reelway listing', 'verified'),
  ('tycoons-discarded-ex-wife', '前夫总裁的弃妻', 'zh', 'Hans', 'https://example.com/shortline/series/2003', 'Shortline listing', 'verified'),
  ('tycoons-discarded-ex-wife', 'The Tycoon''s Discarded Ex-Wife', 'en', null, 'https://example.com/lumentv/series/103', 'Lumen TV listing', 'verified'),
  ('tycoons-discarded-ex-wife', '元夫社長に捨てられた妻', 'ja', 'Jpan', 'https://example.com/reelway/series/303', 'Reelway listing', 'verified'),
  ('tycoons-discarded-ex-wife', 'La Exesposa Descartada del Magnate', 'es', null, 'https://example.com/community/post/502', 'Community report', 'pending'),
  ('midnight-boardroom-romance', '한밤의 회의실 로맨스', 'ko', 'Hang', 'https://example.com/reelway/series/305', 'Reelway listing', 'verified'),
  ('midnight-boardroom-romance', 'Midnight Boardroom Romance', 'en', null, 'https://example.com/lumentv/series/104', 'Lumen TV listing', 'verified'),
  ('midnight-boardroom-romance', '深夜会议室的恋爱', 'zh', 'Hans', 'https://example.com/shortline/series/2004', 'Shortline listing', 'verified'),
  ('accidental-empress-in-metropolis', '意外穿越的现代女皇', 'zh', 'Hans', 'https://example.com/shortline/series/2005', 'Shortline listing', 'verified'),
  ('accidental-empress-in-metropolis', 'Accidental Empress in Metropolis', 'en', null, 'https://example.com/lumentv/series/105', 'Lumen TV listing', 'verified'),
  ('accidental-empress-in-metropolis', 'Empress in Modern Times', 'en', null, 'https://example.com/community/post/503', 'Community report', 'verified'),
  ('billionaire-undercover', 'El Multimillonario Encubierto', 'es', null, 'https://example.com/reelway/series/306', 'Reelway listing', 'verified'),
  ('billionaire-undercover', 'The Billionaire Undercover', 'en', null, 'https://example.com/lumentv/series/106', 'Lumen TV listing', 'verified'),
  ('billionaire-undercover', '隐身亿万富翁', 'zh', 'Hans', 'https://example.com/shortline/series/2006', 'Shortline listing', 'verified'),
  ('billionaire-undercover', 'O Bilionário Disfarçado', 'pt', null, 'https://example.com/reelway/series/307', 'Reelway listing', 'verified'),
  ('twin-heirs-swap-destiny', '双生继承人换命运', 'zh', 'Hans', 'https://example.com/shortline/series/2007', 'Shortline listing', 'verified'),
  ('twin-heirs-swap-destiny', 'Twin Heirs Swap Destiny', 'en', null, 'https://example.com/lumentv/series/107', 'Lumen TV listing', 'verified'),
  ('twin-heirs-swap-destiny', 'Destino Trocado dos Gêmeos', 'pt', null, 'https://example.com/reelway/series/308', 'Reelway listing', 'verified'),
  ('whispers-of-the-shadow-heir', '暗夜之子：影之继承人', 'zh', 'Hans', 'https://example.com/shortline/series/2008', 'Shortline listing', 'verified'),
  ('whispers-of-the-shadow-heir', 'Whispers of the Shadow Heir', 'en', null, 'https://example.com/lumentv/series/108', 'Lumen TV listing', 'verified'),
  ('loop-of-the-last-summer', '最後の夏のループ', 'ja', 'Jpan', 'https://example.com/reelway/series/309', 'Reelway listing', 'verified'),
  ('loop-of-the-last-summer', 'Loop of the Last Summer', 'en', null, 'https://example.com/lumentv/series/109', 'Lumen TV listing', 'verified'),
  ('loop-of-the-last-summer', '마지막 여름의 루프', 'ko', 'Hang', 'https://example.com/community/post/504', 'Community report', 'pending'),
  ('contract-marriage-with-the-rival-ceo', '라이벌 대표와의 계약 결혼', 'ko', 'Hang', 'https://example.com/reelway/series/311', 'Reelway listing', 'verified'),
  ('contract-marriage-with-the-rival-ceo', 'Contract Marriage with the Rival CEO', 'en', null, 'https://example.com/lumentv/series/110', 'Lumen TV listing', 'verified'),
  ('contract-marriage-with-the-rival-ceo', '与对手总裁的契约婚姻', 'zh', 'Hans', 'https://example.com/shortline/series/2010', 'Shortline listing', 'verified'),
  ('heiress-reborn-revenge-duplicate', 'Heiress Reborn Revenge', 'en', null, 'https://example.com/community/post/505', 'Community report', 'pending')
) as v(slug, text, language, script, source_url, source_label, status)
join public.series s on s.slug = v.slug;

insert into public.releases (series_id, platform_slug, region, dub_language, subtitle_languages, episode_count, url, released_year, link_status, is_official)
select s.id, v.platform_slug, v.region, v.dub_language, v.subs, v.episode_count, v.url, v.released_year, v.link_status, v.is_official
from (values
  ('reborn-heiress-strikes-back', 'shortline', 'Global', null, '{en,zh,vi}'::text[], 95, 'https://example.com/shortline/series/2001', 2024, 'active', true),
  ('reborn-heiress-strikes-back', 'lumen-tv', 'North America', 'en', '{en}'::text[], 95, 'https://example.com/lumentv/series/101', 2024, 'active', true),
  ('billionaires-secret-fiancee', 'lumen-tv', 'North America', 'en', '{en}'::text[], 82, 'https://example.com/lumentv/series/102', 2024, 'active', true),
  ('billionaires-secret-fiancee', 'shortline', 'Global', null, '{en,zh}'::text[], 82, 'https://example.com/shortline/series/2002', 2024, 'active', true),
  ('tycoons-discarded-ex-wife', 'lumen-tv', 'North America', 'en', '{en}'::text[], 88, 'https://example.com/lumentv/series/103', 2023, 'active', true),
  ('tycoons-discarded-ex-wife', 'reelway', 'Japan', 'ja', '{ja,en}'::text[], 88, 'https://example.com/reelway/series/303', 2024, 'active', true),
  ('midnight-boardroom-romance', 'reelway', 'Global', null, '{ko,en,es}'::text[], 60, 'https://example.com/reelway/series/305', 2024, 'active', true),
  ('midnight-boardroom-romance', 'youtube', 'Global', null, '{en}'::text[], 60, 'https://www.youtube.com/playlist?list=EXAMPLE001', 2024, 'unverified', false),
  ('accidental-empress-in-metropolis', 'lumen-tv', 'North America', 'en', '{en}'::text[], 75, 'https://example.com/lumentv/series/105', 2024, 'active', true),
  ('accidental-empress-in-metropolis', 'shortline', 'Global', null, '{en,zh}'::text[], 75, 'https://example.com/shortline/series/2005', 2024, 'active', true),
  ('billionaire-undercover', 'reelway', 'Latin America', 'es', '{es,en,pt}'::text[], 90, 'https://example.com/reelway/series/306', 2024, 'active', true),
  ('billionaire-undercover', 'lumen-tv', 'North America', null, '{en}'::text[], 90, 'https://example.com/lumentv/series/106', 2024, 'active', true),
  ('twin-heirs-swap-destiny', 'shortline', 'Global', null, '{en,zh,pt}'::text[], 70, 'https://example.com/shortline/series/2007', 2023, 'active', true),
  ('twin-heirs-swap-destiny', 'reelway', 'Brazil', 'pt', '{pt}'::text[], 70, 'https://example.com/reelway/series/308', 2024, 'active', true),
  ('whispers-of-the-shadow-heir', 'lumen-tv', 'North America', null, '{en}'::text[], 66, 'https://example.com/lumentv/series/108', 2024, 'active', true),
  ('loop-of-the-last-summer', 'reelway', 'Global', null, '{ja,en,ko}'::text[], 48, 'https://example.com/reelway/series/309', 2024, 'active', true),
  ('contract-marriage-with-the-rival-ceo', 'reelway', 'Global', null, '{ko,en,zh}'::text[], 55, 'https://example.com/reelway/series/311', 2023, 'active', true),
  ('contract-marriage-with-the-rival-ceo', 'lumen-tv', 'North America', 'en', '{en}'::text[], 55, 'https://example.com/lumentv/series/110', 2024, 'active', true)
) as v(slug, platform_slug, region, dub_language, subs, episode_count, url, released_year, link_status, is_official)
join public.series s on s.slug = v.slug;

insert into public.series_tags (series_id, tag_slug)
select s.id, v.tag_slug
from (values
  ('reborn-heiress-strikes-back', 'revenge'),
  ('reborn-heiress-strikes-back', 'second-chance'),
  ('reborn-heiress-strikes-back', 'family-drama'),
  ('billionaires-secret-fiancee', 'ceo-romance'),
  ('billionaires-secret-fiancee', 'hidden-identity'),
  ('billionaires-secret-fiancee', 'contract-marriage'),
  ('tycoons-discarded-ex-wife', 'ceo-romance'),
  ('tycoons-discarded-ex-wife', 'second-chance'),
  ('tycoons-discarded-ex-wife', 'revenge'),
  ('midnight-boardroom-romance', 'ceo-romance'),
  ('accidental-empress-in-metropolis', 'urban-fantasy'),
  ('accidental-empress-in-metropolis', 'hidden-identity'),
  ('billionaire-undercover', 'hidden-identity'),
  ('billionaire-undercover', 'ceo-romance'),
  ('twin-heirs-swap-destiny', 'family-drama'),
  ('twin-heirs-swap-destiny', 'hidden-identity'),
  ('whispers-of-the-shadow-heir', 'urban-fantasy'),
  ('whispers-of-the-shadow-heir', 'revenge'),
  ('whispers-of-the-shadow-heir', 'hidden-identity'),
  ('loop-of-the-last-summer', 'time-loop'),
  ('loop-of-the-last-summer', 'second-chance'),
  ('contract-marriage-with-the-rival-ceo', 'contract-marriage'),
  ('contract-marriage-with-the-rival-ceo', 'ceo-romance'),
  ('heiress-reborn-revenge-duplicate', 'revenge')
) as v(slug, tag_slug)
join public.series s on s.slug = v.slug;

insert into public.people (slug, name, native_name) values
  ('su-wanqing', 'Su Wanqing', '苏婉晴'),
  ('gu-mingzhe', 'Gu Mingzhe', '顾明哲'),
  ('lin-chuyan', 'Lin Chuyan', '林楚颜'),
  ('han-seoyun', 'Han Seoyun', '한서윤'),
  ('mori-haruka', 'Mori Haruka', '森遥香'),
  ('diego-ramirez-vela', 'Diego Ramírez Vela', null);

insert into public.series_people (series_id, person_id, role_type, character_name)
select s.id, p.id, v.role_type, v.character_name
from (values
  ('reborn-heiress-strikes-back', 'su-wanqing', 'actor', 'Jiang Ning (江宁)'),
  ('reborn-heiress-strikes-back', 'gu-mingzhe', 'actor', 'Lu Jingting (陆景霆)'),
  ('reborn-heiress-strikes-back', 'lin-chuyan', 'director', null),
  ('billionaires-secret-fiancee', 'lin-chuyan', 'actor', 'Shen Yuqing (沈雨晴)'),
  ('billionaires-secret-fiancee', 'gu-mingzhe', 'actor', 'Xu Zhaoyang (徐朝阳)'),
  ('midnight-boardroom-romance', 'han-seoyun', 'actor', 'Seo Ji-an (서지안)'),
  ('billionaire-undercover', 'diego-ramirez-vela', 'actor', 'Mateo Salvatierra'),
  ('loop-of-the-last-summer', 'mori-haruka', 'actor', 'Aoi Tachibana (橘葵)')
) as v(series_slug, person_slug, role_type, character_name)
join public.series s on s.slug = v.series_slug
join public.people p on p.slug = v.person_slug;

-- One merge redirect (the hidden duplicate points to the main entry)
insert into public.redirects (from_id, to_id, reason)
select d.id, m.id, 'Merged duplicate entry'
from public.series d, public.series m
where d.slug = 'heiress-reborn-revenge-duplicate' and m.slug = 'reborn-heiress-strikes-back';

-- One open report for the moderation queue
insert into public.reports (series_id, type, status, data)
select s.id, 'another_name', 'open',
  jsonb_build_object('name', '重生千金的复仇', 'language', 'zh', 'url', 'https://example.com/community/post/506')
from public.series s where s.slug = 'reborn-heiress-strikes-back';
