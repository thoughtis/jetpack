/**
 * External dependencies
 */
import config from 'config';

/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { doInPlaceConnection, loginToWpSite } from '../lib/flows/jetpack-connect';
import { execMultipleWpCommands, resetWordpressInstall } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import CheckoutPage from '../lib/pages/wpcom/checkout';
import ThankYouPage from '../lib/pages/wpcom/thank-you';
import MyPlanPage from '../lib/pages/wpcom/my-plan';
import PickAPlanPage from '../lib/pages/wpcom/pick-a-plan';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

const cookie = config.get( 'storeSandboxCookieValue' );
const cardCredentials = config.get( 'testCardCredentials' );

describe( 'Connection', () => {
	catchBeforeAll( async () => {
		await execMultipleWpCommands(
			'wp option delete e2e_jetpack_plan_data',
			'wp option delete jetpack_active_plan',
			'wp option delete jetpack_private_options',
			'wp option delete jetpack_sync_error_idc'
		);
		await page.reload();
		await page.reload();
	} );

	beforeEach( async () => {
		await loginToWpSite();
	} );

	afterEach( async () => {
		await resetWordpressInstall();
	} );

	it( 'In-placez', async () => {
		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			await jetpackPage.openDashboard();
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'In-place upgrading a plan from Security Daily to Complete', async () => {
		await step( 'Can set a sandbox cookie', async () => {
			await ( await Sidebar.init( page ) ).setSandboxModeForPayments( cookie );
			await ( await Sidebar.init( page ) ).setSandboxModeForPayments(
				cookie,
				'.cloud.jetpack.com'
			);
		} );

		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection( 'security' );
		} );

		await step( 'Can process payment for Security plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
		} );

		await step( 'Can assert that site has a Security plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'security' ) ).toBeTruthy();
		} );

		await step( 'Can visit plans page and select a Complete plan', async () => {
			await ( await JetpackPage.init( page ) ).openPlans();
			await ( await PickAPlanPage.init( page ) ).select( 'complete' );
		} );

		await step( 'Can process payment for Complete plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
		} );

		await step( 'Can assert that site has a Complete plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'complete' ) ).toBeTruthy();
		} );
	} );
} );
