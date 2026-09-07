-- S HOUSE: cho phép quản trị toàn bộ nội dung khu vực đầu trang.
-- Chạy file này sau migration 001, 002, 003, 004 và 005.

alter table public.site_settings
add column if not exists hero_kicker text not null default 'Giải pháp thiết bị điện hiện đại',
add column if not exists hero_title text not null default 'An tâm hơn cho',
add column if not exists hero_highlight text not null default 'mỗi mái nhà.',
add column if not exists hero_description text not null default 'S HOUSE giới thiệu các giải pháp bộ chống giật với thông tin trực quan, dễ tìm hiểu và đội ngũ sẵn sàng tư vấn.',
add column if not exists hero_primary_label text not null default 'Khám phá sản phẩm',
add column if not exists hero_secondary_label text not null default 'Liên hệ tư vấn',
add column if not exists hero_card_title text not null default 'S HOUSE',
add column if not exists hero_card_description text not null default 'Giải pháp thiết bị điện cho không gian hiện đại',
add column if not exists hero_trust_items jsonb not null default '["Thông tin rõ ràng","Hỗ trợ trực tiếp","Tài liệu dễ tra cứu"]'::jsonb;

-- Kết quả cần thấy: homepage_hero_content_ready = true.
select count(*) = 9 as homepage_hero_content_ready
from information_schema.columns
where table_schema = 'public'
  and table_name = 'site_settings'
  and column_name in (
    'hero_kicker',
    'hero_title',
    'hero_highlight',
    'hero_description',
    'hero_primary_label',
    'hero_secondary_label',
    'hero_card_title',
    'hero_card_description',
    'hero_trust_items'
  );
