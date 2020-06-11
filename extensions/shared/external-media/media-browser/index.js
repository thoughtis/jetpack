/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo, useCallback, useState, useRef, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { UP, DOWN, LEFT, RIGHT, SPACE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import MediaPlaceholder from './placeholder';
import MediaItem from './media-item';

const MAX_SELECTED = 10;

const EmptyResults = memo( () => (
	<div className="jetpack-external-media-browser__empty">
		<p>{ __( 'Sorry, but nothing matched your search criteria.', 'jetpack' ) }</p>
	</div>
) );

const LoadMoreButton = ( { onClick } ) => (
	<Button
		isLarge
		isSecondary
		className="jetpack-external-media-browser__loadmore"
		onClick={ onClick }
	>
		{ __( 'Load More', 'jetpack' ) }
	</Button>
);

const SelectButton = ( { disabled, isCopying, onClick } ) => (
	<div className="jetpack-external-media-browser__media__toolbar">
		<Button isPrimary isLarge isBusy={ isCopying } disabled={ disabled } onClick={ onClick }>
			{ isCopying ? __( 'Inserting…', 'jetpack' ) : __( 'Select', 'jetpack' ) }
		</Button>
	</div>
);

function MediaBrowser( props ) {
	const {
		media,
		isCopying,
		isLoading,
		pageHandle,
		className,
		multiple,
		setPath,
		nextPage,
		onCopy,
	} = props;
	const [ selected, setSelected ] = useState( [] );
	const [ focused, setFocused ] = useState( -1 );
	const [ columns, setColumns ] = useState( -1 );

	const gridEl = useRef( null );

	const select = useCallback(
		( newlySelected, index ) => {
			let newSelected = [ newlySelected ];

			if ( newlySelected.type === 'folder' ) {
				setPath( newlySelected.ID );
			} else if ( multiple ) {
				newSelected = selected.slice( 0, MAX_SELECTED - 1 ).concat( newlySelected );

				if ( selected.find( item => newlySelected.ID === item.ID ) ) {
					newSelected = selected.filter( item => item.ID !== newlySelected.ID );
				}
			} else if ( selected.length === 1 && newlySelected.ID === selected[ 0 ].ID ) {
				newSelected = [];
			}

			setSelected( newSelected );
			setFocused( index );
		},
		[ selected, multiple, setPath ]
	);

	const hasMediaItems = media.filter( item => item.type !== 'folder' ).length > 0;
	const classes = classnames( {
		'jetpack-external-media-browser__media': true,
		'jetpack-external-media-browser__media__loading': isLoading,
	} );
	const wrapper = classnames( {
		'jetpack-external-media-browser': true,
		[ className ]: true,
	} );

	const navigate = ( keyCode, index ) => {
		switch ( keyCode ) {
			case LEFT:
				if ( index >= 1 ) {
					setFocused( index - 1 );
				}
				break;
			case RIGHT:
				if ( index < media.length ) {
					setFocused( index + 1 );
				}
				break;
			case UP:
				if ( index >= columns ) {
					setFocused( index - columns );
				}
				break;
			case DOWN:
				if ( index < media.length - columns ) {
					setFocused( index + columns );
				}
				break;
		}
	};

	/**
	 * Counts how many items are in a row by checking how many of the grid's child
	 * items have a matching offsetTop.
	 */
	const checkColumns = () => {
		let perRow = 1;

		const items = gridEl.current.children;

		if ( items.length > 0 ) {
			const firstOffset = items[ 0 ].offsetTop;

			/**
			 *Check how many items have a matching offsetTop. This will give us the
			 * total number of items in a row.
			 */
			while ( perRow < items.length && items[ perRow ].offsetTop === firstOffset ) {
				++perRow;
			}
		}

		setColumns( perRow );
	};

	useEffect( () => {
		checkColumns();
	}, [ media ] );

	const handleMediaItemClick = ( event, { item, index } ) => {
		select( item, index );
	};

	const handleMediaItemKeyDown = ( event, { item, index } ) => {
		if ( [ LEFT, RIGHT, UP, DOWN ].includes( event.keyCode ) ) {
			navigate( event.keyCode, index );
		}

		if ( [ SPACE, ENTER ].includes( event.keyCode ) ) {
			select( item, index );
			event.preventDefault(); // Prevent space from scrolling the page down;
		}
	};

	const handleLoadMoreButtonClick = () => {
		if ( media.length ) {
			setFocused( media.length );
		}
		nextPage();
	};

	const handleSelectButtonClick = useCallback( () => {
		onCopy( selected );
	}, [ selected, onCopy ] );

	return (
		<div className={ wrapper }>
			<ul ref={ gridEl } className={ classes }>
				{ media.map( ( item, index ) => (
					<MediaItem
						item={ item }
						index={ index }
						key={ item.ID }
						onClick={ handleMediaItemClick }
						onKeyDown={ handleMediaItemKeyDown }
						focus={ index === focused }
						isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
						isCopying={ isCopying }
					/>
				) ) }

				{ media.length === 0 && ! isLoading && <EmptyResults /> }
				{ isLoading && <MediaPlaceholder /> }
			</ul>

			{ pageHandle && ! isLoading && <LoadMoreButton onClick={ handleLoadMoreButtonClick } /> }

			{ hasMediaItems && (
				<SelectButton
					isCopying
					disabled={ selected.length === 0 || isCopying }
					onClick={ handleSelectButtonClick }
				/>
			) }
		</div>
	);
}

export default MediaBrowser;
