/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { external, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { waitForEditor } from '../../shared/wait-for-editor';
import { basicTemplate, spotifyBadgeTemplate } from './templates';

/**
 * Style dependencies
 */
import './editor.scss';

async function insertTemplate( params ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );

	let templateBlocks;
	switch ( params.tpl ) {
		case 'sporifyBadge':
			templateBlocks = spotifyBadgeTemplate( params );
		break;

		case 'basicEpisode':
			templateBlocks = basicTemplate( params );
		break;
	}

	if ( templateBlocks?.length ) {
		insertBlocks(
			templateBlocks,
			0,
			undefined,
			false
		);
	}
}

async function setEpisodeTitle( { title } ) {
	if ( ! title ) {
		return;
	}
	await waitForEditor();
	dispatch( 'core/editor' ).editPost( { title } );
}

const ConvertToAudio = () => (
	<PluginPostPublishPanel className="anchor-post-publish-outbound-link">
		<p className="post-publish-panel__postpublish-subheader">
			<strong>{ __( 'Convert to audio', 'jetpack' ) }</strong>
		</p>
		<p>{ __( 'Let your readers listen to your post.', 'jetpack' ) }</p>
		<p>
			<a href="https://anchor.fm/wordpress" target="_top">
				{ __( 'Create a podcast episode', 'jetpack' ) }
				<Icon icon={ external } className="anchor-post-publish-outbound-link__external_icon" />
			</a>
		</p>
	</PluginPostPublishPanel>
);

function showPostPublishOutboundLink() {
	registerPlugin( 'anchor-post-publish-outbound-link', {
		render: ConvertToAudio,
	} );
}

function initAnchor() {
	const data = window.Jetpack_AnchorFm;
	if ( typeof data !== 'object' ) {
		return;
	}

	data.actions.forEach( action => {
		const [ actionName, actionParams ] = castArray( action );
		switch ( actionName ) {
			case 'insert-spotify-badge':
				insertTemplate( { ...actionParams, tpl: 'spotifyBadge' } );
				break;
			case 'insert-episode-template':
				insertTemplate( { ...actionParams, tpl: 'basicEpisode' } );
				break;
			case 'show-post-publish-outbound-link':
				showPostPublishOutboundLink();
				break;
			case 'set-episode-title':
				setEpisodeTitle( actionParams );
				break;
		}
	} );
}

initAnchor();
