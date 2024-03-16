import React from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { FaArrowDownWideShort, FaMagnifyingGlass } from 'react-icons/fa6';
import { useStoreMap } from 'effector-react';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { cnMainScreen } from '@features/MainScreen';
import { NotesList } from '@features/MainScreen/NotesList';
import { useTagsContext } from '@features/Workspace/WorkspaceProvider';

export const NotesPanel = () => {
	const { $tags } = useTagsContext();
	const activeTagName = useStoreMap($tags, ({ selected, list }) => {
		if (selected === null) return null;
		return list.find((tag) => tag.id === selected)?.name ?? null;
	});

	return (
		<>
			<Stack direction="horizontal" spacing={1}>
				<Textinput
					placeholder="Search..."
					size="s"
					addonBeforeControl={
						<Icon
							boxSize="1rem"
							hasGlyph
							style={{
								zIndex: 2,
								marginInlineStart: '.5rem',
								marginInlineEnd: '.3rem',
								opacity: 0.7,
							}}
						>
							<FaMagnifyingGlass size="100%" />
						</Icon>
					}
				/>

				<Button view="default">
					<Icon boxSize="1rem" hasGlyph>
						<FaArrowDownWideShort size="100%" />
					</Icon>
				</Button>
			</Stack>

			<div className={cnMainScreen('NotesList')}>
				{activeTagName && (
					<div className={cnMainScreen('NotesListSelectedTag')}>
						With tag{' '}
						<span className={cnMainScreen('NotesListSelectedTagName')}>
							{activeTagName}
						</span>
					</div>
				)}
				<NotesList />
			</div>
		</>
	);
};
