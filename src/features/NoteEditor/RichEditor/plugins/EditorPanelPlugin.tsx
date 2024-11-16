import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

import { useEditorPanelContext } from '../../EditorPanel';

// TODO: implement all inserting & formatting features
export const EditorPanelPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { onInserting } = useEditorPanelContext();

	useEffect(() => {
		return onInserting.watch((evt) => {
			console.warn('INSERTING ELEMENT', evt);

			switch (evt.type) {
				case 'horizontalRule': {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
					break;
				}
			}
		});
	}, [editor, onInserting]);

	return null;
};
