import { withModIconSizeM } from "react-elegant-ui/esm/components/Icon/_size/Icon_size_m";
import { withModIconSizeS } from "react-elegant-ui/esm/components/Icon/_size/Icon_size_s";
import { Icon as IconBase } from "react-elegant-ui/esm/components/Icon/Icon";
import { IconConstructor } from "react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor";
import { compose, composeU } from "react-elegant-ui/esm/lib/compose";

import IconExpandMore from '../assets/expand_more.svg';
import IconTag from '../assets/tag.svg';

const withModIconGlyphTag = IconConstructor<{ glyph?: 'tag' }>('tag', IconTag);
const withModIconGlyphExpandMore = IconConstructor<{ glyph?: 'expand-more' }>('expand-more', IconExpandMore);

export const Icon = compose(
	composeU(withModIconGlyphTag, withModIconGlyphExpandMore),
	composeU(withModIconSizeS, withModIconSizeM),
)(IconBase);

Icon.defaultProps = {
	size: 'm'
};