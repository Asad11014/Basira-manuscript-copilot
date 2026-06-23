import { clsx } from 'clsx';
import type { ImageVariant, Region } from '@basira/shared';
import { pagesApi } from '../../api/pages.js';

interface ImagePaneProps {
  pageId: string;
  regions: Region[];
  variant?: ImageVariant;
  focusedRegionId?: string | null;
  onFocusRegion?: (regionId: string | null) => void;
}

/**
 * Image pane: the (preprocessed) page with clickable region overlays drawn from
 * normalised bboxes. (§11 image pane)
 */
export function ImagePane({
  pageId,
  regions,
  variant = 'processed',
  focusedRegionId,
  onFocusRegion,
}: ImagePaneProps) {
  return (
    <div className="relative inline-block w-full bg-ink-100">
      <img
        src={pagesApi.imageUrl(pageId, variant)}
        alt="Manuscript page"
        className="block w-full select-none"
        draggable={false}
      />
      {regions.map((region) => {
        const focused = region.id === focusedRegionId;
        return (
          <button
            key={region.id}
            type="button"
            onClick={() => onFocusRegion?.(focused ? null : region.id)}
            title={region.type}
            className={clsx(
              'absolute border transition',
              region.type === 'textblock'
                ? 'border-sky-500/60'
                : region.type === 'margin'
                  ? 'border-amber-500/60'
                  : 'border-violet-500/50',
              focused
                ? 'bg-sky-400/25 ring-2 ring-sky-500'
                : 'hover:bg-sky-400/10',
            )}
            style={{
              left: `${region.bbox.x * 100}%`,
              top: `${region.bbox.y * 100}%`,
              width: `${region.bbox.w * 100}%`,
              height: `${region.bbox.h * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
}
