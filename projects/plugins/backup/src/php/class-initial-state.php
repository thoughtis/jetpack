<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-backup
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * The connection manager object.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->manager = new Manager();
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		return array(
			'connectionStatus' => REST_Connector::connection_status( false ),
			'API'              => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
			'connectionData'   => array(
				'doNotUseConnectionIframe' => ! $this->can_use_connection_iframe(),
				'authorizationUrl'         => ( $this->manager->is_connected() && ! $this->manager->is_user_connected() )
					? $this->manager->get_authorization_url( null, admin_url( 'admin.php?page=jetpack-backup' ) )
					: null,
			),
		);
	}

	/**
	 * Whether we can the connection iframe.
	 *
	 * @return bool
	 */
	private function can_use_connection_iframe() {
		global $is_safari;

		/**
		 * Filters whether the connection manager should use the iframe authorization
		 * flow instead of the regular redirect-based flow.
		 *
		 * @since 8.3.0
		 *
		 * @param Boolean $is_iframe_flow_used should the iframe flow be used, defaults to false.
		 */
		$iframe_flow = apply_filters( 'jetpack_use_iframe_authorization_flow', false );

		if ( ! $iframe_flow ) {
			return false;
		}

		return ! $is_safari && ! User_Agent_Info::is_opera_desktop() && ! Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		add_action( 'jetpack_use_iframe_authorization_flow', '__return_true' );

		return 'var JPBACKUP_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_data() ) ) . '"));';
	}

}
