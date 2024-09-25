import React from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { FaArrowDownWideShort, FaMagnifyingGlass } from 'react-icons/fa6';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { cnMainScreen } from '@features/MainScreen';
import { NotesList } from '@features/MainScreen/NotesList';
import { useAppSelector } from '@state/redux/hooks';
import { selectActiveTag } from '@state/redux/workspaces';

export const NotesPanel = () => {
	const activeTag = useAppSelector(selectActiveTag('default'));

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
				{activeTag && (
					<div className={cnMainScreen('NotesListSelectedTag')}>
						With tag{' '}
						<span className={cnMainScreen('NotesListSelectedTagName')}>
							{activeTag.name}
						</span>
					</div>
				)}
				<NotesList />
			</div>
		</>
	);
};
