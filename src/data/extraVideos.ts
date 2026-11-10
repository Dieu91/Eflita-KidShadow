import { LevelType } from '../types';

export interface ExtraVideo {
  id: string;          // mã video, ví dụ S01
  level: LevelType;
  order: number;
  title: string;       // đổi tên hiển thị ở đây
  youtubeId: string;
}

// 45 video luyện thêm (YouTube Shorts, chế độ Không công khai). Đổi `title` để đặt tên lại từng video.
export const EXTRA_VIDEOS: ExtraVideo[] = [
  { id: 'S01', level: 'STARTER', order: 1, title: 'Starters · Video 01', youtubeId: '0OsvQqKtXLE' },
  { id: 'S02', level: 'STARTER', order: 2, title: 'Starters · Video 02', youtubeId: 'Rdd83HE7Zys' },
  { id: 'S03', level: 'STARTER', order: 3, title: 'Starters · Video 03', youtubeId: 'tqC4jZrwE5E' },
  { id: 'S04', level: 'STARTER', order: 4, title: 'Starters · Video 04', youtubeId: 'VfEDCnFWdIM' },
  { id: 'S05', level: 'STARTER', order: 5, title: 'Starters · Video 05', youtubeId: 'E5yh_8V0A50' },
  { id: 'S06', level: 'STARTER', order: 6, title: 'Starters · Video 06', youtubeId: 'OrBdRm4i69U' },
  { id: 'S07', level: 'STARTER', order: 7, title: 'Starters · Video 07', youtubeId: 'g_9JzlD0ZsQ' },
  { id: 'S08', level: 'STARTER', order: 8, title: 'Starters · Video 08', youtubeId: 'bFFY1msVABc' },
  { id: 'S09', level: 'STARTER', order: 9, title: 'Starters · Video 09', youtubeId: 'cNSByrzdNJs' },
  { id: 'S10', level: 'STARTER', order: 10, title: 'Starters · Video 10', youtubeId: 'TtjXh0FBj54' },
  { id: 'S11', level: 'STARTER', order: 11, title: 'Starters · Video 11', youtubeId: 'XQX5mwAkcOo' },
  { id: 'S12', level: 'STARTER', order: 12, title: 'Starters · Video 12', youtubeId: '_Ac1raKnpc4' },
  { id: 'S13', level: 'STARTER', order: 13, title: 'Starters · Video 13', youtubeId: 'E2jtA0mqg38' },
  { id: 'S14', level: 'STARTER', order: 14, title: 'Starters · Video 14', youtubeId: 'jHYXu4Ck9pk' },
  { id: 'S15', level: 'STARTER', order: 15, title: 'Starters · Video 15', youtubeId: 'xv2mMruJsOc' },
  { id: 'M01', level: 'MOVERS', order: 1, title: 'Movers · Video 01', youtubeId: 'PWSpsUqk5GI' },
  { id: 'M02', level: 'MOVERS', order: 2, title: 'Movers · Video 02', youtubeId: '70N-qL4knEc' },
  { id: 'M03', level: 'MOVERS', order: 3, title: 'Movers · Video 03', youtubeId: 'nZC160s7TmU' },
  { id: 'M04', level: 'MOVERS', order: 4, title: 'Movers · Video 04', youtubeId: '19DEMoMIE2o' },
  { id: 'M05', level: 'MOVERS', order: 5, title: 'Movers · Video 05', youtubeId: 'FNXLCh-3q8Q' },
  { id: 'M06', level: 'MOVERS', order: 6, title: 'Movers · Video 06', youtubeId: 'wjW1H5D8kTg' },
  { id: 'M07', level: 'MOVERS', order: 7, title: 'Movers · Video 07', youtubeId: 'Zcd5aE4lr6w' },
  { id: 'M08', level: 'MOVERS', order: 8, title: 'Movers · Video 08', youtubeId: '0ktl53IsBGA' },
  { id: 'M09', level: 'MOVERS', order: 9, title: 'Movers · Video 09', youtubeId: '4-rrocCMeho' },
  { id: 'M10', level: 'MOVERS', order: 10, title: 'Movers · Video 10', youtubeId: 'HBcVBANfBzE' },
  { id: 'M11', level: 'MOVERS', order: 11, title: 'Movers · Video 11', youtubeId: '4TTfFmGQTBA' },
  { id: 'M12', level: 'MOVERS', order: 12, title: 'Movers · Video 12', youtubeId: 'JxXxz_GKWpU' },
  { id: 'M13', level: 'MOVERS', order: 13, title: 'Movers · Video 13', youtubeId: 'A967wK7L26E' },
  { id: 'M14', level: 'MOVERS', order: 14, title: 'Movers · Video 14', youtubeId: 'NUVYZj4dLD0' },
  { id: 'M15', level: 'MOVERS', order: 15, title: 'Movers · Video 15', youtubeId: 'YGyQroZn8mk' },
  { id: 'F01', level: 'FLYERS', order: 1, title: 'Flyers · Video 01', youtubeId: '9EaSH4Bo1J4' },
  { id: 'F02', level: 'FLYERS', order: 2, title: 'Flyers · Video 02', youtubeId: 'P_5g96HojCA' },
  { id: 'F03', level: 'FLYERS', order: 3, title: 'Flyers · Video 03', youtubeId: 'u_M_IIj9UP0' },
  { id: 'F04', level: 'FLYERS', order: 4, title: 'Flyers · Video 04', youtubeId: 'Czt9W2jlmXI' },
  { id: 'F05', level: 'FLYERS', order: 5, title: 'Flyers · Video 05', youtubeId: 'amEUllALUZ4' },
  { id: 'F06', level: 'FLYERS', order: 6, title: 'Flyers · Video 06', youtubeId: 'GZROuIWp-CM' },
  { id: 'F07', level: 'FLYERS', order: 7, title: 'Flyers · Video 07', youtubeId: 'dwO3NIIUflM' },
  { id: 'F08', level: 'FLYERS', order: 8, title: 'Flyers · Video 08', youtubeId: 'qzyDe4aINds' },
  { id: 'F09', level: 'FLYERS', order: 9, title: 'Flyers · Video 09', youtubeId: 'pRQcykKNKKw' },
  { id: 'F10', level: 'FLYERS', order: 10, title: 'Flyers · Video 10', youtubeId: 'phnkfSwpxOg' },
  { id: 'F11', level: 'FLYERS', order: 11, title: 'Flyers · Video 11', youtubeId: 'ZUZML-dFJ5c' },
  { id: 'F12', level: 'FLYERS', order: 12, title: 'Flyers · Video 12', youtubeId: 'M0P1xL5aJ1g' },
  { id: 'F13', level: 'FLYERS', order: 13, title: 'Flyers · Video 13', youtubeId: 'OtG4LOTMzUI' },
  { id: 'F14', level: 'FLYERS', order: 14, title: 'Flyers · Video 14', youtubeId: 'Ay420JLCjQE' },
  { id: 'F15', level: 'FLYERS', order: 15, title: 'Flyers · Video 15', youtubeId: '6hjUx5Fh-oY' },
];

export const getExtraEmbedUrl = (youtubeId: string): string =>
  `https://www.youtube.com/embed/${youtubeId}?rel=0;

// Bài luyện thêm dùng chung màn hình học/nộp bài; mã bài luôn bắt đầu bằng tiền tố này
export const EXTRA_ID_PREFIX = 'extra_';
export const isExtraLessonId = (lessonId?: string): boolean => !!lessonId && lessonId.startsWith(EXTRA_ID_PREFIX);
export const EXTRA_COUNT_PER_LEVEL = 15;
