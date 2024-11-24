/* eslint-disable spellcheck/spell-checker */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EditorThemeClasses } from 'lexical';

import './common.css';
import './RichEditorTheme.css';

export const theme: EditorThemeClasses = {
	autocomplete: 'RichEditorTheme__autocomplete',
	blockCursor: 'RichEditorTheme__blockCursor',
	characterLimit: 'RichEditorTheme__characterLimit',
	code: 'RichEditorTheme__code',
	codeHighlight: {
		atrule: 'RichEditorTheme__tokenAttr',
		attr: 'RichEditorTheme__tokenAttr',
		boolean: 'RichEditorTheme__tokenProperty',
		builtin: 'RichEditorTheme__tokenSelector',
		cdata: 'RichEditorTheme__tokenComment',
		char: 'RichEditorTheme__tokenSelector',
		class: 'RichEditorTheme__tokenFunction',
		'class-name': 'RichEditorTheme__tokenFunction',
		comment: 'RichEditorTheme__tokenComment',
		constant: 'RichEditorTheme__tokenProperty',
		deleted: 'RichEditorTheme__tokenProperty',
		doctype: 'RichEditorTheme__tokenComment',
		entity: 'RichEditorTheme__tokenOperator',
		function: 'RichEditorTheme__tokenFunction',
		important: 'RichEditorTheme__tokenVariable',
		inserted: 'RichEditorTheme__tokenSelector',
		keyword: 'RichEditorTheme__tokenAttr',
		namespace: 'RichEditorTheme__tokenVariable',
		number: 'RichEditorTheme__tokenProperty',
		operator: 'RichEditorTheme__tokenOperator',
		prolog: 'RichEditorTheme__tokenComment',
		property: 'RichEditorTheme__tokenProperty',
		punctuation: 'RichEditorTheme__tokenPunctuation',
		regex: 'RichEditorTheme__tokenVariable',
		selector: 'RichEditorTheme__tokenSelector',
		string: 'RichEditorTheme__tokenSelector',
		symbol: 'RichEditorTheme__tokenProperty',
		tag: 'RichEditorTheme__tokenProperty',
		url: 'RichEditorTheme__tokenOperator',
		variable: 'RichEditorTheme__tokenVariable',
	},
	embedBlock: {
		base: 'RichEditorTheme__embedBlock',
		focus: 'RichEditorTheme__embedBlockFocus',
	},
	hashtag: 'RichEditorTheme__hashtag',
	heading: {
		h1: 'RichEditorTheme__h1',
		h2: 'RichEditorTheme__h2',
		h3: 'RichEditorTheme__h3',
		h4: 'RichEditorTheme__h4',
		h5: 'RichEditorTheme__h5',
		h6: 'RichEditorTheme__h6',
	},
	hr: 'RichEditorTheme__hr',
	image: 'editor-image',
	indent: 'RichEditorTheme__indent',
	inlineImage: 'inline-editor-image',
	layoutContainer: 'RichEditorTheme__layoutContainer',
	layoutItem: 'RichEditorTheme__layoutItem',
	link: 'RichEditorTheme__link',
	list: {
		checklist: 'RichEditorTheme__checklist',
		listitem: 'RichEditorTheme__listItem',
		listitemChecked: 'RichEditorTheme__listItemChecked',
		listitemUnchecked: 'RichEditorTheme__listItemUnchecked',
		nested: {
			listitem: 'RichEditorTheme__nestedListItem',
		},
		olDepth: [
			'RichEditorTheme__ol1',
			'RichEditorTheme__ol2',
			'RichEditorTheme__ol3',
			'RichEditorTheme__ol4',
			'RichEditorTheme__ol5',
		],
		ul: 'RichEditorTheme__ul',
	},
	ltr: 'RichEditorTheme__ltr',
	mark: 'RichEditorTheme__mark',
	markOverlap: 'RichEditorTheme__markOverlap',
	paragraph: 'RichEditorTheme__paragraph',
	quote: 'RichEditorTheme__quote',
	rtl: 'RichEditorTheme__rtl',
	table: 'RichEditorTheme__table',
	tableCell: 'RichEditorTheme__tableCell',
	tableCellActionButton: 'RichEditorTheme__tableCellActionButton',
	tableCellActionButtonContainer: 'RichEditorTheme__tableCellActionButtonContainer',
	tableCellEditing: 'RichEditorTheme__tableCellEditing',
	tableCellHeader: 'RichEditorTheme__tableCellHeader',
	tableCellPrimarySelected: 'RichEditorTheme__tableCellPrimarySelected',
	tableCellResizer: 'RichEditorTheme__tableCellResizer',
	tableCellSelected: 'RichEditorTheme__tableCellSelected',
	tableCellSortedIndicator: 'RichEditorTheme__tableCellSortedIndicator',
	tableResizeRuler: 'RichEditorTheme__tableCellResizeRuler',
	tableRowStriping: 'RichEditorTheme__tableRowStriping',
	tableSelected: 'RichEditorTheme__tableSelected',
	tableSelection: 'RichEditorTheme__tableSelection',
	text: {
		bold: 'RichEditorTheme__textBold',
		code: 'RichEditorTheme__textCode',
		italic: 'RichEditorTheme__textItalic',
		strikethrough: 'RichEditorTheme__textStrikethrough',
		subscript: 'RichEditorTheme__textSubscript',
		superscript: 'RichEditorTheme__textSuperscript',
		underline: 'RichEditorTheme__textUnderline',
		underlineStrikethrough: 'RichEditorTheme__textUnderlineStrikethrough',
	},
};

export default theme;
