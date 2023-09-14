import { withModIconSizeM } from "react-elegant-ui/esm/components/Icon/_size/Icon_size_m";
import { withModIconSizeS } from "react-elegant-ui/esm/components/Icon/_size/Icon_size_s";
import { Icon as IconBase } from "react-elegant-ui/esm/components/Icon/Icon";
import { IconConstructor } from "react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor";
import { compose, composeU } from "react-elegant-ui/esm/lib/compose";

import IconAdd from '../assets/add.svg';
import IconClear from '../assets/clear.svg';
import IconEdit from '../assets/edit.svg';
import IconExpandMore from '../assets/expand_more.svg';
import IconTag from '../assets/tag.svg';

const withModIconGlyphTag = IconConstructor<{ glyph?: 'tag' }>('tag', IconTag);
const withModIconGlyphExpandMore = IconConstructor<{ glyph?: 'expand-more' }>('expand-more', IconExpandMore);
const withModIconGlyphAdd = IconConstructor<{ glyph?: 'add' }>('add', IconAdd);
const withModIconGlyphClear = IconConstructor<{ glyph?: 'clear' }>('clear', IconClear);
const withModIconGlyphEdit = IconConstructor<{ glyph?: 'edit' }>('edit', IconEdit);

export const Icon = compose(
	composeU(withModIconGlyphTag, withModIconGlyphExpandMore, withModIconGlyphAdd, withModIconGlyphClear, withModIconGlyphEdit),
	composeU(withModIconSizeS, withModIconSizeM),
)(IconBase);

Icon.defaultProps = {
	size: 'm'
};