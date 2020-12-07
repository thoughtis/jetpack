<?php
/**
 * The environment does not have a subscription service available.
 * This represents this scenario.
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service;

use function site_url;

/**
 * Class Unconfigured_Subscription_Service
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service
 */
class Unconfigured_Subscription_Service implements Subscription_Service {

	/**
	 * Is always available because it is the fallback.
	 *
	 * @inheritDoc
	 */
	public static function available() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	function initialize() {
		// noop
	}

	/**
	 * No subscription service available, no users can see this content.
	 *
	 * @inheritDoc
	 */
	function visitor_can_view_content( $valid_plan_ids ) {
		return false;
	}

	/**
	 * The current visitor would like to obtain access. Where do they go?
	 *
	 * @inheritDoc
	 */
	function access_url( $mode = 'subscribe' ) {
		return site_url();
	}

}
