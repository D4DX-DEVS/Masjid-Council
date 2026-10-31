import React from 'react';
import HeroBlock from './HeroBlock';
import ApplicationsBlock from './ApplicationsBlock';
import AboutBlock from './AboutBlock';
import StatsBlock from './StatsBlock';
import TrackBlock from './TrackBlock';
import FooterBlock from './FooterBlock';
import PublicationsSection from '../PublicationsSection';
import BannerCarousel from '../BannerCarousel';
import { CtaBlock, ImageTextBlock, NoticeBlock, TextBlock } from './ContentBlocks';
import { CardsBlock, FaqBlock, GalleryBlock, VideoBlock } from './CollectionBlocks';
import { themeVars, useThemeFonts } from '../../lib/homepage/render';
import { SECTION_META } from '../../lib/homepage/fields';
import { sectionType } from '../../lib/homepage/defaults';

const BLOCKS = {
  hero: HeroBlock,
  publications: PublicationsSection,
  applications: ApplicationsBlock,
  banners: BannerCarousel,
  about: AboutBlock,
  stats: StatsBlock,
  track: TrackBlock,
  footer: FooterBlock,
  text: TextBlock,
  imageText: ImageTextBlock,
  cta: CtaBlock,
  cards: CardsBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  faq: FaqBlock,
  notice: NoticeBlock,
};

/**
 * Renders a merged home page config (see lib/homepage/defaults.js): the theme as CSS
 * variables on the wrapper, then each visible section in the admin's order.
 *
 * data-hp-section lets the editor's preview scroll to the section being edited. `editable`
 * (the preview only) also labels each section so it can be clicked to open its settings.
 */
const HomeSections = ({ config, editable = false }) => {
  useThemeFonts(config.theme);

  return (
    <div style={{ ...themeVars(config.theme), backgroundColor: 'var(--hp-page-bg)' }}>
      {config.sections
        .filter((section) => section.visible !== false && BLOCKS[sectionType(section)])
        .map((section) => {
          const Block = BLOCKS[sectionType(section)];
          return (
            <div
              key={section.id}
              data-hp-section={section.id}
              data-hp-label={editable ? `${SECTION_META[sectionType(section)]?.label} · click to edit` : undefined}
              className={editable ? 'relative' : undefined}
            >
              <Block section={section} theme={config.theme} />
            </div>
          );
        })}
    </div>
  );
};

export default HomeSections;
